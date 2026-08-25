(function () {
  var layer = document.querySelector('.scene-layer');
  if (!layer) return;

  var S = 20;
  var SQRT3 = Math.sqrt(3);
  var W = SQRT3 * S;
  var FADE_MS = 400;

  var svgNS = 'http://www.w3.org/2000/svg';

  function makeHex() {
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'hex-highlight');
    svg.setAttribute('viewBox', '-17.3205 -20 34.641 40');
    var path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M0 -20 17.3205 -10 17.3205 10 0 20 -17.3205 10 -17.3205 -10Z');
    svg.appendChild(path);
    svg.style.opacity = '0';
    layer.appendChild(svg);
    return svg;
  }

  var hexA = makeHex();
  var hexB = makeHex();
  var current = null;
  var fading = null;
  var fadingStart = 0;
  var rafPending = false;

  function roundCell(qf, rf) {
    var xf = qf;
    var yf = -qf - rf;
    var zf = rf;
    var rx = Math.round(xf);
    var ry = Math.round(yf);
    var rz = Math.round(zf);
    var dx = Math.abs(rx - xf);
    var dy = Math.abs(ry - yf);
    var dz = Math.abs(rz - zf);
    if (dx > dy && dx > dz) {
      rx = -ry - rz;
    } else if (dy > dz) {
      ry = -rx - rz;
    } else {
      rz = -rx - ry;
    }
    return { q: rx, r: rz };
  }

  function pick(lx, ly) {
    var qf = ((SQRT3 / 3) * lx - ly / 3) / S;
    var rf = ((2 / 3) * ly) / S;
    return roundCell(qf, rf);
  }

  function show(el, cell) {
    var cx = W * (cell.q + cell.r / 2);
    var cy = S * 1.5 * cell.r;
    el.style.transform = 'translate(' + cx + 'px, ' + cy + 'px)';
    el.style.opacity = '1';
  }

  function tick(now) {
    rafPending = false;
    if (!fading) return;
    var t = (now - fadingStart) / FADE_MS;
    if (t >= 1) {
      fading.el.style.opacity = '0';
      fading = null;
      return;
    }
    fading.el.style.opacity = String(1 - t);
    rafPending = true;
    requestAnimationFrame(tick);
  }

  function startFadeLoop() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(tick);
  }

  function hideAll() {
    hexA.style.opacity = '0';
    hexB.style.opacity = '0';
    current = null;
    fading = null;
  }

  function onMove(e) {
    var rect = layer.getBoundingClientRect();
    var lx = e.clientX - rect.left;
    var ly = e.clientY - rect.top;
    if (lx < 0 || ly < 0 || lx > rect.width || ly > rect.height) {
      hideAll();
      return;
    }
    var cell = pick(lx, ly);
    var key = cell.q + ',' + cell.r;
    if (current && current.key === key) return;

    if (fading) fading.el.style.opacity = '0';
    fading = current;
    fadingStart = performance.now();

    var el = fading && fading.el === hexA ? hexB : hexA;
    current = { el: el, key: key };
    show(el, cell);
    startFadeLoop();
  }

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseout', function (e) {
    if (!e.relatedTarget) hideAll();
  });
})();
