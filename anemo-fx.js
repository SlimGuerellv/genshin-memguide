/*!
 * anemo-fx.js — анімація вітру й Анемо для переходу «клік по регіону → картка».
 * Без залежностей, чистий canvas. Працює на ПК і телефоні.
 *
 * Використання:
 *   AnemoFX.play().then(() => openRegionCard('mond'));
 *   AnemoFX.play({ x: clientX, y: clientY })        // центр ефекту (за замовчуванням центр екрана)
 *   AnemoFX.play({ duration: 2200, resolveAt: .8 }) // resolveAt: коли віддати Promise (частка тривалості)
 *   AnemoFX.play({ colors: { main:'#ffd36b', deep:'#d49a1f', white:'#fff8e1' } }) // інший регіон
 *
 * Promise вирішується на resolveAt (за замовчуванням 0.8): картка починає з'являтись,
 * поки ефект ще доплаває й зникає, без паузи між ними.
 * prefers-reduced-motion: ефект пропускається, Promise вирішується одразу.
 */
(function (global) {
  'use strict';

  var FPS = 30; // «кадри» рахуємо як у Remotion-версії: 60 кадрів = 2 с

  var PRESET_ANEMO = { main: '#8ff5d3', deep: '#3fc4a0', white: '#f2fffb' };

  // ---------- допоміжне ----------
  // детерміновані псевдовипадкові числа (щоб кожен запуск виглядав однаково)
  function rand(seed) {
    var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeOut(t) { t = clamp01(t); return 1 - Math.pow(1 - t, 3); }
  function lerp(frame, ins, outs) { // piecewise-linear interpolate з clamp
    if (frame <= ins[0]) return outs[0];
    for (var i = 1; i < ins.length; i++) {
      if (frame <= ins[i]) {
        var t = (frame - ins[i - 1]) / (ins[i] - ins[i - 1]);
        return outs[i - 1] + (outs[i] - outs[i - 1]) * t;
      }
    }
    return outs[outs.length - 1];
  }
  function rgba(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function makeSpiral(i, size, speedMul) {
    speedMul = speedMul || 1;
    return {
      base: rand(i * 3 + 1) * Math.PI * 2,
      turns: (0.7 + rand(i * 3 + 2) * 0.8) * speedMul,
      dir: rand(i * 7 + 5) > 0.5 ? 1 : -1,
      rMin: size * (0.04 + rand(i * 5 + 4) * 0.05),
      rMax: size * (0.32 + rand(i * 11 + 9) * 0.2),
      delay: rand(i * 3 + 3) * 16,
      life: 30 + rand(i * 13 + 2) * 10
    };
  }
  function pointOn(sp, cx, cy, s) {
    var a = sp.base + sp.dir * s * sp.turns * Math.PI * 2;
    var r = sp.rMin + (sp.rMax - sp.rMin) * easeOut(s);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.85, a];
  }

  // ---------- малювання одного кадру ----------
  // frame: «кадр» (float) від 0 до total. Малює в ctx, що вже масштабований під CSS-пікселі.
  function drawFrame(ctx, w, h, frame, total, opt) {
    opt = opt || {};
    var col = opt.colors || PRESET_ANEMO;
    var cx = opt.x != null ? opt.x : w / 2;
    var cy = opt.y != null ? opt.y : h / 2;
    var size = opt.size || Math.min(w, h);
    var i, k;

    ctx.clearRect(0, 0, w, h);

    var envelope = lerp(frame, [0, 4, total - 14, total - 1], [0, 1, 1, 0]);
    if (envelope <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = envelope;
    ctx.globalCompositeOperation = 'lighter'; // світло накладається, дає «сяйво» без важких blur-фільтрів

    // --- ядро ---
    var coreOpacity = lerp(frame, [0, 6, 28, 48], [0, 0.95, 0.6, 0]);
    var coreR = lerp(frame, [0, 14, 44], [size * 0.03, size * 0.2, size * 0.12]);
    if (coreOpacity > 0.01) {
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.2);
      g.addColorStop(0, rgba(col.white, coreOpacity));
      g.addColorStop(0.45, rgba(col.main, coreOpacity * 0.7));
      g.addColorStop(1, rgba(col.deep, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- кільця-хвилі ---
    function ring(start, dur, maxR) {
      var t = clamp01((frame - start) / dur);
      if (t <= 0 || t >= 1) return;
      var r = size * 0.05 + easeOut(t) * maxR;
      ctx.strokeStyle = rgba(col.main, (1 - t) * 0.8);
      ctx.lineWidth = 6 * (1 - t) + 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.85, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ring(2, 26, size * 0.52);
    ring(10, 28, size * 0.42);

    // --- вітряні смуги ---
    var STREAKS = opt.streaks || 16;
    var TAIL = 22;
    ctx.lineCap = 'round';
    for (i = 0; i < STREAKS; i++) {
      var sp = makeSpiral(i, size);
      var s = clamp01((frame - sp.delay) / sp.life);
      if (s <= 0) continue;
      var fade = s < 0.75 ? 1 : clamp01((1 - s) / 0.25);
      var baseW = 3 + rand(i * 17 + 1) * 4;
      var prev = pointOn(sp, cx, cy, s);
      for (k = 1; k <= TAIL; k++) {
        var sk = s - k * 0.016;
        if (sk < 0) break;
        var p = pointOn(sp, cx, cy, sk);
        var t = 1 - k / TAIL;
        var o = t * fade;
        // широкий м'який шар (світіння)
        ctx.strokeStyle = rgba(col.main, o * 0.28);
        ctx.lineWidth = baseW * t * 3.2;
        ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
        // тонкий яскравий шар
        ctx.strokeStyle = rgba(col.white, o);
        ctx.lineWidth = baseW * t;
        ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
        prev = p;
      }
    }

    // --- листя ---
    var LEAVES = opt.leaves || 9;
    for (i = 0; i < LEAVES; i++) {
      var lsp = makeSpiral(i + 40, size, 0.8);
      var ls = clamp01((frame - lsp.delay - 4) / (lsp.life + 8));
      if (ls <= 0 || ls >= 1) continue;
      var lp = pointOn(lsp, cx, cy, ls);
      var lfade = ls < 0.7 ? 1 : clamp01((1 - ls) / 0.3);
      var sc = 0.8 + rand(i * 19 + 3) * 0.9;
      var rot = lp[2] + frame * (6 + rand(i) * 6) * lsp.dir * Math.PI / 180;
      ctx.save();
      ctx.translate(lp[0], lp[1]);
      ctx.rotate(rot);
      ctx.scale(sc, sc);
      ctx.globalAlpha = envelope * lfade;
      ctx.fillStyle = col.deep;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.bezierCurveTo(11, -8, 11, 8, 0, 16);
      ctx.bezierCurveTo(-11, 8, -11, -8, 0, -14);
      ctx.fill();
      ctx.strokeStyle = rgba(col.white, 0.8);
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 14); ctx.stroke();
      ctx.restore();
    }

    // --- іскорки ---
    var SPARKS = opt.sparks || 34;
    ctx.fillStyle = col.white;
    for (i = 0; i < SPARKS; i++) {
      var ssp = makeSpiral(i + 100, size, 1.3);
      var ss = clamp01((frame - ssp.delay) / (ssp.life + 10));
      if (ss <= 0 || ss >= 1) continue;
      var pp = pointOn(ssp, cx, cy, ss);
      var tw = 0.5 + 0.5 * Math.sin(frame * 0.9 + i * 2.1);
      var sf = ss < 0.6 ? 1 : clamp01((1 - ss) / 0.4);
      ctx.globalAlpha = envelope * sf * (0.5 + tw * 0.5);
      ctx.beginPath();
      ctx.arc(pp[0], pp[1], 1.5 + rand(i * 23 + 7) * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ---------- керування відтворенням ----------
  var current = null; // {promise, cancel}

  function play(opts) {
    opts = opts || {};
    if (current) return current.promise;

    var reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || opts.skip) return Promise.resolve();

    var duration = opts.duration || 2000;
    var resolveAt = opts.resolveAt != null ? opts.resolveAt : 0.8;
    var total = duration / 1000 * FPS;

    var w = global.innerWidth;
    var h = global.innerHeight;
    var dpr = Math.min(global.devicePixelRatio || 1, opts.maxDpr || 2);

    var cv = document.createElement('canvas');
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText =
      'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:' +
      (opts.zIndex != null ? opts.zIndex : 9999) + ';';
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var drawOpt = {
      x: opts.x, y: opts.y, size: opts.size,
      colors: opts.colors ? Object.assign({}, PRESET_ANEMO, opts.colors) : PRESET_ANEMO
    };

    var raf = 0, done = false, resolved = false, resolveFn;
    var promise = new Promise(function (res) { resolveFn = res; });

    function finish() {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      if (cv.parentNode) cv.parentNode.removeChild(cv);
      current = null;
      if (!resolved) { resolved = true; resolveFn(); }
    }

    var t0 = null;
    function tick(now) {
      if (done) return;
      if (t0 === null) t0 = now;
      var elapsed = now - t0;
      var frame = elapsed / 1000 * FPS;
      drawFrame(ctx, w, h, frame, total, drawOpt);
      if (!resolved && elapsed >= duration * resolveAt) { resolved = true; resolveFn(); }
      if (elapsed >= duration) return finish();
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    // страховка: якщо вкладка у фоні й rAF стоїть, не залишаємо користувача без картки
    var guard = setTimeout(function () { finish(); }, duration + 1500);
    var origFinish = finish;
    finish = function () { clearTimeout(guard); origFinish(); };

    current = { promise: promise, cancel: finish };
    return promise;
  }

  function cancel() { if (current) current.cancel(); }

  global.AnemoFX = {
    play: play,
    cancel: cancel,
    presets: { anemo: PRESET_ANEMO },
    _draw: drawFrame // для тестів: ручне малювання конкретного кадру
  };
})(window);
