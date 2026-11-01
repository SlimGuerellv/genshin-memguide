/* Каэнри'ах: повноекранна сцена з точки на глобусі (map.js викликає window.knOpen()).
   Око → темніє → вогонь знизу → персонаж → напис з глюками; фоновий гул av/kk_hum.mp3 (як у К. К., без голосу).
   Файли: kn.js, kn.css, kn_icon.png, kn_door.webp, kn_eye.webp, kn_avatar.webp, kn_font.ttf, av/kk_hum.mp3 */
(() => {
  'use strict';
  const HTML = '<div class="eye"><img src="kn_eye.webp?v=1" alt="" draggable="false"></div>\n  <div class="glow"></div>\n  <canvas id="knfx"></canvas>\n  <div class="quote" id="knq" aria-label="For the nation, we can\'t forgo this skyborne power, but we failed"></div>\n  <div class="who"><img src="kn_avatar.webp?v=1" alt="" draggable="false"></div>\n  <button id="knx" type="button" aria-label="Закрыть">×</button>';
  let API = null;
  function build(){

  const KN = document.createElement('div'); KN.id = 'kn'; KN.setAttribute('role', 'dialog'); KN.setAttribute('aria-modal', 'true'); KN.setAttribute('aria-label', "Каэнри'ах"); KN.setAttribute('aria-hidden', 'true');
  KN.innerHTML = HTML; document.body.appendChild(KN);
  const $ = s => KN.querySelector(s), cv = $('#knfx'), cx = cv.getContext('2d');
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

  /* спрайти вогню */
  const spr = (r, g, b) => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(.35, `rgba(${r},${g},${b},.45)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c; };
  const SP = [spr(255, 50, 30), spr(255, 90, 40), spr(200, 50, 200), spr(140, 60, 255)];

  function size(){ dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function spawn(){
    const x = Math.random() * W, big = Math.random() < .18;
    // ближче до низу — червоний, вище — фіолетовий (колір міняється з висотою в draw)
    parts.push({x, y: H + 20, vx: (Math.random() - .5) * 26, vy: -(70 + Math.random() * 170), s: big ? 80 + Math.random() * 90 : 22 + Math.random() * 42,
      life: 0, max: 1.6 + Math.random() * 2.4, ph: Math.random() * 6.28, w: 18 + Math.random() * 40});
  }
  function loop(ts){
    raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
    cx.clearRect(0, 0, W, H); cx.globalCompositeOperation = 'lighter';
    if (fireOn){ const n = parts.length < 420 ? 8 : 0; for (let i = 0; i < n * (dt * 60 / 2 + .5) | 0; i++) spawn(); }
    parts = parts.filter(p => p.life < p.max);
    for (const p of parts){
      p.life += dt; const k = p.life / p.max;
      p.x += (p.vx + Math.sin(p.ph + p.life * 2.4) * p.w) * dt; p.y += p.vy * dt; p.vy *= (1 - .12 * dt);
      const h = 1 - Math.max(0, Math.min(1, p.y / H));            // 0 знизу … 1 вгорі
      const idx = h < .25 ? (Math.random() < .5 ? 0 : 1) : h < .5 ? 1 : h < .7 ? 2 : 3;
      const a = Math.sin(Math.PI * Math.min(1, k * 1.15)) * (.5 - h * .3);
      cx.globalAlpha = Math.max(0, a); const s = p.s * (1 - k * .5);
      cx.drawImage(SP[idx], p.x - s * .3, p.y - s * .95, s * .6, s * 1.9);   // витягнуті язики
    }
    cx.globalAlpha = 1;
  }

  function open(){
    if (KN.classList.contains('on')) return;
    size(); parts = []; fireOn = false; last = 0;
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
