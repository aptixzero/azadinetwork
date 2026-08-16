(function () {
  'use strict';

  var csrf = '';
  var settings = null;
  var view = 'dashboard';
  var appEl = document.getElementById('admin-app');
  var modalRoot = document.getElementById('modal-root');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(msg, kind) {
    var root = document.getElementById('toast-root');
    var t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  }

  function api(method, url, body, raw) {
    var opts = { method: method, headers: {} };
    if (csrf) opts.headers['X-CSRF'] = csrf;
    if (body !== undefined && !raw) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    } else if (raw) {
      opts.body = body;
    }
    return fetch(url, opts).then(function (r) {
      if (r.status === 401) { renderLogin(); throw new Error('unauthorized'); }
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) {
        var e = new Error(j.error || 'http_' + r.status);
        e.code = j.error;
        throw e;
      });
      var ct = r.headers.get('content-type') || '';
      return ct.indexOf('json') !== -1 ? r.json() : r;
    });
  }

  function mediaUrl(ref) {
    if (!ref) return '';
    if (ref.indexOf('u/') === 0) return '/m/' + encodeURIComponent(ref.slice(2));
    return '';
  }

  function thumb(ref) {
    var u = mediaUrl(ref);
    if (!u) return '<div class="item-thumb"></div>';
    if (/\.(mp4|webm|mov)$/i.test(ref)) return '<div class="item-thumb"><video src="' + esc(u) + '" muted preload="metadata"></video></div>';
    return '<div class="item-thumb"><img src="' + esc(u) + '" alt=""></div>';
  }

  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
    return (n / 1073741824).toFixed(2) + ' GB';
  }

  function fmtDate(ts) {
    if (!ts) return '-';
    try {
      return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(ts));
    } catch (e) { return new Date(ts).toLocaleString(); }
  }

  function fmtDur(ms) {
    var m = Math.floor((ms || 0) / 60000);
    var s = Math.floor(((ms || 0) % 60000) / 1000);
    return m + ' دقیقه ' + s + ' ثانیه';
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }

  function modal(html, cls) {
    modalRoot.innerHTML = '<div class="overlay"><div class="modal ' + (cls || '') + '">' + html + '</div></div>';
    var ov = modalRoot.querySelector('.overlay');
    ov.addEventListener('mousedown', function (e) {
      if (e.target === ov) closeModal();
    });
    return modalRoot.querySelector('.modal');
  }

  function closeModal() { modalRoot.innerHTML = ''; }

  function confirmDialog(title, text, okLabel, danger) {
    return new Promise(function (resolve) {
      var m = modal('<div class="modal-title">' + esc(title) + '</div>' +
        '<p style="color:var(--text2)">' + esc(text) + '</p>' +
        '<div class="modal-actions">' +
        '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" data-ok>' + esc(okLabel || 'تایید') + '</button>' +
        '<button class="btn btn-ghost" data-cancel>انصراف</button></div>', 'narrow');
      m.querySelector('[data-ok]').addEventListener('click', function () { closeModal(); resolve(true); });
      m.querySelector('[data-cancel]').addEventListener('click', function () { closeModal(); resolve(false); });
    });
  }

  var ICONS = {
    dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="10" rx="2"/><rect x="13" y="3" width="8" height="6" rx="2"/><rect x="13" y="11" width="8" height="10" rx="2"/><rect x="3" y="15" width="8" height="6" rx="2"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.6c2.8.2 4.9 2 5.5 4.9"/></svg>',
    content: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v16H4z" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
    story: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9" stroke-dasharray="4 3"/><circle cx="12" cy="12" r="5"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2.5 21 7v10l-9 4.5L3 17V7l9-4.5Z"/><path d="M3 7l9 4.5L21 7M12 11.5V21.5"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Z"/><path d="M9 4v13M15 6.5v13"/></svg>',
    article: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2.5h9L20 7.5v14H6v-19Z"/><path d="M15 2.5v5h5M9 12h8M9 16h8"/></svg>',
    work: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>',
    svc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m14.5 6.5 3 3L8 19H5v-3l9.5-9.5ZM12 21h9"/></svg>',
    contact: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5Z"/></svg>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5-5 3 3 4-4 4 4"/></svg>',
    backup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v11m0 0-4-4m4 4 4-4"/><path d="M4 15v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3"/></svg>',
    restore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 14V3m0 0L8 7m4-4 4 4"/><path d="M4 15v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.15-1.4l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.4-1.4L13.8 3h-3.6l-.35 2.3a7 7 0 0 0-2.4 1.4l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.8l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.4 1.4l.35 2.3h3.6l.35-2.3a7 7 0 0 0 2.4-1.4l2.3 1 2-3.4-2-1.5c.1-.45.15-.92.15-1.4Z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    exit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h11"/></svg>',
    menu: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9ZM10 20a2.2 2.2 0 0 0 4 0"/></svg>'
  };

  var NAV = [
    { id: 'dashboard', label: 'داشبورد و CRM', icon: 'dash' },
    { id: 'visitors', label: 'ترکینگ کاربران', icon: 'users' },
    { id: 'content', label: 'محتوای سایت', icon: 'content' },
    { id: 'stories', label: 'استوری‌ها', icon: 'story' },
    { id: 'services', label: 'خدمات', icon: 'svc' },
    { id: 'products', label: 'محصولات', icon: 'box' },
    { id: 'provinces', label: 'استان‌ها', icon: 'map' },
    { id: 'articles', label: 'مقالات و آموزش', icon: 'article' },
    { id: 'portfolio', label: 'نمونه کارها', icon: 'work' },
    { id: 'contact', label: 'ارتباط با ما', icon: 'contact' },
    { id: 'media', label: 'رسانه‌ها', icon: 'media' },
    { id: 'backup', label: 'بکاپ‌گیری', icon: 'backup' },
    { id: 'restore', label: 'بازگردانی', icon: 'restore' },
    { id: 'settings', label: 'تنظیمات', icon: 'gear' }
  ];

  function renderLogin(err) {
    appEl.innerHTML = '<div class="login-wrap"><form class="login-card" data-login>' +
      '<div class="login-logo">AZ</div>' +
      '<div class="login-title">پنل مدیریت آزادی نتورک</div>' +
      '<div class="login-sub">برای ورود، اطلاعات مدیریت را وارد کنید</div>' +
      (err ? '<div class="login-err">' + esc(err) + '</div>' : '') +
      '<div class="field"><label>نام کاربری</label><input name="username" autocomplete="off" autocapitalize="off" spellcheck="false" required maxlength="100"></div>' +
      '<div class="field"><label>رمز عبور</label><input name="password" type="password" autocomplete="new-password" required maxlength="200"></div>' +
      '<button class="btn btn-primary btn-block" type="submit">ورود به پنل</button>' +
      '</form></div>';
    var form = appEl.querySelector('[data-login]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button');
      btn.disabled = true;
      fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.value.trim(),
          password: form.password.value
        })
      }).then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
        .then(function (res) {
          if (res.s === 200 && res.j.ok) {
            csrf = res.j.csrf;
            boot(true);
          } else if (res.s === 429) {
            renderLogin('تعداد تلاش‌های ورود زیاد است. کمی بعد دوباره امتحان کنید');
          } else {
            renderLogin('نام کاربری یا رمز عبور اشتباه است');
          }
        }).catch(function () {
          renderLogin('خطا در برقراری ارتباط با سرور');
        });
    });
  }

  function layoutShell(inner) {
    var nav = NAV.map(function (n) {
      return '<button class="side-item' + (view === n.id ? ' on' : '') + '" data-view="' + n.id + '">' + ICONS[n.icon] + '<span>' + esc(n.label) + '</span></button>';
    }).join('');
    appEl.innerHTML =
      '<div class="mobile-topbar"><button data-sidebar-open>' + ICONS.menu + '</button><b>پنل مدیریت</b><span></span></div>' +
      '<div class="layout">' +
      '<aside class="sidebar"><div class="side-logo"><span class="mark">AZ</span><span>آزادی نتورک</span></div>' + nav +
      '<div class="side-sep"></div>' +
      '<div class="side-foot">' +
      '<a class="side-item" href="/" target="_blank" rel="noopener">' + ICONS.eye + '<span>مشاهده سایت</span></a>' +
      '<button class="side-item" data-logout>' + ICONS.exit + '<span>خروج</span></button>' +
      '</div></aside>' +
      '<div class="main">' + inner + '</div></div>';

    appEl.querySelectorAll('[data-view]').forEach(function (b) {
      b.addEventListener('click', function () {
        view = b.getAttribute('data-view');
        renderView();
      });
    });
    var so = appEl.querySelector('[data-sidebar-open]');
    if (so) so.addEventListener('click', function () {
      appEl.querySelector('.sidebar').classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      var sb = appEl.querySelector('.sidebar');
      if (sb && sb.classList.contains('open') && !e.target.closest('.sidebar') && !e.target.closest('[data-sidebar-open]')) {
        sb.classList.remove('open');
      }
    });
    var lo = appEl.querySelector('[data-logout]');
    if (lo) lo.addEventListener('click', function () {
      api('POST', '/api/admin/logout', {}).then(function () { location.reload(); }).catch(function () { location.reload(); });
    });
  }

  function pageHead(title, sub, actions) {
    return '<div class="page-head"><div><div class="page-title">' + esc(title) + '</div>' +
      (sub ? '<div class="page-sub">' + esc(sub) + '</div>' : '') + '</div>' +
      '<div class="page-head-actions">' + (actions || '') + '</div></div>';
  }

  function barChart(entries, labelKey, countKey) {
    if (!entries || !entries.length) return '<div style="color:var(--text2);font-size:0.87em;text-align:center;padding:14px">داده‌ای ثبت نشده است</div>';
    var max = Math.max.apply(null, entries.map(function (e) { return e[countKey]; }));
    return entries.map(function (e) {
      var w = max ? Math.round(e[countKey] / max * 100) : 0;
      return '<div class="bar-row"><span class="bar-label" title="' + esc(e[labelKey]) + '">' + esc(e[labelKey]) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + w + '%"></span></span>' +
        '<span class="bar-num">' + e[countKey] + '</span></div>';
    }).join('');
  }

  function renderDashboard() {
    layoutShell(pageHead('داشبورد و CRM', 'نمای کلی فعالیت سایت بر اساس داده‌های واقعی بازدیدکنندگان') +
      '<div data-dash><div class="card">در حال بارگذاری آمار...</div></div>');
    api('GET', '/api/admin/track/summary').then(function (s) {
      var root = appEl.querySelector('[data-dash]');
      var devices = Object.keys(s.devices).map(function (k) { return { key: k, count: s.devices[k] }; });
      var browsers = Object.keys(s.browsers).map(function (k) { return { key: k, count: s.browsers[k] }; });
      root.innerHTML =
        '<div class="kpi-grid">' +
        '<div class="kpi green"><div class="kpi-val">' + s.online + '</div><div class="kpi-label">کاربر آنلاین (۵ دقیقه اخیر)</div></div>' +
        '<div class="kpi"><div class="kpi-val">' + s.today + '</div><div class="kpi-label">بازدیدکننده امروز</div></div>' +
        '<div class="kpi"><div class="kpi-val">' + s.week + '</div><div class="kpi-label">بازدیدکننده هفته اخیر</div></div>' +
        '<div class="kpi amber"><div class="kpi-val">' + s.totalPageViews + '</div><div class="kpi-label">کل بازدید صفحات</div></div>' +
        '</div>' +
        '<div class="grid2">' +
        '<div class="card"><div class="card-title">پربازدیدترین صفحات</div>' + barChart(s.topPages, 'key', 'count') + '</div>' +
        '<div class="card"><div class="card-title">پرجستجوترین عبارت‌ها</div>' + barChart(s.topSearches, 'key', 'count') + '</div>' +
        '<div class="card"><div class="card-title">محصولات با بیشترین بازدید</div>' + barChart(s.topProducts, 'name', 'count') + '</div>' +
        '<div class="card"><div class="card-title">نمونه کارهای با بیشترین بازدید</div>' + barChart(s.topWorks, 'name', 'count') + '</div>' +
        '<div class="card"><div class="card-title">مقالات پربازدید</div>' + barChart(s.topArticles, 'name', 'count') + '</div>' +
        '<div class="card"><div class="card-title">دسته‌بندی‌های پربازدید</div>' + barChart(s.topCategories, 'name', 'count') + '</div>' +
        '<div class="card"><div class="card-title">کلیک روی پیشنهادهای جستجو</div>' + barChart(s.topSuggests, 'key', 'count') + '</div>' +
        '<div class="card"><div class="card-title">دستگاه و مرورگر کاربران</div>' +
        '<div style="margin-bottom:14px"><b style="font-size:0.85em;color:var(--text2)">دستگاه‌ها</b>' + barChart(devices, 'key', 'count') + '</div>' +
        '<div><b style="font-size:0.85em;color:var(--text2)">مرورگرها</b>' + barChart(browsers, 'key', 'count') + '</div></div>' +
        '</div>';
    }).catch(function () {});
  }

  function renderVisitors() {
    layoutShell(pageHead('ترکینگ کاربران', 'اطلاعات دقیق بازدیدکنندگان — داده‌های کاربران غیرفعال بعد از ۷ روز خودکار پاک می‌شوند',
      '<button class="btn btn-ghost" data-export>خروجی Excel (CSV)</button>' +
      '<button class="btn btn-danger" data-clear-all>پاک کردن همه</button>') +
      '<div class="card"><div class="table-wrap" data-vis-table>در حال بارگذاری...</div></div>');

    appEl.querySelector('[data-export]').addEventListener('click', function () {
      var a = document.createElement('a');
      a.href = '/api/admin/track/export';
      a.download = 'azadi_visitors.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
    appEl.querySelector('[data-clear-all]').addEventListener('click', function () {
      confirmDialog('پاک کردن همه داده‌ها', 'تمام اطلاعات ترکینگ بازدیدکنندگان حذف می‌شود. ادامه می‌دهید؟', 'پاک کن', true).then(function (ok) {
        if (!ok) return;
        api('POST', '/api/admin/track/clear', {}).then(function () {
          toast('داده‌های ترکینگ پاک شد', 'ok');
          renderVisitors();
        }).catch(function () { toast('خطا در حذف', 'err'); });
      });
    });

    api('GET', '/api/admin/track/visitors').then(function (r) {
      var root = appEl.querySelector('[data-vis-table]');
      if (!r.visitors.length) {
        root.innerHTML = '<div style="color:var(--text2);text-align:center;padding:24px">هنوز بازدیدکننده‌ای ثبت نشده است</div>';
        return;
      }
      root.innerHTML = '<table><thead><tr>' +
        '<th>IP</th><th>آخرین بازدید</th><th>مدت آنلاین</th><th>مرورگر</th><th>سیستم عامل</th><th>دستگاه</th><th>صفحات</th><th>کلیک‌ها</th><th>جستجوها</th><th></th>' +
        '</tr></thead><tbody>' +
        r.visitors.map(function (v) {
          var online = Date.now() - v.lastSeen < 5 * 60 * 1000;
          return '<tr>' +
            '<td class="mono">' + esc(v.ip) + (online ? ' <span class="pill pill-ok">آنلاین</span>' : '') + '</td>' +
            '<td>' + fmtDate(v.lastSeen) + '</td>' +
            '<td>' + fmtDur(v.totalMs) + '</td>' +
            '<td>' + esc(v.browser) + '</td>' +
            '<td>' + esc(v.os) + '</td>' +
            '<td>' + esc(v.device) + '</td>' +
            '<td>' + v.pageCount + '</td><td>' + v.clickCount + '</td><td>' + v.searchCount + '</td>' +
            '<td><div class="item-actions">' +
            '<button class="btn btn-ghost btn-sm" data-vdetail="' + esc(v.id) + '">جزئیات</button>' +
            '<button class="btn btn-danger btn-sm" data-vdel="' + esc(v.id) + '">حذف</button>' +
            '</div></td></tr>';
        }).join('') + '</tbody></table>';

      root.querySelectorAll('[data-vdel]').forEach(function (b) {
        b.addEventListener('click', function () {
          confirmDialog('حذف بازدیدکننده', 'اطلاعات این کاربر حذف شود؟', 'حذف', true).then(function (ok) {
            if (!ok) return;
            api('DELETE', '/api/admin/track/visitor/' + b.getAttribute('data-vdel')).then(function () {
              toast('حذف شد', 'ok');
              renderVisitors();
            }).catch(function () { toast('خطا در حذف', 'err'); });
          });
        });
      });
      root.querySelectorAll('[data-vdetail]').forEach(function (b) {
        b.addEventListener('click', function () {
          api('GET', '/api/admin/track/visitor/' + b.getAttribute('data-vdetail')).then(showVisitorDetail).catch(function () {});
        });
      });
    }).catch(function () {});
  }

  function showVisitorDetail(v) {
    var pages = Object.keys(v.pages || {}).map(function (p) {
      return '<tr><td class="mono">' + esc(p) + '</td><td>' + v.pages[p].n + '</td><td>' + fmtDate(v.pages[p].last) + '</td></tr>';
    }).join('');
    var clicks = (v.clicks || []).slice(-40).reverse().map(function (c) {
      return '<tr><td>' + esc(c.v) + '</td><td>' + fmtDate(c.ts) + '</td></tr>';
    }).join('');
    var views = (v.views || []).slice(-40).reverse().map(function (c) {
      return '<tr><td>' + esc(c.v) + '</td><td>' + fmtDate(c.ts) + '</td></tr>';
    }).join('');
    var searches = (v.searches || []).slice(-30).reverse().map(function (c) {
      return '<tr><td>' + esc(c.v) + '</td><td>' + fmtDate(c.ts) + '</td></tr>';
    }).join('');
    modal('<div class="modal-title">جزئیات بازدیدکننده</div>' +
      '<div class="grid3" style="margin-bottom:18px">' +
      '<div class="card" style="margin:0"><b>IP:</b> <span class="mono">' + esc(v.ip) + '</span><br><b>اولین بازدید:</b> ' + fmtDate(v.firstSeen) + '<br><b>آخرین بازدید:</b> ' + fmtDate(v.lastSeen) + '<br><b>مدت آنلاین:</b> ' + fmtDur(v.totalMs) + '<br><b>تعداد نشست:</b> ' + (v.sessions || 1) + '</div>' +
      '<div class="card" style="margin:0"><b>مرورگر:</b> ' + esc(v.browser) + '<br><b>سیستم عامل:</b> ' + esc(v.os) + '<br><b>دستگاه:</b> ' + esc(v.device) + '<br><b>زبان:</b> <span class="mono">' + esc(v.lang) + '</span><br><b>لمسی:</b> ' + (v.touch ? 'بله' : 'خیر') + '</div>' +
      '<div class="card" style="margin:0"><b>رزولوشن:</b> <span class="mono">' + esc(v.screen || '-') + '</span><br><b>منطقه زمانی:</b> <span class="mono">' + esc(v.tz || '-') + '</span><br><b>پلتفرم:</b> <span class="mono">' + esc(v.platform || '-') + '</span><br><b>هسته CPU:</b> ' + (v.cores || '-') + '<br><b>حافظه:</b> ' + (v.memory ? v.memory + ' GB' : '-') + '<br><b>شبکه:</b> <span class="mono">' + esc(v.netInfo || '-') + '</span></div>' +
      '</div>' +
      (v.referrer ? '<div class="card"><b>ارجاع از:</b> <span class="mono">' + esc(v.referrer) + '</span></div>' : '') +
      '<div class="card"><div class="card-title">صفحات بازدید شده</div><div class="table-wrap"><table><thead><tr><th>صفحه</th><th>تعداد</th><th>آخرین بار</th></tr></thead><tbody>' + (pages || '<tr><td colspan="3">-</td></tr>') + '</tbody></table></div></div>' +
      '<div class="grid2">' +
      '<div class="card"><div class="card-title">کلیک‌ها (آخرین ۴۰)</div><div class="table-wrap" style="max-height:250px;overflow-y:auto"><table><tbody>' + (clicks || '<tr><td>-</td></tr>') + '</tbody></table></div></div>' +
      '<div class="card"><div class="card-title">محتواهای دیده شده (آخرین ۴۰)</div><div class="table-wrap" style="max-height:250px;overflow-y:auto"><table><tbody>' + (views || '<tr><td>-</td></tr>') + '</tbody></table></div></div>' +
      '</div>' +
      '<div class="card"><div class="card-title">جستجوها</div><div class="table-wrap" style="max-height:200px;overflow-y:auto"><table><tbody>' + (searches || '<tr><td>-</td></tr>') + '</tbody></table></div></div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" data-close>بستن</button></div>', 'wide')
      .querySelector('[data-close]').addEventListener('click', closeModal);
  }

  function loadSettings() {
    return api('GET', '/api/admin/settings').then(function (s) { settings = s; return s; });
  }

  function saveSettings() {
    return api('PUT', '/api/admin/settings', settings).then(function (r) {
      settings = r.settings;
      toast('ذخیره شد', 'ok');
    }).catch(function () { toast('خطا در ذخیره', 'err'); });
  }

  function inputField(label, value, attrs) {
    return '<div><label>' + esc(label) + '</label><input value="' + esc(value == null ? '' : value) + '" ' + (attrs || '') + '></div>';
  }

  function switchField(label, checked, attr) {
    return '<label class="switch"><input type="checkbox" ' + attr + (checked ? ' checked' : '') + '><span class="sw"></span><span class="sw-label">' + esc(label) + '</span></label>';
  }

  function pickMedia(cb, videoOk) {
    api('GET', '/api/admin/media').then(function (r) {
      var files = r.files.filter(function (f) {
        return videoOk ? true : !/\.(mp4|webm|mov)$/i.test(f.name);
      });
      var cells = files.map(function (f) {
        var isVid = /\.(mp4|webm|mov)$/i.test(f.name);
        var inner = isVid
          ? '<video src="/m/' + esc(encodeURIComponent(f.name)) + '" muted preload="metadata"></video>'
          : '<img src="/m/' + esc(encodeURIComponent(f.name)) + '" loading="lazy" alt="">';
        return '<div class="media-cell" data-pick="u/' + esc(f.name) + '">' + inner + '<span class="mc-name">' + esc(f.name) + '</span></div>';
      }).join('');
      var m = modal('<div class="modal-title">انتخاب رسانه</div>' +
        '<div class="upload-zone" data-upzone>برای آپلود فایل جدید کلیک کنید یا فایل را اینجا رها کنید<input type="file" hidden accept="image/*' + (videoOk ? ',video/*' : '') + '"></div>' +
        '<div style="height:14px"></div>' +
        '<div class="media-grid">' + (cells || '<div style="color:var(--text2)">فایلی موجود نیست</div>') + '</div>' +
        '<div class="modal-actions"><button class="btn btn-ghost" data-close>بستن</button></div>', 'wide');
      m.querySelector('[data-close]').addEventListener('click', closeModal);
      m.querySelectorAll('[data-pick]').forEach(function (c) {
        c.addEventListener('click', function () {
          var ref = c.getAttribute('data-pick');
          closeModal();
          cb(ref);
        });
      });
      var zone = m.querySelector('[data-upzone]');
      var fi = zone.querySelector('input');
      zone.addEventListener('click', function () { fi.click(); });
      zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('drag'); });
      zone.addEventListener('dragleave', function () { zone.classList.remove('drag'); });
      zone.addEventListener('drop', function (e) {
        e.preventDefault();
        zone.classList.remove('drag');
        if (e.dataTransfer.files.length) uploadFile(e.dataTransfer.files[0], function (ref) { closeModal(); cb(ref); });
      });
      fi.addEventListener('change', function () {
        if (fi.files.length) uploadFile(fi.files[0], function (ref) { closeModal(); cb(ref); });
      });
    }).catch(function () { toast('خطا در دریافت رسانه‌ها', 'err'); });
  }

  function uploadFile(file, cb) {
    if (file.size > 80 * 1024 * 1024) { toast('حجم فایل بیشتر از ۸۰ مگابایت است', 'err'); return; }
    toast('در حال آپلود...');
    fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'X-CSRF': csrf, 'X-File-Name': encodeURIComponent(file.name).replace(/%/g, '') || 'file.' + (file.name.split('.').pop() || 'png'), 'Content-Type': 'application/octet-stream' },
      body: file
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.ok) { toast('آپلود شد', 'ok'); cb(j.ref); }
      else toast('خطا در آپلود', 'err');
    }).catch(function () { toast('خطا در آپلود', 'err'); });
  }

  function renderContent() {
    layoutShell(pageHead('محتوای سایت', 'ویرایش تمام متن‌ها، سکشن‌ها، هدر و فوتر با پیش‌نمایش زنده',
      '<button class="btn btn-ghost" data-preview>پیش‌نمایش سایت</button>' +
      '<button class="btn btn-primary" data-save-all>ذخیره همه تغییرات</button>') +
      '<div data-content-root></div>');

    var s = settings;
    var root = appEl.querySelector('[data-content-root]');

    function secMetaCard(key, name) {
      var m = s.sectionsMeta[key];
      return '<div class="card"><div class="card-title">سکشن: ' + esc(name) + '</div>' +
        '<div class="form-grid">' +
        '<div class="full">' + switchField('نمایش این سکشن در صفحه اصلی', m.enabled, 'data-sm="' + key + '.enabled"') + '</div>' +
        inputField('عنوان', m.title, 'data-sm="' + key + '.title" maxlength="150"') +
        inputField('زیرعنوان', m.subtitle, 'data-sm="' + key + '.subtitle" maxlength="300"') +
        '</div></div>';
    }

    root.innerHTML =
      '<div class="card"><div class="card-title">سکشن اول (Hero)</div><div class="form-grid">' +
      '<div class="full">' + switchField('نمایش سکشن Hero', s.hero.enabled, 'data-h="enabled"') + '</div>' +
      inputField('عنوان گلیچی (انگلیسی)', s.hero.title, 'data-h="title" maxlength="80" dir="ltr"') +
      inputField('متن خوش‌آمد', s.hero.welcome, 'data-h="welcome" maxlength="200"') +
      inputField('توضیح', s.hero.description, 'data-h="description" maxlength="300"') +
      inputField('توضیح تکمیلی', s.hero.sub, 'data-h="sub" maxlength="300"') +
      inputField('متن دکمه اول', s.hero.ctaLabel, 'data-h="ctaLabel" maxlength="60"') +
      inputField('لینک دکمه اول', s.hero.ctaUrl, 'data-h="ctaUrl" maxlength="300" dir="ltr"') +
      inputField('متن دکمه دوم', s.hero.cta2Label, 'data-h="cta2Label" maxlength="60"') +
      inputField('لینک دکمه دوم', s.hero.cta2Url, 'data-h="cta2Url" maxlength="300" dir="ltr"') +
      '</div></div>' +
      '<div class="card"><div class="card-title">بنر میانی</div><div class="form-grid">' +
      '<div class="full">' + switchField('نمایش بنر', s.banner.enabled, 'data-b="enabled"') + '</div>' +
      inputField('متن بنر', s.banner.text, 'data-b="text" maxlength="300"') +
      inputField('متن دکمه', s.banner.buttonLabel, 'data-b="buttonLabel" maxlength="80"') +
      inputField('لینک دکمه', s.banner.buttonUrl, 'data-b="buttonUrl" maxlength="300" dir="ltr"') +
      '</div></div>' +
      secMetaCard('stories', 'استوری‌ها') +
      secMetaCard('services', 'خدمات') +
      secMetaCard('products', 'محصولات پرفروش') +
      secMetaCard('portfolioHome', 'نمونه کارهای صفحه اصلی') +
      secMetaCard('provinces', 'استان‌ها') +
      secMetaCard('stats', 'آمار') +
      secMetaCard('articles', 'مقالات') +
      secMetaCard('faq', 'سوالات متداول') +
      '<div class="card"><div class="card-title">آمار (اعداد صفحه اصلی)</div><div data-stats-list></div>' +
      '<button class="btn btn-ghost btn-sm" data-add-stat>افزودن آمار</button></div>' +
      '<div class="card"><div class="card-title">سوالات متداول</div><div data-faq-list></div>' +
      '<button class="btn btn-ghost btn-sm" data-add-faq>افزودن سوال</button></div>' +
      '<div class="card"><div class="card-title">لینک‌های هدر</div><div data-header-links></div>' +
      '<button class="btn btn-ghost btn-sm" data-add-hlink>افزودن لینک</button></div>' +
      '<div class="card"><div class="card-title">فوتر</div><div class="form-grid">' +
      '<div class="full"><label>درباره ما (فوتر)</label><textarea data-f="about" maxlength="600">' + esc(s.footer.about) + '</textarea></div>' +
      inputField('متن کپی‌رایت', s.footer.copyright, 'data-f="copyright" maxlength="200"') +
      '</div><div style="height:12px"></div><div data-footer-cols></div>' +
      '<button class="btn btn-ghost btn-sm" data-add-fcol>افزودن ستون فوتر</button></div>';

    function renderStatsList() {
      var box = root.querySelector('[data-stats-list]');
      box.innerHTML = s.stats.map(function (st, i) {
        return '<div class="item-row"><div class="item-main"><div class="form-grid">' +
          inputField('عنوان', st.label, 'data-stat="' + i + '.label" maxlength="80"') +
          inputField('مقدار', st.value, 'data-stat="' + i + '.value" maxlength="30" dir="ltr"') +
          '</div></div><div class="item-actions"><button class="btn btn-danger btn-sm" data-del-stat="' + i + '">حذف</button></div></div>';
      }).join('');
      box.querySelectorAll('[data-stat]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var p = inp.getAttribute('data-stat').split('.');
          s.stats[Number(p[0])][p[1]] = inp.value;
        });
      });
      box.querySelectorAll('[data-del-stat]').forEach(function (b) {
        b.addEventListener('click', function () {
          s.stats.splice(Number(b.getAttribute('data-del-stat')), 1);
          renderStatsList();
        });
      });
    }

    function renderFaqList() {
      var box = root.querySelector('[data-faq-list]');
      box.innerHTML = s.faq.map(function (f, i) {
        return '<div class="item-row"><div class="item-main">' +
          '<div style="margin-bottom:8px"><label>سوال</label><input value="' + esc(f.q) + '" data-faq="' + i + '.q" maxlength="300"></div>' +
          '<div><label>پاسخ</label><textarea data-faq="' + i + '.a" maxlength="2000">' + esc(f.a) + '</textarea></div>' +
          '</div><div class="item-actions"><button class="btn btn-danger btn-sm" data-del-faq="' + i + '">حذف</button></div></div>';
      }).join('');
      box.querySelectorAll('[data-faq]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var p = inp.getAttribute('data-faq').split('.');
          s.faq[Number(p[0])][p[1]] = inp.value;
        });
      });
      box.querySelectorAll('[data-del-faq]').forEach(function (b) {
        b.addEventListener('click', function () {
          s.faq.splice(Number(b.getAttribute('data-del-faq')), 1);
          renderFaqList();
        });
      });
    }

    function renderHeaderLinks() {
      var box = root.querySelector('[data-header-links]');
      box.innerHTML = s.header.links.map(function (l, i) {
        return '<div class="item-row"><div class="item-main"><div class="form-grid">' +
          inputField('عنوان', l.label, 'data-hl="' + i + '.label" maxlength="60"') +
          inputField('آدرس مقصد', l.url, 'data-hl="' + i + '.url" maxlength="300" dir="ltr"') +
          '</div></div><div class="item-actions">' +
          '<button class="btn btn-ghost btn-sm" data-hl-up="' + i + '">بالا</button>' +
          '<button class="btn btn-danger btn-sm" data-del-hl="' + i + '">حذف</button></div></div>';
      }).join('');
      box.querySelectorAll('[data-hl]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var p = inp.getAttribute('data-hl').split('.');
          s.header.links[Number(p[0])][p[1]] = inp.value;
        });
      });
      box.querySelectorAll('[data-del-hl]').forEach(function (b) {
        b.addEventListener('click', function () {
          s.header.links.splice(Number(b.getAttribute('data-del-hl')), 1);
          renderHeaderLinks();
        });
      });
      box.querySelectorAll('[data-hl-up]').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = Number(b.getAttribute('data-hl-up'));
          if (i > 0) {
            var tmp = s.header.links[i - 1];
            s.header.links[i - 1] = s.header.links[i];
            s.header.links[i] = tmp;
            renderHeaderLinks();
          }
        });
      });
    }

    function renderFooterCols() {
      var box = root.querySelector('[data-footer-cols]');
      box.innerHTML = s.footer.columns.map(function (c, i) {
        var links = c.links.map(function (l, j) {
          return '<div class="form-grid" style="margin-bottom:8px">' +
            inputField('عنوان لینک', l.label, 'data-fcl="' + i + '.' + j + '.label" maxlength="60"') +
            inputField('آدرس', l.url, 'data-fcl="' + i + '.' + j + '.url" maxlength="300" dir="ltr"') +
            '</div>';
        }).join('');
        return '<div class="item-row" style="display:block"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
          '<div style="flex:1;margin-left:10px"><label>عنوان ستون</label><input value="' + esc(c.title) + '" data-fct="' + i + '" maxlength="80"></div>' +
          '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-fcol-addlink="' + i + '">افزودن لینک</button>' +
          '<button class="btn btn-danger btn-sm" data-del-fcol="' + i + '">حذف ستون</button></div></div>' + links + '</div>';
      }).join('');
      box.querySelectorAll('[data-fct]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          s.footer.columns[Number(inp.getAttribute('data-fct'))].title = inp.value;
        });
      });
      box.querySelectorAll('[data-fcl]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var p = inp.getAttribute('data-fcl').split('.');
          s.footer.columns[Number(p[0])].links[Number(p[1])][p[2]] = inp.value;
        });
      });
      box.querySelectorAll('[data-fcol-addlink]').forEach(function (b) {
        b.addEventListener('click', function () {
          s.footer.columns[Number(b.getAttribute('data-fcol-addlink'))].links.push({ id: uid(), label: 'لینک جدید', url: '/' });
          renderFooterCols();
        });
      });
      box.querySelectorAll('[data-del-fcol]').forEach(function (b) {
        b.addEventListener('click', function () {
          s.footer.columns.splice(Number(b.getAttribute('data-del-fcol')), 1);
          renderFooterCols();
        });
      });
    }

    renderStatsList();
    renderFaqList();
    renderHeaderLinks();
    renderFooterCols();

    root.querySelectorAll('[data-h]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var k = inp.getAttribute('data-h');
        s.hero[k] = inp.type === 'checkbox' ? inp.checked : inp.value;
      });
      if (inp.type === 'checkbox') inp.addEventListener('change', function () { s.hero[inp.getAttribute('data-h')] = inp.checked; });
    });
    root.querySelectorAll('[data-b]').forEach(function (inp) {
      var f = function () {
        s.banner[inp.getAttribute('data-b')] = inp.type === 'checkbox' ? inp.checked : inp.value;
      };
      inp.addEventListener('input', f);
      inp.addEventListener('change', f);
    });
    root.querySelectorAll('[data-sm]').forEach(function (inp) {
      var f = function () {
        var p = inp.getAttribute('data-sm').split('.');
        s.sectionsMeta[p[0]][p[1]] = inp.type === 'checkbox' ? inp.checked : inp.value;
      };
      inp.addEventListener('input', f);
      inp.addEventListener('change', f);
    });
    root.querySelectorAll('[data-f]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        s.footer[inp.getAttribute('data-f')] = inp.value;
      });
    });
    root.querySelector('[data-add-stat]') && root.querySelector('[data-add-stat]').addEventListener('click', function () {
      s.stats.push({ id: uid(), label: 'عنوان', value: '0' });
      renderStatsList();
    });
    root.querySelector('[data-add-faq]').addEventListener('click', function () {
      s.faq.push({ id: uid(), q: 'سوال جدید', a: 'پاسخ' });
      renderFaqList();
    });
    root.querySelector('[data-add-hlink]').addEventListener('click', function () {
      s.header.links.push({ id: uid(), label: 'لینک جدید', url: '/' });
      renderHeaderLinks();
    });
    root.querySelector('[data-add-fcol]').addEventListener('click', function () {
      s.footer.columns.push({ id: uid(), title: 'ستون جدید', links: [] });
      renderFooterCols();
    });

    appEl.querySelector('[data-save-all]').addEventListener('click', function () {
      saveSettings();
    });
    appEl.querySelector('[data-preview]').addEventListener('click', function () {
      saveSettings().then(function () {
        var m = modal('<div class="modal-title">پیش‌نمایش سایت</div>' +
          '<div class="preview-frame-wrap"><iframe src="/?_pv=' + Date.now() + '" sandbox="allow-scripts allow-same-origin"></iframe></div>' +
          '<div class="modal-actions"><button class="btn btn-ghost" data-close>بستن</button></div>', 'wide');
        m.querySelector('[data-close]').addEventListener('click', closeModal);
      });
    });
  }

  function crudList(opts) {
    layoutShell(pageHead(opts.title, opts.sub,
      '<button class="btn btn-primary" data-add-item>' + esc(opts.addLabel) + '</button>') +
      '<div class="card"><div data-crud-list>در حال بارگذاری...</div></div>');
    appEl.querySelector('[data-add-item]').addEventListener('click', function () {
      opts.editor(null);
    });
    reloadCrud(opts);
  }

  function reloadCrud(opts) {
    api('GET', '/api/admin/' + opts.api).then(function (list) {
      var box = appEl.querySelector('[data-crud-list]');
      if (!box) return;
      if (!list.length) {
        box.innerHTML = '<div style="color:var(--text2);text-align:center;padding:24px">موردی ثبت نشده است</div>';
        return;
      }
      box.innerHTML = list.map(function (it) { return opts.row(it); }).join('');
      box.querySelectorAll('[data-edit]').forEach(function (b) {
        b.addEventListener('click', function () {
          var item = list.filter(function (x) { return x.id === b.getAttribute('data-edit'); })[0];
          opts.editor(item);
        });
      });
      box.querySelectorAll('[data-del]').forEach(function (b) {
        b.addEventListener('click', function () {
          confirmDialog('حذف', 'این مورد برای همیشه حذف می‌شود. مطمئن هستید؟', 'حذف', true).then(function (ok) {
            if (!ok) return;
            api('DELETE', '/api/admin/' + opts.api + '/' + b.getAttribute('data-del')).then(function () {
              toast('حذف شد', 'ok');
              reloadCrud(opts);
            }).catch(function () { toast('خطا در حذف', 'err'); });
          });
        });
      });
    }).catch(function () {});
  }

  function saveItem(apiName, item, cb) {
    var p = item.id && item._existing
      ? api('PUT', '/api/admin/' + apiName + '/' + item.id, item)
      : api('POST', '/api/admin/' + apiName, item);
    p.then(function () {
      toast('ذخیره شد', 'ok');
      closeModal();
      cb();
    }).catch(function () { toast('خطا در ذخیره', 'err'); });
  }

  function renderStories() {
    var opts = {
      title: 'استوری‌ها', sub: 'استوری‌های شبیه اینستاگرام صفحه اصلی — عکس، ویدیو یا محصول',
      addLabel: 'افزودن استوری', api: 'stories',
      row: function (st) {
        return '<div class="item-row">' + thumb(st.media) +
          '<div class="item-main"><div class="item-title">' + esc(st.title) + '</div>' +
          '<div class="item-sub">نوع: ' + (st.type === 'video' ? 'ویدیو' : st.type === 'product' ? 'محصول' : 'عکس') + ' — ترتیب: ' + st.order + '</div></div>' +
          '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-edit="' + esc(st.id) + '">ویرایش</button>' +
          '<button class="btn btn-danger btn-sm" data-del="' + esc(st.id) + '">حذف</button></div></div>';
      },
      editor: function (item) { storyEditor(item, opts); }
    };
    crudList(opts);
  }

  function storyEditor(item, opts) {
    var st = item ? JSON.parse(JSON.stringify(item)) : { id: '', title: '', type: 'image', media: '', caption: '', productId: '', order: 0 };
    st._existing = !!item;
    api('GET', '/api/admin/products').then(function (products) {
      var prodOptions = '<option value="">- انتخاب محصول -</option>' + products.map(function (p) {
        return '<option value="' + esc(p.id) + '"' + (st.productId === p.id ? ' selected' : '') + '>' + esc(p.name) + ' (' + esc(p.code) + ')</option>';
      }).join('');
      var m = modal('<div class="modal-title">' + (item ? 'ویرایش استوری' : 'استوری جدید') + '</div>' +
        '<div class="form-grid">' +
        inputField('عنوان', st.title, 'data-fld="title" maxlength="80"') +
        '<div><label>نوع استوری</label><select data-fld="type">' +
        '<option value="image"' + (st.type === 'image' ? ' selected' : '') + '>عکس</option>' +
        '<option value="video"' + (st.type === 'video' ? ' selected' : '') + '>ویدیو</option>' +
        '<option value="product"' + (st.type === 'product' ? ' selected' : '') + '>محصول</option></select></div>' +
        '<div><label>محصول (برای نوع محصول)</label><select data-fld="productId">' + prodOptions + '</select></div>' +
        inputField('ترتیب نمایش', st.order, 'data-fld="order" type="number" min="0" dir="ltr"') +
        '<div class="full"><label>رسانه (عکس یا ویدیو)</label>' +
        '<div style="display:flex;gap:8px;align-items:center"><span data-media-thumb>' + thumb(st.media) + '</span>' +
        '<input value="' + esc(st.media) + '" data-fld="media" readonly style="flex:1" dir="ltr">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-pick-media>انتخاب / آپلود</button></div></div>' +
        '<div class="full"><label>متن روی استوری</label><textarea data-fld="caption" maxlength="400">' + esc(st.caption) + '</textarea></div>' +
        '</div>' +
        '<div class="modal-actions"><button class="btn btn-primary" data-save>ذخیره</button>' +
        '<button class="btn btn-ghost" data-cancel>انصراف</button></div>');
      bindEditor(m, st, function () { saveItem('stories', st, function () { reloadCrud(opts); }); }, true);
    }).catch(function () {});
  }

  function bindEditor(m, obj, onSave, videoOk) {
    m.querySelectorAll('[data-fld]').forEach(function (inp) {
      var f = function () {
        var k = inp.getAttribute('data-fld');
        if (inp.type === 'checkbox') obj[k] = inp.checked;
        else if (inp.type === 'number') obj[k] = Number(inp.value) || 0;
        else obj[k] = inp.value;
      };
      inp.addEventListener('input', f);
      inp.addEventListener('change', f);
    });
    var pick = m.querySelector('[data-pick-media]');
    if (pick) pick.addEventListener('click', function () {
      pickMedia(function (ref) {
        obj.media = ref;
        var inp = m.querySelector('[data-fld="media"]');
        if (inp) inp.value = ref;
        var th = m.querySelector('[data-media-thumb]');
        if (th) th.innerHTML = thumb(ref);
      }, videoOk);
    });
    m.querySelector('[data-save]').addEventListener('click', onSave);
    m.querySelector('[data-cancel]').addEventListener('click', closeModal);
  }

  function renderServices() {
    var iconOpts = ['camera', 'wifi', 'server', 'support', 'shield'];
    var opts = {
      title: 'خدمات', sub: 'خدماتی که در صفحه اصلی نمایش داده می‌شوند',
      addLabel: 'افزودن خدمت', api: 'services',
      row: function (sv) {
        return '<div class="item-row"><div class="item-main"><div class="item-title">' + esc(sv.title) +
          (sv.enabled ? ' <span class="pill pill-ok">فعال</span>' : ' <span class="pill pill-off">غیرفعال</span>') + '</div>' +
          '<div class="item-sub">' + esc(sv.desc) + '</div></div>' +
          '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-edit="' + esc(sv.id) + '">ویرایش</button>' +
          '<button class="btn btn-danger btn-sm" data-del="' + esc(sv.id) + '">حذف</button></div></div>';
      },
      editor: function (item) {
        var sv = item ? JSON.parse(JSON.stringify(item)) : { id: '', title: '', desc: '', icon: 'server', order: 0, enabled: true };
        sv._existing = !!item;
        var m = modal('<div class="modal-title">' + (item ? 'ویرایش خدمت' : 'خدمت جدید') + '</div>' +
          '<div class="form-grid">' +
          inputField('عنوان', sv.title, 'data-fld="title" maxlength="120"') +
          '<div><label>آیکون</label><select data-fld="icon">' + iconOpts.map(function (ic) {
            return '<option value="' + ic + '"' + (sv.icon === ic ? ' selected' : '') + '>' + ic + '</option>';
          }).join('') + '</select></div>' +
          inputField('ترتیب', sv.order, 'data-fld="order" type="number" min="0" dir="ltr"') +
          '<div>' + switchField('فعال', sv.enabled, 'data-fld="enabled"') + '</div>' +
          '<div class="full"><label>توضیحات</label><textarea data-fld="desc" maxlength="600">' + esc(sv.desc) + '</textarea></div>' +
          '</div><div class="modal-actions"><button class="btn btn-primary" data-save>ذخیره</button>' +
          '<button class="btn btn-ghost" data-cancel>انصراف</button></div>');
        bindEditor(m, sv, function () { saveItem('services', sv, function () { reloadCrud(opts); }); });
      }
    };
    crudList(opts);
  }

  function renderProducts() {
    layoutShell(pageHead('محصولات', 'مدیریت فروشگاه، دسته‌بندی‌ها و محصولات پرفروش',
      '<button class="btn btn-ghost" data-manage-cats>دسته‌بندی‌ها</button>' +
      '<button class="btn btn-primary" data-add-item>افزودن محصول</button>') +
      '<div class="card"><div data-crud-list>در حال بارگذاری...</div></div>');

    var opts = {
      api: 'products',
      row: function (p) {
        return '<div class="item-row">' + thumb(p.image) +
          '<div class="item-main"><div class="item-title">' + esc(p.name) +
          (p.featured ? ' <span class="pill pill-info">پرفروش</span>' : '') + '</div>' +
          '<div class="item-sub">کد: <span class="mono">' + esc(p.code) + '</span></div></div>' +
          '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-edit="' + esc(p.id) + '">ویرایش</button>' +
          '<button class="btn btn-danger btn-sm" data-del="' + esc(p.id) + '">حذف</button></div></div>';
      },
      editor: function (item) { productEditor(item, opts); }
    };
    appEl.querySelector('[data-add-item]').addEventListener('click', function () { opts.editor(null); });
    appEl.querySelector('[data-manage-cats]').addEventListener('click', manageCategories);
    reloadCrud(opts);
  }

  function manageCategories() {
    api('GET', '/api/admin/categories').then(function (cats) {
      var rows = cats.map(function (c) {
        return '<div class="item-row"><div class="item-main"><div class="item-title">' + esc(c.name) + '</div>' +
          '<div class="item-sub mono">' + esc(c.slug) + '</div></div>' +
          '<div class="item-actions"><button class="btn btn-danger btn-sm" data-cdel="' + esc(c.id) + '">حذف</button></div></div>';
      }).join('');
      var m = modal('<div class="modal-title">دسته‌بندی‌ها</div>' + rows +
        '<div class="form-grid" style="margin-top:14px">' +
        inputField('نام دسته جدید', '', 'data-newcat maxlength="100"') +
        inputField('اسلاگ (انگلیسی)', '', 'data-newslug maxlength="100" dir="ltr"') +
        '</div>' +
        '<div class="modal-actions"><button class="btn btn-primary" data-addcat>افزودن دسته</button>' +
        '<button class="btn btn-ghost" data-close>بستن</button></div>');
      m.querySelector('[data-close]').addEventListener('click', closeModal);
      m.querySelector('[data-addcat]').addEventListener('click', function () {
        var name = m.querySelector('[data-newcat]').value.trim();
        if (!name) return;
        api('POST', '/api/admin/categories', { name: name, slug: m.querySelector('[data-newslug]').value.trim() }).then(function () {
          toast('اضافه شد', 'ok');
          manageCategories();
        }).catch(function () { toast('خطا', 'err'); });
      });
      m.querySelectorAll('[data-cdel]').forEach(function (b) {
        b.addEventListener('click', function () {
          api('DELETE', '/api/admin/categories/' + b.getAttribute('data-cdel')).then(function () {
            manageCategories();
          }).catch(function () { toast('خطا', 'err'); });
        });
      });
    }).catch(function () {});
  }

  function productEditor(item, opts) {
    var p = item ? JSON.parse(JSON.stringify(item)) : { id: '', code: '', name: '', desc: '', category: '', image: '', images: [], featured: false, order: 0, tags: [] };
    p._existing = !!item;
    api('GET', '/api/admin/categories').then(function (cats) {
      var catOpts = '<option value="">- بدون دسته -</option>' + cats.map(function (c) {
        return '<option value="' + esc(c.id) + '"' + (p.category === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>';
      }).join('');
      var m = modal('<div class="modal-title">' + (item ? 'ویرایش محصول' : 'محصول جدید') + '</div>' +
        '<div class="form-grid">' +
        inputField('نام محصول', p.name, 'data-fld="name" maxlength="200"') +
        inputField('کد محصول', p.code, 'data-fld="code" maxlength="40" dir="ltr" placeholder="PR-1234"') +
        '<div><label>دسته‌بندی</label><select data-fld="category">' + catOpts + '</select></div>' +
        inputField('ترتیب', p.order, 'data-fld="order" type="number" min="0" dir="ltr"') +
        '<div>' + switchField('نمایش در محصولات پرفروش صفحه اصلی', p.featured, 'data-fld="featured"') + '</div>' +
        inputField('برچسب‌ها (با ویرگول جدا کنید)', (p.tags || []).join('، '), 'data-tags maxlength="300"') +
        '<div class="full"><label>عکس اصلی</label>' +
        '<div style="display:flex;gap:8px;align-items:center"><span data-media-thumb>' + thumb(p.image) + '</span>' +
        '<input value="' + esc(p.image) + '" data-fld="image" readonly style="flex:1" dir="ltr">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-pick-main>انتخاب / آپلود</button></div></div>' +
        '<div class="full"><label>توضیحات</label><textarea data-fld="desc" maxlength="2000">' + esc(p.desc) + '</textarea></div>' +
        '</div><div class="modal-actions"><button class="btn btn-primary" data-save>ذخیره</button>' +
        '<button class="btn btn-ghost" data-cancel>انصراف</button></div>');
      m.querySelector('[data-pick-main]').addEventListener('click', function () {
        pickMedia(function (ref) {
          p.image = ref;
          if (p.images.indexOf(ref) === -1) p.images.push(ref);
          m.querySelector('[data-fld="image"]').value = ref;
          m.querySelector('[data-media-thumb]').innerHTML = thumb(ref);
        }, false);
      });
      var tagsInp = m.querySelector('[data-tags]');
      tagsInp.addEventListener('input', function () {
        p.tags = tagsInp.value.split(/[,،]/).map(function (t) { return t.trim(); }).filter(Boolean);
      });
      bindEditor(m, p, function () { saveItem('products', p, function () { reloadCrud(opts); }); });
    }).catch(function () {});
  }

  function renderProvinces() {
    var opts = {
      title: 'استان‌ها و شهرها', sub: 'استان‌های تحت پوشش — شهرهای فعال به رنگ سبز در سایت نمایش داده می‌شوند',
      addLabel: 'افزودن استان', api: 'provinces',
      row: function (pv) {
        var activeCities = (pv.cities || []).filter(function (c) { return c.active; }).length;
        return '<div class="item-row"><div class="item-main"><div class="item-title">' + esc(pv.name) +
          (pv.allCities ? ' <span class="pill pill-ok">همه شهرها</span>' : '') + '</div>' +
          '<div class="item-sub">' + (pv.cities || []).length + ' شهر — ' + activeCities + ' شهر فعال</div></div>' +
          '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-edit="' + esc(pv.id) + '">ویرایش</button>' +
          '<button class="btn btn-danger btn-sm" data-del="' + esc(pv.id) + '">حذف</button></div></div>';
      },
      editor: function (item) { provinceEditor(item, opts); }
    };
    crudList(opts);
  }

  function provinceEditor(item, opts) {
    var pv = item ? JSON.parse(JSON.stringify(item)) : { id: '', name: '', allCities: false, cities: [] };
    pv._existing = !!item;
    var m = modal('<div class="modal-title">' + (item ? 'ویرایش استان' : 'استان جدید') + '</div>' +
      '<div class="form-grid">' +
      inputField('نام استان', pv.name, 'data-fld="name" maxlength="80"') +
      '<div>' + switchField('پوشش همه شهرهای این استان', pv.allCities, 'data-fld="allCities"') + '</div>' +
      '</div>' +
      '<div style="margin-top:16px"><label>شهرها (کلیک = فعال/غیرفعال، ضربدر = حذف)</label>' +
      '<div class="city-editor" data-cities></div></div>' +
      '<div class="form-grid" style="margin-top:12px">' +
      inputField('نام شهر جدید', '', 'data-newcity maxlength="80"') +
      '<div style="display:flex;align-items:flex-end"><button class="btn btn-ghost" data-addcity>افزودن شهر</button></div>' +
      '</div>' +
      '<div class="modal-actions"><button class="btn btn-primary" data-save>ذخیره</button>' +
      '<button class="btn btn-ghost" data-cancel>انصراف</button></div>');

    function renderCities() {
      var box = m.querySelector('[data-cities]');
      box.innerHTML = pv.cities.map(function (c, i) {
        return '<span class="city-tag' + (c.active ? ' on' : '') + '" data-ct="' + i + '">' + esc(c.name) +
          '<span class="x" data-cx="' + i + '">&times;</span></span>';
      }).join('') || '<span style="color:var(--text2);font-size:0.85em">شهری اضافه نشده</span>';
      box.querySelectorAll('[data-ct]').forEach(function (t) {
        t.addEventListener('click', function (e) {
          if (e.target.hasAttribute('data-cx')) return;
          var i = Number(t.getAttribute('data-ct'));
          pv.cities[i].active = !pv.cities[i].active;
          renderCities();
        });
      });
      box.querySelectorAll('[data-cx]').forEach(function (x) {
        x.addEventListener('click', function () {
          pv.cities.splice(Number(x.getAttribute('data-cx')), 1);
          renderCities();
        });
      });
    }
    renderCities();
    m.querySelector('[data-addcity]').addEventListener('click', function () {
      var name = m.querySelector('[data-newcity]').value.trim();
      if (!name) return;
      pv.cities.push({ name: name, active: true });
      m.querySelector('[data-newcity]').value = '';
      renderCities();
    });
    bindEditor(m, pv, function () { saveItem('provinces', pv, function () { reloadCrud(opts); }); });
  }

  function blocksEditor(container, blocks) {
    function render() {
      container.innerHTML = '<div class="blocks-editor">' + blocks.map(function (b, i) {
        var body = '';
        if (b.type === 'text') body = '<textarea data-bf="' + i + '.text" maxlength="8000" placeholder="متن...">' + esc(b.text || '') + '</textarea>';
        else if (b.type === 'heading') body = '<input data-bf="' + i + '.text" maxlength="300" placeholder="عنوان..." value="' + esc(b.text || '') + '">';
        else if (b.type === 'steps') {
          body = '<input data-bf="' + i + '.title" maxlength="200" placeholder="عنوان مراحل..." value="' + esc(b.title || '') + '" style="margin-bottom:8px">' +
            '<div class="steps-list">' + (b.steps || []).map(function (st, j) {
              return '<div style="display:flex;gap:6px;margin-bottom:6px"><textarea data-bstep="' + i + '.' + j + '" maxlength="600">' + esc(st) + '</textarea>' +
                '<button class="btn btn-danger btn-sm" data-bstep-del="' + i + '.' + j + '">&times;</button></div>';
            }).join('') + '</div>' +
            '<button class="btn btn-ghost btn-sm" data-bstep-add="' + i + '">افزودن قدم</button>';
        } else if (b.type === 'image' || b.type === 'video') {
          body = '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><span data-bthumb="' + i + '">' + thumb(b.src) + '</span>' +
            '<input data-bf="' + i + '.src" readonly value="' + esc(b.src || '') + '" dir="ltr" style="flex:1">' +
            '<button class="btn btn-ghost btn-sm" data-bpick="' + i + '">انتخاب</button></div>' +
            '<input data-bf="' + i + '.caption" maxlength="300" placeholder="توضیح زیر رسانه..." value="' + esc(b.caption || '') + '">';
        }
        var typeName = { text: 'متن', heading: 'عنوان', steps: 'قدم به قدم', image: 'عکس', video: 'ویدیو' }[b.type] || b.type;
        return '<div class="block-item"><div class="block-item-head">' +
          '<span class="block-type-tag">' + typeName + '</span>' +
          '<div class="item-actions">' +
          '<button class="btn btn-ghost btn-sm" data-bup="' + i + '">بالا</button>' +
          '<button class="btn btn-ghost btn-sm" data-bdown="' + i + '">پایین</button>' +
          '<button class="btn btn-danger btn-sm" data-bdel="' + i + '">حذف</button></div></div>' + body + '</div>';
      }).join('') + '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
        '<button class="btn btn-ghost btn-sm" data-badd="text">+ متن</button>' +
        '<button class="btn btn-ghost btn-sm" data-badd="heading">+ عنوان</button>' +
        '<button class="btn btn-ghost btn-sm" data-badd="steps">+ قدم به قدم</button>' +
        '<button class="btn btn-ghost btn-sm" data-badd="image">+ عکس</button>' +
        '<button class="btn btn-ghost btn-sm" data-badd="video">+ ویدیو</button></div>';

      container.querySelectorAll('[data-bf]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var pth = inp.getAttribute('data-bf').split('.');
          blocks[Number(pth[0])][pth[1]] = inp.value;
        });
      });
      container.querySelectorAll('[data-bstep]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var pth = inp.getAttribute('data-bstep').split('.');
          blocks[Number(pth[0])].steps[Number(pth[1])] = inp.value;
        });
      });
      container.querySelectorAll('[data-bstep-del]').forEach(function (b) {
        b.addEventListener('click', function () {
          var pth = b.getAttribute('data-bstep-del').split('.');
          blocks[Number(pth[0])].steps.splice(Number(pth[1]), 1);
          render();
        });
      });
      container.querySelectorAll('[data-bstep-add]').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = Number(b.getAttribute('data-bstep-add'));
          if (!blocks[i].steps) blocks[i].steps = [];
          blocks[i].steps.push('');
          render();
        });
      });
      container.querySelectorAll('[data-bpick]').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = Number(b.getAttribute('data-bpick'));
          pickMedia(function (ref) {
            blocks[i].src = ref;
            render();
          }, blocks[i].type === 'video');
        });
      });
      container.querySelectorAll('[data-bdel]').forEach(function (b) {
        b.addEventListener('click', function () {
          blocks.splice(Number(b.getAttribute('data-bdel')), 1);
          render();
        });
      });
      container.querySelectorAll('[data-bup]').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = Number(b.getAttribute('data-bup'));
          if (i > 0) { var t = blocks[i - 1]; blocks[i - 1] = blocks[i]; blocks[i] = t; render(); }
        });
      });
      container.querySelectorAll('[data-bdown]').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = Number(b.getAttribute('data-bdown'));
          if (i < blocks.length - 1) { var t = blocks[i + 1]; blocks[i + 1] = blocks[i]; blocks[i] = t; render(); }
        });
      });
      container.querySelectorAll('[data-badd]').forEach(function (b) {
        b.addEventListener('click', function () {
          var type = b.getAttribute('data-badd');
          var nb = { id: uid(), type: type };
          if (type === 'steps') { nb.title = ''; nb.steps = ['']; }
          else if (type === 'image' || type === 'video') { nb.src = ''; nb.caption = ''; }
          else nb.text = '';
          blocks.push(nb);
          render();
        });
      });
    }
    render();
  }

  function renderArticles() {
    var opts = {
      title: 'مقالات و آموزش‌ها', sub: 'مقالات با ساختار بلوکی: متن، عنوان، قدم به قدم، عکس و ویدیو',
      addLabel: 'مقاله جدید', api: 'articles',
      row: function (a) {
        return '<div class="item-row">' + thumb(a.cover) +
          '<div class="item-main"><div class="item-title">' + esc(a.title) +
          (a.published ? ' <span class="pill pill-ok">منتشر شده</span>' : ' <span class="pill pill-off">پیش‌نویس</span>') + '</div>' +
          '<div class="item-sub">کد: <span class="mono">' + esc(a.code) + '</span> — موضوع: ' + esc(a.topic) + '</div></div>' +
          '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-edit="' + esc(a.id) + '">ویرایش</button>' +
          '<button class="btn btn-danger btn-sm" data-del="' + esc(a.id) + '">حذف</button></div></div>';
      },
      editor: function (item) { articleEditor(item, opts); }
    };
    crudList(opts);
  }

  function articleEditor(item, opts) {
    var a = item ? JSON.parse(JSON.stringify(item)) : { id: '', code: '', title: '', topic: '', desc: '', cover: '', font: 'vazir', published: true, blocks: [] };
    a._existing = !!item;
    if (!a.blocks) a.blocks = [];
    var m = modal('<div class="modal-title">' + (item ? 'ویرایش مقاله' : 'مقاله جدید') + '</div>' +
      '<div class="form-grid">' +
      inputField('عنوان مقاله', a.title, 'data-fld="title" maxlength="300"') +
      inputField('کد مقاله', a.code, 'data-fld="code" maxlength="40" dir="ltr" placeholder="AR-1234"') +
      inputField('موضوع آموزش', a.topic, 'data-fld="topic" maxlength="120"') +
      '<div>' + switchField('انتشار در سایت', a.published, 'data-fld="published"') + '</div>' +
      '<div class="full"><label>کاور</label>' +
      '<div style="display:flex;gap:8px;align-items:center"><span data-media-thumb>' + thumb(a.cover) + '</span>' +
      '<input value="' + esc(a.cover) + '" data-cover readonly style="flex:1" dir="ltr">' +
      '<button type="button" class="btn btn-ghost btn-sm" data-pick-cover>انتخاب / آپلود</button></div></div>' +
      '<div class="full"><label>توضیحات کوتاه</label><textarea data-fld="desc" maxlength="1000">' + esc(a.desc) + '</textarea></div>' +
      '</div>' +
      '<div style="margin-top:18px"><label style="font-size:1em;margin-bottom:10px">محتوای مقاله (بلوک‌ها)</label>' +
      '<div data-blocks></div></div>' +
      '<div class="modal-actions"><button class="btn btn-primary" data-save>ذخیره مقاله</button>' +
      '<button class="btn btn-ghost" data-cancel>انصراف</button></div>', 'wide');
    m.querySelector('[data-pick-cover]').addEventListener('click', function () {
      pickMedia(function (ref) {
        a.cover = ref;
        m.querySelector('[data-cover]').value = ref;
        m.querySelector('[data-media-thumb]').innerHTML = thumb(ref);
      }, false);
    });
    blocksEditor(m.querySelector('[data-blocks]'), a.blocks);
    bindEditor(m, a, function () { saveItem('articles', a, function () { reloadCrud(opts); }); });
  }

  function renderPortfolio() {
    var opts = {
      title: 'نمونه کارها', sub: 'پروژه‌های اجرا شده — با گالری چند رسانه‌ای و صفحه اختصاصی',
      addLabel: 'نمونه کار جدید', api: 'portfolio',
      row: function (w) {
        return '<div class="item-row">' + thumb(w.cover) +
          '<div class="item-main"><div class="item-title">' + esc(w.title) +
          (w.featuredHome ? ' <span class="pill pill-info">صفحه اصلی</span>' : '') +
          (w.featuredTop ? ' <span class="pill pill-warn">اول لیست</span>' : '') + '</div>' +
          '<div class="item-sub">کد: <span class="mono">' + esc(w.code) + '</span> — ' + (w.media || []).length + ' رسانه</div></div>' +
          '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-edit="' + esc(w.id) + '">ویرایش</button>' +
          '<button class="btn btn-danger btn-sm" data-del="' + esc(w.id) + '">حذف</button></div></div>';
      },
      editor: function (item) { workEditor(item, opts); }
    };
    crudList(opts);
  }

  function workEditor(item, opts) {
    var w = item ? JSON.parse(JSON.stringify(item)) : { id: '', code: '', title: '', category: '', desc: '', cover: '', media: [], featuredHome: false, featuredTop: false, blocks: [] };
    w._existing = !!item;
    if (!w.media) w.media = [];
    if (!w.blocks) w.blocks = [];
    api('GET', '/api/admin/categories').then(function (cats) {
      var catOpts = '<option value="">- بدون دسته -</option>' + cats.map(function (c) {
        return '<option value="' + esc(c.id) + '"' + (w.category === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>';
      }).join('');
      var m = modal('<div class="modal-title">' + (item ? 'ویرایش نمونه کار' : 'نمونه کار جدید') + '</div>' +
        '<div class="form-grid">' +
        inputField('عنوان', w.title, 'data-fld="title" maxlength="300"') +
        inputField('کد نمونه کار', w.code, 'data-fld="code" maxlength="40" dir="ltr" placeholder="WK-1234"') +
        '<div><label>دسته‌بندی</label><select data-fld="category">' + catOpts + '</select></div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;justify-content:flex-end">' +
        switchField('نمایش در صفحه اصلی', w.featuredHome, 'data-fld="featuredHome"') +
        switchField('نمایش اول لیست نمونه کارها', w.featuredTop, 'data-fld="featuredTop"') + '</div>' +
        '<div class="full"><label>کاور</label>' +
        '<div style="display:flex;gap:8px;align-items:center"><span data-media-thumb>' + thumb(w.cover) + '</span>' +
        '<input value="' + esc(w.cover) + '" data-cover readonly style="flex:1" dir="ltr">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-pick-cover>انتخاب / آپلود</button></div></div>' +
        '<div class="full"><label>توضیحات کوتاه</label><textarea data-fld="desc" maxlength="1000">' + esc(w.desc) + '</textarea></div>' +
        '</div>' +
        '<div style="margin-top:16px"><label>گالری عکس و ویدیو</label><div data-wmedia></div>' +
        '<button class="btn btn-ghost btn-sm" data-add-media>افزودن رسانه</button></div>' +
        '<div style="margin-top:18px"><label style="font-size:1em">توضیحات کامل پروژه (بلوک‌ها)</label>' +
        '<div data-blocks></div></div>' +
        '<div class="modal-actions"><button class="btn btn-primary" data-save>ذخیره نمونه کار</button>' +
        '<button class="btn btn-ghost" data-cancel>انصراف</button></div>', 'wide');

      function renderWMedia() {
        var box = m.querySelector('[data-wmedia]');
        box.innerHTML = w.media.map(function (md, i) {
          return '<div class="item-row">' + thumb(md.src) +
            '<div class="item-main"><div class="item-sub mono">' + esc(md.src) + ' (' + md.type + ')</div>' +
            '<input value="' + esc(md.caption || '') + '" data-mcap="' + i + '" maxlength="300" placeholder="توضیح..."></div>' +
            '<div class="item-actions"><button class="btn btn-danger btn-sm" data-mdel="' + i + '">حذف</button></div></div>';
        }).join('') || '<div style="color:var(--text2);font-size:0.85em;padding:8px 0">رسانه‌ای اضافه نشده</div>';
        box.querySelectorAll('[data-mcap]').forEach(function (inp) {
          inp.addEventListener('input', function () {
            w.media[Number(inp.getAttribute('data-mcap'))].caption = inp.value;
          });
        });
        box.querySelectorAll('[data-mdel]').forEach(function (b) {
          b.addEventListener('click', function () {
            w.media.splice(Number(b.getAttribute('data-mdel')), 1);
            renderWMedia();
          });
        });
      }
      renderWMedia();
      m.querySelector('[data-add-media]').addEventListener('click', function () {
        pickMedia(function (ref) {
          w.media.push({ type: /\.(mp4|webm|mov)$/i.test(ref) ? 'video' : 'image', src: ref, caption: '' });
          if (!w.cover) {
            w.cover = ref;
            m.querySelector('[data-cover]').value = ref;
            m.querySelector('[data-media-thumb]').innerHTML = thumb(ref);
          }
          renderWMedia();
        }, true);
      });
      m.querySelector('[data-pick-cover]').addEventListener('click', function () {
        pickMedia(function (ref) {
          w.cover = ref;
          m.querySelector('[data-cover]').value = ref;
          m.querySelector('[data-media-thumb]').innerHTML = thumb(ref);
        }, false);
      });
      blocksEditor(m.querySelector('[data-blocks]'), w.blocks);
      bindEditor(m, w, function () { saveItem('portfolio', w, function () { reloadCrud(opts); }); });
    }).catch(function () {});
  }

  function renderContactAdmin() {
    layoutShell(pageHead('صفحه ارتباط با ما', 'سکشن‌ها و آیکون‌های پیام‌رسان — قابل افزودن، ویرایش و حذف',
      '<button class="btn btn-ghost" data-add-section>افزودن سکشن</button>' +
      '<button class="btn btn-primary" data-save-all>ذخیره تغییرات</button>') +
      '<div data-contact-root></div>');

    var iconOpts = ['telegram', 'whatsapp', 'bale', 'eitaa', 'rubika', 'instagram', 'location', 'phone', 'clock'];
    var iconNames = { telegram: 'تلگرام', whatsapp: 'واتساپ', bale: 'بله', eitaa: 'ایتا', rubika: 'روبیکا', instagram: 'اینستاگرام', location: 'آدرس', phone: 'تلفن', clock: 'ساعت' };
    var root = appEl.querySelector('[data-contact-root]');
    var secs = settings.contactPage.sections;

    function render() {
      root.innerHTML = secs.map(function (cs, i) {
        var items = (cs.items || []).map(function (it, j) {
          return '<div class="item-row"><div class="item-main"><div class="form-grid">' +
            '<div><label>آیکون</label><select data-ci="' + i + '.' + j + '.icon">' + iconOpts.map(function (ic) {
              return '<option value="' + ic + '"' + (it.icon === ic ? ' selected' : '') + '>' + iconNames[ic] + '</option>';
            }).join('') + '</select></div>' +
            inputField('عنوان', it.label, 'data-ci="' + i + '.' + j + '.label" maxlength="80"') +
            inputField('شماره / آیدی / متن', it.value, 'data-ci="' + i + '.' + j + '.value" maxlength="300" dir="ltr"') +
            '<div style="display:flex;align-items:flex-end;padding-bottom:6px">' + switchField('فعال', it.enabled, 'data-ci="' + i + '.' + j + '.enabled"') + '</div>' +
            '</div></div><div class="item-actions"><button class="btn btn-danger btn-sm" data-idel="' + i + '.' + j + '">حذف</button></div></div>';
        }).join('');
        return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px">' +
          '<div style="flex:1;min-width:200px"><div class="form-grid">' +
          inputField('عنوان سکشن', cs.title, 'data-cs="' + i + '.title" maxlength="200"') +
          inputField('زیرعنوان', cs.subtitle, 'data-cs="' + i + '.subtitle" maxlength="300"') +
          '</div></div>' +
          '<div class="item-actions">' + switchField('فعال', cs.enabled, 'data-cs="' + i + '.enabled"') +
          '<button class="btn btn-ghost btn-sm" data-iadd="' + i + '">افزودن آیتم</button>' +
          '<button class="btn btn-danger btn-sm" data-sdel="' + i + '">حذف سکشن</button></div></div>' +
          items + '</div>';
      }).join('');

      root.querySelectorAll('[data-cs]').forEach(function (inp) {
        var f = function () {
          var p = inp.getAttribute('data-cs').split('.');
          secs[Number(p[0])][p[1]] = inp.type === 'checkbox' ? inp.checked : inp.value;
        };
        inp.addEventListener('input', f);
        inp.addEventListener('change', f);
      });
      root.querySelectorAll('[data-ci]').forEach(function (inp) {
        var f = function () {
          var p = inp.getAttribute('data-ci').split('.');
          secs[Number(p[0])].items[Number(p[1])][p[2]] = inp.type === 'checkbox' ? inp.checked : inp.value;
        };
        inp.addEventListener('input', f);
        inp.addEventListener('change', f);
      });
      root.querySelectorAll('[data-iadd]').forEach(function (b) {
        b.addEventListener('click', function () {
          secs[Number(b.getAttribute('data-iadd'))].items.push({ id: uid(), icon: 'telegram', label: 'آیتم جدید', value: '', enabled: true });
          render();
        });
      });
      root.querySelectorAll('[data-idel]').forEach(function (b) {
        b.addEventListener('click', function () {
          var p = b.getAttribute('data-idel').split('.');
          secs[Number(p[0])].items.splice(Number(p[1]), 1);
          render();
        });
      });
      root.querySelectorAll('[data-sdel]').forEach(function (b) {
        b.addEventListener('click', function () {
          confirmDialog('حذف سکشن', 'این سکشن و همه آیتم‌های آن حذف می‌شود؟', 'حذف', true).then(function (ok) {
            if (!ok) return;
            secs.splice(Number(b.getAttribute('data-sdel')), 1);
            render();
          });
        });
      });
    }
    render();

    appEl.querySelector('[data-add-section]').addEventListener('click', function () {
      secs.push({ id: uid(), type: 'custom', enabled: true, title: 'سکشن جدید', subtitle: '', items: [] });
      render();
    });
    appEl.querySelector('[data-save-all]').addEventListener('click', saveSettings);
  }

  function renderMedia() {
    layoutShell(pageHead('رسانه‌ها', 'مدیریت عکس‌ها و ویدیوهای آپلود شده') +
      '<div class="card"><div class="upload-zone" data-upzone>برای آپلود فایل جدید کلیک کنید یا فایل را اینجا رها کنید<input type="file" hidden accept="image/*,video/*" multiple></div></div>' +
      '<div class="card"><div class="media-grid" data-media-grid>در حال بارگذاری...</div></div>');

    var zone = appEl.querySelector('[data-upzone]');
    var fi = zone.querySelector('input');
    zone.addEventListener('click', function () { fi.click(); });
    zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('drag'); });
    zone.addEventListener('dragleave', function () { zone.classList.remove('drag'); });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('drag');
      Array.prototype.slice.call(e.dataTransfer.files).forEach(function (f) {
        uploadFile(f, function () { loadGrid(); });
      });
    });
    fi.addEventListener('change', function () {
      Array.prototype.slice.call(fi.files).forEach(function (f) {
        uploadFile(f, function () { loadGrid(); });
      });
    });

    function loadGrid() {
      api('GET', '/api/admin/media').then(function (r) {
        var grid = appEl.querySelector('[data-media-grid]');
        if (!r.files.length) {
          grid.innerHTML = '<div style="color:var(--text2)">فایلی آپلود نشده است</div>';
          return;
        }
        grid.innerHTML = r.files.map(function (f) {
          var isVid = /\.(mp4|webm|mov)$/i.test(f.name);
          var inner = isVid
            ? '<video src="/m/' + esc(encodeURIComponent(f.name)) + '" muted preload="metadata"></video>'
            : '<img src="/m/' + esc(encodeURIComponent(f.name)) + '" loading="lazy" alt="">';
          return '<div class="media-cell">' + inner +
            '<span class="mc-name">' + esc(f.name) + ' — ' + fmtBytes(f.size) + '</span>' +
            '<button class="mc-del" data-mdel="' + esc(f.name) + '">&times;</button></div>';
        }).join('');
        grid.querySelectorAll('[data-mdel]').forEach(function (b) {
          b.addEventListener('click', function () {
            confirmDialog('حذف فایل', 'فایل ' + b.getAttribute('data-mdel') + ' حذف شود؟', 'حذف', true).then(function (ok) {
              if (!ok) return;
              api('DELETE', '/api/admin/media/' + encodeURIComponent(b.getAttribute('data-mdel'))).then(function () {
                toast('حذف شد', 'ok');
                loadGrid();
              }).catch(function () { toast('خطا در حذف', 'err'); });
            });
          });
        });
      }).catch(function () {});
    }
    loadGrid();
  }

  var BKP_STATE_KEY = 'az_backup_state';

  function renderBackup() {
    layoutShell(pageHead('بکاپ‌گیری کامل', 'بکاپ کامل از تمام محتوا، تنظیمات، آمار، عکس‌ها و ویدیوها — ذخیره روی دستگاه شما') +
      '<div class="card" data-bkp-root>در حال محاسبه حجم بکاپ...</div>');

    var root = appEl.querySelector('[data-bkp-root]');
    var pending = null;
    try { pending = JSON.parse(localStorage.getItem(BKP_STATE_KEY)); } catch (e) {}

    api('GET', '/api/admin/backup/manifest').then(function (man) {
      var supported = typeof window.showDirectoryPicker === 'function';
      root.innerHTML =
        (pending && pending.doneFiles ? '<div class="login-err" style="text-align:right">یک بکاپ ناتمام از قبل وجود دارد (' + pending.doneFiles.length + ' فایل ذخیره شده). با شروع بکاپ جدید در همان پوشه، فایل‌های قبلی دوباره دانلود نمی‌شوند و بکاپ ادامه پیدا می‌کند.</div>' : '') +
        '<div class="kpi-grid">' +
        '<div class="kpi"><div class="kpi-val">' + fmtBytes(man.totalSize) + '</div><div class="kpi-label">حجم تقریبی بکاپ</div></div>' +
        '<div class="kpi"><div class="kpi-val">' + man.files.length + '</div><div class="kpi-label">تعداد فایل رسانه</div></div>' +
        '<div class="kpi"><div class="kpi-val">' + fmtBytes(man.dbSize + man.trackSize) + '</div><div class="kpi-label">حجم داده‌ها و آمار</div></div>' +
        '</div>' +
        '<div class="form-grid" style="margin-bottom:16px">' +
        inputField('نام بکاپ', (pending && pending.name) || 'azadi_network_Bac', 'data-bkp-name maxlength="80" dir="ltr"') +
        '</div>' +
        (supported
          ? '<p style="color:var(--text2);font-size:0.87em;margin-bottom:14px">با زدن دکمه، مرورگر از شما مسیر ذخیره روی دستگاه را می‌پرسد. اگر پوشه‌ای با همین نام وجود داشته باشد، به صورت خودکار شماره‌گذاری می‌شود (azadi_network_Bac_1 و بالاتر). اگر اینترنت قطع شود، بکاپ از همان‌جا قابل ادامه است.'
          : '<p style="color:var(--text2);font-size:0.87em;margin-bottom:14px">مرورگر شما از انتخاب پوشه پشتیبانی نمی‌کند؛ بکاپ به صورت یک فایل کامل دانلود می‌شود. برای انتخاب مسیر و بکاپ قابل ادامه، از مرورگر Chrome یا Edge استفاده کنید.') + '</p>' +
        '<div class="page-head-actions">' +
        '<button class="btn btn-primary" data-bkp-start>بکاپ کامل</button>' +
        (pending ? '<button class="btn btn-ghost" data-bkp-clearstate>حذف وضعیت بکاپ ناتمام</button>' : '') +
        '</div>' +
        '<div class="progress-wrap" data-bkp-prog hidden>' +
        '<div class="progress-track"><div class="progress-fill" style="width:0%"></div></div>' +
        '<div class="progress-label"><span data-bkp-status>آماده...</span><span data-bkp-pct>0%</span></div></div>';

      var clearBtn = root.querySelector('[data-bkp-clearstate]');
      if (clearBtn) clearBtn.addEventListener('click', function () {
        localStorage.removeItem(BKP_STATE_KEY);
        renderBackup();
      });

      root.querySelector('[data-bkp-start]').addEventListener('click', function () {
        var name = (root.querySelector('[data-bkp-name]').value.trim() || 'azadi_network_Bac').replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, '_');
        confirmDialog('شروع بکاپ کامل',
          'آیا مطمئن هستید که می‌خواهید بکاپ بگیرید؟ حجم تقریبی بکاپ: ' + fmtBytes(man.totalSize),
          'شروع بکاپ').then(function (ok) {
          if (!ok) return;
          if (supported) startFolderBackup(name, man);
          else startFileBackup(name, man);
        });
      });
    }).catch(function () {
      root.innerHTML = '<div style="color:var(--danger)">خطا در دریافت اطلاعات بکاپ</div>';
    });
  }

  function bkpProgress(pct, status) {
    var prog = appEl.querySelector('[data-bkp-prog]');
    if (!prog) return;
    prog.hidden = false;
    prog.querySelector('.progress-fill').style.width = pct + '%';
    var st = appEl.querySelector('[data-bkp-status]');
    var pc = appEl.querySelector('[data-bkp-pct]');
    if (st) st.textContent = status;
    if (pc) pc.textContent = pct + '%';
  }

  function uniqueDirName(parent, base) {
    return parent.getDirectoryHandle(base, { create: false }).then(function () {
      var tryNext = function (n) {
        var nm = base + '_' + n;
        return parent.getDirectoryHandle(nm, { create: false }).then(function () {
          return tryNext(n + 1);
        }).catch(function () { return nm; });
      };
      return tryNext(1);
    }).catch(function () { return base; });
  }

  function startFolderBackup(name, man) {
    var pending = null;
    try { pending = JSON.parse(localStorage.getItem(BKP_STATE_KEY)); } catch (e) {}
    var doneFiles = (pending && pending.name === name && pending.doneFiles) || [];

    window.showDirectoryPicker({ mode: 'readwrite' }).then(function (parent) {
      var dirNameP = doneFiles.length && pending.dirName
        ? parent.getDirectoryHandle(pending.dirName, { create: false }).then(function () { return pending.dirName; }).catch(function () { return uniqueDirName(parent, name); })
        : uniqueDirName(parent, name);

      dirNameP.then(function (dirName) {
        return parent.getDirectoryHandle(dirName, { create: true }).then(function (dir) {
          return runFolderBackup(dir, dirName, name, man, doneFiles);
        });
      }).catch(function (e) {
        toast('بکاپ متوقف شد: ' + (e && e.message ? e.message : 'خطا'), 'err');
      });
    }).catch(function () {});
  }

  function runFolderBackup(dir, dirName, name, man, doneFiles) {
    var files = man.files;
    var total = files.length + 1;
    var idx = 0;

    function saveState() {
      try {
        localStorage.setItem(BKP_STATE_KEY, JSON.stringify({ name: name, dirName: dirName, doneFiles: doneFiles, ts: Date.now() }));
      } catch (e) {}
    }

    function writeFile(handleDir, fname, blob) {
      return handleDir.getFileHandle(fname, { create: true }).then(function (fh) {
        return fh.createWritable();
      }).then(function (ws) {
        return ws.write(blob).then(function () { return ws.close(); });
      });
    }

    bkpProgress(0, 'شروع بکاپ...');

    return api('GET', '/api/admin/backup/db').then(function (dbData) {
      return writeFile(dir, 'azadi_backup.json', new Blob([JSON.stringify(dbData)], { type: 'application/json' })).then(function () {
        idx = 1;
        bkpProgress(Math.round(idx / total * 100), 'داده‌ها ذخیره شد');
        return dir.getDirectoryHandle('uploads', { create: true });
      });
    }).then(function (updir) {
      var chain = Promise.resolve();
      files.forEach(function (f) {
        chain = chain.then(function () {
          if (doneFiles.indexOf(f.name) !== -1) {
            idx++;
            bkpProgress(Math.round(idx / total * 100), 'رد شد (قبلا ذخیره شده): ' + f.name);
            return;
          }
          bkpProgress(Math.round(idx / total * 100), 'در حال دانلود: ' + f.name);
          return fetch('/api/admin/backup/file/' + encodeURIComponent(f.name), { headers: { 'X-CSRF': csrf } })
            .then(function (r) {
              if (!r.ok) throw new Error('دانلود ناموفق: ' + f.name);
              return r.blob();
            }).then(function (blob) {
              return writeFile(updir, f.name, blob);
            }).then(function () {
              doneFiles.push(f.name);
              saveState();
              idx++;
              bkpProgress(Math.round(idx / total * 100), 'ذخیره شد: ' + f.name);
            });
        });
      });
      return chain;
    }).then(function () {
      localStorage.removeItem(BKP_STATE_KEY);
      bkpProgress(100, 'بکاپ کامل شد');
      if (settings.notifications && settings.notifications.backup !== false) {
        toast('بکاپ با موفقیت در پوشه ' + dirName + ' ذخیره شد', 'ok');
      }
    }).catch(function (e) {
      saveState();
      bkpProgress(Math.round(idx / total * 100), 'قطع شد — با ورود بعدی قابل ادامه است');
      toast('بکاپ ناتمام ماند: ' + (e && e.message ? e.message : 'اتصال قطع شد') + ' — دوباره بکاپ بگیرید تا ادامه یابد', 'err');
    });
  }

  function startFileBackup(name, man) {
    bkpProgress(5, 'در حال ساخت فایل بکاپ...');
    api('GET', '/api/admin/backup/db').then(function (dbData) {
      var files = man.files;
      var total = files.length;
      var idx = 0;
      var mediaData = {};
      var chain = Promise.resolve();
      files.forEach(function (f) {
        chain = chain.then(function () {
          bkpProgress(5 + Math.round(idx / Math.max(total, 1) * 85), 'دانلود: ' + f.name);
          return fetch('/api/admin/backup/file/' + encodeURIComponent(f.name), { headers: { 'X-CSRF': csrf } })
            .then(function (r) { return r.blob(); })
            .then(function (blob) {
              return new Promise(function (resolve) {
                var fr = new FileReader();
                fr.onload = function () { mediaData[f.name] = fr.result; resolve(); };
                fr.onerror = function () { resolve(); };
                fr.readAsDataURL(blob);
              });
            }).then(function () { idx++; });
        });
      });
      return chain.then(function () {
        dbData.mediaBase64 = mediaData;
        var blob = new Blob([JSON.stringify(dbData)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name + '.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
        bkpProgress(100, 'بکاپ کامل شد');
        toast('فایل بکاپ دانلود شد', 'ok');
      });
    }).catch(function () {
      toast('خطا در بکاپ‌گیری', 'err');
    });
  }

  function renderRestore() {
    layoutShell(pageHead('بازگردانی بکاپ', 'بازگردانی کامل و دقیق تمام محتوا، عکس‌ها، ویدیوها و تنظیمات از بکاپ قبلی') +
      '<div class="card">' +
      '<p style="color:var(--text2);font-size:0.9em;margin-bottom:16px">پوشه بکاپ (شامل azadi_backup.json و پوشه uploads) یا فایل بکاپ تکی (json.) را انتخاب کنید. همه چیز دقیقا سر جای خود بازگردانده می‌شود.</p>' +
      '<div class="page-head-actions" style="margin-bottom:16px">' +
      (typeof window.showDirectoryPicker === 'function' ? '<button class="btn btn-primary" data-rst-folder>انتخاب پوشه بکاپ</button>' : '') +
      '<button class="btn btn-ghost" data-rst-file>انتخاب فایل بکاپ (json.)</button>' +
      '<input type="file" hidden accept="application/json,.json" data-rst-input></div>' +
      '<div class="progress-wrap" data-bkp-prog hidden>' +
      '<div class="progress-track"><div class="progress-fill" style="width:0%"></div></div>' +
      '<div class="progress-label"><span data-bkp-status></span><span data-bkp-pct>0%</span></div></div>' +
      '</div>');

    var fbtn = appEl.querySelector('[data-rst-folder]');
    if (fbtn) fbtn.addEventListener('click', function () {
      window.showDirectoryPicker().then(function (dir) {
        confirmDialog('بازگردانی بکاپ', 'تمام اطلاعات فعلی سایت با محتوای بکاپ جایگزین می‌شود. ادامه می‌دهید؟', 'بازگردانی', true).then(function (ok) {
          if (ok) restoreFromFolder(dir);
        });
      }).catch(function () {});
    });
    var input = appEl.querySelector('[data-rst-input]');
    appEl.querySelector('[data-rst-file]').addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () {
      if (!input.files.length) return;
      confirmDialog('بازگردانی بکاپ', 'تمام اطلاعات فعلی سایت با محتوای بکاپ جایگزین می‌شود. ادامه می‌دهید؟', 'بازگردانی', true).then(function (ok) {
        if (ok) restoreFromFile(input.files[0]);
      });
    });
  }

  function restoreFromFolder(dir) {
    bkpProgress(2, 'خواندن فایل داده‌ها...');
    dir.getFileHandle('azadi_backup.json').then(function (fh) {
      return fh.getFile();
    }).then(function (file) {
      return file.text();
    }).then(function (txt) {
      var data = JSON.parse(txt);
      return api('POST', '/api/admin/restore/begin', {}).then(function (r) {
        var rid = r.rid;
        return dir.getDirectoryHandle('uploads', { create: false }).then(function (updir) {
          var entries = [];
          var it = updir.entries();
          function collect() {
            return it.next().then(function (res) {
              if (res.done) return entries;
              if (res.value[1].kind === 'file') entries.push(res.value[1]);
              return collect();
            });
          }
          return collect();
        }).catch(function () { return []; }).then(function (entries) {
          var idx = 0;
          var total = entries.length + 1;
          var chain = Promise.resolve();
          entries.forEach(function (fh2) {
            chain = chain.then(function () {
              bkpProgress(Math.round(idx / total * 90), 'آپلود: ' + fh2.name);
              return fh2.getFile().then(function (f) {
                return fetch('/api/admin/restore/file', {
                  method: 'POST',
                  headers: { 'X-CSRF': csrf, 'X-Restore-Id': rid, 'X-File-Name': fh2.name, 'Content-Type': 'application/octet-stream' },
                  body: f
                }).then(function (r2) {
                  if (!r2.ok) throw new Error('آپلود ناموفق: ' + fh2.name);
                  idx++;
                });
              });
            });
          });
          return chain.then(function () {
            bkpProgress(95, 'ثبت نهایی داده‌ها...');
            return commitRestore(data, rid);
          });
        });
      });
    }).then(function () {
      bkpProgress(100, 'بازگردانی کامل شد');
      toast('بکاپ با موفقیت بازگردانی شد', 'ok');
      loadSettings().then(function () {});
    }).catch(function (e) {
      toast('خطا در بازگردانی: ' + (e && e.message ? e.message : ''), 'err');
    });
  }

  function commitRestore(data, rid) {
    return fetch('/api/admin/restore/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF': csrf, 'X-Restore-Id': rid },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) throw new Error('ثبت نهایی ناموفق بود');
      return r.json();
    });
  }

  function restoreFromFile(file) {
    bkpProgress(5, 'خواندن فایل بکاپ...');
    file.text().then(function (txt) {
      var data = JSON.parse(txt);
      return api('POST', '/api/admin/restore/begin', {}).then(function (r) {
        var rid = r.rid;
        var media = data.mediaBase64 || {};
        var names = Object.keys(media);
        var idx = 0;
        var chain = Promise.resolve();
        names.forEach(function (nm) {
          chain = chain.then(function () {
            bkpProgress(5 + Math.round(idx / Math.max(names.length, 1) * 85), 'آپلود: ' + nm);
            var b64 = media[nm].split(',')[1] || '';
            var bin = atob(b64);
            var arr = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            return fetch('/api/admin/restore/file', {
              method: 'POST',
              headers: { 'X-CSRF': csrf, 'X-Restore-Id': rid, 'X-File-Name': nm, 'Content-Type': 'application/octet-stream' },
              body: arr
            }).then(function () { idx++; });
          });
        });
        return chain.then(function () {
          delete data.mediaBase64;
          bkpProgress(95, 'ثبت نهایی...');
          return commitRestore(data, rid);
        });
      });
    }).then(function () {
      bkpProgress(100, 'بازگردانی کامل شد');
      toast('بکاپ با موفقیت بازگردانی شد', 'ok');
      loadSettings().then(function () {});
    }).catch(function (e) {
      toast('خطا در بازگردانی: ' + (e && e.message ? e.message : 'فایل نامعتبر'), 'err');
    });
  }

  function renderSettingsView() {
    var s = settings;
    layoutShell(pageHead('تنظیمات', 'تنظیمات کلی سایت، لوگو، تم، فونت، اعلان‌ها و امنیت',
      '<button class="btn btn-primary" data-save-all>ذخیره تغییرات</button>') +
      '<div class="card"><div class="card-title">هویت سایت</div><div class="form-grid">' +
      inputField('نام سایت (فارسی)', s.siteName, 'data-s="siteName" maxlength="100"') +
      inputField('نام سایت (انگلیسی)', s.siteNameEn, 'data-s="siteNameEn" maxlength="100" dir="ltr"') +
      inputField('شعار', s.tagline, 'data-s="tagline" maxlength="200"') +
      inputField('متن لوگو (۲ حرف)', s.logoText, 'data-s="logoText" maxlength="40"') +
      '<div class="full"><label>لوگوی تصویری (اختیاری — جایگزین متن لوگو)</label>' +
      '<div style="display:flex;gap:8px;align-items:center"><span data-media-thumb>' + thumb(s.logoImage) + '</span>' +
      '<input value="' + esc(s.logoImage || '') + '" data-logo readonly style="flex:1" dir="ltr">' +
      '<button type="button" class="btn btn-ghost btn-sm" data-pick-logo>انتخاب</button>' +
      '<button type="button" class="btn btn-danger btn-sm" data-clear-logo>حذف لوگو</button></div></div>' +
      '</div></div>' +
      '<div class="card"><div class="card-title">ظاهر</div><div class="form-grid">' +
      '<div><label>تم پیش‌فرض سایت</label><select data-s="theme">' +
      '<option value="dark"' + (s.theme === 'dark' ? ' selected' : '') + '>دارک (تیره)</option>' +
      '<option value="light"' + (s.theme === 'light' ? ' selected' : '') + '>لایت (روشن)</option></select></div>' +
      '<div><label>اندازه فونت سایت (' + s.fontScale + '%)</label><input type="range" min="80" max="130" step="5" value="' + s.fontScale + '" data-s="fontScale"></div>' +
      '</div></div>' +
      '<div class="card"><div class="card-title">تنظیمات اعلان</div>' +
      '<p style="color:var(--text2);font-size:0.85em;margin-bottom:14px">انتخاب کنید چه رویدادهایی به شما اعلان داده شود</p>' +
      '<div class="form-grid">' +
      '<div>' + switchField('اعلان بکاپ‌گیری', s.notifications.backup, 'data-n="backup"') + '</div>' +
      '<div>' + switchField('اعلان بازگردانی', s.notifications.restore, 'data-n="restore"') + '</div>' +
      '<div>' + switchField('اعلان تغییر محتوا', s.notifications.content, 'data-n="content"') + '</div>' +
      '<div>' + switchField('اعلان ترکینگ', s.notifications.tracking, 'data-n="tracking"') + '</div>' +
      '</div></div>' +
      '<div class="card"><div class="card-title">تغییر رمز عبور</div><div class="form-grid">' +
      '<div><label>رمز فعلی</label><input type="password" data-pw-cur autocomplete="new-password"></div>' +
      '<div><label>رمز جدید (حداقل ۶ کاراکتر)</label><input type="password" data-pw-new autocomplete="new-password"></div>' +
      '<div style="display:flex;align-items:flex-end"><button class="btn btn-ghost" data-pw-save>تغییر رمز</button></div>' +
      '</div></div>');

    appEl.querySelectorAll('[data-s]').forEach(function (inp) {
      var f = function () {
        var k = inp.getAttribute('data-s');
        s[k] = inp.type === 'range' ? Number(inp.value) : inp.value;
      };
      inp.addEventListener('input', f);
      inp.addEventListener('change', f);
    });
    appEl.querySelectorAll('[data-n]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        s.notifications[inp.getAttribute('data-n')] = inp.checked;
      });
    });
    appEl.querySelector('[data-pick-logo]').addEventListener('click', function () {
      pickMedia(function (ref) {
        s.logoImage = ref;
        appEl.querySelector('[data-logo]').value = ref;
        appEl.querySelector('[data-media-thumb]').innerHTML = thumb(ref);
      }, false);
    });
    appEl.querySelector('[data-clear-logo]').addEventListener('click', function () {
      s.logoImage = '';
      appEl.querySelector('[data-logo]').value = '';
      appEl.querySelector('[data-media-thumb]').innerHTML = thumb('');
    });
    appEl.querySelector('[data-save-all]').addEventListener('click', saveSettings);
    appEl.querySelector('[data-pw-save]').addEventListener('click', function () {
      var cur = appEl.querySelector('[data-pw-cur]').value;
      var nw = appEl.querySelector('[data-pw-new]').value;
      if (nw.length < 6) { toast('رمز جدید حداقل ۶ کاراکتر باشد', 'err'); return; }
      api('POST', '/api/admin/password', { current: cur, next: nw }).then(function () {
        toast('رمز عبور تغییر کرد', 'ok');
        appEl.querySelector('[data-pw-cur]').value = '';
        appEl.querySelector('[data-pw-new]').value = '';
      }).catch(function (e) {
        toast(e.code === 'invalid_credentials' ? 'رمز فعلی اشتباه است' : 'خطا در تغییر رمز', 'err');
      });
    });
  }

  function renderView() {
    closeModal();
    if (view === 'dashboard') renderDashboard();
    else if (view === 'visitors') renderVisitors();
    else if (view === 'content') renderContent();
    else if (view === 'stories') renderStories();
    else if (view === 'services') renderServices();
    else if (view === 'products') renderProducts();
    else if (view === 'provinces') renderProvinces();
    else if (view === 'articles') renderArticles();
    else if (view === 'portfolio') renderPortfolio();
    else if (view === 'contact') renderContactAdmin();
    else if (view === 'media') renderMedia();
    else if (view === 'backup') renderBackup();
    else if (view === 'restore') renderRestore();
    else if (view === 'settings') renderSettingsView();
    else renderDashboard();
  }

  function boot(afterLogin) {
    if (afterLogin) {
      loadSettings().then(function () { renderView(); }).catch(function () {});
      return;
    }
    api('GET', '/api/admin/me').then(function (r) {
      csrf = r.csrf;
      return loadSettings();
    }).then(function () {
      renderView();
    }).catch(function () {});
  }

  boot();
})();