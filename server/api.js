'use strict';
const fs = require('fs');
const path = require('path');
const util = require('./util.js');
const store = require('./store.js');
const security = require('./security.js');
const tracking = require('./tracking.js');

function publicSettings(s) {
  return {
    siteName: s.siteName, siteNameEn: s.siteNameEn, tagline: s.tagline,
    logoText: s.logoText, logoImage: s.logoImage, theme: s.theme, fontScale: s.fontScale,
    header: s.header, hero: s.hero, banner: s.banner, sectionsMeta: s.sectionsMeta,
    sectionOrder: s.sectionOrder, stats: s.stats, faq: s.faq, footer: s.footer,
    contactPage: s.contactPage
  };
}

function listArticlesPublic(db) {
  return db.articles.filter(function (a) { return a.published; }).map(function (a) {
    return { id: a.id, code: a.code, title: a.title, topic: a.topic, desc: a.desc, cover: a.cover, createdAt: a.createdAt };
  });
}

function listPortfolioPublic(db) {
  return db.portfolio.map(function (w) {
    return { id: w.id, code: w.code, title: w.title, category: w.category, desc: w.desc, cover: w.cover, featuredHome: !!w.featuredHome, featuredTop: !!w.featuredTop, mediaCount: (w.media || []).length, createdAt: w.createdAt };
  });
}

function findById(list, id) {
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

function sanitizeLinks(arr, max) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, max).map(function (l) {
    return { id: util.clampStr(l.id, 24) || util.uid(4), label: util.clampStr(l.label, 60), url: sanitizeUrl(l.url) };
  });
}

function sanitizeUrl(u) {
  u = util.clampStr(u, 300).trim();
  if (!u) return '';
  if (/^(javascript|data|vbscript|file):/i.test(u)) return '';
  if (/^https?:\/\//i.test(u) || u[0] === '/' || u[0] === '#') return u;
  return '/' + u;
}

function sanitizeMediaRef(m) {
  m = util.clampStr(m, 200).trim();
  if (!m) return '';
  if (m.indexOf('u/') === 0) {
    var n = m.slice(2);
    if (/^[a-zA-Z0-9._-]+$/.test(n) && n.indexOf('..') === -1) return m;
    return '';
  }
  return '';
}

function mediaPath(ref) {
  if (!ref || ref.indexOf('u/') !== 0) return null;
  return path.join(store.UPLOAD_DIR, ref.slice(2));
}

function sanitizeBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks.slice(0, 60).map(function (b) {
    var type = util.clampStr(b.type, 12);
    var out = { id: util.clampStr(b.id, 24) || util.uid(4), type: type };
    if (type === 'text') out.text = util.clampStr(b.text, 8000);
    else if (type === 'heading') out.text = util.clampStr(b.text, 300);
    else if (type === 'image') { out.src = sanitizeMediaRef(b.src); out.caption = util.clampStr(b.caption, 300); }
    else if (type === 'video') { out.src = sanitizeMediaRef(b.src); out.caption = util.clampStr(b.caption, 300); }
    else if (type === 'steps') {
      out.title = util.clampStr(b.title, 200);
      out.steps = Array.isArray(b.steps) ? b.steps.slice(0, 40).map(function (s) { return util.clampStr(s, 600); }) : [];
    } else out.type = 'text', out.text = '';
    return out;
  });
}

function sanitizeStory(x) {
  return {
    id: util.clampStr(x.id, 24) || util.uid(6),
    title: util.clampStr(x.title, 80),
    type: ['image', 'video', 'product'].indexOf(x.type) !== -1 ? x.type : 'image',
    media: sanitizeMediaRef(x.media),
    caption: util.clampStr(x.caption, 400),
    productId: util.clampStr(x.productId, 24),
    order: util.clampNum(x.order, 0, 9999, 0),
    createdAt: util.clampNum(x.createdAt, 0, 9e15, util.now())
  };
}

function sanitizeService(x) {
  return {
    id: util.clampStr(x.id, 24) || util.uid(6),
    title: util.clampStr(x.title, 120),
    desc: util.clampStr(x.desc, 600),
    icon: util.clampStr(x.icon, 30),
    order: util.clampNum(x.order, 0, 9999, 0),
    enabled: util.clampBool(x.enabled)
  };
}

