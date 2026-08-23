'use strict';
const fs = require('fs');
const path = require('path');
const util = require('./util.js');

const DATA_DIR = process.env.AZADI_DATA_DIR
  ? path.resolve(process.env.AZADI_DATA_DIR)
  : (process.env.VERCEL ? '/tmp/azadi-data' : path.join(__dirname, '..', 'data'));
const DB_FILE = path.join(DATA_DIR, 'db.json');
const TRACK_FILE = path.join(DATA_DIR, 'tracking.json');
const SECRET_FILE = path.join(DATA_DIR, 'secret.key');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const TMP_DIR = path.join(DATA_DIR, 'tmp');

function ensureDirs() {
  [DATA_DIR, UPLOAD_DIR, TMP_DIR].forEach(function (d) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

function atomicWrite(file, content) {
  var tmp = file + '.' + util.uid(4) + '.tmp';
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

function loadJson(file, fallback) {
  try {
    if (fs.existsSync(file)) {
      return util.safeJson(fs.readFileSync(file, 'utf8'), fallback);
    }
  } catch (e) {}
  return fallback;
}

var db = null;
var track = null;
var dbDirty = false;
var trackDirty = false;

function getSecret() {
  ensureDirs();
  try {
    if (fs.existsSync(SECRET_FILE)) {
      var s = fs.readFileSync(SECRET_FILE, 'utf8').trim();
      if (s.length >= 32) return s;
    }
  } catch (e) {}
  var secret = util.uid(32);
  atomicWrite(SECRET_FILE, secret);
  return secret;
}

function migrate(next) {
  if (!next || !next.settings) return next;
  var s = next.settings;
  if (!s.commerce) {
    s.commerce = {
      priceText: 'جهت خرید یا اطلاع از قیمت در صفحه ارتباط با ما بهمون پیغام دهید.',
      buyButtonText: 'جهت خرید یا اطلاع از قیمت در صفحه ارتباط با ما بهمون پیغام دهید.'
    };
  }
  if (!s.commerce.priceText) s.commerce.priceText = 'جهت خرید یا اطلاع از قیمت در صفحه ارتباط با ما بهمون پیغام دهید.';
  if (!s.commerce.buyButtonText) s.commerce.buyButtonText = s.commerce.priceText;
  if (!s.sectionsMeta) s.sectionsMeta = {};
  if (!s.sectionsMeta.offers) {
    s.sectionsMeta.offers = { enabled: true, title: 'پیشنهاد ویژه', subtitle: 'فرصت‌های منتخب این هفته' };
  }
  var wanted = ['hero', 'stories', 'services', 'products', 'portfolioHome', 'provinces', 'articles', 'offers', 'stats', 'faq'];
  var ver = (next.meta && next.meta.version) || 1;
  if (ver < 2) {
    s.sectionOrder = wanted.slice();
    if (!next.meta) next.meta = {};
    next.meta.version = 2;
  } else {
    s.sectionOrder = (Array.isArray(s.sectionOrder) ? s.sectionOrder : []).filter(function (k) {
      return wanted.indexOf(k) !== -1;
    });
    wanted.forEach(function (k) { if (s.sectionOrder.indexOf(k) === -1) s.sectionOrder.push(k); });
  }
  if (!Array.isArray(next.banners)) {
    next.banners = [
      { id: 'bn1', title: 'نظارت تصویری هوشمند', subtitle: 'دوربین و NVR سازمانی', image: 'u/banner-cctv.svg', url: '/shop?cat=cctv', order: 1, enabled: true },
      { id: 'bn2', title: 'لینک وایرلس پایدار', subtitle: 'ارتباط نقطه به نقطه تا ۲۰ کیلومتر', image: 'u/banner-wireless.svg', url: '/shop?cat=wireless', order: 2, enabled: true },
      { id: 'bn3', title: 'اتاق سرور استاندارد', subtitle: 'رک، UPS و خنک‌سازی حرفه‌ای', image: 'u/banner-server.svg', url: '/portfolio', order: 3, enabled: true },
      { id: 'bn4', title: 'شبکه سازمانی امن', subtitle: 'سوییچ، فایروال و پشتیبانی ۲۴/۷', image: 'u/banner-net.svg', url: '/contact', order: 4, enabled: true }
    ];
  }
  (next.products || []).forEach(function (p) {
    if (!Array.isArray(p.images)) p.images = p.image ? [p.image] : [];
    if (!p.video) p.video = '';
    if (!p.banner) p.banner = '';
    if (!Array.isArray(p.features)) p.features = [];
    if (!p.details) p.details = '';
    if (!Array.isArray(p.blocks)) p.blocks = [];
    if (p.specialOffer == null) p.specialOffer = false;
  });
  return next;
}

function init(seedFn) {
  ensureDirs();
  db = loadJson(DB_FILE, null);
  if (!db || !db.settings) {
    db = seedFn();
    saveDbNow();
  } else {
    db = migrate(db);
    saveDbNow();
  }
  track = loadJson(TRACK_FILE, null);
  if (!track) {
    track = { visitors: {}, stats: { searches: {}, productViews: {}, portfolioViews: {}, articleViews: {}, categoryViews: {}, suggestClicks: {} } };
    saveTrackNow();
  }
  if (!track.stats) track.stats = { searches: {}, productViews: {}, portfolioViews: {}, articleViews: {}, categoryViews: {}, suggestClicks: {} };
  setInterval(flush, 4000).unref();
  setInterval(cleanupVisitors, 6 * 3600 * 1000).unref();
  cleanupVisitors();
}

function getDb() { return db; }
function getTrack() { return track; }
function markDb() { dbDirty = true; }
function markTrack() { trackDirty = true; }

function saveDbNow() {
  atomicWrite(DB_FILE, JSON.stringify(db));
  dbDirty = false;
}
function saveTrackNow() {
  atomicWrite(TRACK_FILE, JSON.stringify(track));
  trackDirty = false;
}
function flush() {
  try {
    if (dbDirty) saveDbNow();
    if (trackDirty) saveTrackNow();
  } catch (e) {}
}

function cleanupVisitors() {
  var cutoff = util.now() - 7 * 24 * 3600 * 1000;
  var removed = 0;
  Object.keys(track.visitors).forEach(function (id) {
    var v = track.visitors[id];
    if ((v.lastSeen || 0) < cutoff) {
      delete track.visitors[id];
      removed++;
    }
  });
  if (removed > 0) markTrack();
}

function replaceDb(next) {
  db = next;
  saveDbNow();
}
function replaceTrack(next) {
  track = next;
  if (!track.stats) track.stats = { searches: {}, productViews: {}, portfolioViews: {}, articleViews: {}, categoryViews: {}, suggestClicks: {} };
  if (!track.visitors) track.visitors = {};
  saveTrackNow();
}

module.exports = {
  DATA_DIR: DATA_DIR, DB_FILE: DB_FILE, TRACK_FILE: TRACK_FILE,
  UPLOAD_DIR: UPLOAD_DIR, TMP_DIR: TMP_DIR,
  init: init, getDb: getDb, getTrack: getTrack, markDb: markDb, markTrack: markTrack,
  flush: flush, saveDbNow: saveDbNow, saveTrackNow: saveTrackNow,
  replaceDb: replaceDb, replaceTrack: replaceTrack, getSecret: getSecret,
  cleanupVisitors: cleanupVisitors
};
