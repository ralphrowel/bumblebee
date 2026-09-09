/* =============================================================
   honeycomb-hover.js

   Two effects only:

   1. HOVER  — mouse moves over a hex → that hex lights up.
               Moving away → old hex fades out (the "tail").

   2. CLICK  — clicking anywhere fires a radial ripple that
               spreads outward hex-ring by hex-ring from the
               click origin. Outer rings are progressively
               dimmer. Each hex fades back after the wave passes.
   ============================================================= */
(function () {
  var layer = document.querySelector('.scene-layer');
  if (!layer) return;

  /* ─── Hex grid ─────────────────────────────────────────────── */
  var S     = 20;
  var SQRT3 = Math.sqrt(3);
  var W     = SQRT3 * S;

  /* ─── Canvas ────────────────────────────────────────────────── */
  var canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
  layer.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ─── Hex math ──────────────────────────────────────────────── */
  function hexCenter(q, r) {
    return { x: W * (q + r * 0.5), y: S * 1.5 * r };
  }

  function pixelToAxial(px, py) {
    var qf = (SQRT3 / 3 * px - py / 3) / S;
    var rf = (2  / 3 * py) / S;
    var sf = -qf - rf;
    var rq = Math.round(qf), rr = Math.round(rf), rs = Math.round(sf);
    var dq = Math.abs(rq - qf), dr = Math.abs(rr - rf), ds = Math.abs(rs - sf);
    if (dq > dr && dq > ds) rq = -rr - rs;
    else if (dr > ds)       rr = -rq - rs;
    return { q: rq, r: rr };
  }

  /* Axial hex distance */
  function hexDist(q1, r1, q2, r2) {
    var dq = q1 - q2, dr = r1 - r2;
    return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
  }

  function hexPath(cx, cy) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = (60 * i - 90) * Math.PI / 180;
      if (i === 0) ctx.moveTo(cx + S * Math.cos(a), cy + S * Math.sin(a));
      else         ctx.lineTo(cx + S * Math.cos(a), cy + S * Math.sin(a));
    }
    ctx.closePath();
  }

  function drawHex(cx, cy, alpha, useGrad) {
    ctx.save();
    hexPath(cx, cy);
    ctx.clip();
    if (useGrad) {
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 1.15);
      g.addColorStop(0,   'rgba(255,215,110,' + Math.min(alpha * 1.5, 1).toFixed(3) + ')');
      g.addColorStop(0.5, 'rgba(240,184,76,'  + alpha.toFixed(3) + ')');
      g.addColorStop(1,   'rgba(200,155,50,'  + (alpha * 0.5).toFixed(3) + ')');
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = 'rgba(240,184,76,' + alpha.toFixed(3) + ')';
    }
    ctx.fill();
    ctx.restore();
  }

  /* ================================================================
     CLICK WAVE — radial ripple from clicked hex
  ================================================================
     When user clicks:
       - Determine the clicked hex cell
       - Store { q0, r0, t0 } in the clicks array
     Each frame:
       - For every hex, compute axial distance to each active click
       - A hex at distance d gets lit when wave front arrives (d × RING_MS)
       - Alpha fades quadratically after the front passes
       - Outer rings are progressively dimmer
  ================================================================ */
  var RING_MS    = 55;    // ms between rings — wave propagation speed
  var FLASH_MS   = 80;    // ms — brief bright flash as wave front hits
  var FADE_MS    = 480;   // ms — glow decay after the flash
  var MAX_RINGS  = 28;    // how many rings the wave spreads
  var CLICK_PEAK = 0.52;  // alpha of ring 0 at peak

  /* Total life of a click event */
  var CLICK_LIFE = MAX_RINGS * RING_MS + FLASH_MS + FADE_MS;

  var clicks = []; // { q0, r0, t0 }

  function clickAlpha(q, r, click, now) {
    var d       = hexDist(q, r, click.q0, click.r0);
    if (d > MAX_RINGS) return 0;

    var elapsed  = now - click.t0;
    var arrival  = d * RING_MS;       // when wave front reaches this hex

    if (elapsed < arrival) return 0;  // not reached yet

    var since    = elapsed - arrival;
    var total    = FLASH_MS + FADE_MS;
    if (since >= total) return 0;

    /* Alpha profile: quick flash peak, then slow fade */
    var peakFrac = FLASH_MS / total;  // fraction of total used for flash phase
    var progress;
    if (since < FLASH_MS) {
      /* Rising flash: 0 → 1 over FLASH_MS */
      progress = since / FLASH_MS;
      var raw = Math.sin(progress * Math.PI * 0.5); // ease-in sine
      var distFade = 1 - d / MAX_RINGS;
      return CLICK_PEAK * distFade * raw;
    } else {
      /* Decaying tail */
      var t = (since - FLASH_MS) / FADE_MS; // 0 → 1
      var decay = (1 - t) * (1 - t);       // quadratic ease-out
      var distFade = 1 - d / MAX_RINGS;
      return CLICK_PEAK * distFade * decay;
    }
  }

  /* ================================================================
     HOVER — single hex + fading tail
  ================================================================ */
  var HOVER_ALPHA   = 0.58;
  var HOVER_FADE_MS = 650;

  var hoverCur  = null; // { q, r }
  var hoverPrev = null; // { q, r, t0 }

  /* ================================================================
     RENDER LOOP
  ================================================================ */
  var rafRunning = false;

  function drawFrame(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Purge expired clicks */
    clicks = clicks.filter(function (c) { return now - c.t0 < CLICK_LIFE; });

    var anythingActive = clicks.length > 0 || hoverCur || hoverPrev;

    if (anythingActive) {
      var rMin = -2;
      var rMax = Math.ceil(canvas.height / (S * 1.5)) + 2;
      var qMin = -4;
      var qMax = Math.ceil(canvas.width  / W) + 5;

      for (var r = rMin; r <= rMax; r++) {
        for (var q = qMin; q <= qMax; q++) {
          var c = hexCenter(q, r);

          if (c.x < -S * 3 || c.x > canvas.width  + S * 3 ||
              c.y < -S * 3 || c.y > canvas.height + S * 3) continue;

          var alpha = 0;
          var useGrad = false;

          /* Click wave contributions */
          for (var i = 0; i < clicks.length; i++) {
            var ca = clickAlpha(q, r, clicks[i], now);
            if (ca > alpha) alpha = ca;
          }

          /* Hover — current */
          var isHoverCur = hoverCur && hoverCur.q === q && hoverCur.r === r;
          if (isHoverCur) {
            alpha   = HOVER_ALPHA;
            useGrad = true;
          }

          /* Hover — fading tail */
          if (hoverPrev && hoverPrev.q === q && hoverPrev.r === r && !isHoverCur) {
            var t  = (now - hoverPrev.t0) / HOVER_FADE_MS;
            if (t >= 1) {
              hoverPrev = null;
            } else {
              var ft = 1 - (1 - t) * (1 - t) * (1 - t); // ease-out cubic
              var ta = HOVER_ALPHA * (1 - ft);
              if (ta > alpha) { alpha = ta; useGrad = true; }
            }
          }

          if (alpha < 0.005) continue;
          drawHex(c.x, c.y, alpha, useGrad);
        }
      }
    }

    rafRunning = anythingActive;
    if (rafRunning) requestAnimationFrame(drawFrame);
  }

  function ensureLoop() {
    if (!rafRunning) {
      rafRunning = true;
      requestAnimationFrame(drawFrame);
    }
  }

  /* ─── Mouse hover ───────────────────────────────────────────── */
  var lastHoverKey = null;

  window.addEventListener('mousemove', function (e) {
    var cell = pixelToAxial(e.clientX, e.clientY);
    var key  = cell.q + ',' + cell.r;
    if (key === lastHoverKey) return;
    lastHoverKey = key;
    if (hoverCur) {
      hoverPrev = { q: hoverCur.q, r: hoverCur.r, t0: performance.now() };
    }
    hoverCur = { q: cell.q, r: cell.r };
    ensureLoop();
  });

  window.addEventListener('mouseout', function (e) {
    if (!e.relatedTarget) {
      if (hoverCur) {
        hoverPrev = { q: hoverCur.q, r: hoverCur.r, t0: performance.now() };
        hoverCur  = null;
      }
      lastHoverKey = null;
    }
  });

  /* ─── Click wave ────────────────────────────────────────────── */
  window.addEventListener('click', function (e) {
    /* Don't fire wave on button/link clicks — let those elements handle themselves */
    var tag = e.target.tagName;
    if (tag === 'BUTTON' || tag === 'A' || e.target.closest('button, a')) return;

    var cell = pixelToAxial(e.clientX, e.clientY);
    clicks.push({ q0: cell.q, r0: cell.r, t0: performance.now() });
    ensureLoop();
  });

})();
