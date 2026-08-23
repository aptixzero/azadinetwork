'use strict';
const fs = require('fs');

var MAGIC = Buffer.from('AZBK');
var MAX_MEDIA = 80 * 1024 * 1024;
var CHUNK = 64 * 1024;

function packToFile(outPath, payload, files) {
  var metaFiles = [];
  var included = [];
  var total = 0;
  (files || []).forEach(function (f) {
    try {
      var st = fs.statSync(f.absPath);
      if (!st.isFile() || st.size < 0) return;
      if (total + st.size > MAX_MEDIA) return;
      metaFiles.push({ name: f.name, size: st.size });
      included.push(f);
      total += st.size;
    } catch (e) {}
  });
  var json = Buffer.from(JSON.stringify({
    format: 'azadi-bak-2',
    exportedAt: payload.exportedAt,
    db: payload.db,
    track: payload.track,
    files: metaFiles
  }), 'utf8');
  var header = Buffer.alloc(9);
  MAGIC.copy(header, 0);
  header[4] = 2;
  header.writeUInt32BE(json.length, 5);
  var fd = fs.openSync(outPath, 'w');
  try {
    fs.writeSync(fd, header);
    fs.writeSync(fd, json);
    included.forEach(function (f) {
      var src = fs.openSync(f.absPath, 'r');
      try {
        var buf = Buffer.alloc(CHUNK);
        var n;
        while ((n = fs.readSync(src, buf, 0, buf.length, null)) > 0) {
          fs.writeSync(fd, buf, 0, n);
        }
      } finally {
        fs.closeSync(src);
      }
    });
  } finally {
    fs.closeSync(fd);
  }
  return outPath;
}

function unpack(buf) {
  if (!buf || buf.length < 9) throw new Error('bad_backup');
  if (buf.slice(0, 4).toString('ascii') !== 'AZBK') throw new Error('bad_magic');
  var jlen = buf.readUInt32BE(5);
  if (jlen < 2 || 9 + jlen > buf.length) throw new Error('bad_backup');
  var json = JSON.parse(buf.slice(9, 9 + jlen).toString('utf8'));
  if (!json || !json.db || !json.db.settings) throw new Error('bad_backup');
  var off = 9 + jlen;
  var files = {};
  (json.files || []).forEach(function (f) {
    var size = Number(f.size) || 0;
    if (size < 0 || off + size > buf.length) throw new Error('bad_backup');
    var name = String(f.name || '').replace(/[^a-zA-Z0-9._-]/g, '');
    if (name && name.indexOf('..') === -1 && name[0] !== '.') {
      files[name] = buf.slice(off, off + size);
    }
    off += size;
  });
  return { db: json.db, track: json.track || null, files: files, format: json.format || 'azadi-bak-2' };
}

function isBak(buf) {
  return buf && buf.length >= 4 && buf.slice(0, 4).toString('ascii') === 'AZBK';
}

module.exports = { packToFile: packToFile, unpack: unpack, isBak: isBak };
