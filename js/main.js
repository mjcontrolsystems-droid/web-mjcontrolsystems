/* MJ Control Systems — interacciones
   Fondo de nodos que reacciona al mouse, tarjetas 3D, escudo que sigue el cursor,
   contadores, animaciones al hacer scroll y menú móvil. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* menú móvil */
  var mb = document.getElementById('menuBtn'), nl = document.getElementById('navLinks');
  if (mb) mb.addEventListener('click', function () { nl.classList.toggle('open'); });
  if (nl) nl.addEventListener('click', function (e) { if (e.target.tagName === 'A') nl.classList.remove('open'); });

  /* aparición al hacer scroll */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .14 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* contadores */
  function run(el) {
    var t = +el.dataset.count, s = el.dataset.suffix || '', st = performance.now(), d = 1100;
    function f(n) { var p = Math.min((n - st) / d, 1), v = Math.round(t * (1 - Math.pow(1 - p, 3))); el.textContent = v + s; if (p < 1) requestAnimationFrame(f); }
    requestAnimationFrame(f);
  }
  var co = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { run(e.target); co.unobserve(e.target); } });
  }, { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach(function (el) { co.observe(el); });

  if (reduce) return;

  /* tarjetas con inclinación 3D + reflejo que sigue el cursor */
  document.querySelectorAll('.tilt').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.transform = 'perspective(800px) rotateY(' + ((x - .5) * 8) + 'deg) rotateX(' + ((.5 - y) * 8) + 'deg) translateY(-4px)';
      c.style.setProperty('--mx', (x * 100) + '%'); c.style.setProperty('--my', (y * 100) + '%');
    });
    c.addEventListener('pointerleave', function () { c.style.transform = ''; });
  });

  /* escudo del hero sigue el mouse */
  var sh = document.getElementById('shield');
  if (sh) {
    var scene = sh.parentElement;
    scene.addEventListener('pointermove', function (e) {
      var r = scene.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      sh.style.transform = 'rotateY(' + (x * 26) + 'deg) rotateX(' + (-y * 26) + 'deg)';
    });
    scene.addEventListener('pointerleave', function () { sh.style.transform = ''; });
  }

  /* ===== red de nodos animada y reactiva al mouse ===== */
  var cv = document.getElementById('nodes'); if (!cv) return;
  var ctx = cv.getContext('2d'), W, H, pts, DPR = Math.min(devicePixelRatio || 1, 2);
  var mouse = { x: -9999, y: -9999, on: false };

  function size() {
    W = cv.width = innerWidth * DPR; H = cv.height = innerHeight * DPR;
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    var n = Math.min(90, Math.floor(innerWidth / 18)); pts = [];
    for (var i = 0; i < n; i++) pts.push({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .3 * DPR, vy: (Math.random() - .5) * .3 * DPR
    });
  }
  size(); addEventListener('resize', size);

  addEventListener('pointermove', function (e) { mouse.x = e.clientX * DPR; mouse.y = e.clientY * DPR; mouse.on = true; });
  addEventListener('pointerleave', function () { mouse.on = false; });

  var LINK = 150 * DPR, LINK2 = LINK * LINK;   // distancia de conexión entre nodos
  var PULL = 190 * DPR, PULL2 = PULL * PULL;    // radio de influencia del mouse

  function tick() {
    ctx.clearRect(0, 0, W, H);
    var i, j, p, a, b, dx, dy, d2, o;

    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      // leve atracción hacia el cursor
      if (mouse.on) {
        dx = mouse.x - p.x; dy = mouse.y - p.y; d2 = dx * dx + dy * dy;
        if (d2 < PULL2 && d2 > 1) { var f = (1 - d2 / PULL2) * .035; p.vx += dx / Math.sqrt(d2) * f; p.vy += dy / Math.sqrt(d2) * f; }
      }
      p.x += p.vx; p.y += p.vy;
      // fricción + límite de velocidad
      p.vx *= .992; p.vy *= .992;
      var sp = p.vx * p.vx + p.vy * p.vy, mx = .55 * DPR * .55 * DPR;
      if (sp > mx) { var s = Math.sqrt(mx / sp); p.vx *= s; p.vy *= s; }
      if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
    }

    // líneas entre nodos
    for (i = 0; i < pts.length; i++) {
      for (j = i + 1; j < pts.length; j++) {
        a = pts[i]; b = pts[j]; dx = a.x - b.x; dy = a.y - b.y; d2 = dx * dx + dy * dy;
        if (d2 < LINK2) { o = 1 - d2 / LINK2; ctx.strokeStyle = 'rgba(96,140,220,' + (o * .32) + ')'; ctx.lineWidth = DPR; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
    }

    // líneas hacia el cursor (resaltan la zona del mouse)
    if (mouse.on) {
      for (i = 0; i < pts.length; i++) {
        p = pts[i]; dx = p.x - mouse.x; dy = p.y - mouse.y; d2 = dx * dx + dy * dy;
        if (d2 < PULL2) { o = 1 - d2 / PULL2; ctx.strokeStyle = 'rgba(88,199,255,' + (o * .5) + ')'; ctx.lineWidth = DPR; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
      }
    }

    // nodos
    for (i = 0; i < pts.length; i++) {
      p = pts[i]; var near = mouse.on && ((p.x - mouse.x) * (p.x - mouse.x) + (p.y - mouse.y) * (p.y - mouse.y)) < PULL2;
      ctx.fillStyle = near ? 'rgba(120,200,255,.95)' : 'rgba(120,165,235,.7)';
      ctx.beginPath(); ctx.arc(p.x, p.y, (near ? 2.2 : 1.5) * DPR, 0, 6.283); ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  tick();
})();
