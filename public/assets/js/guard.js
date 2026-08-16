(function () {
  'use strict';
  var d = document;

  function block(e) { e.preventDefault(); e.stopPropagation(); return false; }

  d.addEventListener('contextmenu', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    block(e);
  }, true);

  d.addEventListener('dragstart', block, true);
  d.addEventListener('drop', block, true);
  d.addEventListener('selectstart', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    block(e);
  }, true);

  d.addEventListener('copy', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.clipboardData) e.clipboardData.setData('text/plain', '');
    block(e);
  }, true);

  d.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    var ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && (k === 's' || k === 'p' || k === 'u')) return block(e);
    if (ctrl && e.shiftKey && (k === 'i' || k === 'j' || k === 'c' || k === 'k' || k === 'e')) return block(e);
    if (k === 'f12') return block(e);
    if (k === 'printscreen') {
      try { navigator.clipboard.writeText(''); } catch (err) {}
      flashShield();
      return block(e);
    }
  }, true);

  d.addEventListener('keyup', function (e) {
    if ((e.key || '').toLowerCase() === 'printscreen') {
      try { navigator.clipboard.writeText(''); } catch (err) {}
      flashShield();
    }
  }, true);

  var shield = null;
  function ensureShield() {
    if (shield) return shield;
    shield = d.createElement('div');
    shield.setAttribute('aria-hidden', 'true');
    shield.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#05080f;display:none;pointer-events:none;';
    var inner = d.createElement('div');
    inner.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#22d3ee;font-family:Vazir,Tahoma,sans-serif;font-weight:800;font-size:20px;text-align:center;';
    inner.textContent = 'محتوای این سایت محافظت شده است';
    shield.appendChild(inner);
    (d.body || d.documentElement).appendChild(shield);
    return shield;
  }

  var shieldTimer = null;
  function flashShield() {
    var s = ensureShield();
    s.style.display = 'block';
    if (shieldTimer) clearTimeout(shieldTimer);
    shieldTimer = setTimeout(function () { s.style.display = 'none'; }, 900);
  }

  function showShield() { ensureShield().style.display = 'block'; }
  function hideShield() { if (shield) shield.style.display = 'none'; }

  d.addEventListener('visibilitychange', function () {
    if (d.visibilityState === 'hidden') showShield();
    else hideShield();
  });
  window.addEventListener('blur', showShield);
  window.addEventListener('focus', hideShield);

  window.addEventListener('beforeprint', showShield);
  window.addEventListener('afterprint', hideShield);

  if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    var orig = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
    try {
      Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
        value: function () {
          showShield();
          return orig.apply(navigator.mediaDevices, arguments).then(function (stream) {
            try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
            return Promise.reject(new DOMException('NotAllowedError'));
          });
        }
      });
    } catch (e) {}
  }

  setInterval(function () {
    var w = window.outerWidth - window.innerWidth;
    var h = window.outerHeight - window.innerHeight;
    if (w > 220 || h > 220) {
      d.title = 'آزادی نتورک';
    }
  }, 2000);

  window.__azGuard = { showShield: showShield, hideShield: hideShield };
})();