function sanitizeCategory(x) {
  return {
    id: util.clampStr(x.id, 24) || util.uid(6),
    name: util.clampStr(x.name, 100),
    slug: util.slugify(util.clampStr(x.slug || x.name, 100))
  };
}

function sanitizeProduct(x) {
  return {
    id: util.clampStr(x.id, 24) || util.uid(6),
    code: util.clampStr(x.code, 40),
    name: util.clampStr(x.name, 200),
    desc: util.clampStr(x.desc, 2000),
    category: util.clampStr(x.category, 24),
    image: sanitizeMediaRef(x.image),
    images: (Array.isArray(x.images) ? x.images : []).slice(0, 12).map(sanitizeMediaRef).filter(Boolean),
    featured: util.clampBool(x.featured),
    order: util.clampNum(x.order, 0, 9999, 0),
    tags: (Array.isArray(x.tags) ? x.tags : []).slice(0, 15).map(function (t) { return util.clampStr(t, 40); }).filter(Boolean),
    createdAt: util.clampNum(x.createdAt, 0, 9e15, util.now())
  };
}

function sanitizeProvince(x) {
  return {
    id: util.clampStr(x.id, 24) || util.uid(6),
    name: util.clampStr(x.name, 80),
    allCities: util.clampBool(x.allCities),
    cities: (Array.isArray(x.cities) ? x.cities : []).slice(0, 80).map(function (c) {
      return { name: util.clampStr(c.name, 80), active: util.clampBool(c.active) };
    })
  };
}

function sanitizeArticle(x) {
  return {
    id: util.clampStr(x.id, 24) || util.uid(6),
    code: util.clampStr(x.code, 40),
    title: util.clampStr(x.title, 300),
    topic: util.clampStr(x.topic, 120),
    desc: util.clampStr(x.desc, 1000),
    cover: sanitizeMediaRef(x.cover),
    font: util.clampStr(x.font, 20) || 'vazir',
    published: util.clampBool(x.published),
    createdAt: util.clampNum(x.createdAt, 0, 9e15, util.now()),
    blocks: sanitizeBlocks(x.blocks)
  };
}

function sanitizeWork(x) {
  return {
    id: util.clampStr(x.id, 24) || util.uid(6),
    code: util.clampStr(x.code, 40),
    title: util.clampStr(x.title, 300),
    category: util.clampStr(x.category, 24),
    desc: util.clampStr(x.desc, 1000),
    cover: sanitizeMediaRef(x.cover),
    media: (Array.isArray(x.media) ? x.media : []).slice(0, 24).map(function (m) {
      return {
        type: ['image', 'video'].indexOf(m.type) !== -1 ? m.type : 'image',
        src: sanitizeMediaRef(m.src),
        caption: util.clampStr(m.caption, 300)
      };
    }).filter(function (m) { return m.src; }),
    featuredHome: util.clampBool(x.featuredHome),
    featuredTop: util.clampBool(x.featuredTop),
    createdAt: util.clampNum(x.createdAt, 0, 9e15, util.now()),
    blocks: sanitizeBlocks(x.blocks)
  };
}

function sanitizeContactItems(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 20).map(function (it) {
    return {
      id: util.clampStr(it.id, 24) || util.uid(4),
      icon: util.clampStr(it.icon, 30),
      label: util.clampStr(it.label, 80),
      value: util.clampStr(it.value, 300),
      enabled: util.clampBool(it.enabled)
    };
  });
}

