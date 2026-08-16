'use strict';
const crypto = require('crypto');

function uid(n) {
  return crypto.randomBytes(n || 12).toString('hex');
}

function now() {
  return Date.now();
}

function safeJson(str, fallback) {
  try { return JSON.parse(str); } catch (e) { return fallback; }
}

function clampStr(v, max) {
  if (typeof v !== 'string') return '';
  v = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  return v.length > max ? v.slice(0, max) : v;
}

function clampNum(v, min, max, dflt) {
  var n = Number(v);
  if (!isFinite(n)) return dflt;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function clampBool(v) {
  return v === true || v === 'true' || v === 1;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function timingSafeEq(a, b) {
  var ba = Buffer.from(String(a));
  var bb = Buffer.from(String(b));
  if (ba.length !== bb.length) {
    crypto.timingSafeEqual(ba, ba);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

function hmac(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  var h = crypto.scryptSync(String(password), salt, 32).toString('hex');
  return salt + ':' + h;
}

function verifyPassword(password, stored) {
  var parts = String(stored || '').split(':');
  if (parts.length !== 2) return false;
  var h = crypto.scryptSync(String(password), parts[0], 32).toString('hex');
  return timingSafeEq(h, parts[1]);
}

function slugify(s) {
  return String(s || '').trim().toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 80) || uid(4);
}

function parseCookies(header) {
  var out = {};
  if (!header) return out;
  var parts = String(header).split(';');
  for (var i = 0; i < parts.length; i++) {
    var idx = parts[i].indexOf('=');
    if (idx > 0) {
      var k = parts[i].slice(0, idx).trim();
      var v = parts[i].slice(idx + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  }
  return out;
}

module.exports = {
  uid: uid, now: now, safeJson: safeJson, clampStr: clampStr, clampNum: clampNum,
  clampBool: clampBool, esc: esc, timingSafeEq: timingSafeEq, hmac: hmac,
  hashPassword: hashPassword, verifyPassword: verifyPassword, slugify: slugify,
  parseCookies: parseCookies
};
