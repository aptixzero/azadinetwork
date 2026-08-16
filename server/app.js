'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const util = require('./util.js');
const store = require('./store.js');
const security = require('./security.js');
const tracking = require('./tracking.js');
const seedMod = require('./seed.js');
const mediaSeed = require('./media-seed.js');
const api = require('./api.js');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PORT = Number(process.env.PORT) || 3000;

store.init(seedMod.seed);
mediaSeed.ensureSeedMedia();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime'
};

const PUBLIC_ROUTES = ['/', '/shop', '/portfolio', '/articles', '/contact', '/saved', '/search'];

function send(res, code, type, body, extra) {
  var headers = { 'Content-Type': type };
  if (extra) Object.keys(extra).forEach(function (k) { headers[k] = extra[k]; });
  res.writeHead(code, headers);
  res.end(body);
}

function sendJson(res, code, obj) {
  send(res, code, 'application/json; charset=utf-8', JSON.stringify(obj), { 'Cache-Control': 'no-store' });
}

function notFound(res) {
  send(res, 404, 'application/json; charset=utf-8', '{"error":"not_found"}');
}

function serveFile(res, filePath, cacheable, downloadGuard) {
  var ext = path.extname(filePath).toLowerCase();
  var type = MIME[ext] || 'application/octet-stream';
  fs.stat(filePath, function (err, st) {
    if (err || !st.isFile()) return notFound(res);
    var headers = { 'Content-Type': type, 'Content-Length': st.size };
    if (cacheable) headers['Cache-Control'] = 'public, max-age=86400';
    else headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
    if (downloadGuard) {
      headers['Content-Disposition'] = 'inline';
      headers['X-Robots-Tag'] = 'noindex, noimageindex';
      headers['Accept-Ranges'] = 'bytes';
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
}

function safeName(name) {
  var n = String(name || '').replace(/[^a-zA-Z0-9._-]/g, '');
  if (!n || n.indexOf('..') !== -1 || n[0] === '.') return null;
  return n;
}

function readBody(req, limit, cb) {
  var chunks = [];
  var size = 0;
  var done = false;
  req.on('data', function (c) {
    if (done) return;
    size += c.length;
    if (size > limit) {
      done = true;
      cb(new Error('too_large'), null);
      req.destroy();
      return;
    }
    chunks.push(c);
  });
  req.on('end', function () {
    if (done) return;
    done = true;
    cb(null, Buffer.concat(chunks));
  });
  req.on('error', function () {
    if (done) return;
    done = true;
    cb(new Error('aborted'), null);
  });
}

function readJsonBody(req, limit, cb) {
  readBody(req, limit, function (err, buf) {
    if (err) return cb(err, null);
    var obj = util.safeJson(buf.toString('utf8'), null);
    if (!obj || typeof obj !== 'object') return cb(new Error('bad_json'), null);
    cb(null, obj);
  });
}

function setCookie(res, name, value, opts) {
  var parts = [name + '=' + encodeURIComponent(value), 'Path=/', 'SameSite=' + (opts.sameSite || 'Lax')];
  if (opts.httpOnly) parts.push('HttpOnly');
  if (opts.maxAge) parts.push('Max-Age=' + opts.maxAge);
  var prev = res.getHeader('Set-Cookie') || [];
  if (!Array.isArray(prev)) prev = [prev];
  prev.push(parts.join('; '));
  res.setHeader('Set-Cookie', prev);
}

function handle(req, res) {
  var u;
  try {
    u = new URL(req.url, 'http://localhost');
  } catch (e) {
    return send(res, 400, 'text/plain', 'bad request');
  }
  var pathname = decodeURIComponent(u.pathname).replace(/\/+$/, '') || '/';
  var ip = tracking.getIp(req);
  var isHtml = pathname === '/admin' || PUBLIC_ROUTES.indexOf(pathname) !== -1 || pathname.indexOf('/portfolio/') === 0 || pathname.indexOf('/articles/') === 0 || pathname.indexOf('/product/') === 0;
  security.securityHeaders(res, isHtml);

  if (!security.rateLimit(ip, 'g', 400, 60000)) {
    return send(res, 429, 'application/json; charset=utf-8', '{"error":"rate_limited"}', { 'Retry-After': '30' });
  }

  var cookies = util.parseCookies(req.headers.cookie);

  if (pathname.indexOf('/api/') === 0) {
    if (!security.rateLimit(ip, 'api', 200, 60000)) {
      return send(res, 429, 'application/json; charset=utf-8', '{"error":"rate_limited"}', { 'Retry-After': '30' });
    }
    return api.handle(req, res, u, pathname, ip, cookies, {
      sendJson: sendJson, readBody: readBody, readJsonBody: readJsonBody,
      setCookie: setCookie, safeName: safeName, notFound: notFound
    });
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'application/json; charset=utf-8', '{"error":"method_not_allowed"}');
  }

  if (pathname.indexOf('/m/') === 0) {
    var mname = safeName(pathname.slice(3));
    if (!mname) return notFound(res);
    var fetchDest = String(req.headers['sec-fetch-dest'] || '');
    var fetchSite = String(req.headers['sec-fetch-site'] || '');
    if (fetchSite === 'cross-site' || fetchDest === 'document' || fetchDest === 'iframe') {
      return send(res, 403, 'application/json; charset=utf-8', '{"error":"forbidden"}');
    }
    return serveFile(res, path.join(store.UPLOAD_DIR, mname), false, true);
  }

  if (pathname.indexOf('/assets/') === 0) {
    var rel = pathname.slice(8).split('/').map(safeName);
    if (rel.some(function (x) { return !x; })) return notFound(res);
    var fp = path.join(PUBLIC_DIR, 'assets', rel.join(path.sep));
    if (fp.indexOf(path.join(PUBLIC_DIR, 'assets')) !== 0) return notFound(res);
    return serveFile(res, fp, true, false);
  }

  if (pathname === '/favicon.ico' || pathname === '/favicon.svg') {
    return serveFile(res, path.join(PUBLIC_DIR, 'favicon.svg'), true, false);
  }

  if (pathname === '/robots.txt') {
    return send(res, 200, 'text/plain; charset=utf-8', 'User-agent: *\nDisallow: /admin\nDisallow: /api/\nDisallow: /m/\n');
  }

  if (pathname === '/admin') {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');
    return serveFile(res, path.join(PUBLIC_DIR, 'admin.html'), false, false);
  }

  if (isHtml || pathname === '/') {
    if (!cookies.vid) {
      var vid = util.uid(16);
      setCookie(res, 'vid', vid, { httpOnly: true, sameSite: 'Lax', maxAge: 30 * 24 * 3600 });
    }
    res.setHeader('Cache-Control', 'no-store');
    return serveFile(res, path.join(PUBLIC_DIR, 'index.html'), false, false);
  }

  notFound(res);
}

var server = http.createServer(function (req, res) {
  try {
    handle(req, res);
  } catch (e) {
    try { send(res, 500, 'application/json; charset=utf-8', '{"error":"server_error"}'); } catch (e2) {}
  }
});

server.headersTimeout = 20000;
server.requestTimeout = 120000;
server.maxHeadersCount = 60;

function requestListener(req, res) {
  try {
    handle(req, res);
  } catch (e) {
    try { send(res, 500, 'application/json; charset=utf-8', '{"error":"server_error"}'); } catch (e2) {}
  }
}

if (!process.env.VERCEL) {
  server.listen(PORT, function () {
    process.stdout.write('azadi-network listening on ' + PORT + '\n');
  });

  process.on('SIGTERM', function () { store.flush(); process.exit(0); });
  process.on('SIGINT', function () { store.flush(); process.exit(0); });
}

module.exports = requestListener;
