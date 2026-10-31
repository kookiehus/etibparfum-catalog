/* ETIB FX — общий слой эффектов (без библиотек, работает офлайн).
   window.EtibFX: scan, tap, enableGyro, count, ring, bars, radar, bottle3D, aurora.
   Атрибуты: data-tilt, data-depth, data-reveal, data-count, data-ripple, data-haptic. */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.EtibFX && window.EtibFX.__fx) return; // загружен дважды — ничего не делаем

  var doc = document;
  var root = doc.documentElement;
  var FX = { __fx: true, version: '1.0.0', lastError: null };
  window.EtibFX = FX;

  function note(e) { FX.lastError = e; }
  function safe(fn) {
    return function () {
      try { return fn.apply(this, arguments); } catch (e) { note(e); return undefined; }
    };
  }
  function mq(q) { try { return window.matchMedia(q); } catch (e) { return { matches: false }; } }
  var reducedMQ = mq('(prefers-reduced-motion: reduce)');
  function reduced() { return !!reducedMQ.matches; }
  var coarse = mq('(pointer: coarse)').matches;
  var raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function (f) { return setTimeout(function () { f(Date.now()); }, 16); };
  var caf = window.cancelAnimationFrame ? window.cancelAnimationFrame.bind(window) : clearTimeout;
  var hasIO = 'IntersectionObserver' in window;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } return null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function el(x) { return typeof x === 'string' ? doc.querySelector(x) : x; }
  function ensureRel(node) {
    try { if (getComputedStyle(node).position === 'static') node.classList.add('fx-rel'); } catch (e) { /* ignore */ }
  }
  function onVisible(node, cb, threshold) {
    if (!hasIO || reduced()) { cb(); return; }
    var io = new IntersectionObserver(function (ents) {
      for (var i = 0; i < ents.length; i++) {
        if (ents[i].isIntersecting) { io.disconnect(); safe(cb)(); return; }
      }
    }, { threshold: threshold || 0.25 });
    io.observe(node);
  }

  /* ---------- числа по-русски ---------- */
  var fmtCache = {};
  function fmt(n, dec) {
    dec = dec || 0;
    var f = fmtCache[dec];
    if (!f) {
      try { f = fmtCache[dec] = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
      catch (e) { f = fmtCache[dec] = { format: function (x) { return x.toFixed(dec).replace('.', ','); } }; }
    }
    return f.format(n);
  }
  FX.format = safe(fmt);

  /* ---------- вибро-отклик ---------- */
  FX.tap = safe(function (ms) {
    if (store('etibfx-haptic') === 'off') return false;
    if (navigator.vibrate) { try { return navigator.vibrate(ms || 8); } catch (e) { return false; } }
    return false;
  });
  FX.haptics = safe(function (on) { store('etibfx-haptic', on ? 'on' : 'off'); });

  /* =====================================================================
     1. 3D-наклон [data-tilt="макс. градусов"], [data-depth="N"], data-glare="off"
     ===================================================================== */
  var tilts = [];          // состояния
  var tiltLoop = 0;
  var gyro = { on: false, bx: null, by: null, gx: 0, gy: 0, listening: false };
  var tiltIO = hasIO ? new IntersectionObserver(function (ents) {
    ents.forEach(function (en) { if (en.target.__fxTilt) en.target.__fxTilt.vis = en.isIntersecting; });
  }) : null;

  function tiltFrame() {
    tiltLoop = 0;
    var busy = false;
    for (var i = 0; i < tilts.length; i++) {
      var t = tilts[i];
      if (!t.node.isConnected) continue;
      var tx = t.tx, ty = t.ty, tg = t.tg;
      if (!t.hover && gyro.on && t.vis) { tx = gyro.gx; ty = gyro.gy; tg = 0.55; }
      var k = 0.14;
      t.x += (tx - t.x) * k; t.y += (ty - t.y) * k; t.g += (tg - t.g) * 0.12;
      var moving = Math.abs(tx - t.x) > 0.002 || Math.abs(ty - t.y) > 0.002 || Math.abs(tg - t.g) > 0.01;
      if (moving) busy = true;
      var settled = !moving && Math.abs(t.x) < 0.003 && Math.abs(t.y) < 0.003;
      var s = t.node.style;
      if (settled && !t.hover) {
        if (t.live) { t.live = false; t.node.classList.remove('fx-live'); s.setProperty('--fx-go', '0'); }
        continue;
      }
      if (!t.live) { t.live = true; t.node.classList.add('fx-live'); }
      s.setProperty('--fx-rx', (-t.y * t.max).toFixed(2) + 'deg');
      s.setProperty('--fx-ry', (t.x * t.max).toFixed(2) + 'deg');
      s.setProperty('--fx-dx', (t.x * 6).toFixed(2) + 'px');
      s.setProperty('--fx-dy', (t.y * 6).toFixed(2) + 'px');
      if (t.glare) {
        s.setProperty('--fx-gx', (50 + t.x * 50).toFixed(1) + '%');
        s.setProperty('--fx-gy', (50 + t.y * 50).toFixed(1) + '%');
        s.setProperty('--fx-go', t.g.toFixed(3));
      }
    }
    if (busy) kickTilt();
  }
  function kickTilt() { if (!tiltLoop) tiltLoop = raf(tiltFrame); }

  function initTilt(node) {
    if (node.__fxTilt || reduced()) return;
    var max = parseFloat(node.getAttribute('data-tilt'));
    var t = { node: node, max: isFinite(max) && max > 0 ? max : 8, x: 0, y: 0, tx: 0, ty: 0, g: 0, tg: 0, hover: false, live: false, vis: !tiltIO, glare: node.getAttribute('data-glare') !== 'off' };
    node.__fxTilt = t;
    node.classList.add('fx-tilt');
    ensureRel(node);
    if (t.glare && !node.querySelector(':scope > .fx-glare')) {
      var g = doc.createElement('span'); g.className = 'fx-glare'; g.setAttribute('aria-hidden', 'true'); node.appendChild(g);
    }
    var deps = node.querySelectorAll('[data-depth]');
    for (var i = 0; i < deps.length; i++) deps[i].style.setProperty('--fx-d', parseFloat(deps[i].getAttribute('data-depth')) || 1);
    var rect = null;
    node.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' || e.pointerType === 'pen') { rect = node.getBoundingClientRect(); t.hover = true; t.tg = 1; } }, { passive: true });
    node.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' && gyro.on) return;
      if (!rect || e.pointerType === 'touch') rect = node.getBoundingClientRect();
      t.hover = true; t.tg = 1;
      t.tx = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      t.ty = clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
      kickTilt();
    }, { passive: true });
    function leave() { rect = null; t.hover = false; t.tx = 0; t.ty = 0; t.tg = 0; kickTilt(); }
    node.addEventListener('pointerleave', leave, { passive: true });
    node.addEventListener('pointercancel', leave, { passive: true });
    node.addEventListener('pointerup', function (e) { if (e.pointerType === 'touch') leave(); }, { passive: true });
    tilts.push(t);
    if (tiltIO) tiltIO.observe(node);
    if (gyro.on) kickTilt();
  }

  // гироскоп: базовая линия плавно подстраивается под то, как держат телефон
  function onOrient(e) {
    if (e.beta == null || e.gamma == null) return;
    var b = e.beta, g = e.gamma;
    if (gyro.bx === null) { gyro.bx = g; gyro.by = b; }
    gyro.bx += (g - gyro.bx) * 0.02; gyro.by += (b - gyro.by) * 0.02;
    gyro.gx = clamp((g - gyro.bx) / 18, -1, 1);
    gyro.gy = clamp((b - gyro.by) / 18, -1, 1);
    if (!gyro.on) { gyro.on = true; }
    kickTilt();
  }
  function listenGyro(on) {
    if (on === gyro.listening) return;
    gyro.listening = on;
    if (on) window.addEventListener('deviceorientation', onOrient, { passive: true });
    else { window.removeEventListener('deviceorientation', onOrient); gyro.on = false; gyro.bx = null; }
  }
  var gyroAsked = false;
  /* Включить гироскоп. На iOS вызывать только из обработчика нажатия. Возвращает Promise<boolean>. */
  FX.enableGyro = function () {
    try {
      if (reduced() || !('DeviceOrientationEvent' in window)) return Promise.resolve(false);
      var D = window.DeviceOrientationEvent;
      if (typeof D.requestPermission === 'function') {
        if (store('etibfx-gyro') === 'denied') return Promise.resolve(false);
        return D.requestPermission().then(function (r) {
          store('etibfx-gyro', r === 'granted' ? 'granted' : 'denied');
          if (r === 'granted') { listenGyro(true); return true; }
          return false;
        }).catch(function () { return false; });
      }
      listenGyro(true);
      return Promise.resolve(true);
    } catch (e) { note(e); return Promise.resolve(false); }
  };
  function autoGyro() {
    if (!coarse || reduced() || !('DeviceOrientationEvent' in window)) return;
    var D = window.DeviceOrientationEvent;
    // iOS: разрешение спросим один раз — при первом нажатии на карточку с наклоном (см. click ниже)
    if (typeof D.requestPermission === 'function') return;
    listenGyro(true);
  }
  doc.addEventListener('visibilitychange', function () {
    if (gyro.listening || gyro.on) {
      if (doc.hidden) { window.removeEventListener('deviceorientation', onOrient); }
      else { window.addEventListener('deviceorientation', onOrient, { passive: true }); }
    }
  });

  /* =====================================================================
     2. Появление при прокрутке [data-reveal] = rise | fade | zoom | left | right | stagger
        data-reveal-delay="мс"
     ===================================================================== */
  var revealIO = (hasIO) ? new IntersectionObserver(function (ents) {
    for (var i = 0; i < ents.length; i++) {
      if (ents[i].isIntersecting) { ents[i].target.classList.add('fx-in'); revealIO.unobserve(ents[i].target); }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;

  function initReveal(node) {
    if (node.__fxRev) { if (node.getAttribute('data-reveal') === 'stagger') indexKids(node); return; }
    node.__fxRev = 1;
    var d = parseFloat(node.getAttribute('data-reveal-delay'));
    if (isFinite(d)) node.style.setProperty('--fx-delay', d + 'ms');
    if (node.getAttribute('data-reveal') === 'stagger') indexKids(node);
    if (!revealIO || reduced()) node.classList.add('fx-in');
    else revealIO.observe(node);
  }
  function indexKids(node) {
    var kids = node.children;
    for (var i = 0; i < kids.length; i++) if (!kids[i].style.getPropertyValue('--fx-i')) kids[i].style.setProperty('--fx-i', Math.min(i, 12));
  }

  /* =====================================================================
     3. Счётчики [data-count="1234.5"] data-suffix=" ₽" data-prefix data-decimals data-duration
     ===================================================================== */
  function countTo(node, to, opts) {
    opts = opts || {};
    var dec = opts.decimals != null ? opts.decimals : ((String(to).split('.')[1] || '').length);
    var pre = opts.prefix || '', suf = opts.suffix || '';
    var from = opts.from || 0;
    var dur = opts.duration || 1200;
    var finalTxt = pre + fmt(to, dec) + suf;
    if (reduced() || dur <= 0) { node.textContent = finalTxt; return; }
    // резервируем ширину, чтобы текст не прыгал
    node.textContent = finalTxt;
    var w = node.getBoundingClientRect().width;
    if (w) node.style.minWidth = Math.ceil(w) + 'px';
    node.classList.add('fx-counting');
    var t0 = 0;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      node.textContent = p >= 1 ? finalTxt : pre + fmt(from + (to - from) * e, dec) + suf;
      if (p < 1) raf(step); else node.classList.remove('fx-counting');
    }
    raf(step);
  }
  function initCount(node) {
    if (node.__fxCount) return;
    node.__fxCount = 1;
    var to = parseFloat(String(node.getAttribute('data-count')).replace(',', '.').replace(/\s/g, ''));
    if (!isFinite(to)) return;
    var a = node.getAttribute.bind(node);
    var decAttr = a('data-decimals');
    var opts = {
      prefix: a('data-prefix') || '', suffix: a('data-suffix') || '',
      decimals: decAttr != null ? parseInt(decAttr, 10) : undefined,
      duration: parseFloat(a('data-duration')) || 1200,
      from: parseFloat(a('data-from')) || 0
    };
    node.classList.add('fx-count');
    if (reduced() || !hasIO) { countTo(node, to, opts); return; }
    var dec = opts.decimals != null ? opts.decimals : ((String(to).split('.')[1] || '').length);
    node.textContent = opts.prefix + fmt(to, dec) + opts.suffix;
    var w = node.getBoundingClientRect().width;
    if (w) node.style.minWidth = Math.ceil(w) + 'px';
    node.textContent = opts.prefix + fmt(opts.from, dec) + opts.suffix;
    onVisible(node, function () { countTo(node, to, opts); }, 0.4);
  }
  /* EtibFX.count(el, 1234, {suffix:' ₽', decimals:0, duration:1200, from:0}) */
  FX.count = safe(function (node, to, opts) { node = el(node); if (node) countTo(node, +to, opts); });

  /* =====================================================================
     7. Волна [data-ripple] и вибро [data-haptic] (одно делегирование на документ)
     ===================================================================== */
  function ripple(node, x, y) {
    if (reduced()) return;
    var box = node.querySelector(':scope > .fx-ripple-box');
    if (!box) {
      ensureRel(node);
      box = doc.createElement('span'); box.className = 'fx-ripple-box'; box.setAttribute('aria-hidden', 'true');
      node.appendChild(box);
    }
    var r = node.getBoundingClientRect();
    var size = Math.max(r.width, r.height) * 2.2;
    var s = doc.createElement('span');
    s.className = 'fx-ripple';
    s.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (x - r.left - size / 2) + 'px;top:' + (y - r.top - size / 2) + 'px';
    box.appendChild(s);
    s.addEventListener('animationend', function () { if (s.parentNode) s.parentNode.removeChild(s); });
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 1200);
  }
  FX.ripple = safe(function (node, x, y) { node = el(node); if (!node) return; var r = node.getBoundingClientRect(); ripple(node, x == null ? r.left + r.width / 2 : x, y == null ? r.top + r.height / 2 : y); });

  doc.addEventListener('pointerdown', safe(function (e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    var rp = t.closest('[data-ripple]');
    if (rp && !rp.disabled) ripple(rp, e.clientX, e.clientY);
  }), { passive: true, capture: true });
  doc.addEventListener('click', safe(function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-haptic]') : null;
    if (t) FX.tap(parseInt(t.getAttribute('data-haptic'), 10) || 8);
    // iOS: гироскоп спрашиваем один раз за сессию, только по нажатию на карточку с наклоном; отказ запоминаем навсегда
    if (!gyroAsked && coarse && !gyro.listening && e.target.closest && e.target.closest('[data-tilt]')) {
      var D = window.DeviceOrientationEvent;
      if (D && typeof D.requestPermission === 'function' && store('etibfx-gyro') !== 'denied') { gyroAsked = true; FX.enableGyro(); }
    }
  }), { passive: true, capture: true });

  /* =====================================================================
     5. Инфографика (SVG/HTML, цвета — CSS-переменные, тёмная тема работает сама)
     ===================================================================== */
  var NS = 'http://www.w3.org/2000/svg';

  /* EtibFX.ring(el, 72, 100, {label:'План месяца', suffix:'%', size:112, stroke:10, color:'var(--fx-s2)', sub:'из 100', decimals:0, showPercent:false}) */
  FX.ring = safe(function (host, value, max, opts) {
    host = el(host); if (!host) return null;
    opts = opts || {};
    max = +max || 100; value = +value || 0;
    var dec = opts.decimals || 0;
    var sw = opts.stroke || 10;
    var r = 50 - sw / 2 - 1;
    function pct(v) { return clamp(v / max, 0, 1) * 100; }
    var shown = opts.showPercent ? fmt(pct(value), dec) + '%' : fmt(value, dec) + (opts.suffix || '');
    host.classList.add('fx-ring');
    if (opts.size) host.style.setProperty('--fx-size', opts.size + 'px');
    if (opts.color) host.style.setProperty('--fx-c', opts.color);
    var label = opts.label || '';
    var sub = opts.sub != null ? opts.sub : (opts.showPercent ? '' : 'из ' + fmt(max, 0));
    host.innerHTML =
      '<svg viewBox="0 0 100 100" role="img" aria-label="' + esc((label ? label + ': ' : '') + shown + (sub ? ' ' + sub : '')) + '">' +
      '<circle class="fx-ring-track" cx="50" cy="50" r="' + r + '" stroke-width="' + sw + '"/>' +
      '<circle class="fx-ring-val" cx="50" cy="50" r="' + r + '" stroke-width="' + sw + '" pathLength="100" transform="rotate(-90 50 50)"/>' +
      '<text class="fx-ring-num" x="50" y="' + (sub ? 46 : 50) + '" aria-hidden="true">' + esc(shown) + '</text>' +
      (sub ? '<text class="fx-ring-sub" x="50" y="64" aria-hidden="true">' + esc(sub) + '</text>' : '') +
      '</svg>' + (label ? '<div class="fx-ring-label" aria-hidden="true">' + esc(label) + '</div>' : '');
    var numEl = host.querySelector('.fx-ring-num');
    function setOff(v) { host.style.setProperty('--fx-off', (100 - pct(v)).toFixed(2)); }
    setOff(value);
    onVisible(host, function () {
      host.classList.add('fx-on');
      if (!reduced() && numEl) countTo(numEl, opts.showPercent ? +pct(value).toFixed(dec) : value, { decimals: dec, suffix: opts.showPercent ? '%' : (opts.suffix || ''), duration: 1300 });
    });
    return {
      el: host,
      update: safe(function (v) {
        value = +v || 0; setOff(value);
        var txt = opts.showPercent ? fmt(pct(value), dec) + '%' : fmt(value, dec) + (opts.suffix || '');
        if (numEl) numEl.textContent = txt;
        var svg = host.querySelector('svg'); if (svg) svg.setAttribute('aria-label', (label ? label + ': ' : '') + txt + (sub ? ' ' + sub : ''));
      })
    };
  });

  /* EtibFX.bars(el, [{label:'Lanvin', value:42, display:'42 шт', color:'var(--fx-s2)'}], {max:50, suffix:' шт', decimals:0, sort:true}) */
  FX.bars = safe(function (host, data, opts) {
    host = el(host); if (!host || !data) return null;
    opts = opts || {};
    var rows = data.slice();
    if (opts.sort) rows.sort(function (a, b) { return (+b.value || 0) - (+a.value || 0); });
    var max = +opts.max || rows.reduce(function (m, d) { return Math.max(m, +d.value || 0); }, 0) || 1;
    var list = doc.createElement('ul');
    list.className = 'fx-bars';
    if (opts.label) list.setAttribute('aria-label', opts.label);
    var html = '';
    rows.forEach(function (d, i) {
      var v = +d.value || 0;
      var txt = d.display != null ? d.display : fmt(v, opts.decimals || 0) + (opts.suffix || '');
      var style = '--fx-p:' + clamp(v / max, 0, 1).toFixed(4) + ';--fx-i:' + Math.min(i, 12) + (d.color ? ';--fx-c:' + d.color : '');
      html += '<li style="' + esc(style) + '" title="' + esc(d.label + ': ' + txt) + '">' +
        '<span class="fx-bar-lbl">' + esc(d.label) + '</span>' +
        '<span class="fx-bar-row"><span class="fx-bar-fill" aria-hidden="true"></span><span class="fx-bar-val">' + esc(txt) + '</span></span></li>';
    });
    list.innerHTML = html;
    host.innerHTML = '';
    host.appendChild(list);
    onVisible(list, function () { list.classList.add('fx-on'); }, 0.2);
    return { el: list };
  });

  /* Радар.
     EtibFX.radar(el, [{label:'Цветочные', value:8}, ...], {max:10, name:'Аромат'})
     EtibFX.radar(el, {axes:['Цветочные',...], series:[{name:'Аромат A', values:[...]}, {name:'Аромат B', values:[...]}]}, {max:10}) */
  FX.radar = safe(function (host, axes, opts) {
    host = el(host); if (!host || !axes) return null;
    opts = opts || {};
    var labels, series;
    if (Array.isArray(axes)) {
      labels = axes.map(function (a) { return typeof a === 'string' ? a : a.label; });
      series = [{ name: opts.name || '', values: axes.map(function (a) { return +(a && a.value) || 0; }), color: opts.color }];
    } else {
      labels = axes.axes || []; series = axes.series || [];
    }
    var n = labels.length;
    if (n < 3) return null;
    series = series.slice(0, 3); // больше трёх серий на радаре не читается
    var palette = ['var(--fx-s1)', 'var(--fx-s2)', 'var(--fx-mute)'];
    var max = +opts.max || series.reduce(function (m, s) { return Math.max.apply(Math, [m].concat(s.values.map(Number))); }, 0) || 1;
    var W = 380, H = 280, cx = W / 2, cy = H / 2, R = 92, levels = opts.levels || 4;
    function pt(i, f) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f]; }
    var g = '';
    for (var l = 1; l <= levels; l++) {
      var ps = [];
      for (var i = 0; i < n; i++) ps.push(pt(i, l / levels).map(function (v) { return v.toFixed(1); }).join(','));
      g += '<polygon class="fx-grid" points="' + ps.join(' ') + '"/>';
    }
    for (i = 0; i < n; i++) { var p = pt(i, 1); g += '<line class="fx-grid" x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '"/>'; }
    var lb = '';
    for (i = 0; i < n; i++) {
      var q = pt(i, 1.13), ax = q[0] - cx, ay = q[1] - cy;
      var anchor = Math.abs(ax) < 8 ? 'middle' : ax > 0 ? 'start' : 'end';
      var dy = ay < -8 ? '-0.2em' : ay > 8 ? '0.9em' : '0.35em';
      lb += '<text class="fx-axis-lbl" x="' + q[0].toFixed(1) + '" y="' + q[1].toFixed(1) + '" dy="' + dy + '" text-anchor="' + anchor + '">' + esc(labels[i]) + '</text>';
    }
    var areas = '';
    series.forEach(function (s, si) {
      var col = s.color || palette[si];
      var pts = [], dots = '';
      for (var j = 0; j < n; j++) {
        var v = clamp((+s.values[j] || 0) / max, 0, 1), pp = pt(j, v);
        pts.push(pp[0].toFixed(1) + ',' + pp[1].toFixed(1));
        dots += '<circle cx="' + pp[0].toFixed(1) + '" cy="' + pp[1].toFixed(1) + '" r="4"><title>' + esc((s.name ? s.name + ' — ' : '') + labels[j] + ': ' + fmt(+s.values[j] || 0, opts.decimals || 0)) + '</title></circle>';
      }
      areas += '<g class="fx-area" style="--fx-c:' + esc(col) + ';--fx-i:' + si + ';--fx-o:' + cx + 'px ' + cy + 'px"><polygon points="' + pts.join(' ') + '"/>' + dots + '</g>';
    });
    var summary = series.map(function (s) {
      return (s.name ? s.name + ': ' : '') + labels.map(function (lab, j) { return lab + ' ' + fmt(+s.values[j] || 0, opts.decimals || 0); }).join(', ');
    }).join('; ');
    var table = '<table class="fx-sr"><caption>' + esc(opts.label || 'Профиль аромата') + ' (из ' + fmt(max, 0) + ')</caption><thead><tr><th>Семейство</th>' +
      series.map(function (s, si) { return '<th>' + esc(s.name || ('Серия ' + (si + 1))) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      labels.map(function (lab, j) { return '<tr><th>' + esc(lab) + '</th>' + series.map(function (s) { return '<td>' + fmt(+s.values[j] || 0, opts.decimals || 0) + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table>';
    var legend = series.length > 1 ? '<ul class="fx-legend">' + series.map(function (s, si) {
      return '<li style="--fx-c:' + esc(s.color || palette[si]) + '"><i aria-hidden="true"></i>' + esc(s.name || ('Серия ' + (si + 1))) + '</li>';
    }).join('') + '</ul>' : '';
    host.classList.add('fx-radar');
    if (opts.maxWidth) host.style.setProperty('--fx-max', opts.maxWidth + 'px');
    host.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc((opts.label || 'Профиль аромата') + '. ' + summary) + '">' + g + areas + lb + '</svg>' + legend + table;
    onVisible(host, function () { host.classList.add('fx-on'); }, 0.3);
    return { el: host };
  });

  /* =====================================================================
     6. Фон «аромат-туман»: EtibFX.aurora({z:-1, mist:true}) → элемент; EtibFX.aurora(false) — убрать
     ===================================================================== */
  FX.aurora = safe(function (opts) {
    var ex = doc.querySelector('.fx-aurora');
    if (opts === false) { if (ex && ex.parentNode) ex.parentNode.removeChild(ex); return null; }
    if (ex) return ex;
    opts = opts || {};
    var a = doc.createElement('div');
    a.className = 'fx-aurora';
    a.setAttribute('aria-hidden', 'true');
    if (opts.z != null) a.style.setProperty('--fx-z', opts.z);
    if (opts.mist !== false) { var m = doc.createElement('div'); m.className = 'fx-mist'; a.appendChild(m); }
    (doc.body || root).insertBefore(a, (doc.body || root).firstChild);
    return a;
  });

  /* =====================================================================
     4. 3D-флакон: EtibFX.bottle3D(canvas, {color:'#c9a24a'|'--accent', fill:.7, shape:'classic'|'round'|'tall', autoRotate:true, speed:.45, fps:60})
        → {mode:'webgl'|'2d', setColor(c), setFill(f), play(), pause(), destroy()}
     ===================================================================== */
  var cnv2d = null;
  function parseColor(c, fallback) {
    try {
      if (!c) c = fallback;
      if (typeof c === 'string' && (c.indexOf('--') === 0 || c.indexOf('var(') === 0)) {
        var name = c.replace(/^var\(\s*/, '').replace(/\s*\)$/, '').split(',')[0];
        c = getComputedStyle(root).getPropertyValue(name).trim() || fallback;
      }
      if (!cnv2d) cnv2d = doc.createElement('canvas').getContext('2d');
      cnv2d.fillStyle = '#000'; cnv2d.fillStyle = c;
      var s = cnv2d.fillStyle;
      if (s[0] === '#') return [parseInt(s.substr(1, 2), 16) / 255, parseInt(s.substr(3, 2), 16) / 255, parseInt(s.substr(5, 2), 16) / 255];
      var m = s.match(/[\d.]+/g);
      return m ? [m[0] / 255, m[1] / 255, m[2] / 255] : [0.48, 0.18, 0.25];
    } catch (e) { return [0.48, 0.18, 0.25]; }
  }

  // поверхность вращения с сечением-суперэллипсом: кольца [y, ax, az, n, hard]
  function lathe(rings, seg, out) {
    var P = out.p, N = out.n, I = out.i;
    var ymin = Infinity, ymax = -Infinity;
    rings.forEach(function (r) { ymin = Math.min(ymin, r[0]); ymax = Math.max(ymax, r[0]); });
    var yc = (ymin + ymax) / 2;
    function pos(r, th) {
      var c = Math.cos(th), s = Math.sin(th), e = 2 / r[3];
      return [r[1] * (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), e), r[0], r[2] * (s < 0 ? -1 : 1) * Math.pow(Math.abs(s), e)];
    }
    function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
    function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    function norm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
    for (var k = 0; k < rings.length - 1; k++) {
      var base = P.length / 3;
      for (var side = 0; side < 2; side++) {
        var ri = k + side, r = rings[ri];
        // касательная вдоль профиля: на изломе — по своей полосе, иначе центральная разность
        var oneSided = r[4] || ri === 0 || ri === rings.length - 1;
        var prev = oneSided && side === 0 ? r : rings[ri - 1];
        var next = oneSided && side === 1 ? r : rings[ri + 1];
        for (var j = 0; j <= seg; j++) {
          var th = j / seg * Math.PI * 2;
          var p = pos(r, th);
          var dth = sub(pos(r, th + 0.002), pos(r, th - 0.002));
          var dt = sub(pos(next, th), pos(prev, th));
          if (Math.hypot(dth[0], dth[2]) < 1e-6) dth = [-Math.sin(th), 0, Math.cos(th)];
          var nn = norm(cross(dth, dt));
          var out2 = [p[0], p[1] - yc, p[2]];
          if (Math.hypot(p[0], p[2]) < 1e-4) out2 = [0, p[1] - yc, 0];
          if (nn[0] * out2[0] + nn[1] * out2[1] + nn[2] * out2[2] < 0) nn = [-nn[0], -nn[1], -nn[2]];
          P.push(p[0], p[1], p[2]); N.push(nn[0], nn[1], nn[2]);
        }
      }
      var row = seg + 1;
      for (j = 0; j < seg; j++) {
        var a = base + j, b = base + j + 1, c = base + row + j, d = base + row + j + 1;
        tri(a, c, b); tri(b, c, d);
      }
    }
    function tri(a, b, c) {
      // согласуем обход с наружной нормалью, чтобы отсечение граней было верным
      var pa = [P[a * 3], P[a * 3 + 1], P[a * 3 + 2]], pb = [P[b * 3], P[b * 3 + 1], P[b * 3 + 2]], pc = [P[c * 3], P[c * 3 + 1], P[c * 3 + 2]];
      var fn = cross(sub(pb, pa), sub(pc, pa));
      var nx = N[a * 3] + N[b * 3] + N[c * 3], ny = N[a * 3 + 1] + N[b * 3 + 1] + N[c * 3 + 1], nz = N[a * 3 + 2] + N[b * 3 + 2] + N[c * 3 + 2];
      if (fn[0] * nx + fn[1] * ny + fn[2] * nz < 0) I.push(a, c, b); else I.push(a, b, c);
    }
    return out;
  }

  function shapeDims(shape) {
    if (shape === 'round') return { ax: 0.56, az: 0.56, n: 2.0, top: 0.42, neck: 0.15 };
    if (shape === 'tall') return { ax: 0.46, az: 0.32, n: 4.2, top: 0.55, neck: 0.13 };
    return { ax: 0.64, az: 0.40, n: 4.4, top: 0.42, neck: 0.15 };
  }
  function buildGeo(shape, fill) {
    var d = shapeDims(shape), ax = d.ax, az = d.az, n = d.n, T = d.top, nk = d.neck;
    var bot = -1.0;
    var glass = lathe([
      [bot, 0, 0, n, 1], [bot, ax * 0.9, az * 0.9, n, 0], [bot + 0.025, ax * 0.975, az * 0.975, n, 0], [bot + 0.08, ax, az, n, 1],
      [T, ax, az, n, 1], [T + 0.06, ax * 0.97, az * 0.97, n, 0], [T + 0.12, ax * 0.84, az * 0.86, (n + 2) / 2, 0], [T + 0.17, ax * 0.55, az * 0.62, 2.4, 0],
      [T + 0.2, nk + 0.04, nk + 0.04, 2, 0], [T + 0.22, nk, nk, 2, 1], [T + 0.36, nk, nk, 2, 1], [T + 0.36, 0, 0, 2, 1]
    ], 72, { p: [], n: [], i: [] });
    var lb = bot + 0.09, ly = lb + clamp(fill, 0.05, 1) * (T - lb - 0.02), li = 0.9;
    var liquid = lathe([
      [lb, 0, 0, n, 1], [lb, ax * li * 0.9, az * (li - 0.04) * 0.9, n, 0], [lb + 0.04, ax * li, az * (li - 0.04), n, 1],
      [ly, ax * li, az * (li - 0.04), n, 1], [ly, 0, 0, n, 1]
    ], 56, { p: [], n: [], i: [] });
    var c0 = T + 0.3, cr = Math.max(0.24, nk + 0.1);
    var cap = lathe([
      [c0, 0, 0, 2, 1], [c0, cr * 0.94, cr * 0.94, 2, 0], [c0 + 0.02, cr, cr, 2, 1], [c0 + 0.08, cr, cr, 2, 1], [c0 + 0.085, cr * 0.93, cr * 0.93, 2, 1], [c0 + 0.11, cr * 0.93, cr * 0.93, 2, 1],
      [c0 + 0.115, cr, cr, 2, 1], [c0 + 0.42, cr, cr, 2, 0], [c0 + 0.455, cr * 0.9, cr * 0.9, 2, 0], [c0 + 0.465, cr * 0.7, cr * 0.7, 2, 1], [c0 + 0.465, 0, 0, 2, 1]
    ], 48, { p: [], n: [], i: [] });
    // тень — плоский диск, «нормаль» хранит радиус
    var sh = { p: [0, bot - 0.001, 0], n: [0, 0, 0], i: [] }, S = 40;
    for (var j = 0; j <= S; j++) { var a = j / S * Math.PI * 2; sh.p.push(Math.cos(a) * 1.0, bot - 0.001, Math.sin(a) * 0.62); sh.n.push(1, 0, 0); if (j) sh.i.push(0, j, j + 1); }
    return { glass: glass, liquid: liquid, cap: cap, shadow: sh, top: c0 + 0.465, bot: bot };
  }

  var VS = 'attribute vec3 aP;attribute vec3 aN;uniform mat4 uM;uniform mat4 uVP;varying vec3 vN;varying vec3 vW;varying float vR;' +
    'void main(){vec4 w=uM*vec4(aP,1.0);vW=w.xyz;vN=(uM*vec4(aN,0.0)).xyz;vR=aN.x;gl_Position=uVP*w;}';
  var FS = 'precision mediump float;varying vec3 vN;varying vec3 vW;varying float vR;uniform int uMode;uniform vec3 uC;uniform vec3 uCam;uniform vec3 uInk;uniform float uDark;' +
    'float env(vec3 R){float u=(R.x-0.55)*4.5;float w=(R.x+0.72)*7.0;float e=1.15*exp(-u*u)*smoothstep(-0.7,0.35,R.y);' +
    'e+=0.55*exp(-w*w)*smoothstep(-0.5,0.45,R.y);' +
    'e+=0.45*smoothstep(0.55,0.97,R.y);e+=0.06+0.1*(R.y*0.5+0.5);return e;}' +
    'void main(){' +
    'if(uMode==3){float a=pow(clamp(1.0-vR,0.0,1.0),1.6)*(0.26-0.12*uDark);gl_FragColor=vec4(uInk*a,a);return;}' +
    'vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 V=normalize(uCam-vW);float ndv=clamp(dot(N,V),0.0,1.0);' +
    'vec3 R=reflect(-V,N);float E=env(R);vec3 L=normalize(vec3(0.5,0.85,0.7));vec3 H=normalize(L+V);' +
    'float sp=pow(max(dot(N,H),0.0),90.0);float fr=pow(1.0-ndv,3.0);' +
    'if(uMode==0){vec3 c=vec3(E)*vec3(1.0,0.985,0.97)+sp*1.4;float a=clamp(0.05+fr*0.62+E*0.22+sp,0.0,0.92);' +
    'if(!gl_FrontFacing)a*=0.55;gl_FragColor=vec4(c*a,a);return;}' +
    'if(uMode==1){vec3 deep=uC*0.38;vec3 core=min(uC*1.18+0.03,vec3(1.0));' +
    'vec3 c=mix(deep,core,pow(ndv,0.9));c+=uC*0.35*smoothstep(-0.2,0.6,-vW.y*0.5+0.2)*ndv;' +
    'float top=smoothstep(0.85,0.98,N.y);c=mix(c,min(uC*1.6+0.12,vec3(1.0)),top*0.55);' +
    'c+=vec3(E)*fr*0.35+sp*0.6;float a=0.9;gl_FragColor=vec4(c*a,a);return;}' +
    'vec3 gold=vec3(0.86,0.67,0.37);vec3 c=gold*(0.16+0.95*E)+sp*vec3(1.0,0.92,0.75)*1.2+fr*gold*0.25;' +
    'gl_FragColor=vec4(c,1.0);}';

  function mat4Persp(fov, asp, n, f) {
    var t = 1 / Math.tan(fov / 2), nf = 1 / (n - f);
    return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]);
  }
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
      o[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3];
    }
    return o;
  }
  function rotYX(y, x, ty) {
    var cy = Math.cos(y), sy = Math.sin(y), cx = Math.cos(x), sx = Math.sin(x);
    // Rx * Ry, затем сдвиг по y
    return new Float32Array([cy, sx * sy, -cx * sy, 0, 0, cx, sx, 0, sy, -sx * cy, cx * cy, 0, 0, ty, 0, 1]);
  }

  FX.bottle3D = function (canvas, opts) {
    try {
      canvas = el(canvas);
      if (!canvas || !canvas.getContext) return null;
      if (canvas.__fxBottle) { canvas.__fxBottle.destroy(); }
      opts = opts || {};
      canvas.classList.add('fx-bottle');
      if (!canvas.getAttribute('role')) { canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', opts.label || 'Флакон духов, 3D'); }
      var st = {
        yaw: opts.yaw != null ? opts.yaw : 0.5, pitch: 0.12, vy: 0, auto: opts.autoRotate !== false && !reduced(),
        speed: opts.speed || 0.45, fill: opts.fill != null ? opts.fill : 0.72, color: parseColor(opts.color, '--accent'),
        shape: opts.shape || 'classic', dragging: false, lastUser: 0, vis: true, playing: true, dirty: true,
        frame: 0, last: 0, minDt: 1000 / (opts.fps || 60) - 2, dead: false
      };
      var ctrl = { mode: 'none', canvas: canvas };
      var gl = null;
      if (opts.webgl !== false) {
        try {
          var ca = { alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false };
          gl = canvas.getContext('webgl', ca) || canvas.getContext('experimental-webgl', ca);
        } catch (e) { gl = null; }
      }
      var draw, setup;
      var ink = [0.1, 0.07, 0.08], dark = 0;
      function readTheme() {
        var cs = getComputedStyle(root);
        ink = parseColor(cs.getPropertyValue('--ink').trim() || '#1a1215');
        var lum = 0.2126 * ink[0] + 0.7152 * ink[1] + 0.0722 * ink[2];
        dark = lum > 0.5 ? 1 : 0;
        if (dark) ink = [0, 0, 0];
        st.dirty = true;
      }
      readTheme();

      function size() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = canvas.clientWidth || canvas.width || 300, h = canvas.clientHeight || canvas.height || 400;
        var W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(h * dpr));
        if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; st.dirty = true; }
      }

      if (gl) {
        ctrl.mode = 'webgl';
        var prog, loc = {}, meshes = {};
        setup = function () {
          function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
          prog = gl.createProgram();
          gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
          gl.linkProgram(prog);
          if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
          gl.useProgram(prog);
          ['aP', 'aN'].forEach(function (k) { loc[k] = gl.getAttribLocation(prog, k); });
          ['uM', 'uVP', 'uMode', 'uC', 'uCam', 'uInk', 'uDark'].forEach(function (k) { loc[k] = gl.getUniformLocation(prog, k); });
          rebuild();
        };
        var rebuild = function () {
          var geo = buildGeo(st.shape, st.fill);
          ['glass', 'liquid', 'cap', 'shadow'].forEach(function (k) {
            var g = geo[k], m = meshes[k] || (meshes[k] = { pb: gl.createBuffer(), nb: gl.createBuffer(), ib: gl.createBuffer() });
            gl.bindBuffer(gl.ARRAY_BUFFER, m.pb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g.p), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, m.nb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g.n), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(g.i), gl.STATIC_DRAW);
            m.count = g.i.length;
          });
          meshes.top = geo.top; meshes.bot = geo.bot;
          st.dirty = true;
        };
        var drawMesh = function (m) {
          gl.bindBuffer(gl.ARRAY_BUFFER, m.pb); gl.enableVertexAttribArray(loc.aP); gl.vertexAttribPointer(loc.aP, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, m.nb); gl.enableVertexAttribArray(loc.aN); gl.vertexAttribPointer(loc.aN, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib); gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_SHORT, 0);
        };
        var ID = rotYX(0, 0, 0);
        draw = function () {
          size();
          var W = canvas.width, H = canvas.height;
          gl.viewport(0, 0, W, H);
          gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          var asp = W / H, mid = (meshes.top + meshes.bot) / 2, half = (meshes.top - meshes.bot) / 2 + 0.12;
          var fov = 0.52, dist = Math.max(half / Math.tan(fov / 2), (0.95 / asp) / Math.tan(fov / 2)) * 1.08;
          var P = mat4Persp(fov, asp, 0.1, 50);
          var Vw = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -0.04, -dist, 1]);
          gl.uniformMatrix4fv(loc.uVP, false, mul(P, Vw));
          gl.uniform3f(loc.uCam, 0, 0.04, dist);
          gl.uniform3fv(loc.uC, st.color); gl.uniform3fv(loc.uInk, ink); gl.uniform1f(loc.uDark, dark);
          var M = rotYX(st.yaw, st.pitch, -mid);
          gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
          gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
          // тень (не вращается)
          ID[13] = -mid; gl.uniformMatrix4fv(loc.uM, false, ID);
          gl.depthMask(false); gl.disable(gl.CULL_FACE); gl.uniform1i(loc.uMode, 3); drawMesh(meshes.shadow); gl.enable(gl.CULL_FACE);
          gl.uniformMatrix4fv(loc.uM, false, M);
          // задняя стенка стекла
          gl.cullFace(gl.FRONT); gl.uniform1i(loc.uMode, 0); drawMesh(meshes.glass);
          // жидкость и золотая крышка
          gl.depthMask(true); gl.cullFace(gl.BACK);
          gl.uniform1i(loc.uMode, 1); drawMesh(meshes.liquid);
          gl.uniform1i(loc.uMode, 2); drawMesh(meshes.cap);
          // передняя стенка стекла
          gl.depthMask(false); gl.uniform1i(loc.uMode, 0); drawMesh(meshes.glass);
          gl.depthMask(true);
        };
        try { setup(); } catch (e) { note(e); gl = null; }
        if (gl) {
          canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); st.lost = true; stop(); }, false);
          canvas.addEventListener('webglcontextrestored', function () { st.lost = false; meshes = {}; try { setup(); kick(); } catch (e) { note(e); } }, false);
          ctrl.setFill = safe(function (f) { st.fill = clamp(+f || 0, 0.05, 1); rebuild(); kick(); });
          ctrl.setShape = safe(function (s) { st.shape = s; rebuild(); kick(); });
        }
      }

      if (!gl) {
        // запасной 2D-вариант: псевдо-3D за счёт меняющейся ширины и бегущего блика
        var c2 = canvas.getContext('2d');
        if (!c2) return null;
        ctrl.mode = '2d';
        var rgb = function (c, k, a) { return 'rgba(' + Math.round(clamp(c[0] * k, 0, 1) * 255) + ',' + Math.round(clamp(c[1] * k, 0, 1) * 255) + ',' + Math.round(clamp(c[2] * k, 0, 1) * 255) + ',' + (a == null ? 1 : a) + ')'; };
        var rr = function (x, y, w, h, r) { c2.beginPath(); c2.moveTo(x + r, y); c2.arcTo(x + w, y, x + w, y + h, r); c2.arcTo(x + w, y + h, x, y + h, r); c2.arcTo(x, y + h, x, y, r); c2.arcTo(x, y, x + w, y, r); c2.closePath(); };
        draw = function () {
          size();
          var W = canvas.width, H = canvas.height, d = shapeDims(st.shape);
          c2.clearRect(0, 0, W, H);
          var sc = Math.min(W / 2.2, H / 2.75), cx = W / 2, by = H * 0.88;
          var hw = Math.sqrt(Math.pow(d.ax * Math.cos(st.yaw), 2) + Math.pow(d.az * Math.sin(st.yaw), 2)) * sc;
          var bh = (d.top + 1) * sc, top = by - bh, rad = Math.min(hw * 0.35, 18 * (W / 300));
          var g = c2.createRadialGradient(cx, by, 0, cx, by, sc * 1.0);
          g.addColorStop(0, rgb(ink, 1, dark ? 0.35 : 0.18)); g.addColorStop(1, rgb(ink, 1, 0));
          c2.save(); c2.scale(1, 0.25); c2.fillStyle = g; c2.beginPath(); c2.arc(cx, by * 4, sc, 0, 7); c2.fill(); c2.restore();
          var lh = (bh - 0.1 * sc) * st.fill;
          rr(cx - hw * 0.88, by - 0.06 * sc - lh, hw * 1.76, lh, rad * 0.8);
          var lg = c2.createLinearGradient(cx - hw, 0, cx + hw, 0);
          lg.addColorStop(0, rgb(st.color, 0.45)); lg.addColorStop(0.5, rgb(st.color, 1.25)); lg.addColorStop(1, rgb(st.color, 0.45));
          c2.fillStyle = lg; c2.fill();
          rr(cx - hw, top, hw * 2, bh, rad);
          var gg = c2.createLinearGradient(cx - hw, 0, cx + hw, 0);
          gg.addColorStop(0, 'rgba(255,255,255,.55)'); gg.addColorStop(0.12, 'rgba(255,255,255,.08)'); gg.addColorStop(0.88, 'rgba(255,255,255,.08)'); gg.addColorStop(1, 'rgba(255,255,255,.5)');
          c2.fillStyle = gg; c2.fill(); c2.lineWidth = Math.max(1, W / 300); c2.strokeStyle = 'rgba(255,255,255,.6)'; c2.stroke();
          var hx = cx + Math.sin(st.yaw * 1.3) * hw * 0.6;
          var hl = c2.createLinearGradient(hx - hw * 0.12, 0, hx + hw * 0.12, 0);
          hl.addColorStop(0, 'rgba(255,255,255,0)'); hl.addColorStop(0.5, 'rgba(255,255,255,.55)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
          c2.fillStyle = hl; c2.fillRect(hx - hw * 0.12, top + rad, hw * 0.24, bh - rad * 2);
          var nw = d.neck * sc, cw = Math.max(0.24, d.neck + 0.1) * sc, ct = by - (d.top + 1.765) * sc;
          c2.fillStyle = 'rgba(255,255,255,.35)'; c2.fillRect(cx - nw, by - (d.top + 1.36) * sc, nw * 2, 0.17 * sc);
          var cg = c2.createLinearGradient(cx - cw, 0, cx + cw, 0);
          cg.addColorStop(0, '#6e5428'); cg.addColorStop(0.35, '#f3dca4'); cg.addColorStop(0.55, '#b8935a'); cg.addColorStop(1, '#5a4320');
          c2.fillStyle = cg; rr(cx - cw, ct, cw * 2, 0.465 * sc, Math.min(cw * 0.3, 8 * (W / 300))); c2.fill();
        };
        ctrl.setFill = safe(function (f) { st.fill = clamp(+f || 0, 0.05, 1); kick(); });
        ctrl.setShape = safe(function (s) { st.shape = s; kick(); });
      }

      // цикл: работает только когда флакон виден и вкладка активна
      function loop(ts) {
        st.frame = 0;
        if (st.dead || st.lost) return;
        if (st.last && ts - st.last < st.minDt) { st.frame = raf(loop); return; }
        var dt = st.last ? Math.min(0.05, (ts - st.last) / 1000) : 0.016;
        st.last = ts;
        var moving = false;
        if (!st.dragging) {
          if (Math.abs(st.vy) > 0.0005) { st.yaw += st.vy; st.vy *= 0.94; moving = true; }
          else if (st.auto && ts - st.lastUser > 1800) { st.yaw += st.speed * dt; moving = true; }
          var tp = 0.12; if (Math.abs(st.pitch - tp) > 0.001) { st.pitch += (tp - st.pitch) * 0.06; moving = true; }
        }
        if (moving || st.dirty || st.dragging) { st.dirty = false; try { draw(); } catch (e) { note(e); stop(); return; } }
        if (moving || st.dragging || (st.auto && ts - st.lastUser <= 1800)) st.frame = raf(loop);
        else st.last = 0;
      }
      function kick() { if (!st.frame && !st.dead && st.vis && st.playing && !doc.hidden) { st.dirty = true; st.frame = raf(loop); } }
      function stop() { if (st.frame) { caf(st.frame); st.frame = 0; } st.last = 0; }

      // перетаскивание
      var px = 0, py = 0, lx = 0;
      function down(e) { st.dragging = true; px = lx = e.clientX; py = e.clientY; st.vy = 0; st.lastUser = performance.now(); try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } kick(); }
      function move(e) {
        if (!st.dragging) return;
        var dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY;
        var k = 5.5 / Math.max(200, canvas.clientWidth);
        st.yaw += dx * k; st.vy = (e.clientX - lx) * k * 0.6; lx = e.clientX;
        if (e.pointerType !== 'touch') st.pitch = clamp(st.pitch + dy * k * 0.6, -0.4, 0.5);
        st.lastUser = performance.now(); st.dirty = true; kick();
      }
      function up() { if (!st.dragging) return; st.dragging = false; st.lastUser = performance.now(); kick(); }
      canvas.addEventListener('pointerdown', down);
      canvas.addEventListener('pointermove', move, { passive: true });
      canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up); canvas.addEventListener('lostpointercapture', up);

      var io = hasIO ? new IntersectionObserver(function (ents) { st.vis = ents[ents.length - 1].isIntersecting; if (st.vis) kick(); else stop(); }) : null;
      if (io) io.observe(canvas);
      var ro = ('ResizeObserver' in window) ? new ResizeObserver(function () { st.dirty = true; if (!st.frame) { st.frame = raf(function (t) { st.frame = 0; try { draw(); } catch (e) { note(e); } }); } }) : null;
      if (ro) ro.observe(canvas);
      function vis() { if (doc.hidden) stop(); else kick(); }
      doc.addEventListener('visibilitychange', vis);
      var themeMO = new MutationObserver(function () { readTheme(); kick(); });
      themeMO.observe(root, { attributes: true, attributeFilter: ['data-theme', 'class'] });

      ctrl.setColor = safe(function (c) { st.color = parseColor(c, '--accent'); st.dirty = true; kick(); if (!st.frame) try { draw(); } catch (e) { note(e); } });
      ctrl.play = safe(function () { st.playing = true; st.auto = !reduced(); kick(); });
      ctrl.pause = safe(function () { st.playing = false; stop(); });
      ctrl.destroy = safe(function () {
        st.dead = true; stop();
        if (io) io.disconnect(); if (ro) ro.disconnect(); themeMO.disconnect();
        doc.removeEventListener('visibilitychange', vis);
        canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
        canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up); canvas.removeEventListener('lostpointercapture', up);
        canvas.__fxBottle = null;
      });
      canvas.__fxBottle = ctrl;
      try { draw(); } catch (e) { note(e); }
      kick();
      return ctrl;
    } catch (e) { note(e); return null; }
  };

  /* =====================================================================
     Сканирование страницы (и подгружаемых позже узлов)
     ===================================================================== */
  FX.scan = safe(function (scope) {
    scope = scope || doc;
    var q = function (s) { return scope.querySelectorAll ? scope.querySelectorAll(s) : []; };
    var i, n;
    n = q('[data-reveal]'); for (i = 0; i < n.length; i++) safe(initReveal)(n[i]);
    n = q('[data-count]'); for (i = 0; i < n.length; i++) safe(initCount)(n[i]);
    n = q('[data-tilt]'); for (i = 0; i < n.length; i++) safe(initTilt)(n[i]);
  });
  FX.reduced = reduced;

  var pending = false;
  function queueScan() {
    if (pending) return;
    pending = true;
    var run = function () { pending = false; FX.scan(doc); };
    if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 300 }); else setTimeout(run, 60);
  }

  var started = false;
  FX.init = safe(function () {
    if (started) return;
    started = true;
    root.classList.add('fx-js');
    FX.scan(doc);
    autoGyro();
    if (window.MutationObserver && doc.body) {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var a = muts[i].addedNodes;
          for (var j = 0; j < a.length; j++) if (a[j].nodeType === 1 && !/(^| )fx-/.test(a[j].className && a[j].className.baseVal == null ? a[j].className : '')) { queueScan(); return; }
        }
      }).observe(doc.body, { childList: true, subtree: true });
    }
    // смена настройки «уменьшить движение» на лету
    try {
      var onRM = function () { if (reduced()) { listenGyro(false); FX.scan(doc); var r = doc.querySelectorAll('[data-reveal]'); for (var k = 0; k < r.length; k++) r[k].classList.add('fx-in'); } };
      if (reducedMQ.addEventListener) reducedMQ.addEventListener('change', onRM); else if (reducedMQ.addListener) reducedMQ.addListener(onRM);
    } catch (e) { note(e); }
  });
  // класс fx-js ставим сразу, чтобы элементы не мигали до появления
  try { root.classList.add('fx-js'); } catch (e) { note(e); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', FX.init);
  else FX.init();
})();
