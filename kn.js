/* Каэнри'ах: повноекранна сцена з точки на глобусі (map.js викликає window.knOpen()).
   Око → темніє → вогонь знизу → персонаж → напис з глюками; фоновий гул av/kk_hum.mp3 (як у К. К., без голосу).
   Файли: kn.js, kn.css, kn_icon.png, kn_door.webp, kn_eye.webp, kn_avatar.webp, kn_font.ttf, av/kk_hum.mp3 */
(() => {
  'use strict';
  const HTML = '<div class="eye"><img src="kn_eye.webp?v=1" alt="" draggable="false"></div>\n  <div class="glow"></div>\n  <canvas id="knfx"></canvas>\n  <div class="quote" id="knq" aria-label="For the nation, we can\'t forgo this skyborne power, but we failed"></div>\n  <div class="who"><img src="kn_avatar.webp?v=1" alt="" draggable="false"></div>\n  <canvas id="knfx2"></canvas>\n  <button id="knx" type="button" aria-label="Закрыть">×</button>';
  let API = null;
  function build(){

  const KN = document.createElement('div'); KN.id = 'kn'; KN.setAttribute('role', 'dialog'); KN.setAttribute('aria-modal', 'true'); KN.setAttribute('aria-label', "Каэнри'ах"); KN.setAttribute('aria-hidden', 'true');
  KN.innerHTML = HTML; document.body.appendChild(KN);
  const $ = s => KN.querySelector(s), cv = $('#knfx'), cx = cv.getContext('2d'), cv2 = $('#knfx2'), cx2 = cv2.getContext('2d');
  const QT = "For the nation, we can't forgo this skyborne power, but we failed", KQ = $('#knq');
  const WT = [0, .4, 1.165, 2.345, 2.775, 3.625, 4.525, 5.015, 5.858, 7.378, 7.858, 8.248];   // старт кожного слова в обробленому голосі (с), оцінка за паузами
  const WS = QT.split(' ');
  KQ.innerHTML = WS.map((w, i) => '<span class="w' + (i === WS.length - 1 ? ' fail' : '') + '" data-t="' + w + '" aria-hidden="true" style="transition-delay:' + 0 + 's;--td:' + (2.8 + Math.random() * 2.6).toFixed(2) + 's;--tl:-' + (Math.random() * 4).toFixed(2) + 's;--ed:' + (2.4 + Math.random() * 2.2).toFixed(2) + 's;--gd:' + (6 + Math.random() * 9).toFixed(2) + 's;--gl:-' + (Math.random() * 8).toFixed(2) + 's">' + w + '</span>').join(' ');
  const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* фоновий гул як у К. К. (av/kk_hum.mp3, 3%, зациклений); музика сайту на час сцени приглушується; без голосу */
  const hum = new Audio('av/kk_hum.mp3?v=1'); hum.loop = true; hum.preload = 'auto'; hum.volume = 0;
  const HUM_VOL = 0.03; let humRaf = 0, humWant = false;
  const muted = () => { try { return !!(window.gMusic && window.gMusic.sfxVol && window.gMusic.sfxVol() === 0); } catch (e) { return false; } };
  const duck = on => { try { if (window.gMusic) on ? window.gMusic.hush() : window.gMusic.unhush(); } catch (e) {} };
  function humTo(target, ms, done){
    cancelAnimationFrame(humRaf); const v0 = hum.volume, t0 = performance.now();
    (function st(t){ const k = Math.min(1, (t - t0) / ms); try { hum.volume = Math.max(0, Math.min(1, v0 + (target - v0) * k)); } catch (e) {}
      if (k < 1) humRaf = requestAnimationFrame(st); else done && done(); })(t0); }
  function humOn(){ humWant = true; duck(true); hum.currentTime = 0; hum.play().catch(() => {}); humTo(muted() ? 0 : HUM_VOL, 3000); }
  function humOff(){ if (!humWant) return; humWant = false; humTo(0, 900, () => { if (!humWant){ hum.pause(); duck(false); } }); }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, () => { if (humWant && hum.paused) hum.play().catch(() => {}); }, {passive: true}));

  /* power → ABYSS: лаг-підміна слова */
  const PW = [...KQ.querySelectorAll('.w')].find(w => w.dataset.t === 'power,'), PW0 = 'power,', PA = 'ABYSS,', JUNK = 'ABCDEFGHIKLMNOPRSTUVWXYZ#?!0123456789';
  const junk = n => Array.from({length: n}, () => JUNK[Math.random() * JUNK.length | 0]).join('');
  const setW = (t, abyss, gl) => { PW.textContent = t; PW.dataset.t = t; PW.classList.toggle('fail', abyss); PW.classList.toggle('abyss', abyss); PW.classList.toggle('gl', !!gl); };
  const restoreW = () => PW && setW(PW0, false, false);
  function powerCycle(){
    if (!PW) return; const at = (ms, f) => timers.push(setTimeout(f, ms));
    // power → ABYSS
    setW('p0w#r,', false, true); at(90, () => setW(junk(5), false, true)); at(170, () => setW(PA, true, true));
    at(260, () => setW(PW0, false, true)); at(340, () => setW(PA, true, true)); at(430, () => setW(PA, true, false));
    // тримаємо ABYSS, потім назад
    at(2900, () => setW(junk(5), true, true)); at(3000, () => setW(PA, true, true)); at(3100, () => setW('pow3r', false, true)); at(3200, () => setW(PW0, false, false));
    at(3200 + 5500 + Math.random() * 4500, powerCycle);
  }

  /* ---- купа варіантів глюків для всіх слів, окрім power (його веде powerCycle) ---- */
  const WL = [...KQ.querySelectorAll('.w')]; WL.forEach(w => { w.dataset.o = w.dataset.t; });
  const rnd = n => Math.random() * n | 0, pick = a => a[rnd(a.length)];
  const rest = w => { if (w === PW && PW.classList.contains('abyss')){ w._b = 0; return; } w.textContent = w.dataset.o; w.dataset.t = w.dataset.o; w.className = w.className.replace(/\bg-\w+|\bgl\b/g, '').replace(/\s+/g, ' ').trim(); w._b = 0; };
  const txt = (w, t) => { w.textContent = t; w.dataset.t = t; };
  const gcls = (w, c) => w.classList.add(c);
  const GL = [
    (w, at) => { const o = w.dataset.o; gcls(w, 'gl'); txt(w, junk(o.length)); at(70, () => txt(w, junk(o.length))); at(150, () => { txt(w, o.slice(0, 1) + junk(Math.max(0, o.length - 1))); }); at(240, () => rest(w)); },       // розсип
    (w, at) => { const o = w.dataset.o, a = o[0]; txt(w, a + '-' + a + '-' + o); gcls(w, 'g-jit'); at(110, () => txt(w, a + '-' + o)); at(220, () => txt(w, a + '-' + a + '-' + a + '-' + o)); at(340, () => rest(w)); },     // заїкання
    (w, at) => { const o = w.dataset.o, ch = [...o]; for (let k = 0; k < 1 + rnd(2); k++) ch[rnd(ch.length)] = pick([...JUNK]); gcls(w, 'gl'); txt(w, ch.join('')); at(90, () => { const c2 = [...o]; c2[rnd(c2.length)] = pick([...JUNK]); txt(w, c2.join('')); }); at(200, () => rest(w)); },   // підміна літер
    (w, at) => { const o = w.dataset.o, ch = [...o]; ch.splice(rnd(ch.length), 1 + rnd(2)); gcls(w, 'g-jit'); txt(w, ch.join('')); at(130, () => { txt(w, o + o.slice(-1)); }); at(250, () => rest(w)); },       // випали літери
    (w, at) => { gcls(w, 'g-tear'); at(400, () => rest(w)); },                                                    // розрив зрізами
    (w, at) => { gcls(w, 'g-flip'); at(120, () => w.classList.remove('g-flip')); at(190, () => gcls(w, 'g-flip')); at(310, () => rest(w)); },    // дзеркало
    (w, at) => { gcls(w, 'g-str'); at(100, () => { w.classList.remove('g-str'); gcls(w, 'g-sq'); }); at(210, () => { w.classList.remove('g-sq'); gcls(w, 'g-str'); }); at(300, () => rest(w)); },   // розтяг / сплющення
    (w, at) => { gcls(w, 'g-big'); at(90, () => w.classList.remove('g-big')); at(160, () => gcls(w, 'g-big')); at(250, () => rest(w)); },           // спалах-збільшення
    (w, at) => { gcls(w, 'g-split'); at(110, () => w.classList.remove('g-split')); at(170, () => gcls(w, 'g-split')); at(330, () => rest(w)); },   // роздвоєння
    (w, at) => { gcls(w, 'g-blk'); at(80, () => w.classList.remove('g-blk')); at(140, () => gcls(w, 'g-blk')); at(260, () => rest(w)); },        // чорна діра
    (w, at) => { gcls(w, 'g-tilt'); at(140, () => { w.classList.remove('g-tilt'); gcls(w, 'g-jit'); }); at(280, () => rest(w)); },             // перекіс
    (w, at) => { const o = w.dataset.o; gcls(w, 'gl'); txt(w, o.toLowerCase() === o ? o.toUpperCase() : o.toLowerCase()); at(100, () => txt(w, junk(o.length))); at(190, () => txt(w, o.split('').reverse().join(''))); at(300, () => rest(w)); }   // реверс слова
  ];
  function glitchTick(){
    const burst = Math.random() < .14, n = burst ? 3 + rnd(3) : 1 + rnd(2);
    for (let i = 0; i < n; i++){
      const w = pick(WL); if (w === PW || w._b) continue; w._b = 1;
      const at = (ms, f) => timers.push(setTimeout(f, ms)); pick(GL)(w, at); }
    timers.push(setTimeout(glitchTick, burst ? 1100 + rnd(1200) : 280 + rnd(900)));
  }
  const restoreAll = () => { WL.forEach(w => { if (w !== PW) rest(w); }); KQ.classList.remove('rgb'); KQ.style.visibility = ''; const im = KN.querySelector('.who img'); im && im.classList.remove('kgl'); };

  /* ---- глюки з К. К. (ті самі 9 типів, але на словах) ---- */
  const NOISE = '#@%&▓░01?!/\\|<>', rndCh = () => NOISE[rnd(NOISE.length)];
  const free = ex => WL.filter(w => !w._b && !(w === PW && (PW.dataset.t !== PW0 || PW.classList.contains('gl'))) && !(ex && ex(w)));
  function kkSwap(els, fn, ms, cls){
    const run = els.filter(w => !w._b); run.forEach(w => { w._b = 1; txt(w, fn(w)); if (cls) w.classList.add(cls); });
    timers.push(setTimeout(() => run.forEach(w => rest(w)), ms)); }
  const kkFlash = (w, cls, ms) => { if (w._b) return; w._b = 1; w.classList.add(cls); timers.push(setTimeout(() => rest(w), ms)); };
  /* шифр: 36 груп коду розкладаються по 51 літері пропорційно довжині слів */
  const CODE = '3.2-..3-.23-.32-32.-3..-..2-223-.32-322-..3-..2-2.2-3..-232-223-..2-.32-3.2-..3-.23-3.3-..3-.32-32.-322-.3.-.3.-33.-22.-23.-..3-.23-..2-3..-.2.'.split('-');
  const CP = (() => { let tot = 0, acc = 0, prev = 0, gi = 0; const L = WL.map(w => (w.dataset.o.match(/[A-Za-z]/g) || []).length); L.forEach(n => tot += n);
    return L.map(n => { acc += n; const end = Math.round(acc * CODE.length / tot), s = CODE.slice(prev, end).join('-'); prev = end; return s; }); })();
  function cipher(){
    const run = WL.filter((w, i) => !w._b && free().includes(w) && CP[i]); if (!run.length) return;
    KQ.classList.add('cp'); run.forEach(w => { w._b = 1; txt(w, CP[WL.indexOf(w)]); w.classList.add('g-cp'); });
    timers.push(setTimeout(() => { run.forEach(w => rest(w)); KQ.classList.remove('cp'); }, 750 + Math.random() * 450)); }
  const KK = [
    function allNoise(){ kkSwap(free(), w => Array.from({length: w.dataset.o.length}, rndCh).join(''), 160 + Math.random() * 160, 'g-kr'); },                 // весь текст на мить — символи
    function blockout(){ kkSwap(free(w => w.classList.contains('fail')), w => '▓'.repeat(w.dataset.o.length), 280 + Math.random() * 220, 'g-bk'); },         // усе закрашено ▓, крім червоного
    function split(){ const f = free(); for (let i = 0; i < Math.min(f.length, 2 + rnd(4)); i++) kkFlash(pick(f), Math.random() < .5 ? 'g-kc' : 'g-kr', 90 + Math.random() * 140); },   // RGB-розкол слів
    function corrupt(){ const f = free(), i = rnd(Math.max(1, f.length)); kkSwap(f.slice(i, i + 3 + rnd(4)), w => Array.from({length: w.dataset.o.length}, rndCh).join(''), 110 + Math.random() * 120, 'g-kr'); },   // кілька слів — сміття
    function stutter(){ const f = free(), i = rnd(Math.max(1, f.length)); f.slice(i, i + 5).forEach(w => kkFlash(w, 'g-st', 260)); },                      // шматок смикається
    function rgb(){ KQ.classList.add('rgb'); timers.push(setTimeout(() => KQ.classList.remove('rgb'), 160)); },                                           // весь текст з RGB-розколом
    function dip(){ KQ.style.visibility = 'hidden'; timers.push(setTimeout(() => KQ.style.visibility = '', 70), setTimeout(() => { KQ.style.visibility = 'hidden'; timers.push(setTimeout(() => KQ.style.visibility = '', 50)); }, 160)); },   // зник і повернувся
    function img(){ const im = KN.querySelector('.who img'); im.classList.add('kgl'); timers.push(setTimeout(() => im.classList.remove('kgl'), 150)); },    // картинка смикається
    function tear(){ const f = free(), i = rnd(Math.max(1, f.length)); f.slice(i, i + 3 + rnd(3)).forEach(w => kkFlash(w, 'g-tear', 380)); },               // розрив рядка
    cipher                                                                                                                                              // усі літери → код 3.2-..3-…
  ];
  KK.push(cipher);   // двічі — щоб траплявся частіше

  /* глюки слів у такт лагам голосу: the — заїкання, can't — зависання, skyborne — сповільнення, power — ABYSS, failed — заїкання+дрож */
  const LAG = [[1, w => kkFlash(w, 'g-jit', 380)], [4, w => kkFlash(w, 'g-tear', 420)], [7, w => kkFlash(w, 'g-st', 700)], [8, () => powerCycle()], [11, w => kkFlash(w, 'g-jit', 900)]];
  let lastKK = -1;
  function kkLoop(){
    let k; do { k = rnd(KK.length); } while (k === lastKK); lastKK = k;
    try { KK[k](); } catch (e) {}
    timers.push(setTimeout(kkLoop, 2800 + Math.random() * 1500));   // приблизно раз на 3,5 с, як у К. К.
  }

  /* голос (оброблений: заїкання/сповільнення на the, can't, skyborne, power, failed); стартує разом з написом */
  const voice = new Audio('av/kn_voice.mp3?v=1'); voice.preload = 'auto'; let voiceT0 = 0, voiceWant = false;
  const VDUR = 11;
  function voiceOn(){ voiceWant = true; voiceT0 = performance.now(); try { voice.currentTime = 0; } catch (e) {} voice.volume = muted() ? 0 : .9; voice.play().catch(() => {}); }
  function voiceOff(){ voiceWant = false; voice.pause(); try { voice.currentTime = 0; } catch (e) {} }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, () => { const t = (performance.now() - voiceT0) / 1000;
    if (voiceWant && voice.paused && t < VDUR){ try { voice.currentTime = t; } catch (e) {} voice.play().catch(() => {}); } }, {passive: true}));
  const T_DARK = 5000, T_WHO = 2600;   // 5 с на оці, далі темніє; персонаж за 2,6 с після початку вогню
  let timers = [], raf = 0, fireOn = false, parts = [], last = 0, W = 0, H = 0, dpr = 1;

  /* ===== червоні куби: темні грані, неоновий червоний контур, гравіювання на гранях, повільне обертання + іскри ===== */
  const fr = (a, b) => a + Math.random() * (b - a);
  const CV = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  const CF = [[0,1,2,3],[4,5,6,7],[0,1,5,4],[3,2,6,7],[0,3,7,4],[1,2,6,5]];   // кожна грань — по колу
  const EMB = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,215,200,1)'); g.addColorStop(.2, 'rgba(255,70,55,.95)'); g.addColorStop(.55, 'rgba(255,25,25,.3)'); g.addColorStop(1, 'rgba(255,20,20,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return c; })();
  let cubes = [], tt = 0, nextCube = 0, X = cx, whoK = 0;
  const MASK = new Image(); MASK.src = 'kn_king_mask.webp?v=1';   // силует короля: куби «за ним» ховаються
  let maskC = null, maskSz = 0;
  function maskFor(sz){   // силует × те саме згасання по краях, що в CSS-масці .who — щоб виріз не мав різкого краю
    sz = Math.round(sz); if (maskC && maskSz === sz) return maskC;
    maskC = document.createElement('canvas'); maskC.width = maskC.height = maskSz = sz; const m = maskC.getContext('2d');
    m.drawImage(MASK, 0, 0, sz, sz); m.globalCompositeOperation = 'destination-in';
    m.save(); m.translate(sz * .5, sz * .55); m.scale(sz * .47, sz * .8);
    const g = m.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(.52, 'rgba(0,0,0,1)'); g.addColorStop(.7, 'rgba(0,0,0,.7)'); g.addColorStop(.86, 'rgba(0,0,0,.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = g; m.fillRect(-3, -3, 6, 6); m.restore();
    const l = m.createLinearGradient(0, 0, 0, sz); l.addColorStop(0, 'rgba(0,0,0,0)'); l.addColorStop(.07, 'rgba(0,0,0,1)'); l.addColorStop(1, 'rgba(0,0,0,1)'); m.fillStyle = l; m.fillRect(0, 0, sz, sz);
    return maskC; }
  function size(){ dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = cv2.width = W * dpr; cv.height = cv2.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx2.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function mkCube(anywhere){
    const sc = Math.max(.5, Math.min(1.3, W / 1500)), front = Math.random() < .26, big = Math.random() < (front ? .45 : .22), s = (big ? fr(85, 150) : fr(22, 80)) * sc;
    let x = 0, best = -1; for (let i = 0; i < 10; i++){ const cxp = fr(-.02, 1.02) * W; let d = Math.min(...cubes.map(q => Math.abs(q.x - cxp)), 1e9);
      if (Math.abs(cxp / W - .5) < .2) d *= front ? .08 : (Math.random() < .7 ? .45 : 1);   // перед королем куби майже не літають; позаду — рідко
      if (d > best){ best = d; x = cxp; } }
    const y = anywhere ? fr(.05, 1.05) * H : H + s * 1.8;
    const pats = Array.from({length: 6}, () => ({k: (Math.random() * 4) | 0, d: Array.from({length: 7}, () => [fr(.12, .88), fr(.12, .88), fr(.4, 1)])}));
    cubes.push({x, y, s, front, z: front ? -fr(220, 420) : fr(40, 320), rx: fr(0, 6.28), ry: fr(0, 6.28), rz: fr(0, 6.28), wx: fr(-.35, .35), wy: fr(-.4, .4), wz: fr(-.25, .25),
      vx: fr(-9, 9), vy: -fr(8, 26), age: 0, pats});
  }
  const rot = (v, rx, ry, rz) => { let [x, y, z] = v, c = Math.cos(rx), s = Math.sin(rx), t = y * c - z * s; z = y * s + z * c; y = t;
    c = Math.cos(ry); s = Math.sin(ry); t = x * c + z * s; z = -x * s + z * c; x = t; c = Math.cos(rz); s = Math.sin(rz); t = x * c - y * s; y = x * s + y * c; x = t; return [x, y, z]; };
  const bil = (P, u, v) => [(1 - u) * (1 - v) * P[0][0] + u * (1 - v) * P[1][0] + u * v * P[2][0] + (1 - u) * v * P[3][0], (1 - u) * (1 - v) * P[0][1] + u * (1 - v) * P[1][1] + u * v * P[2][1] + (1 - u) * v * P[3][1]];
  function line(P, u0, v0, u1, v1){ const a = bil(P, u0, v0), b = bil(P, u1, v1); X.moveTo(a[0], a[1]); X.lineTo(b[0], b[1]); }
  function quad(P){ X.moveTo(P[0][0], P[0][1]); for (let i = 1; i < 4; i++) X.lineTo(P[i][0], P[i][1]); X.closePath(); }
  function glowStroke(al){   // тришаровий неон: широкий м'який ореол → червоне ядро → гарячий центр
    X.lineJoin = 'round'; X.lineCap = 'round';
    X.globalAlpha = al * .16; X.strokeStyle = '#ff1f1f'; X.lineWidth = 9; X.stroke();
    X.globalAlpha = al * .9;  X.strokeStyle = '#ff2b2b'; X.lineWidth = 2.4; X.stroke();
    X.globalAlpha = al * .8;  X.strokeStyle = '#ffb4a8'; X.lineWidth = .8; X.stroke(); }
  function drawCube(c){
    const al = Math.min(1, c.age / 1.6), f = 1500, V = CV.map(v => { const r = rot(v, c.rx, c.ry, c.rz), Z = r[2] * c.s + c.z, k = f / (f + Z);
      return [c.x + r[0] * c.s * k, c.y + r[1] * c.s * k, r[2]]; });
    const faces = CF.map((fc, i) => ({i, P: fc.map(j => V[j]), cz: fc.reduce((q, j) => q + V[j][2], 0) / 4}));
    // задні грані — лише тьмяний контур, видно крізь куб
    X.beginPath(); for (const fc of faces) if (fc.cz >= 0) quad(fc.P); glowStroke(al * .22);
    for (const fc of faces){ if (fc.cz >= 0) continue;
      const P = fc.P, lit = .55 + .45 * (-fc.cz);   // грань, що дивиться на глядача, трохи яскравіша
      X.globalAlpha = al; X.fillStyle = `rgba(${70 + 50 * lit | 0},0,10,${.32 + .2 * lit})`; X.beginPath(); quad(P); X.fill();
      const pt = c.pats[fc.i]; X.beginPath();   // гравіювання: рамка + візерунок
      line(P, .1, .1, .9, .1); line(P, .9, .1, .9, .9); line(P, .9, .9, .1, .9); line(P, .1, .9, .1, .1);
      if (pt.k === 0){ line(P, .5, .1, .5, .9); line(P, .1, .5, .9, .5); }
      else if (pt.k === 1){ for (let q = 0; q <= 16; q++){ const an = q / 16 * 6.283, p = bil(P, .5 + Math.cos(an) * .26, .5 + Math.sin(an) * .26); q ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1]); } line(P, .5, .1, .5, .24); line(P, .5, .76, .5, .9); }
      else if (pt.k === 2){ line(P, .1, .5, .35, .5); line(P, .35, .5, .35, .25); line(P, .35, .25, .7, .25); line(P, .7, .25, .7, .7); line(P, .7, .7, .9, .7); line(P, .5, .9, .5, .6); }
      else { line(P, .1, .1, .5, .5); line(P, .9, .1, .5, .5); line(P, .5, .5, .5, .9); }
      X.globalAlpha = al * .5 * lit; X.strokeStyle = '#ff2f2f'; X.lineWidth = 1; X.stroke();
      X.fillStyle = '#ff5a48'; for (const d of pt.d){ const p = bil(P, d[0], d[1]); X.globalAlpha = al * d[2] * .55 * lit; X.fillRect(p[0], p[1], 1.5, 1.5); }   // «іскри» всередині грані
    }
    X.beginPath(); for (const fc of faces) if (fc.cz < 0) quad(fc.P); glowStroke(al);   // яскравий неоновий контур передніх граней
  }
  function spawnEmber(){
    parts.push({x: Math.random() * W, y: H + 10, vx: fr(-20, 30), vy: -fr(40, 170), wd: fr(3, 9), life: 0, max: fr(2.5, 6), ph: fr(0, 6.28), sw: fr(15, 45), sp: fr(2, 5)});
  }
  function loop(ts){
    raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; tt += dt;
    cx.clearRect(0, 0, W, H); cx.globalCompositeOperation = 'lighter';
    if (fireOn){   // fireOn = «ефект увімкнено»
      const N = Math.min(18, 9 + (W / 170 | 0)); nextCube -= dt;
      if (cubes.length < N && nextCube <= 0){ mkCube(true); nextCube = fr(.15, .4); }
      if (parts.length < 90 && Math.random() < dt * 22) spawnEmber();
    }
    for (let i = cubes.length - 1; i >= 0; i--){ const c = cubes[i]; c.age += dt; c.rx += c.wx * dt; c.ry += c.wy * dt; c.rz += c.wz * dt; c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.y < -c.s * 2 || c.x < -c.s * 2 || c.x > W + c.s * 2){ cubes.splice(i, 1); if (fireOn) mkCube(false); } }
    whoK = KN.classList.contains('who-on') ? Math.min(1, whoK + dt / 2) : 0;
    cubes.sort((p, q) => q.z - p.z);   // далекі першими
    cx2.clearRect(0, 0, W, H); cx2.globalCompositeOperation = 'lighter';
    X = cx; for (const c of cubes) if (!c.front) drawCube(c);
    X = cx2; for (const c of cubes) if (c.front) drawCube(c);   // передній план: окремий шар поверх короля, розмитий CSS-ом (як поза фокусом)
    X = cx;
    parts = parts.filter(p => p.life < p.max);
    for (const p of parts){ p.life += dt; const k = p.life / p.max; p.x += (p.vx + Math.sin(p.ph + p.life * p.sp) * p.sw) * dt; p.y += p.vy * dt;
      const tw = .55 + .45 * Math.sin(p.life * 20 + p.ph), s = p.wd * (1 - k * .5); cx.globalAlpha = Math.max(0, Math.sin(Math.PI * k) * tw); cx.drawImage(EMB, p.x - s, p.y - s, s * 2, s * 2); }
    cx.globalAlpha = 1;
    if (whoK > 0 && MASK.complete && MASK.naturalWidth){ const sz = Math.min(H * .8, W, 780); cx.globalCompositeOperation = 'destination-out'; cx.globalAlpha = whoK; cx.drawImage(maskFor(sz), Math.round(W / 2 - sz / 2), Math.round(H - sz)); }   // задній шар: вирізаємо силует короля
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over'; cx2.globalAlpha = 1; cx2.globalCompositeOperation = 'source-over';
  }

  function open(){
    if (KN.classList.contains('on')) return;
    size(); parts = []; cubes = []; nextCube = 0; fireOn = false; last = 0;
    KN.classList.remove('dark', 'fire', 'who-on'); KQ.classList.remove('on'); WL.forEach(w => w.classList.remove('sh')); restoreW(); KN.setAttribute('aria-hidden', 'false'); void KN.offsetWidth; KN.classList.add('on');
    timers.push(setTimeout(() => { KN.classList.add('dark'); }, T_DARK));
    timers.push(setTimeout(() => { KN.classList.add('fire'); fireOn = !RM; }, T_DARK + 500));
    timers.push(setTimeout(() => { KN.classList.add('who-on'); }, T_DARK + 500 + T_WHO));
    const TQ = T_DARK + 500 + T_WHO + 900;   // напис і голос стартують разом
    timers.push(setTimeout(() => { KQ.classList.add('on'); voiceOn(); }, TQ));
    WL.forEach((w, i) => timers.push(setTimeout(() => w.classList.add('sh'), TQ + WT[i] * 1000 + 30)));
    LAG.forEach(([i, f]) => timers.push(setTimeout(() => f(WL[i]), TQ + WT[i] * 1000 + 60)));
    timers.push(setTimeout(glitchTick, TQ + 9500));
    timers.push(setTimeout(kkLoop, TQ + 10500));
    if (!RM) raf = requestAnimationFrame(loop);
    humOn();
    window.dispatchEvent(new Event('kn:open'));
    $('#knx').focus({preventScroll: true});
  }
  function close(){
    timers.forEach(clearTimeout); timers = []; restoreW(); restoreAll(); cancelAnimationFrame(raf); fireOn = false;
    humOff(); voiceOff();
    KN.classList.remove('on'); KN.setAttribute('aria-hidden', 'true');
    setTimeout(() => { if (!KN.classList.contains('on')){ KN.classList.remove('dark', 'fire', 'who-on'); KQ.classList.remove('on'); WL.forEach(w => w.classList.remove('sh')); cx.clearRect(0, 0, W, H); parts = []; } }, 950);
    window.dispatchEvent(new Event('kn:close'));
  }

  $('#knx').addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape' && KN.classList.contains('on')) close(); });
  addEventListener('resize', () => { if (KN.classList.contains('on')) size(); });
  return {open, close, isOpen: () => KN.classList.contains('on')};

  }
  window.knOpen = () => { if (!API) API = build(); API.open(); };
  window.knClose = () => { API && API.close(); };
})();
