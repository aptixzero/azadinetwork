'use strict';
const util = require('./util.js');
const store = require('./store.js');

function parseUA(ua) {
  ua = String(ua || '');
  var browser = 'نامشخص', os = 'نامشخص', device = 'دسکتاپ';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua)) browser = 'Safari';
  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Android/.test(ua)) { os = 'Android'; device = 'موبایل'; }
  else if (/iPhone|iPad/.test(ua)) { os = 'iOS'; device = /iPad/.test(ua) ? 'تبلت' : 'موبایل'; }
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';
  if (/Mobile/.test(ua) && device === 'دسکتاپ') device = 'موبایل';
  return { browser: browser, os: os, device: device };
}

function getIp(req) {
  var h = req.headers;
  var xf = h['x-forwarded-for'];
  if (xf) {
    var first = String(xf).split(',')[0].trim();
    if (first) return first.slice(0, 45);
  }
  if (h['x-real-ip']) return String(h['x-real-ip']).slice(0, 45);
  return (req.socket && req.socket.remoteAddress || '').slice(0, 45);
}

function getVisitor(vid, req) {
  var track = store.getTrack();
  var v = track.visitors[vid];
  var t = util.now();
  if (!v) {
    var ua = parseUA(req.headers['user-agent']);
    v = track.visitors[vid] = {
      id: vid,
      ip: getIp(req),
      firstSeen: t,
      lastSeen: t,
      totalMs: 0,
      sessions: 1,
      browser: ua.browser,
      os: ua.os,
      device: ua.device,
      lang: String(req.headers['accept-language'] || '').split(',')[0].slice(0, 20),
      pages: {},
      clicks: [],
      views: [],
      searches: [],
      screen: '',
      tz: '',
      platform: '',
      cores: 0,
      memory: 0,
      touch: false,
      referrer: '',
      netInfo: ''
    };
  } else {
    if (t - v.lastSeen > 30 * 60 * 1000) v.sessions = (v.sessions || 1) + 1;
    else v.totalMs = (v.totalMs || 0) + Math.min(t - v.lastSeen, 5 * 60 * 1000);
    v.lastSeen = t;
    v.ip = getIp(req);
  }
  store.markTrack();
  return v;
}

function recordEvents(vid, req, events) {
  if (!Array.isArray(events)) return;
  var v = getVisitor(vid, req);
  var track = store.getTrack();
  var stats = track.stats;
  events.slice(0, 40).forEach(function (e) {
    if (!e || typeof e !== 'object') return;
    var type = util.clampStr(e.t, 20);
    var val = util.clampStr(e.v, 200);
    var t = util.now();
    if (type === 'page') {
      var p = val.slice(0, 120) || '/';
      if (!v.pages[p]) v.pages[p] = { n: 0, first: t, last: t };
      v.pages[p].n++;
      v.pages[p].last = t;
    } else if (type === 'click') {
      v.clicks.push({ v: val, ts: t });
      if (v.clicks.length > 150) v.clicks = v.clicks.slice(-150);
    } else if (type === 'view') {
      v.views.push({ v: val, ts: t });
      if (v.views.length > 200) v.views = v.views.slice(-200);
      var m = val.match(/^(product|work|article|category|image|story):(.+)$/);
      if (m) {
        var bucket = { product: 'productViews', work: 'portfolioViews', article: 'articleViews', category: 'categoryViews' }[m[1]];
        if (bucket) stats[bucket][m[2]] = (stats[bucket][m[2]] || 0) + 1;
      }
    } else if (type === 'search') {
      v.searches.push({ v: val, ts: t });
      if (v.searches.length > 80) v.searches = v.searches.slice(-80);
      var q = val.replace(/^(products|works):/, '').trim().toLowerCase();
      if (q) stats.searches[q] = (stats.searches[q] || 0) + 1;
    } else if (type === 'suggest') {
      v.clicks.push({ v: 'suggest:' + val, ts: t });
      stats.suggestClicks[val] = (stats.suggestClicks[val] || 0) + 1;
    } else if (type === 'env') {
      var env = util.safeJson(val, null) || (e.d && typeof e.d === 'object' ? e.d : null);
      if (env) {
        v.screen = util.clampStr(env.screen, 30);
        v.tz = util.clampStr(env.tz, 60);
        v.platform = util.clampStr(env.platform, 60);
        v.cores = util.clampNum(env.cores, 0, 512, 0);
        v.memory = util.clampNum(env.memory, 0, 1024, 0);
        v.touch = util.clampBool(env.touch);
        v.referrer = util.clampStr(env.referrer, 200);
        v.netInfo = util.clampStr(env.net, 60);
      }
    } else if (type === 'leave') {
      var dur = util.clampNum(e.d, 0, 12 * 3600 * 1000, 0);
      if (dur) v.totalMs = (v.totalMs || 0) + Math.min(dur, 5 * 60 * 1000);
    }
  });
  store.markTrack();
}