function sanitizeSettings(cur, x) {
  var s = {};
  s.siteName = util.clampStr(x.siteName, 100) || cur.siteName;
  s.siteNameEn = util.clampStr(x.siteNameEn, 100) || cur.siteNameEn;
  s.tagline = util.clampStr(x.tagline, 200);
  s.logoText = util.clampStr(x.logoText, 40);
  s.logoImage = sanitizeMediaRef(x.logoImage);
  s.theme = x.theme === 'light' ? 'light' : 'dark';
  s.fontScale = util.clampNum(x.fontScale, 80, 130, 100);
  s.header = { links: sanitizeLinks(x.header && x.header.links, 10) };
  var h = x.hero || {};
  s.hero = {
    enabled: util.clampBool(h.enabled),
    title: util.clampStr(h.title, 80),
    welcome: util.clampStr(h.welcome, 200),
    description: util.clampStr(h.description, 300),
    sub: util.clampStr(h.sub, 300),
    ctaLabel: util.clampStr(h.ctaLabel, 60), ctaUrl: sanitizeUrl(h.ctaUrl),
    cta2Label: util.clampStr(h.cta2Label, 60), cta2Url: sanitizeUrl(h.cta2Url)
  };
  var b = x.banner || {};
  s.banner = {
    enabled: util.clampBool(b.enabled),
    text: util.clampStr(b.text, 300),
    buttonLabel: util.clampStr(b.buttonLabel, 80),
    buttonUrl: sanitizeUrl(b.buttonUrl)
  };
  var sm = x.sectionsMeta || {};
  s.sectionsMeta = {};
  ['stories', 'services', 'products', 'provinces', 'articles', 'portfolioHome', 'stats', 'faq'].forEach(function (k) {
    var m = sm[k] || {};
    s.sectionsMeta[k] = {
      enabled: util.clampBool(m.enabled),
      title: util.clampStr(m.title, 150),
      subtitle: util.clampStr(m.subtitle, 300)
    };
  });
  var validSections = ['hero', 'stories', 'banner', 'services', 'products', 'portfolioHome', 'provinces', 'stats', 'articles', 'faq'];
  s.sectionOrder = (Array.isArray(x.sectionOrder) ? x.sectionOrder : []).filter(function (k) {
    return validSections.indexOf(k) !== -1;
  });
  validSections.forEach(function (k) { if (s.sectionOrder.indexOf(k) === -1) s.sectionOrder.push(k); });
  s.stats = (Array.isArray(x.stats) ? x.stats : []).slice(0, 8).map(function (st) {
    return { id: util.clampStr(st.id, 24) || util.uid(4), label: util.clampStr(st.label, 80), value: util.clampStr(st.value, 30) };
  });
  s.faq = (Array.isArray(x.faq) ? x.faq : []).slice(0, 30).map(function (f) {
    return { id: util.clampStr(f.id, 24) || util.uid(4), q: util.clampStr(f.q, 300), a: util.clampStr(f.a, 2000) };
  });
  var fo = x.footer || {};
  s.footer = {
    about: util.clampStr(fo.about, 600),
    copyright: util.clampStr(fo.copyright, 200),
    columns: (Array.isArray(fo.columns) ? fo.columns : []).slice(0, 5).map(function (c) {
      return { id: util.clampStr(c.id, 24) || util.uid(4), title: util.clampStr(c.title, 80), links: sanitizeLinks(c.links, 10) };
    })
  };
  var cp = x.contactPage || {};
  s.contactPage = {
    sections: (Array.isArray(cp.sections) ? cp.sections : []).slice(0, 12).map(function (cs) {
      return {
        id: util.clampStr(cs.id, 24) || util.uid(4),
        type: ['channels', 'social', 'info', 'custom'].indexOf(cs.type) !== -1 ? cs.type : 'custom',
        enabled: util.clampBool(cs.enabled),
        title: util.clampStr(cs.title, 200),
        subtitle: util.clampStr(cs.subtitle, 300),
        items: sanitizeContactItems(cs.items)
      };
    })
  };
  var nf = x.notifications || {};
  s.notifications = {
    backup: util.clampBool(nf.backup),
    restore: util.clampBool(nf.restore),
    content: util.clampBool(nf.content),
    tracking: util.clampBool(nf.tracking)
  };
  return s;
}

function requireAdmin(req, cookies) {
  var sid = cookies.asid;
  if (!sid) return null;
  return security.getSession(sid);
}

function csrfOk(req, sess) {
  return sess && util.timingSafeEq(String(req.headers['x-csrf'] || ''), sess.csrf);
}

