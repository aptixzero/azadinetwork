(function () {
  'use strict';

  var state = {
    data: null,
    theme: localStorage.getItem('az_theme') || null,
    saved: safeParse(localStorage.getItem('az_saved'), []),
    route: null,
    events: [],
    enterTs: Date.now()
  };

  function safeParse(s, fb) {
    try { var v = JSON.parse(s); return v == null ? fb : v; } catch (e) { return fb; }
  }

  var app = document.getElementById('app');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function fmtCode(c) { return esc(c || ''); }

  var ICONS = {
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 8.5A2.5 2.5 0 0 1 4.5 6h8A2.5 2.5 0 0 1 15 8.5v7a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 2 15.5v-7Z"/><path d="m15 10 4.5-2.5a1 1 0 0 1 1.5.87v7.26a1 1 0 0 1-1.5.87L15 14"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2.5 9a15 15 0 0 1 19 0"/><path d="M5.5 12.5a10.5 10.5 0 0 1 13 0"/><path d="M8.5 16a6 6 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1.4" fill="currentColor"/></svg>',
    server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><circle cx="7.5" cy="7.5" r="1" fill="currentColor"/><circle cx="7.5" cy="16.5" r="1" fill="currentColor"/></svg>',
    support: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 13a8 8 0 0 1 16 0"/><rect x="2.5" y="13" width="4" height="6.5" rx="2"/><rect x="17.5" y="13" width="4" height="6.5" rx="2"/><path d="M19.5 19.5c0 1.5-2 2.5-5 2.5"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2.5 4.5 5.5v6c0 5 3.5 8.5 7.5 10 4-1.5 7.5-5 7.5-10v-6L12 2.5Z"/><path d="m9 12 2 2 4-4.5"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m21 4.5-4 15.5c-.2.7-.7.9-1.4.5l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1L17 6c.4-.4-.1-.6-.7-.2L5.2 12.6l-4.7-1.5c-.7-.2-.7-.7.1-1L20 3.5c.6-.3 1.2.1 1 1Z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.9-1.3A9.5 9.5 0 1 0 12 2.5Z"/><path d="M8.7 8c-.4 1.7.8 4.3 2.7 5.9 1.6 1.3 3.6 2 4.6 1.4l.7-1.5-2.2-1.3-1 .8c-1-.5-2.2-1.7-2.7-2.7l.9-.9L10.4 7.5 8.7 8Z"/></svg>',
    bale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9.5"/><path d="m7.5 12.5 3 3 6-6.5"/></svg>',
    eitaa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2.5c5.2 0 9.5 4.3 9.5 9.5s-4.3 9.5-9.5 9.5c-1.7 0-3.4-.5-4.8-1.3L2.5 21.5l1.3-4.7A9.5 9.5 0 0 1 12 2.5Z"/><path d="M8 13.5 10.5 16l5.5-6"/></svg>',
    rubika: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="3.5" width="17" height="17" rx="5" transform="rotate(45 12 12)"/><path d="m9.5 12 1.8 1.8 3.4-3.8"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor"/></svg>',
    location: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21.5s7-6.2 7-11.5a7 7 0 1 0-14 0c0 5.3 7 11.5 7 11.5Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 3.5h3.5L10.5 8 8 9.8a13.5 13.5 0 0 0 6.2 6.2L16 13.5l4.5 2v3.5a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 3 5.7 2 2 0 0 1 5 3.5Z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.5 2"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8L12 3Z"/></svg>',
    starFill: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8L12 3Z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.5-4.5"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    chevDown: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>',
    plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5Z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.45)"/><path d="M10 8l6 4-6 4V8Z" fill="#fff"/></svg>',
    arrowL: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>',
    arrowR: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>',
    zoomIn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6M20.5 20.5 16 16"/></svg>',
    zoomOut: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M8 11h6M20.5 20.5 16 16"/></svg>'
  };

  function track(type, value, extra) {
    var e = { t: type, v: String(value == null ? '' : value).slice(0, 200) };
    if (extra != null) e.d = extra;
    state.events.push(e);
    if (state.events.length >= 12) flushEvents();
  }

  var flushTimer = setInterval(flushEvents, 8000);

  function flushEvents(useBeacon) {
    if (!state.events.length) return;
    var payload = JSON.stringify({ events: state.events.splice(0, 40) });
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
      return;
    }
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(function () {});
  }

  window.addEventListener('pagehide', function () {
    track('leave', '', Date.now() - state.enterTs);
    flushEvents(true);
  });

  function sendEnv() {
    var net = '';
    try {
      var c = navigator.connection;
      if (c) net = (c.effectiveType || '') + (c.downlink ? ' ' + c.downlink + 'Mb' : '');
    } catch (e) {}
    track('env', '', {
      screen: screen.width + 'x' + screen.height + '@' + (window.devicePixelRatio || 1),
      tz: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || '',
      platform: navigator.platform || '',
      cores: navigator.hardwareConcurrency || 0,
      memory: navigator.deviceMemory || 0,
      touch: 'ontouchstart' in window,
      referrer: document.referrer || '',
      net: net
    });
    flushEvents();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-track]');
    if (b) track('click', b.getAttribute('data-track'));
  }, true);

  function toast(msg) {
    var root = document.getElementById('toast-root');
    var t = el('<div class="toast">' + esc(msg) + '</div>');
    root.appendChild(t);
    setTimeout(function () { t.remove(); }, 2800);
  }

  function applyTheme() {
    var t = state.theme || (state.data ? state.data.settings.theme : 'dark') || 'dark';
    document.body.setAttribute('data-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }

  function toggleTheme() {
    var cur = document.body.getAttribute('data-theme');
    state.theme = cur === 'dark' ? 'light' : 'dark';
    localStorage.setItem('az_theme', state.theme);
    applyTheme();
    renderHeaderIcons();
  }

  function isSaved(kind, id) {
    return state.saved.some(function (s) { return s.k === kind && s.id === id; });
  }

  function toggleSaved(kind, id, title, image) {
    var idx = -1;
    for (var i = 0; i < state.saved.length; i++) {
      if (state.saved[i].k === kind && state.saved[i].id === id) { idx = i; break; }
    }
    if (idx >= 0) {
      state.saved.splice(idx, 1);
      toast('از نشان‌شده‌ها حذف شد');
    } else {
      state.saved.push({ k: kind, id: id, t: String(title).slice(0, 120), img: String(image || '').slice(0, 200), ts: Date.now() });
      toast('به نشان‌شده‌ها اضافه شد');
      track('click', 'bookmark:' + kind + ':' + id);
    }
    localStorage.setItem('az_saved', JSON.stringify(state.saved.slice(0, 200)));
    renderHeaderIcons();
  }

  function mediaUrl(ref) {
    if (!ref) return '';
    if (ref.indexOf('u/') === 0) return '/m/' + encodeURIComponent(ref.slice(2));
    return '';
  }

  function mediaImg(ref, alt, cls) {
    var u = mediaUrl(ref);
    if (!u) return '<div class="media-shell ' + (cls || '') + '"></div>';
    return '<div class="media-shell ' + (cls || '') + '"><img src="' + esc(u) + '" alt="' + esc(alt || '') + '" loading="lazy" decoding="async"></div>';
  }

  function isVideoRef(ref) {
    return /\.(mp4|webm|mov)$/i.test(String(ref || ''));
  }

  function catName(id) {
    var c = (state.data.categories || []).filter(function (x) { return x.id === id; })[0];
    return c ? c.name : '';
  }

  function fetchJson(url, opts) {
    return fetch(url, opts).then(function (r) {
      if (!r.ok) throw new Error('http_' + r.status);
      return r.json();
    });
  }

  function navigate(path, replace) {
    if (replace) history.replaceState(null, '', path);
    else history.pushState(null, '', path);
    route();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-nav]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/^https?:\/\//i.test(href)) return;
    if (href.indexOf('#') === 0) return;
    e.preventDefault();
    var mob = document.querySelector('.mobile-nav');
    if (mob) mob.classList.remove('open');
    if (href.indexOf('#') > 0) {
      var parts = href.split('#');
      if (location.pathname === parts[0] || (parts[0] === '/' && location.pathname === '/')) {
        var sec = document.getElementById(parts[1]);
        if (sec) { sec.scrollIntoView({ behavior: 'smooth' }); return; }
      }
      navigate(parts[0]);
      setTimeout(function () {
        var sec2 = document.getElementById(parts[1]);
        if (sec2) sec2.scrollIntoView({ behavior: 'smooth' });
      }, 350);
      return;
    }
    navigate(href);
  });

  window.addEventListener('popstate', route);

  var revealObserver = null;
  function setupReveal() {
    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('vis');
          revealObserver.unobserve(en.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (n) { revealObserver.observe(n); });
  }

  function headerHtml() {
    var s = state.data.settings;
    var links = (s.header.links || []).map(function (l) {
      return '<a href="' + esc(l.url) + '" data-nav data-track="nav:' + esc(l.label) + '">' + esc(l.label) + '</a>';
    }).join('');
    var logoInner = s.logoImage
      ? mediaImg(s.logoImage, s.siteName)
      : '<span>' + esc((s.logoText || 'AZ').slice(0, 2)) + '</span>';
    return '<header class="site-header"><div class="header-inner">' +
      '<a href="/" data-nav class="logo" data-track="nav:logo">' +
      '<span class="logo-mark">' + logoInner + '</span>' +
      '<span class="logo-grad">' + esc(s.siteName) + '</span></a>' +
      '<nav class="nav-links">' + links + '</nav>' +
      '<div class="header-actions">' +
      '<a class="icon-btn" href="/saved" data-nav title="نشان‌شده‌ها" data-track="nav:saved">' + ICONS.star + '<span class="badge" data-saved-count hidden></span></a>' +
      '<button class="icon-btn" data-theme-toggle title="تغییر تم"></button>' +
      '<button class="icon-btn burger" data-burger title="منو">' + ICONS.menu + '</button>' +
      '</div></div></header>' +
      '<nav class="mobile-nav">' + links + '<a href="/saved" data-nav>نشان‌شده‌ها</a></nav>';
  }

  function renderHeaderIcons() {
    var tbtn = document.querySelector('[data-theme-toggle]');
    if (tbtn) tbtn.innerHTML = document.body.getAttribute('data-theme') === 'dark' ? ICONS.sun : ICONS.moon;
    var badge = document.querySelector('[data-saved-count]');
    if (badge) {
      if (state.saved.length) { badge.hidden = false; badge.textContent = state.saved.length; }
      else badge.hidden = true;
    }
    highlightNav();
  }

  function highlightNav() {
    document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('#')[0] || '/';
      a.classList.toggle('active', href === location.pathname || (href !== '/' && location.pathname.indexOf(href) === 0));
    });
  }

  function footerHtml() {
    var s = state.data.settings;
    var cols = (s.footer.columns || []).map(function (c) {
      return '<div class="footer-col"><h4>' + esc(c.title) + '</h4>' +
        (c.links || []).map(function (l) {
          return '<a href="' + esc(l.url) + '" data-nav>' + esc(l.label) + '</a>';
        }).join('') + '</div>';
    }).join('');
    return '<footer class="site-footer"><div class="container">' +
      '<div class="footer-grid"><div>' +
      '<div class="logo"><span class="logo-mark">' + esc((s.logoText || 'AZ').slice(0, 2)) + '</span><span class="logo-grad">' + esc(s.siteName) + '</span></div>' +
      '<p class="footer-about">' + esc(s.footer.about) + '</p></div>' + cols + '</div>' +
      '<div class="footer-bottom"><span>' + esc(s.footer.copyright) + '</span>' +
      '<span dir="ltr">' + esc(s.siteNameEn) + ' © ' + new Date().getFullYear() + '</span></div>' +
      '</div></footer>';
  }

  function shell(inner) {
    app.innerHTML = headerHtml() + '<main>' + inner + '</main>' + footerHtml();
    var burger = document.querySelector('[data-burger]');
    var mob = document.querySelector('.mobile-nav');
    if (burger) burger.addEventListener('click', function () {
      var open = mob.classList.toggle('open');
      burger.innerHTML = open ? ICONS.close : ICONS.menu;
    });
    var tbtn = document.querySelector('[data-theme-toggle]');
    if (tbtn) tbtn.addEventListener('click', toggleTheme);
    renderHeaderIcons();
    setupReveal();
    window.scrollTo(0, 0);
  }

  function heroNetCanvas(container) {
    var canvas = document.createElement('canvas');
    canvas.className = 'hero-net';
    container.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var nodes = [];
    var W = 0, H = 0;
    var running = true;

    function resize() {
      W = canvas.width = container.clientWidth;
      H = canvas.height = container.clientHeight;
      var count = Math.min(90, Math.max(30, Math.floor(W * H / 22000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
          r: Math.random() * 1.8 + 0.8
        });
      }
    }
    resize();
    window.addEventListener('resize', resize);

    var dark = function () { return document.body.getAttribute('data-theme') !== 'light'; };

    function frame() {
      if (!running) return;
      if (!document.body.contains(canvas)) { running = false; return; }
      ctx.clearRect(0, 0, W, H);
      var lineBase = dark() ? '34,211,238' : '8,145,178';
      var dotColor = dark() ? 'rgba(129,140,248,0.8)' : 'rgba(79,70,229,0.7)';
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        for (var j = i + 1; j < nodes.length; j++) {
          var m = nodes[j];
          var dx = n.x - m.x, dy = n.y - m.y;
          var dist = dx * dx + dy * dy;
          if (dist < 15000) {
            ctx.strokeStyle = 'rgba(' + lineBase + ',' + (0.35 * (1 - dist / 15000)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function sectionHead(meta) {
    return '<div class="section-head reveal"><h2 class="section-title">' + esc(meta.title) + '</h2>' +
      (meta.subtitle ? '<p class="section-sub">' + esc(meta.subtitle) + '</p>' : '') +
      '<div class="section-line"></div></div>';
  }

  function renderHome() {
    var d = state.data;
    var s = d.settings;
    var sm = s.sectionsMeta;
    var order = s.sectionOrder || [];
    var parts = [];

    order.forEach(function (key) {
      if (key === 'hero' && s.hero.enabled) {
        parts.push('<section class="hero" id="hero"><div class="hero-content">' +
          '<h1 class="glitch-title" data-text="' + esc(s.hero.title) + '">' + esc(s.hero.title) + '</h1>' +
          '<p class="hero-welcome">' + esc(s.hero.welcome) + '</p>' +
          '<p class="hero-desc">' + esc(s.hero.description) + '</p>' +
          (s.hero.sub ? '<p class="hero-sub">' + esc(s.hero.sub) + '</p>' : '') +
          '<div class="hero-ctas">' +
          (s.hero.ctaLabel ? '<a class="btn btn-primary" href="' + esc(s.hero.ctaUrl) + '" data-nav data-track="cta:hero1">' + esc(s.hero.ctaLabel) + '</a>' : '') +
          (s.hero.cta2Label ? '<a class="btn btn-ghost" href="' + esc(s.hero.cta2Url) + '" data-nav data-track="cta:hero2">' + esc(s.hero.cta2Label) + '</a>' : '') +
          '</div></div><div class="hero-scroll">' + ICONS.chevDown + '</div></section>');
      }
      if (key === 'stories' && sm.stories.enabled && d.stories.length) {
        var bubbles = d.stories.map(function (st, i) {
          var thumb = st.type === 'product' ? productImage(st.productId) || st.media : st.media;
          return '<button class="story-bubble reveal" data-story="' + i + '" data-track="story:' + esc(st.id) + '">' +
            '<span class="story-ring"><span class="story-ring-inner">' + mediaImg(thumb, st.title) + '</span></span>' +
            '<span class="story-name">' + esc(st.title) + '</span></button>';
        }).join('');
        parts.push('<section class="section compact" id="stories"><div class="container">' +
          sectionHead(sm.stories) + '<div class="stories-row">' + bubbles + '</div></div></section>');
      }
      if (key === 'banner' && s.banner.enabled) {
        parts.push('<div class="container reveal"><div class="banner-strip">' +
          '<span class="banner-text">' + esc(s.banner.text) + '</span>' +
          '<a class="btn btn-primary" href="' + esc(s.banner.buttonUrl) + '" data-nav data-track="cta:banner">' + esc(s.banner.buttonLabel) + '</a>' +
          '</div></div>');
      }
      if (key === 'services' && sm.services.enabled && d.services.length) {
        var svc = d.services.map(function (sv) {
          return '<div class="svc-card reveal" data-track="service:' + esc(sv.id) + '">' +
            '<div class="svc-icon">' + (ICONS[sv.icon] || ICONS.server) + '</div>' +
            '<h3>' + esc(sv.title) + '</h3><p>' + esc(sv.desc) + '</p></div>';
        }).join('');
        parts.push('<section class="section" id="services"><div class="container">' +
          sectionHead(sm.services) + '<div class="cards-grid">' + svc + '</div></div></section>');
      }
      if (key === 'products' && sm.products.enabled) {
        var feat = d.products.filter(function (p) { return p.featured; }).slice(0, 8);
        if (!feat.length) feat = d.products.slice(0, 8);
        parts.push('<section class="section" id="products"><div class="container">' +
          sectionHead(sm.products) +
          '<div class="cards-grid">' + feat.map(productCard).join('') + '</div>' +
          '<div style="text-align:center;margin-top:36px"><a class="btn btn-ghost" href="/shop" data-nav data-track="cta:allproducts">مشاهده همه محصولات</a></div>' +
          '</div></section>');
      }
      if (key === 'portfolioHome' && sm.portfolioHome.enabled) {
        var works = d.portfolio.filter(function (w) { return w.featuredHome; }).slice(0, 6);
        if (!works.length) works = d.portfolio.slice(0, 6);
        parts.push('<section class="section" id="works"><div class="container">' +
          sectionHead(sm.portfolioHome) +
          '<div class="cards-grid">' + works.map(workCard).join('') + '</div>' +
          '<div style="text-align:center;margin-top:36px"><a class="btn btn-ghost" href="/portfolio" data-nav data-track="cta:allworks">تماشای نمونه کارهای بیشتر</a></div>' +
          '</div></section>');
      }
      if (key === 'provinces' && sm.provinces.enabled && d.provinces.length) {
        var provs = d.provinces.map(function (p, i) {
          var chips = (p.cities || []).map(function (c) {
            return '<span class="city-chip' + (c.active ? ' on' : '') + '">' + esc(c.name) + '</span>';
          }).join('');
          if (p.allCities) chips = '<span class="city-chip all">همه شهرهای این استان</span>' + chips;
          return '<div class="province-card reveal" data-prov="' + i + '">' +
            '<button class="province-head" data-track="province:' + esc(p.name) + '"><span>' + esc(p.name) + '</span><span class="pv-arrow">' + ICONS.chevDown + '</span></button>' +
            '<div class="province-cities">' + chips + '</div></div>';
        }).join('');
        parts.push('<section class="section" id="provinces"><div class="container">' +
          sectionHead(sm.provinces) + '<div class="province-grid">' + provs + '</div></div></section>');
      }
      if (key === 'stats' && sm.stats.enabled && s.stats.length) {
        var stats = s.stats.map(function (st) {
          return '<div class="stat-box reveal"><div class="stat-value">' + esc(st.value) + '</div>' +
            '<div class="stat-label">' + esc(st.label) + '</div></div>';
        }).join('');
        parts.push('<section class="section compact" id="stats"><div class="container">' +
          sectionHead(sm.stats) + '<div class="stats-row">' + stats + '</div></div></section>');
      }
      if (key === 'articles' && sm.articles.enabled && d.articles.length) {
        parts.push('<section class="section" id="articles"><div class="container">' +
          sectionHead(sm.articles) +
          '<div class="cards-grid">' + d.articles.slice(0, 6).map(articleCard).join('') + '</div>' +
          '<div style="text-align:center;margin-top:36px"><a class="btn btn-ghost" href="/articles" data-nav data-track="cta:allarticles">مشاهده همه مقالات</a></div>' +
          '</div></section>');
      }
      if (key === 'faq' && sm.faq.enabled && s.faq.length) {
        var faqs = s.faq.map(function (f, i) {
          return '<div class="faq-item reveal" data-faq="' + i + '">' +
            '<button class="faq-q" data-track="faq:' + esc(f.id) + '"><span>' + esc(f.q) + '</span><span class="fq-icon">' + ICONS.plus + '</span></button>' +
            '<div class="faq-a">' + esc(f.a) + '</div></div>';
        }).join('');
        parts.push('<section class="section compact" id="faq"><div class="container">' +
          sectionHead(sm.faq) + '<div class="faq-list">' + faqs + '</div></div></section>');
      }
    });

    shell(parts.join(''));

    var hero = document.getElementById('hero');
    if (hero) heroNetCanvas(hero);

    document.querySelectorAll('[data-story]').forEach(function (b) {
      b.addEventListener('click', function () {
        openStories(Number(b.getAttribute('data-story')));
      });
    });
    document.querySelectorAll('.province-head').forEach(function (b) {
      b.addEventListener('click', function () {
        b.parentElement.classList.toggle('open');
      });
    });
    document.querySelectorAll('.faq-q').forEach(function (b) {
      b.addEventListener('click', function () {
        b.parentElement.classList.toggle('open');
      });
    });
    bindCards();
  }

  function productImage(pid) {
    var p = (state.data.products || []).filter(function (x) { return x.id === pid; })[0];
    return p ? p.image : '';
  }

  function productCard(p) {
    var savedOn = isSaved('product', p.id);
    return '<div class="prod-card reveal" data-product="' + esc(p.id) + '">' +
      '<div class="prod-media">' + mediaImg(p.image, p.name) +
      '<span class="prod-code">' + fmtCode(p.code) + '</span>' +
      '<button class="prod-fav' + (savedOn ? ' on' : '') + '" data-fav="product:' + esc(p.id) + '" title="نشان کردن">' + (savedOn ? ICONS.starFill : ICONS.star) + '</button>' +
      '</div><div class="prod-body">' +
      '<span class="prod-cat">' + esc(catName(p.category)) + '</span>' +
      '<span class="prod-name">' + esc(p.name) + '</span>' +
      '<span class="prod-desc">' + esc(p.desc) + '</span>' +
      '<span class="prod-price">' + ICONS.chat + '<span>برای مطلع شدن از قیمت در بله یا واتساپ پیام بدهید</span></span>' +
      '</div></div>';
  }

  function workCard(w) {
    var savedOn = isSaved('work', w.id);
    return '<div class="work-card reveal" data-work="' + esc(w.id) + '">' +
      '<div class="work-cover">' + mediaImg(w.cover, w.title) +
      '<span class="work-code">' + fmtCode(w.code) + '</span>' +
      (w.mediaCount > 1 ? '<span class="work-media-count">' + w.mediaCount + ' رسانه</span>' : '') +
      '<button class="prod-fav' + (savedOn ? ' on' : '') + '" data-fav="work:' + esc(w.id) + '" title="نشان کردن">' + (savedOn ? ICONS.starFill : ICONS.star) + '</button>' +
      '</div><div class="work-body">' +
      '<span class="work-cat">' + esc(catName(w.category)) + '</span>' +
      '<div class="work-title">' + esc(w.title) + '</div>' +
      '<div class="work-desc">' + esc(w.desc) + '</div>' +
      '</div></div>';
  }

  function articleCard(a) {
    return '<div class="article-card reveal" data-article="' + esc(a.id) + '">' +
      '<div class="article-cover">' + mediaImg(a.cover, a.title) + '</div>' +
      '<div class="article-body">' +
      '<span class="article-topic">' + esc(a.topic) + '</span>' +
      '<span class="article-title">' + esc(a.title) + '</span>' +
      '<span class="article-desc">' + esc(a.desc) + '</span>' +
      '</div></div>';
  }

  function bindCards() {
    document.querySelectorAll('[data-fav]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var parts = b.getAttribute('data-fav').split(':');
        var kind = parts[0], id = parts[1];
        var item, title = '', img = '';
        if (kind === 'product') {
          item = state.data.products.filter(function (x) { return x.id === id; })[0];
          if (item) { title = item.name; img = item.image; }
        } else {
          item = state.data.portfolio.filter(function (x) { return x.id === id; })[0];
          if (item) { title = item.title; img = item.cover; }
        }
        toggleSaved(kind, id, title, img);
        var on = isSaved(kind, id);
        b.classList.toggle('on', on);
        b.innerHTML = on ? ICONS.starFill : ICONS.star;
      });
    });
    document.querySelectorAll('[data-product]').forEach(function (c) {
      c.addEventListener('click', function () {
        var id = c.getAttribute('data-product');
        track('view', 'product:' + id);
        var p = state.data.products.filter(function (x) { return x.id === id; })[0];
        var cid = p ? p.category : '';
        if (cid) track('view', 'category:' + cid);
        navigate('/contact?product=' + encodeURIComponent(id));
      });
    });
    document.querySelectorAll('[data-work]').forEach(function (c) {
      c.addEventListener('click', function () {
        var id = c.getAttribute('data-work');
        navigate('/portfolio/' + encodeURIComponent(id));
      });
    });
    document.querySelectorAll('[data-article]').forEach(function (c) {
      c.addEventListener('click', function () {
        navigate('/articles/' + encodeURIComponent(c.getAttribute('data-article')));
      });
    });
  }

  var storyTimer = null;
  function openStories(startIdx) {
    var viewer = document.getElementById('storyviewer');
    var stories = state.data.stories;
    if (!stories.length) return;
    var idx = Math.max(0, Math.min(startIdx, stories.length - 1));
    viewer.hidden = false;
    document.body.style.overflow = 'hidden';

    function renderStory() {
      var st = stories[idx];
      track('view', 'story:' + st.id);
      var dur = st.type === 'video' ? 0 : 6000;
      var mediaRef = st.type === 'product' ? (productImage(st.productId) || st.media) : st.media;
      var mediaHtml;
      if (st.type === 'video' && mediaRef) {
        mediaHtml = '<div class="media-shell" style="width:100%;height:100%"><video src="' + esc(mediaUrl(mediaRef)) + '" autoplay playsinline controlslist="nodownload noremoteplayback" disablepictureinpicture oncontextmenu="return false"></video></div>';
      } else {
        mediaHtml = mediaImg(mediaRef, st.title);
      }
      var prog = stories.map(function (_, i) {
        var cls = i < idx ? 'done' : (i === idx ? 'active' : '');
        return '<span class="' + cls + '"><i style="animation-duration:' + (dur || 8000) + 'ms"></i></span>';
      }).join('');
      var cta = '';
      if (st.type === 'product' && st.productId) {
        cta = '<a class="btn btn-primary story-cta" href="/contact?product=' + encodeURIComponent(st.productId) + '" data-nav data-track="story-cta:' + esc(st.productId) + '">استعلام قیمت این محصول</a>';
      }
      viewer.innerHTML = '<div class="story-frame">' + mediaHtml +
        '<div class="story-progress">' + prog + '</div>' +
        '<div class="story-top"><span class="st-title">' + esc(st.title) + '</span></div>' +
        (st.caption ? '<div class="story-caption">' + esc(st.caption) + '</div>' : '') + cta +
        '<div class="story-nav"><button data-snext aria-label="بعدی"></button><button data-sprev aria-label="قبلی"></button></div>' +
        '<button class="story-close" data-sclose>&times;</button></div>';

      viewer.querySelector('[data-sclose]').addEventListener('click', closeStories);
      viewer.querySelector('[data-snext]').addEventListener('click', next);
      viewer.querySelector('[data-sprev]').addEventListener('click', prev);
      var cta2 = viewer.querySelector('.story-cta');
      if (cta2) cta2.addEventListener('click', function () { closeStories(); });

      if (storyTimer) clearTimeout(storyTimer);
      if (st.type === 'video') {
        var vid = viewer.querySelector('video');
        if (vid) {
          vid.addEventListener('ended', next);
          storyTimer = setTimeout(next, 60000);
        }
      } else {
        storyTimer = setTimeout(next, dur);
      }
    }

    function next() {
      if (idx < stories.length - 1) { idx++; renderStory(); }
      else closeStories();
    }
    function prev() {
      if (idx > 0) { idx--; renderStory(); }
    }
    function closeStories() {
      if (storyTimer) clearTimeout(storyTimer);
      viewer.hidden = true;
      viewer.innerHTML = '';
      document.body.style.overflow = '';
    }

    viewer.addEventListener('click', function (e) {
      if (e.target === viewer) closeStories();
    });
    renderStory();
  }

  function openLightbox(items, startIdx) {
    var lb = document.getElementById('lightbox');
    var idx = startIdx || 0;
    var zoom = 1, panX = 0, panY = 0;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';

    function render() {
      var it = items[idx];
      track('view', 'image:' + (it.src || ''));
      var inner;
      if (it.type === 'video') {
        inner = '<video src="' + esc(mediaUrl(it.src)) + '" controls playsinline controlslist="nodownload noremoteplayback" disablepictureinpicture oncontextmenu="return false"></video>';
      } else {
        inner = '<div class="media-shell" style="width:100%;height:100%;display:grid;place-items:center"><img src="' + esc(mediaUrl(it.src)) + '" alt=""></div>';
      }
      lb.innerHTML = '<div class="lb-stage">' + inner + '</div>' +
        '<div class="lb-controls">' +
        '<button class="lb-btn" data-lbprev>' + ICONS.arrowR + '</button>' +
        '<span class="lb-count">' + (idx + 1) + ' / ' + items.length + '</span>' +
        '<button class="lb-btn" data-lbnext>' + ICONS.arrowL + '</button>' +
        '<button class="lb-btn" data-lbzin>' + ICONS.zoomIn + '</button>' +
        '<button class="lb-btn" data-lbzout>' + ICONS.zoomOut + '</button>' +
        '<button class="lb-btn" data-lbclose>' + ICONS.close.replace('viewBox', 'width="20" height="20" viewBox') + '</button>' +
        '</div>';
      zoom = 1; panX = 0; panY = 0;
      bind();
    }

    function apply() {
      var img = lb.querySelector('img');
      if (img) img.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')';
    }

    function bind() {
      lb.querySelector('[data-lbclose]').addEventListener('click', close);
      lb.querySelector('[data-lbnext]').addEventListener('click', function () { idx = (idx + 1) % items.length; render(); });
      lb.querySelector('[data-lbprev]').addEventListener('click', function () { idx = (idx - 1 + items.length) % items.length; render(); });
      lb.querySelector('[data-lbzin]').addEventListener('click', function () { zoom = Math.min(4, zoom + 0.5); apply(); });
      lb.querySelector('[data-lbzout]').addEventListener('click', function () { zoom = Math.max(1, zoom - 0.5); if (zoom === 1) { panX = 0; panY = 0; } apply(); });

      var stage = lb.querySelector('.lb-stage');
      var startX = 0, startY = 0, dragging = false, baseX = 0, baseY = 0;
      stage.addEventListener('pointerdown', function (e) {
        dragging = true;
        startX = e.clientX; startY = e.clientY;
        baseX = panX; baseY = panY;
        stage.setPointerCapture(e.pointerId);
      });
      stage.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        if (zoom > 1) {
          panX = baseX + dx; panY = baseY + dy;
        } else {
          panX = dx * 0.35; panY = 0;
        }
        apply();
      });
      stage.addEventListener('pointerup', function (e) {
        dragging = false;
        if (zoom <= 1) {
          var dx = e.clientX - startX;
          if (dx < -70) { idx = (idx + 1) % items.length; render(); return; }
          if (dx > 70) { idx = (idx - 1 + items.length) % items.length; render(); return; }
          panX = 0; panY = 0; apply();
        }
      });
      stage.addEventListener('wheel', function (e) {
        e.preventDefault();
        zoom = Math.max(1, Math.min(4, zoom + (e.deltaY < 0 ? 0.3 : -0.3)));
        if (zoom === 1) { panX = 0; panY = 0; }
        apply();
      }, { passive: false });
    }

    function close() {
      lb.hidden = true;
      lb.innerHTML = '';
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') { idx = (idx + 1) % items.length; render(); }
      if (e.key === 'ArrowRight') { idx = (idx - 1 + items.length) % items.length; render(); }
    }
    document.addEventListener('keydown', onKey);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    render();
  }

  function renderShop(params) {
    var d = state.data;
    var activeCat = params.get('cat') || '';
    var q = params.get('q') || '';

    var chips = '<button class="chip' + (!activeCat ? ' on' : '') + '" data-cat="">همه</button>' +
      d.categories.map(function (c) {
        return '<button class="chip' + (activeCat === c.slug ? ' on' : '') + '" data-cat="' + esc(c.slug) + '" data-track="filter:' + esc(c.name) + '">' + esc(c.name) + '</button>';
      }).join('');

    shell('<div class="page-hero container">' + sectionHead({ title: 'فروشگاه محصولات', subtitle: 'جستجو با نام یا کد محصول — برای مطلع شدن از قیمت در بله یا واتساپ پیام بدهید' }) + '</div>' +
      '<div class="container" style="padding-bottom:90px">' +
      '<div class="toolbar">' +
      '<div class="search-box">' + ICONS.search + '<input type="search" data-shop-search placeholder="جستجوی نام یا کد محصول..." value="' + esc(q) + '" maxlength="80"><div class="suggest-panel" data-suggest hidden></div></div>' +
      '<div class="chip-row">' + chips + '</div></div>' +
      '<div class="cards-grid" data-shop-grid></div>' +
      '</div>');

    function applyFilter() {
      var grid = document.querySelector('[data-shop-grid]');
      var catObj = d.categories.filter(function (c) { return c.slug === activeCat; })[0];
      var list = d.products.filter(function (p) {
        if (catObj && p.category !== catObj.id) return false;
        if (q) {
          var qq = q.toLowerCase();
          return p.name.toLowerCase().indexOf(qq) !== -1 || p.code.toLowerCase().indexOf(qq) !== -1 ||
            (p.tags || []).some(function (t) { return t.toLowerCase().indexOf(qq) !== -1; });
        }
        return true;
      });
      grid.innerHTML = list.length ? list.map(productCard).join('') : '<div class="empty-note">محصولی یافت نشد</div>';
      grid.querySelectorAll('.reveal').forEach(function (n) { n.classList.add('vis'); });
      bindCards();
    }
    applyFilter();

    document.querySelectorAll('[data-cat]').forEach(function (b) {
      b.addEventListener('click', function () {
        activeCat = b.getAttribute('data-cat');
        var cObj = d.categories.filter(function (c) { return c.slug === activeCat; })[0];
        if (cObj) track('view', 'category:' + cObj.id);
        document.querySelectorAll('[data-cat]').forEach(function (x) { x.classList.toggle('on', x === b); });
        applyFilter();
      });
    });

    var input = document.querySelector('[data-shop-search]');
    var suggestPanel = document.querySelector('[data-suggest]');
    var debounce = null;
    input.addEventListener('input', function () {
      q = input.value.trim();
      applyFilter();
      if (debounce) clearTimeout(debounce);
      if (q.length < 2) { suggestPanel.hidden = true; return; }
      debounce = setTimeout(function () {
        track('search', 'products:' + q);
        fetchJson('/api/public/search?type=products&q=' + encodeURIComponent(q)).then(function (r) {
          if (!r.results.length) { suggestPanel.hidden = true; return; }
          suggestPanel.innerHTML = r.results.map(function (it) {
            return '<button class="suggest-item" data-sg="' + esc(it.id) + '">' +
              '<span class="suggest-thumb">' + mediaImg(it.image, it.name) + '</span>' +
              '<span>' + esc(it.name) + '</span><span class="suggest-code">' + esc(it.code) + '</span></button>';
          }).join('');
          suggestPanel.hidden = false;
          suggestPanel.querySelectorAll('[data-sg]').forEach(function (b) {
            b.addEventListener('click', function () {
              var id = b.getAttribute('data-sg');
              track('suggest', 'product:' + id);
              navigate('/contact?product=' + encodeURIComponent(id));
            });
          });
        }).catch(function () {});
      }, 350);
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.search-box')) suggestPanel.hidden = true;
    });
  }

  function renderPortfolio(params) {
    var d = state.data;
    var activeCat = params.get('cat') || '';
    var q = '';

    var chips = '<button class="chip' + (!activeCat ? ' on' : '') + '" data-cat="">همه</button>' +
      d.categories.map(function (c) {
        return '<button class="chip' + (activeCat === c.slug ? ' on' : '') + '" data-cat="' + esc(c.slug) + '" data-track="wfilter:' + esc(c.name) + '">' + esc(c.name) + '</button>';
      }).join('');

    shell('<div class="page-hero container">' + sectionHead({ title: 'نمونه کارها', subtitle: 'پروژه‌های اجرا شده توسط تیم آزادی نتورک — دسته‌بندی شده و قابل جستجو' }) + '</div>' +
      '<div class="container" style="padding-bottom:90px">' +
      '<div class="toolbar">' +
      '<div class="search-box">' + ICONS.search + '<input type="search" data-work-search placeholder="جستجوی نام یا کد نمونه کار..." maxlength="80"><div class="suggest-panel" data-suggest hidden></div></div>' +
      '<div class="chip-row">' + chips + '</div></div>' +
      '<div class="cards-grid" data-work-grid></div>' +
      '</div>');

    var sorted = d.portfolio.slice().sort(function (a, b) {
      return (b.featuredTop ? 1 : 0) - (a.featuredTop ? 1 : 0) || b.createdAt - a.createdAt;
    });

    function applyFilter() {
      var grid = document.querySelector('[data-work-grid]');
      var catObj = d.categories.filter(function (c) { return c.slug === activeCat; })[0];
      var list = sorted.filter(function (w) {
        if (catObj && w.category !== catObj.id) return false;
        if (q) {
          var qq = q.toLowerCase();
          return w.title.toLowerCase().indexOf(qq) !== -1 || w.code.toLowerCase().indexOf(qq) !== -1;
        }
        return true;
      });
      grid.innerHTML = list.length ? list.map(workCard).join('') : '<div class="empty-note">نمونه کاری یافت نشد</div>';
      grid.querySelectorAll('.reveal').forEach(function (n) { n.classList.add('vis'); });
      bindCards();
    }
    applyFilter();

    document.querySelectorAll('[data-cat]').forEach(function (b) {
      b.addEventListener('click', function () {
        activeCat = b.getAttribute('data-cat');
        var cObj = d.categories.filter(function (c) { return c.slug === activeCat; })[0];
        if (cObj) track('view', 'category:' + cObj.id);
        document.querySelectorAll('[data-cat]').forEach(function (x) { x.classList.toggle('on', x === b); });
        applyFilter();
      });
    });

    var input = document.querySelector('[data-work-search]');
    var suggestPanel = document.querySelector('[data-suggest]');
    var debounce = null;
    input.addEventListener('input', function () {
      q = input.value.trim();
      applyFilter();
      if (debounce) clearTimeout(debounce);
      if (q.length < 2) { suggestPanel.hidden = true; return; }
      debounce = setTimeout(function () {
        track('search', 'works:' + q);
        fetchJson('/api/public/search?type=works&q=' + encodeURIComponent(q)).then(function (r) {
          if (!r.results.length) { suggestPanel.hidden = true; return; }
          suggestPanel.innerHTML = r.results.map(function (it) {
            return '<button class="suggest-item" data-sg="' + esc(it.id) + '">' +
              '<span class="suggest-thumb">' + mediaImg(it.cover, it.title) + '</span>' +
              '<span>' + esc(it.title) + '</span><span class="suggest-code">' + esc(it.code) + '</span></button>';
          }).join('');
          suggestPanel.hidden = false;
          suggestPanel.querySelectorAll('[data-sg]').forEach(function (b) {
            b.addEventListener('click', function () {
              var id = b.getAttribute('data-sg');
              track('suggest', 'work:' + id);
              navigate('/portfolio/' + encodeURIComponent(id));
            });
          });
        }).catch(function () {});
      }, 350);
    });
  }

  function blocksHtml(blocks) {
    return (blocks || []).map(function (b) {
      if (b.type === 'text') return '<div class="block-text reveal">' + esc(b.text) + '</div>';
      if (b.type === 'heading') return '<h3 class="block-heading reveal">' + esc(b.text) + '</h3>';
      if (b.type === 'steps') {
        return '<div class="block-steps reveal"><h4>' + esc(b.title) + '</h4>' +
          (b.steps || []).map(function (s, i) {
            return '<div class="step-row"><span class="step-num">' + (i + 1) + '</span><span>' + esc(s) + '</span></div>';
          }).join('') + '</div>';
      }
      if (b.type === 'image' && b.src) {
        return '<div class="block-media reveal">' + mediaImg(b.src, b.caption) +
          (b.caption ? '<div class="block-caption">' + esc(b.caption) + '</div>' : '') + '</div>';
      }
      if (b.type === 'video' && b.src) {
        return '<div class="block-media reveal"><video src="' + esc(mediaUrl(b.src)) + '" controls playsinline controlslist="nodownload noremoteplayback" disablepictureinpicture oncontextmenu="return false"></video>' +
          (b.caption ? '<div class="block-caption">' + esc(b.caption) + '</div>' : '') + '</div>';
      }
      return '';
    }).join('');
  }

  function renderWorkDetail(id) {
    track('view', 'work:' + id);
    shell('<div class="detail-wrap page-hero"><div class="skeleton" style="height:280px"></div></div>');
    fetchJson('/api/public/work/' + encodeURIComponent(id)).then(function (w) {
      var savedOn = isSaved('work', w.id);
      var gallery = (w.media || []).map(function (m, i) {
        if (m.type === 'video') {
          return '<div class="gallery-item" data-gal="' + i + '"><video src="' + esc(mediaUrl(m.src)) + '" muted playsinline preload="metadata"></video><span class="gi-play">' + ICONS.play + '</span></div>';
        }
        return '<div class="gallery-item" data-gal="' + i + '">' + mediaImg(m.src, w.title) + '</div>';
      }).join('');
      shell('<div class="detail-wrap page-hero">' +
        '<div class="detail-head reveal vis">' +
        '<div class="detail-meta"><span class="meta-pill" dir="ltr">' + esc(w.code) + '</span>' +
        '<span class="meta-pill">' + esc(catName(w.category)) + '</span></div>' +
        '<h1 class="detail-title">' + esc(w.title) + '</h1>' +
        '<p class="detail-desc">' + esc(w.desc) + '</p>' +
        '<div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap">' +
        '<button class="btn btn-ghost" data-fav-detail>' + (savedOn ? ICONS.starFill : ICONS.star) + '<span>' + (savedOn ? 'نشان شده' : 'نشان کردن') + '</span></button>' +
        '<a class="btn btn-primary" href="/contact" data-nav data-track="cta:work-contact">درخواست پروژه مشابه</a>' +
        '</div></div>' +
        (gallery ? '<div class="media-gallery">' + gallery + '</div>' : '') +
        '<div class="content-blocks">' + blocksHtml(w.blocks) + '</div>' +
        '<div style="margin-top:40px"><a class="btn btn-ghost" href="/portfolio" data-nav>بازگشت به نمونه کارها</a></div>' +
        '</div>');
      document.querySelectorAll('[data-gal]').forEach(function (g) {
        g.addEventListener('click', function () {
          openLightbox(w.media, Number(g.getAttribute('data-gal')));
        });
      });
      var fb = document.querySelector('[data-fav-detail]');
      if (fb) fb.addEventListener('click', function () {
        toggleSaved('work', w.id, w.title, w.cover);
        var on = isSaved('work', w.id);
        fb.innerHTML = (on ? ICONS.starFill : ICONS.star) + '<span>' + (on ? 'نشان شده' : 'نشان کردن') + '</span>';
      });
    }).catch(function () {
      shell('<div class="container page-hero"><div class="empty-note">نمونه کار یافت نشد</div></div>');
    });
  }

  function renderArticles() {
    var d = state.data;
    shell('<div class="page-hero container">' + sectionHead({ title: 'مقالات و آموزش‌ها', subtitle: 'آموزش‌های قدم به قدم و مقالات تخصصی شبکه' }) + '</div>' +
      '<div class="container" style="padding-bottom:90px"><div class="cards-grid">' +
      (d.articles.length ? d.articles.map(articleCard).join('') : '<div class="empty-note">مقاله‌ای منتشر نشده است</div>') +
      '</div></div>');
    document.querySelectorAll('.reveal').forEach(function (n) { n.classList.add('vis'); });
    bindCards();
  }

  function renderArticleDetail(id) {
    track('view', 'article:' + id);
    shell('<div class="detail-wrap page-hero"><div class="skeleton" style="height:280px"></div></div>');
    fetchJson('/api/public/article/' + encodeURIComponent(id)).then(function (a) {
      shell('<div class="detail-wrap page-hero">' +
        '<div class="detail-head reveal vis">' +
        '<div class="detail-meta"><span class="meta-pill" dir="ltr">' + esc(a.code) + '</span>' +
        '<span class="meta-pill">' + esc(a.topic) + '</span></div>' +
        '<h1 class="detail-title">' + esc(a.title) + '</h1>' +
        '<p class="detail-desc">' + esc(a.desc) + '</p></div>' +
        (a.cover ? '<div class="block-media reveal vis" style="margin-bottom:26px">' + mediaImg(a.cover, a.title) + '</div>' : '') +
        '<div class="content-blocks">' + blocksHtml(a.blocks) + '</div>' +
        '<div style="margin-top:40px"><a class="btn btn-ghost" href="/articles" data-nav>بازگشت به مقالات</a></div>' +
        '</div>');
      setupReveal();
      document.querySelectorAll('.reveal').forEach(function (n) { n.classList.add('vis'); });
    }).catch(function () {
      shell('<div class="container page-hero"><div class="empty-note">مقاله یافت نشد</div></div>');
    });
  }

  function channelLink(icon, value) {
    var v = String(value || '').trim();
    var handle = v.replace(/^@/, '');
    if (icon === 'telegram') return 'https://t.me/' + encodeURIComponent(handle);
    if (icon === 'whatsapp') {
      var num = v.replace(/[^0-9+]/g, '');
      if (num.indexOf('0') === 0) num = '98' + num.slice(1);
      return 'https://wa.me/' + encodeURIComponent(num.replace('+', ''));
    }
    if (icon === 'bale') return 'https://ble.ir/' + encodeURIComponent(handle);
    if (icon === 'eitaa') return 'https://eitaa.com/' + encodeURIComponent(handle);
    if (icon === 'rubika') return 'https://rubika.ir/' + encodeURIComponent(handle);
    if (icon === 'instagram') return 'https://instagram.com/' + encodeURIComponent(handle);
    if (icon === 'phone') return 'tel:' + encodeURIComponent(v.replace(/[^0-9+]/g, ''));
    return '';
  }

  function renderContact(params) {
    var d = state.data;
    var pid = params.get('product') || '';
    var prodNote = '';
    if (pid) {
      var p = d.products.filter(function (x) { return x.id === pid; })[0];
      if (p) {
        prodNote = '<div class="banner-strip reveal vis" style="margin-bottom:26px">' +
          '<div style="display:flex;align-items:center;gap:16px">' +
          '<span class="suggest-thumb" style="width:58px;height:58px">' + mediaImg(p.image, p.name) + '</span>' +
          '<div><div style="font-weight:900">' + esc(p.name) + '</div>' +
          '<div style="color:var(--text2);font-size:0.85em">کد محصول: <b dir="ltr">' + esc(p.code) + '</b> — برای استعلام قیمت این محصول، کد آن را در پیام خود بنویسید</div></div></div></div>';
      }
    }
    var sections = (d.settings.contactPage.sections || []).filter(function (cs) { return cs.enabled; }).map(function (cs) {
      var items = (cs.items || []).filter(function (it) { return it.enabled; }).map(function (it) {
        var link = channelLink(it.icon, it.value);
        var inner = '<span class="channel-icon">' + (ICONS[it.icon] || ICONS.chat) + '</span>' +
          '<span style="flex:1"><span class="channel-label">' + esc(it.label) + '</span><br>' +
          '<span class="channel-value">' + esc(it.value) + '</span></span>';
        if (link) return '<a class="channel-card" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer" data-track="contact:' + esc(it.label) + '">' + inner + '</a>';
        return '<div class="channel-card">' + inner + '</div>';
      }).join('');
      return '<div class="contact-section reveal vis"><h3>' + esc(cs.title) + '</h3>' +
        (cs.subtitle ? '<p>' + esc(cs.subtitle) + '</p>' : '') +
        '<div class="channel-grid">' + items + '</div></div>';
    }).join('');
    shell('<div class="page-hero container">' + sectionHead({ title: 'ارتباط با ما', subtitle: 'جهت استعلام قیمت و خرید محصولات از راه‌های زیر پیام بدهید' }) + '</div>' +
      '<div class="detail-wrap" style="padding-bottom:90px">' + prodNote + sections + '</div>');
  }

  function renderSaved() {
    var items = state.saved.slice().sort(function (a, b) { return b.ts - a.ts; });
    var inner;
    if (!items.length) {
      inner = '<div class="saved-empty">' + ICONS.star + '<div style="font-weight:800;font-size:1.1em">هنوز چیزی نشان نکرده‌اید</div>' +
        '<p style="margin-top:8px">با دکمه ستاره روی محصولات و نمونه کارها، آن‌ها را اینجا ذخیره کنید</p></div>';
    } else {
      inner = '<div class="cards-grid">' + items.map(function (it) {
        return '<div class="prod-card vis" data-saved-item="' + esc(it.k) + ':' + esc(it.id) + '">' +
          '<div class="prod-media">' + mediaImg(it.img, it.t) +
          '<button class="prod-fav on" data-unsave="' + esc(it.k) + ':' + esc(it.id) + '">' + ICONS.starFill + '</button></div>' +
          '<div class="prod-body"><span class="prod-cat">' + (it.k === 'product' ? 'محصول' : 'نمونه کار') + '</span>' +
          '<span class="prod-name">' + esc(it.t) + '</span></div></div>';
      }).join('') + '</div>';
    }
    shell('<div class="page-hero container">' + sectionHead({ title: 'نشان‌شده‌های من', subtitle: 'محتواهایی که ذخیره کرده‌اید — فقط روی همین دستگاه شما نگهداری می‌شود' }) + '</div>' +
      '<div class="container" style="padding-bottom:90px">' + inner + '</div>');
    document.querySelectorAll('[data-unsave]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var parts = b.getAttribute('data-unsave').split(':');
        toggleSaved(parts[0], parts[1], '', '');
        renderSaved();
      });
    });
    document.querySelectorAll('[data-saved-item]').forEach(function (c) {
      c.addEventListener('click', function () {
        var parts = c.getAttribute('data-saved-item').split(':');
        if (parts[0] === 'product') navigate('/contact?product=' + encodeURIComponent(parts[1]));
        else navigate('/portfolio/' + encodeURIComponent(parts[1]));
      });
    });
  }

  function route() {
    if (!state.data) return;
    var path = location.pathname.replace(/\/+$/, '') || '/';
    var params = new URLSearchParams(location.search);
    state.route = path;
    track('page', path + (location.search || ''));
    if (path === '/') renderHome();
    else if (path === '/shop') renderShop(params);
    else if (path === '/portfolio') renderPortfolio(params);
    else if (path.indexOf('/portfolio/') === 0) renderWorkDetail(path.slice(11));
    else if (path === '/articles') renderArticles();
    else if (path.indexOf('/articles/') === 0) renderArticleDetail(path.slice(10));
    else if (path === '/contact') renderContact(params);
    else if (path === '/saved') renderSaved();
    else renderHome();
  }

  function boot() {
    fetchJson('/api/public/bootstrap').then(function (data) {
      state.data = data;
      applyTheme();
      document.documentElement.style.setProperty('--font-scale', (data.settings.fontScale || 100) / 100);
      document.title = data.settings.siteName + ' | ' + data.settings.tagline;
      route();
      sendEnv();
    }).catch(function () {
      app.innerHTML = '<div style="min-height:100vh;display:grid;place-items:center;text-align:center;padding:20px">' +
        '<div><div style="font-size:1.4em;font-weight:900;margin-bottom:10px">خطا در بارگذاری</div>' +
        '<div style="color:var(--text2)">لطفا صفحه را دوباره بارگذاری کنید</div></div></div>';
    });
  }

  boot();
})();
