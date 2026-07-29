(function () {
  var canvas = document.getElementById('ascii-bg');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var hero = document.getElementById('hero');

  var CELL = 10;
  var CHARS = ' .:-+*=%@#';
  var SCALE = 0.018;

  var perm = new Uint8Array(512);
  for (var i = 0; i < 256; i++) perm[i] = i;
  for (var i = 255; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp;
  }
  for (var i = 0; i < 256; i++) perm[i + 256] = perm[i];

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(t, a, b) { return a + t * (b - a); }
  function grad(hash, x, y) {
    var h = hash & 3;
    var u = h < 2 ? x : y;
    var v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }

  function noise(x, y) {
    var X = Math.floor(x) & 255;
    var Y = Math.floor(y) & 255;
    var xf = x - Math.floor(x);
    var yf = y - Math.floor(y);
    var u = fade(xf);
    var v = fade(yf);
    var aa = perm[perm[X] + Y];
    var ab = perm[perm[X] + Y + 1];
    var ba = perm[perm[X + 1] + Y];
    var bb = perm[perm[X + 1] + Y + 1];
    var val = lerp(v,
      lerp(u, grad(aa, xf, yf), grad(ba, xf - 1, yf)),
      lerp(u, grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1)));
    return val * 0.5 + 0.5;
  }

  function resize() {
    var w = hero.clientWidth;
    var h = hero.clientHeight;
    canvas.width = w;
    canvas.height = h;
  }

  resize();
  window.addEventListener('resize', resize);

  var time = 0;

  function draw() {
    time += 0.002;

    var w = canvas.width;
    var h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.font = '10px monospace';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    var cols = Math.ceil(w / CELL);
    var rows = Math.ceil(h / CELL);

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = c * CELL;
        var y = r * CELL;
        var n = noise(x * SCALE + time, y * SCALE + time * 0.7);
        var idx = Math.floor(n * (CHARS.length - 1));
        var ch = CHARS[idx];
        var t = n * n;
        var br = Math.floor(20 + t * 110);
        var bg = Math.floor(18 + t * 108);
        var bb = Math.floor(16 + t * 102);
        ctx.fillStyle = 'rgb(' + br + ',' + bg + ',' + bb + ')';
        ctx.fillText(ch, x, y);
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
