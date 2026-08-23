'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const test = require('node:test');
const bak = require('./bak.js');

test('packToFile writes AZBK v2 and unpack restores db + files', function () {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'azadi-bak-'));
  var media = path.join(dir, 'banner.svg');
  fs.writeFileSync(media, '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  var out = path.join(dir, 'azadi_network.bak');
  bak.packToFile(out, {
    exportedAt: 1,
    db: { settings: { siteName: 'Azadi' }, products: [] },
    track: { visitors: {} }
  }, [{ name: 'banner.svg', absPath: media }]);
  var buf = fs.readFileSync(out);
  assert.strictEqual(buf.slice(0, 4).toString('ascii'), 'AZBK');
  assert.strictEqual(buf[4], 2);
  var unpacked = bak.unpack(buf);
  assert.strictEqual(unpacked.db.settings.siteName, 'Azadi');
  assert.ok(unpacked.files['banner.svg']);
  assert.ok(bak.isBak(buf));
});

test('unpack rejects junk and truncated buffers', function () {
  assert.throws(function () { bak.unpack(Buffer.from('not-a-backup')); }, /bad_magic|bad_backup/);
  assert.throws(function () { bak.unpack(Buffer.from('AZBK')); }, /bad_backup/);
  assert.strictEqual(bak.isBak(Buffer.from('xxxx')), false);
});
