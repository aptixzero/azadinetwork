'use strict';
const fs = require('fs');
const path = require('path');
const store = require('./store.js');

function grad(id, c1, c2) {
  return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>';
}

function baseSvg(w, h, defs, body) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><defs>' + defs + '</defs>' + body + '</svg>';
}

function gridLines(w, h, step, color) {
  var s = '';
  for (var x = 0; x <= w; x += step) s += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + h + '" stroke="' + color + '" stroke-width="1"/>';
  for (var y = 0; y <= h; y += step) s += '<line x1="0" y1="' + y + '" x2="' + w + '" y2="' + y + '" stroke="' + color + '" stroke-width="1"/>';
  return '<g opacity="0.25">' + s + '</g>';
}

function label(w, h, text, sub) {
  return '<text x="' + (w / 2) + '" y="' + (h / 2 - 8) + '" font-family="sans-serif" font-size="' + Math.round(w / 14) + '" font-weight="bold" fill="#e8f6ff" text-anchor="middle">' + text + '</text>' +
    '<text x="' + (w / 2) + '" y="' + (h / 2 + Math.round(w / 16)) + '" font-family="sans-serif" font-size="' + Math.round(w / 26) + '" fill="#7dd3fc" text-anchor="middle">' + sub + '</text>';
}

function make(name, w, h, c1, c2, text, sub, extra) {
  var f = path.join(store.UPLOAD_DIR, name);
  if (fs.existsSync(f)) return;
  var svg = baseSvg(w, h,
    grad('g', c1, c2),
    '<rect width="' + w + '" height="' + h + '" fill="url(#g)"/>' +
    gridLines(w, h, Math.round(w / 12), 'rgba(125,211,252,0.18)') +
    (extra || '') +
    label(w, h, text, sub));
  fs.writeFileSync(f, svg);
}

function circuit(w, h) {
  var s = '';
  var pts = [[0.1, 0.8], [0.3, 0.6], [0.55, 0.75], [0.8, 0.5], [0.95, 0.65]];
  var d = 'M ' + pts.map(function (p) { return (p[0] * w) + ' ' + (p[1] * h); }).join(' L ');
  s += '<path d="' + d + '" stroke="#22d3ee" stroke-width="3" fill="none" opacity="0.7"/>';
  pts.forEach(function (p) {
    s += '<circle cx="' + (p[0] * w) + '" cy="' + (p[1] * h) + '" r="6" fill="#22d3ee" opacity="0.9"/>';
  });
  return s;
}

function ensureSeedMedia() {
  make('story-cctv.svg', 720, 1280, '#07131f', '#0d3050', 'CCTV', 'Azadi Network', circuit(720, 1280));
  make('story-wireless.svg', 720, 1280, '#081a12', '#0c4a34', 'WIRELESS', 'Azadi Network', circuit(720, 1280));
  make('story-server.svg', 720, 1280, '#140a1f', '#3b1d5e', 'SERVER', 'Azadi Network', circuit(720, 1280));
  make('prod-cam.svg', 800, 600, '#0a1826', '#123a5c', 'دوربین بولت', 'PR-1001', circuit(800, 600));
  make('prod-radio.svg', 800, 600, '#0a2018', '#155e46', 'رادیو وایرلس', 'PR-1002', circuit(800, 600));
  make('prod-rack.svg', 800, 600, '#160c22', '#3f2166', 'رک ۲۷ یونیت', 'PR-1003', circuit(800, 600));
  make('prod-switch.svg', 800, 600, '#1d1206', '#6b3f12', 'سوییچ ۲۴ پورت', 'PR-1004', circuit(800, 600));
  make('prod-nvr.svg', 800, 600, '#0a1826', '#0f4a63', 'دستگاه ضبط', 'PR-1005', circuit(800, 600));
  make('prod-ap.svg', 800, 600, '#0a2018', '#0f5e50', 'اکسس پوینت', 'PR-1006', circuit(800, 600));
  make('art-cctv.svg', 1000, 560, '#0a1826', '#134a72', 'آموزش دوربین', 'مقاله', circuit(1000, 560));
  make('art-wireless.svg', 1000, 560, '#0a2018', '#136248', 'آموزش وایرلس', 'مقاله', circuit(1000, 560));
  make('art-server.svg', 1000, 560, '#160c22', '#472470', 'اتاق سرور', 'مقاله', circuit(1000, 560));
  make('work-cctv.svg', 1000, 640, '#0a1826', '#0f5273', 'پروژه دوربین', 'WK-3001', circuit(1000, 640));
  make('work-cctv2.svg', 1000, 640, '#0a1826', '#125e86', 'جزئیات نصب', 'WK-3001', circuit(1000, 640));
  make('work-wireless.svg', 1000, 640, '#0a2018', '#14684d', 'لینک وایرلس', 'WK-3002', circuit(1000, 640));
  make('work-server.svg', 1000, 640, '#160c22', '#4b2775', 'اتاق سرور', 'WK-3003', circuit(1000, 640));
}

module.exports = { ensureSeedMedia: ensureSeedMedia };