function topEntries(obj, n) {
  return Object.keys(obj || {}).map(function (k) { return { key: k, count: obj[k] }; })
    .sort(function (a, b) { return b.count - a.count; }).slice(0, n);
}

function summary() {
  var track = store.getTrack();
  var db = store.getDb();
  var visitors = Object.keys(track.visitors).map(function (k) { return track.visitors[k]; });
  var t = util.now();
  var day = 24 * 3600 * 1000;
  var online = visitors.filter(function (v) { return t - v.lastSeen < 5 * 60 * 1000; }).length;
  var today = visitors.filter(function (v) { return t - v.lastSeen < day; }).length;
  var week = visitors.length;
  var pageCounts = {};
  visitors.forEach(function (v) {
    Object.keys(v.pages || {}).forEach(function (p) {
      pageCounts[p] = (pageCounts[p] || 0) + v.pages[p].n;
    });
  });
  var nameOf = function (list, id, field) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i][field || 'name'] || list[i].title || id;
    return id;
  };
  var mapNames = function (entries, list, field) {
    return entries.map(function (e) {
      return { key: e.key, name: nameOf(list, e.key, field), count: e.count };
    });
  };
  return {
    online: online, today: today, week: week,
    totalPageViews: Object.keys(pageCounts).reduce(function (s, k) { return s + pageCounts[k]; }, 0),
    topPages: topEntries(pageCounts, 10),
    topSearches: topEntries(track.stats.searches, 10),
    topProducts: mapNames(topEntries(track.stats.productViews, 8), db.products, 'name'),
    topWorks: mapNames(topEntries(track.stats.portfolioViews, 8), db.portfolio, 'title'),
    topArticles: mapNames(topEntries(track.stats.articleViews, 8), db.articles, 'title'),
    topCategories: mapNames(topEntries(track.stats.categoryViews, 8), db.categories, 'name'),
    topSuggests: topEntries(track.stats.suggestClicks, 8),
    devices: visitors.reduce(function (acc, v) { acc[v.device] = (acc[v.device] || 0) + 1; return acc; }, {}),
    browsers: visitors.reduce(function (acc, v) { acc[v.browser] = (acc[v.browser] || 0) + 1; return acc; }, {})
  };
}

function visitorList() {
  var track = store.getTrack();
  return Object.keys(track.visitors).map(function (k) {
    var v = track.visitors[k];
    return {
      id: v.id, ip: v.ip, firstSeen: v.firstSeen, lastSeen: v.lastSeen,
      totalMs: v.totalMs, sessions: v.sessions, browser: v.browser, os: v.os,
      device: v.device, lang: v.lang, screen: v.screen, tz: v.tz,
      platform: v.platform, cores: v.cores, memory: v.memory, touch: v.touch,
      referrer: v.referrer, netInfo: v.netInfo,
      pageCount: Object.keys(v.pages || {}).length,
      clickCount: (v.clicks || []).length,
      viewCount: (v.views || []).length,
      searchCount: (v.searches || []).length
    };
  }).sort(function (a, b) { return b.lastSeen - a.lastSeen; });
}

function visitorDetail(id) {
  var track = store.getTrack();
  return track.visitors[id] || null;
}

function deleteVisitor(id) {
  var track = store.getTrack();
  if (track.visitors[id]) {
    delete track.visitors[id];
    store.markTrack();
    return true;
  }
  return false;
}

function clearVisitors() {
  var track = store.getTrack();
  track.visitors = {};
  store.markTrack();
}

module.exports = {
  getIp: getIp, parseUA: parseUA, getVisitor: getVisitor, recordEvents: recordEvents,
  summary: summary, visitorList: visitorList, visitorDetail: visitorDetail,
  deleteVisitor: deleteVisitor, clearVisitors: clearVisitors
};
