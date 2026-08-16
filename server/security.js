'use strict';
const util = require('./util.js');

var buckets = {};
var loginAttempts = {};

setInterval(function () {
  var t = util.now();
  Object.keys(buckets).forEach(function (k) {
    if (t - buckets[k].ts > 120000) delete buckets[k];
  });
  Object.keys(loginAttempts).forEach(function (k) {
    if (t - loginAttempts[k].ts > 900000) delete loginAttempts[k];
  });
}, 60000).unref();

function rateLimit(ip, key, limit, windowMs) {
  var id = key + ':' + ip;
  var t = util.now();
  var b = buckets[id];
  if (!b || t - b.ts > windowMs) {
    buckets[id] = { ts: t, n: 1 };
    return true;
  }
  b.n++;
  return b.n <= limit;
}

function loginAllowed(ip) {
  var a = loginAttempts[ip];
  if (!a) return true;
  if (util.now() - a.ts > 900000) { delete loginAttempts[ip]; return true; }
  return a.n < 8;
}

function loginFail(ip) {
  var a = loginAttempts[ip];
  if (!a || util.now() - a.ts > 900000) loginAttempts[ip] = { ts: util.now(), n: 1 };
  else a.n++;
}

function loginOk(ip) {
  delete loginAttempts[ip];
}

var sessions = {};

setInterval(function () {
  var t = util.now();
  Object.keys(sessions).forEach(function (k) {
    if (t > sessions[k].exp) delete sessions[k];
  });
}, 300000).unref();

function createSession() {
  var id = util.uid(24);
  sessions[id] = { exp: util.now() + 8 * 3600 * 1000, csrf: util.uid(16) };
  return { id: id, csrf: sessions[id].csrf };
}

function getSession(id) {
  var s = sessions[id];
  if (!s) return null;
  if (util.now() > s.exp) { delete sessions[id]; return null; }
  s.exp = util.now() + 8 * 3600 * 1000;
  return s;
}

function destroySession(id) {
  delete sessions[id];
}

function securityHeaders(res, isHtml) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (isHtml) {
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'");
  }
}

module.exports = {
  rateLimit: rateLimit, loginAllowed: loginAllowed, loginFail: loginFail, loginOk: loginOk,
  createSession: createSession, getSession: getSession, destroySession: destroySession,
  securityHeaders: securityHeaders
};
