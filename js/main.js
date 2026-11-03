(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* header state */
  var hdr = document.getElementById('hdr');
  var onScroll = function () { hdr.classList.toggle('is-solid', window.scrollY > 20); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* mobile menu */
  var burger = document.getElementById('burger'), mm = document.getElementById('mmenu');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mm.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
  mm.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); closeLb(); } });

  /* scroll reveal */
  var els = document.querySelectorAll('.rv-up');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  /* day / night switch */
  var lights = document.getElementById('lights');
  if (lights) {
    var media = document.getElementById('heroMedia');
    lights.addEventListener('click', function () {
      var day = !media.classList.contains('is-day');
      media.classList.toggle('is-day', day);
      lights.setAttribute('aria-pressed', day);
      document.getElementById('swTxt').textContent = day ? 'Lights back on' : 'See it by day';
      document.getElementById('swLbl').textContent = day ? 'By day' : 'After dark';
    });
  }

  /* draggable strips (mouse); touch uses native scroll */
  document.querySelectorAll('[data-drag]').forEach(function (s) {
    var down = false, sx = 0, sl = 0, moved = 0;
    s.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; sx = e.clientX; sl = s.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) { s.classList.add('is-drag'); s.scrollLeft = sl - dx; }
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      setTimeout(function () { s.classList.remove('is-drag'); }, 0);
    });
    s.addEventListener('click', function (e) { if (moved > 4) { e.preventDefault(); e.stopPropagation(); } }, true);
    s.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });

  /* gallery filter */
  var fbtns = document.querySelectorAll('.filters button');
  fbtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.dataset.f;
      fbtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      document.querySelectorAll('.gitem').forEach(function (g) {
        var show = f === 'all' || g.dataset.cat === f;
        g.classList.toggle('is-hidden', !show);
        if (show) g.classList.add('in');
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* lightbox */
  var lb = document.getElementById('lb'), lbImg = lb && lb.querySelector('img'), lbCap = lb && lb.querySelector('.lb__cap');
  var list = [], idx = 0;
  function items() {
    return Array.prototype.slice.call(document.querySelectorAll('.gitem:not(.is-hidden), [data-lb]'));
  }
  function show(i) {
    list = items(); if (!list.length) return;
    idx = (i + list.length) % list.length;
    var el = list[idx], img = el.tagName === 'IMG' ? el : el.querySelector('img');
    lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt;
    lbCap.textContent = el.dataset.cap || img.alt;
  }
  function openLb(el) { list = items(); show(list.indexOf(el)); lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; lb.querySelector('.lb__close').focus(); }
  function closeLb() { if (!lb || !lb.classList.contains('is-open')) return; lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
  if (lb) {
    document.querySelectorAll('.gitem, [data-lb]').forEach(function (el) { el.addEventListener('click', function () { openLb(el); }); });
    lb.querySelector('.lb__close').addEventListener('click', closeLb);
    lb.querySelector('.lb__prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb__next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* today in hours table */
  var ht = document.getElementById('hours');
  if (ht) { var d = new Date().getDay(); var r = ht.querySelector('tr[data-d="' + d + '"]'); if (r) r.classList.add('today'); }

  /* counter fallback */
  var cnt = document.getElementById('count');

  /* ---------- GSAP (runs after the deferred GSAP files) ---------- */
  document.addEventListener('DOMContentLoaded', initGsap);
  function initGsap() {
  if (!window.gsap || reduce) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });
  var mm2 = gsap.matchMedia();
  mm2.add({ all: 'all', wide: '(min-width: 900px)', reduce: '(prefers-reduced-motion: reduce)' }, function (ctx) {
    var c = ctx.conditions;
    if (c.reduce) return;

    var photo = document.querySelector('.hero__photo');

    /* neon underline draw */
    document.querySelectorAll('.uline path').forEach(function (p) {
      var L = p.getTotalLength(); gsap.set(p, { strokeDasharray: L, strokeDashoffset: L });
      gsap.to(p, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', scrollTrigger: { trigger: p, start: 'top 85%' } });
    });

    /* 71 counter */
    if (cnt) {
      var o = { v: 0 };
      gsap.to(o, { v: +cnt.dataset.to, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: cnt, start: 'top 85%' },
        onUpdate: function () { cnt.textContent = Math.round(o.v); } });
    }

    if (c.wide) {
      if (photo) gsap.to('.hero__photo img', { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.utils.toArray('.stack img:nth-child(2)').forEach(function (im) {
        gsap.fromTo(im, { y: 50 }, { y: -30, ease: 'none', scrollTrigger: { trigger: im, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }
  });
  }
})();