function csvEscape(v) {
  var s = String(v == null ? '' : v);
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function fmtDate(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function collectionSizes(db) {
  var uploads = [];
  var total = 0;
  try {
    fs.readdirSync(store.UPLOAD_DIR).forEach(function (f) {
      try {
        var st = fs.statSync(path.join(store.UPLOAD_DIR, f));
        if (st.isFile()) { uploads.push({ name: f, size: st.size }); total += st.size; }
      } catch (e) {}
    });
  } catch (e) {}
  var dbSize = Buffer.byteLength(JSON.stringify(db));
  var trackSize = Buffer.byteLength(JSON.stringify(store.getTrack()));
  return { uploads: uploads, dbSize: dbSize, trackSize: trackSize, totalSize: total + dbSize + trackSize };
}

var restoreSessions = {};

function handle(req, res, u, pathname, ip, cookies, h) {
  var db = store.getDb();
  var method = req.method;
  var route = pathname.slice(4);

  if (route === '/public/bootstrap' && method === 'GET') {
    return h.sendJson(res, 200, {
      settings: publicSettings(db.settings),
      stories: db.stories.slice().sort(function (a, b) { return a.order - b.order; }),
      services: db.services.filter(function (s) { return s.enabled; }).sort(function (a, b) { return a.order - b.order; }),
      categories: db.categories,
      products: db.products.slice().sort(function (a, b) { return a.order - b.order; }),
      provinces: db.provinces,
      articles: listArticlesPublic(db),
      portfolio: listPortfolioPublic(db)
    });
  }

  if (route.indexOf('/public/article/') === 0 && method === 'GET') {
    var a = findById(db.articles, util.clampStr(route.slice(16), 24));
    if (!a || !a.published) return h.notFound(res);
    return h.sendJson(res, 200, a);
  }

  if (route.indexOf('/public/work/') === 0 && method === 'GET') {
    var w = findById(db.portfolio, util.clampStr(route.slice(13), 24));
    if (!w) return h.notFound(res);
    return h.sendJson(res, 200, w);
  }

  if (route === '/public/search' && method === 'GET') {
    var q = util.clampStr(u.searchParams.get('q'), 80).trim().toLowerCase();
    var type = u.searchParams.get('type') === 'works' ? 'works' : 'products';
    if (!q) return h.sendJson(res, 200, { results: [] });
    var results;
    if (type === 'products') {
      results = db.products.filter(function (p) {
        return p.name.toLowerCase().indexOf(q) !== -1 || p.code.toLowerCase().indexOf(q) !== -1 ||
          (p.tags || []).some(function (t) { return t.toLowerCase().indexOf(q) !== -1; });
      }).slice(0, 20).map(function (p) {
        return { id: p.id, code: p.code, name: p.name, image: p.image, category: p.category };
      });
    } else {
      results = db.portfolio.filter(function (w2) {
        return w2.title.toLowerCase().indexOf(q) !== -1 || w2.code.toLowerCase().indexOf(q) !== -1;
      }).slice(0, 20).map(function (w2) {
        return { id: w2.id, code: w2.code, title: w2.title, cover: w2.cover, category: w2.category };
      });
    }
    return h.sendJson(res, 200, { results: results });
  }

  if (route === '/track' && method === 'POST') {
    if (!security.rateLimit(ip, 'trk', 120, 60000)) return h.sendJson(res, 429, { error: 'rate_limited' });
    var vid = util.clampStr(cookies.vid, 64);
    if (!vid) return h.sendJson(res, 204, {});
    return h.readJsonBody(req, 64 * 1024, function (err, body) {
      if (err) return h.sendJson(res, 400, { error: 'bad_request' });
      tracking.recordEvents(vid, req, body.events);
      h.sendJson(res, 200, { ok: true });
    });
  }

  if (route === '/admin/login' && method === 'POST') {
    if (!security.rateLimit(ip, 'login', 15, 60000) || !security.loginAllowed(ip)) {
      return h.sendJson(res, 429, { error: 'too_many_attempts' });
    }
    return h.readJsonBody(req, 4096, function (err, body) {
      if (err) return h.sendJson(res, 400, { error: 'bad_request' });
      var uOk = util.timingSafeEq(util.clampStr(body.username, 100), db.admin.username);
      var pOk = util.verifyPassword(util.clampStr(body.password, 200), db.admin.pass);
      if (!uOk || !pOk) {
        security.loginFail(ip);
        return h.sendJson(res, 401, { error: 'invalid_credentials' });
      }
      security.loginOk(ip);
      var sess = security.createSession();
      h.setCookie(res, 'asid', sess.id, { httpOnly: true, sameSite: 'Strict', maxAge: 8 * 3600 });
      h.sendJson(res, 200, { ok: true, csrf: sess.csrf });
    });
  }

  var sess = requireAdmin(req, cookies);

  if (route === '/admin/me' && method === 'GET') {
    if (!sess) return h.sendJson(res, 401, { error: 'unauthorized' });
    return h.sendJson(res, 200, { ok: true, csrf: sess.csrf, username: db.admin.username });
  }

  if (route.indexOf('/admin/') === 0) {
    if (!sess) return h.sendJson(res, 401, { error: 'unauthorized' });
    if (method !== 'GET' && !csrfOk(req, sess)) return h.sendJson(res, 403, { error: 'csrf' });
  } else {
    return h.notFound(res);
  }

  if (route === '/admin/logout' && method === 'POST') {
    security.destroySession(cookies.asid);
    h.setCookie(res, 'asid', '', { httpOnly: true, sameSite: 'Strict', maxAge: 0 });
    return h.sendJson(res, 200, { ok: true });
  }

  if (route === '/admin/password' && method === 'POST') {
    return h.readJsonBody(req, 4096, function (err, body) {
      if (err) return h.sendJson(res, 400, { error: 'bad_request' });
      if (!util.verifyPassword(util.clampStr(body.current, 200), db.admin.pass)) {
        return h.sendJson(res, 401, { error: 'invalid_credentials' });
      }
      var np = util.clampStr(body.next, 200);
      if (np.length < 6) return h.sendJson(res, 400, { error: 'weak_password' });
      db.admin.pass = util.hashPassword(np);
      store.markDb();
      h.sendJson(res, 200, { ok: true });
    });
  }

  if (route === '/admin/settings') {
    if (method === 'GET') return h.sendJson(res, 200, db.settings);
    if (method === 'PUT') {
      return h.readJsonBody(req, 512 * 1024, function (err, body) {
        if (err) return h.sendJson(res, 400, { error: 'bad_request' });
        db.settings = sanitizeSettings(db.settings, body);
        store.markDb();
        h.sendJson(res, 200, { ok: true, settings: db.settings });
      });
    }
  }

  var collections = {
    stories: { key: 'stories', sanitize: sanitizeStory, max: 40 },
    services: { key: 'services', sanitize: sanitizeService, max: 30 },
    categories: { key: 'categories', sanitize: sanitizeCategory, max: 40 },
    products: { key: 'products', sanitize: sanitizeProduct, max: 500 },
    provinces: { key: 'provinces', sanitize: sanitizeProvince, max: 40 },
    articles: { key: 'articles', sanitize: sanitizeArticle, max: 500 },
    portfolio: { key: 'portfolio', sanitize: sanitizeWork, max: 500 }
  };

  var colMatch = route.match(/^\/admin\/(stories|services|categories|products|provinces|articles|portfolio)(?:\/([a-zA-Z0-9_-]{1,24}))?$/);
  if (colMatch) {
    var col = collections[colMatch[1]];
    var list = db[col.key];
    var itemId = colMatch[2];
    if (method === 'GET' && !itemId) return h.sendJson(res, 200, list);
    if (method === 'GET' && itemId) {
      var item = findById(list, itemId);
      return item ? h.sendJson(res, 200, item) : h.notFound(res);
    }
    if (method === 'POST' && !itemId) {
      return h.readJsonBody(req, 1024 * 1024, function (err, body) {
        if (err) return h.sendJson(res, 400, { error: 'bad_request' });
        if (list.length >= col.max) return h.sendJson(res, 400, { error: 'limit_reached' });
        var next = col.sanitize(body);
        if (findById(list, next.id)) next.id = util.uid(6);
        list.push(next);
        store.markDb();
        h.sendJson(res, 200, { ok: true, item: next });
      });
    }
    if (method === 'PUT' && itemId) {
      return h.readJsonBody(req, 1024 * 1024, function (err, body) {
        if (err) return h.sendJson(res, 400, { error: 'bad_request' });
        var idx = -1;
        for (var i = 0; i < list.length; i++) if (list[i].id === itemId) { idx = i; break; }
        if (idx === -1) return h.notFound(res);
        body.id = itemId;
        list[idx] = col.sanitize(body);
        store.markDb();
        h.sendJson(res, 200, { ok: true, item: list[idx] });
      });
    }
    if (method === 'DELETE' && itemId) {
      var idx2 = -1;
      for (var j = 0; j < list.length; j++) if (list[j].id === itemId) { idx2 = j; break; }
      if (idx2 === -1) return h.notFound(res);
      list.splice(idx2, 1);
      store.markDb();
      return h.sendJson(res, 200, { ok: true });
    }
  }

  if (route === '/admin/upload' && method === 'POST') {
    var rawName = util.clampStr(req.headers['x-file-name'], 120);
    var ext = (rawName.match(/\.([a-zA-Z0-9]{1,6})$/) || [])[1] || '';
    ext = ext.toLowerCase();
    var allowed = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mov'];
    if (allowed.indexOf(ext) === -1) return h.sendJson(res, 400, { error: 'bad_type' });
    return h.readBody(req, 80 * 1024 * 1024, function (err, buf) {
      if (err) return h.sendJson(res, 413, { error: 'too_large' });
      if (!buf || buf.length === 0) return h.sendJson(res, 400, { error: 'empty' });
      if (ext === 'svg') {
        var txt = buf.toString('utf8');
        if (/<script|onload\s*=|onerror\s*=|javascript:/i.test(txt)) return h.sendJson(res, 400, { error: 'bad_svg' });
      }
      var fname = util.uid(10) + '.' + ext;
      fs.writeFile(path.join(store.UPLOAD_DIR, fname), buf, function (werr) {
        if (werr) return h.sendJson(res, 500, { error: 'write_failed' });
        h.sendJson(res, 200, { ok: true, ref: 'u/' + fname });
      });
    });
  }

  if (route === '/admin/media' && method === 'GET') {
    var sizes = collectionSizes(db);
    return h.sendJson(res, 200, { files: sizes.uploads });
  }

  if (route.indexOf('/admin/media/') === 0 && method === 'DELETE') {
    var mn = h.safeName(route.slice(13));
    if (!mn) return h.notFound(res);
    var mp = path.join(store.UPLOAD_DIR, mn);
    return fs.unlink(mp, function (err) {
      if (err) return h.notFound(res);
      h.sendJson(res, 200, { ok: true });
    });
  }

  if (route === '/admin/track/summary' && method === 'GET') {
    return h.sendJson(res, 200, tracking.summary());
  }

  if (route === '/admin/track/visitors' && method === 'GET') {
    return h.sendJson(res, 200, { visitors: tracking.visitorList() });
  }

  if (route.indexOf('/admin/track/visitor/') === 0) {
    var vId = util.clampStr(route.slice(21), 64);
    if (method === 'GET') {
      var det = tracking.visitorDetail(vId);
      return det ? h.sendJson(res, 200, det) : h.notFound(res);
    }
    if (method === 'DELETE') {
      return tracking.deleteVisitor(vId) ? h.sendJson(res, 200, { ok: true }) : h.notFound(res);
    }
  }

  if (route === '/admin/track/clear' && method === 'POST') {
    tracking.clearVisitors();
    return h.sendJson(res, 200, { ok: true });
  }

  if (route === '/admin/track/export' && method === 'GET') {
    var rows = tracking.visitorList();
    var head = ['ID', 'IP', 'First Seen', 'Last Seen', 'Online Minutes', 'Sessions', 'Browser', 'OS', 'Device', 'Language', 'Screen', 'Timezone', 'Platform', 'CPU Cores', 'Memory GB', 'Touch', 'Referrer', 'Network', 'Pages', 'Clicks', 'Views', 'Searches'];
    var lines = [head.join(',')];
    rows.forEach(function (v) {
      lines.push([
        v.id, v.ip, fmtDate(v.firstSeen), fmtDate(v.lastSeen),
        Math.round((v.totalMs || 0) / 60000 * 10) / 10, v.sessions, v.browser, v.os, v.device,
        v.lang, v.screen, v.tz, v.platform, v.cores, v.memory, v.touch ? 'yes' : 'no',
        v.referrer, v.netInfo, v.pageCount, v.clickCount, v.viewCount, v.searchCount
      ].map(csvEscape).join(','));
    });
    var csv = '\uFEFF' + lines.join('\r\n');
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="azadi_visitors.csv"',
      'Cache-Control': 'no-store'
    });
    return res.end(csv);
  }

  if (route === '/admin/backup/manifest' && method === 'GET') {
    var cs = collectionSizes(db);
    return h.sendJson(res, 200, {
      version: 1,
      generatedAt: util.now(),
      dbSize: cs.dbSize,
      trackSize: cs.trackSize,
      files: cs.uploads,
      totalSize: cs.totalSize
    });
  }

  if (route === '/admin/backup/db' && method === 'GET') {
    return h.sendJson(res, 200, { db: db, track: store.getTrack(), exportedAt: util.now(), format: 'azadi-backup-1' });
  }

  if (route.indexOf('/admin/backup/file/') === 0 && method === 'GET') {
    var bn = h.safeName(route.slice(19));
    if (!bn) return h.notFound(res);
    var bp = path.join(store.UPLOAD_DIR, bn);
    return fs.stat(bp, function (err, st) {
      if (err || !st.isFile()) return h.notFound(res);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': st.size,
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(bp).pipe(res);
    });
  }

  if (route === '/admin/restore/begin' && method === 'POST') {
    return h.readJsonBody(req, 4096, function (err, body) {
      if (err) return h.sendJson(res, 400, { error: 'bad_request' });
      var rid = util.uid(8);
      restoreSessions[rid] = { ts: util.now(), files: 0 };
      h.sendJson(res, 200, { ok: true, rid: rid });
    });
  }

  if (route === '/admin/restore/file' && method === 'POST') {
    var rid1 = util.clampStr(req.headers['x-restore-id'], 24);
    if (!restoreSessions[rid1]) return h.sendJson(res, 400, { error: 'no_session' });
    var fn = h.safeName(util.clampStr(req.headers['x-file-name'], 130));
    if (!fn) return h.sendJson(res, 400, { error: 'bad_name' });
    var fext = (fn.match(/\.([a-zA-Z0-9]{1,6})$/) || [])[1] || '';
    var allowedR = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mov'];
    if (allowedR.indexOf(fext.toLowerCase()) === -1) return h.sendJson(res, 400, { error: 'bad_type' });
    return h.readBody(req, 120 * 1024 * 1024, function (err, buf) {
      if (err) return h.sendJson(res, 413, { error: 'too_large' });
      fs.writeFile(path.join(store.UPLOAD_DIR, fn), buf, function (werr) {
        if (werr) return h.sendJson(res, 500, { error: 'write_failed' });
        restoreSessions[rid1].files++;
        h.sendJson(res, 200, { ok: true });
      });
    });
  }

  if (route === '/admin/restore/commit' && method === 'POST') {
    var rid2 = util.clampStr(req.headers['x-restore-id'], 24);
    if (!restoreSessions[rid2]) return h.sendJson(res, 400, { error: 'no_session' });
    return h.readJsonBody(req, 32 * 1024 * 1024, function (err, body) {
      if (err) return h.sendJson(res, 400, { error: 'bad_request' });
      if (!body.db || body.format !== 'azadi-backup-1' || !body.db.settings) {
        return h.sendJson(res, 400, { error: 'bad_backup' });
      }
      var currentAdmin = db.admin;
      var nextDb = body.db;
      if (!nextDb.admin || !nextDb.admin.pass) nextDb.admin = currentAdmin;
      ['stories', 'services', 'categories', 'products', 'provinces', 'articles', 'portfolio'].forEach(function (k) {
        if (!Array.isArray(nextDb[k])) nextDb[k] = [];
      });
      nextDb.settings = sanitizeSettings(nextDb.settings, nextDb.settings);
      nextDb.stories = nextDb.stories.slice(0, 40).map(sanitizeStory);
      nextDb.services = nextDb.services.slice(0, 30).map(sanitizeService);
      nextDb.categories = nextDb.categories.slice(0, 40).map(sanitizeCategory);
      nextDb.products = nextDb.products.slice(0, 500).map(sanitizeProduct);
      nextDb.provinces = nextDb.provinces.slice(0, 40).map(sanitizeProvince);
      nextDb.articles = nextDb.articles.slice(0, 500).map(sanitizeArticle);
      nextDb.portfolio = nextDb.portfolio.slice(0, 500).map(sanitizeWork);
      if (!nextDb.meta) nextDb.meta = { createdAt: util.now(), version: 1 };
      store.replaceDb(nextDb);
      if (body.track && body.track.visitors) store.replaceTrack(body.track);
      delete restoreSessions[rid2];
      h.sendJson(res, 200, { ok: true, files: 0 });
    });
  }

  h.notFound(res);
}

setInterval(function () {
  var t = util.now();
  Object.keys(restoreSessions).forEach(function (k) {
    if (t - restoreSessions[k].ts > 3600000) delete restoreSessions[k];
  });
}, 600000).unref();

module.exports = { handle: handle };
