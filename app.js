// Общий код сайта (index.html и map.html): персонажи и их карточки, эффекты, фон, главная, словарь, артефакты, музыка.
const HVJ = id => JSON.parse(JSON.stringify(window.HVD[id]));   // копия данных из data.js
(function(){
  const CHARS = HVJ('data');
  const ICONS = HVJ('icons');
  const ELEMENTS = [
    {key:'all',    name:'Все',     ic:'🔄', c:'var(--any)', emoji:true},
    {key:'pyro',   name:'Пиро',    ic:'🔥', c:'var(--pyro)'},
    {key:'hydro',  name:'Гидро',   ic:'💧', c:'var(--hydro)'},
    {key:'anemo',  name:'Анемо',   ic:'🌪️', c:'var(--anemo)'},
    {key:'electro',name:'Электро', ic:'⚡', c:'var(--electro)'},
    {key:'dendro', name:'Дендро',  ic:'🌿', c:'var(--dendro)'},
    {key:'cryo',   name:'Крио',    ic:'❄️', c:'var(--cryo)'},
    {key:'geo',    name:'Гео',     ic:'🪨', c:'var(--geo)'},
  ];
  const byName = Object.fromEntries(ELEMENTS.map(e=>[e.name,e]));
  const ANY = {key:'any', name:'Любая', ic:'🌟', c:'var(--any)', emoji:true};
  const icon = (e, cls='') => e.emoji ? e.ic : `<img src="${ICONS[e.key]}" alt="" class="${cls}">`;
  const elOf = ch => byName[ch.e] || ANY;

  let query = '';

  const PAGE = document.documentElement.dataset.page || 'main';
  const STUB = {}, $ = id => document.getElementById(id) || (PAGE === 'map' ? (STUB[id] || (STUB[id] = document.createElement('div'))) : null);
  const esc = s => String(s).replace(/[&<>"]/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  // моя коллекция (хранится в браузере)
  const COLL_KEY = 'hv_coll_v1';
  let COLL = {}; try{ COLL = JSON.parse(localStorage.getItem(COLL_KEY) || '{}') || {}; }catch(e){ COLL = {}; }
  const saveColl = quiet => { try{ localStorage.setItem(COLL_KEY, JSON.stringify(COLL)); }catch(e){} if (!quiet && window.onCollChange) window.onCollChange(COLL); };   // onCollChange — синхронизация с аккаунтом
  const ST = {
    want:{label:'Хочу вайфу / краша', ic:'♡', c:'#FF8FC7'},
    got: {label:'Выбил(а) вайфу / краша', ic:'✓', c:'#7EE08A'},
    none:{label:'Не выбито', ic:'', c:'#8E98B3'},
    main:{label:'One Love Main', ic:'♛', c:'#F3CF73'},
  };
  const stOf = ch => COLL[ch.n] || 'none';
  function setSt(ch, st){
    if (st === 'none') delete COLL[ch.n]; else COLL[ch.n] = st;
    if (PAGE === 'map') try { const p = new Set(JSON.parse(localStorage.getItem('hv_coll_pend') || '[]')); p.add(ch.n); localStorage.setItem('hv_coll_pend', JSON.stringify([...p])); } catch(e){}
    saveColl();
  }
  const myBadge = ch => { const s = stOf(ch); return s==='none' ? '' : `<span class="mybadge" style="--mc:${ST[s].c}" title="${ST[s].label}">${ST[s].ic}</span>`; };

  // фильтр
  const EL_LIST = ELEMENTS.slice(1);
  const GROUPS = [
    {id:'el',  title:'Элемент', opts:[...EL_LIST.map(e=>({v:e.name, label:e.name, el:e})), {v:'bad', label:'Бесполезное говно', bad:true}]},
    {id:'r',   title:'Редкость', opts:[{v:5,label:'5★',rc:'#F2C55C'},{v:4,label:'4★',rc:'#B98CFF'}]},
    {id:'w',   title:'Тип', opts:['Одноручное','Катализатор','Двуручное','Стрелковое','Древковое'].map(v=>({v,label:v}))},
    {id:'reg', title:'Регион', opts:['Мондштадт','Ли Юэ','Игрок','Инадзума','Другое','Сумеру','Фонтейн','Натлан','Нод-Край','Снежная'].map(v=>({v,label:v}))},
    {id:'f',   title:'Фракция', opts:[...['Архонт','Фатуи','Ордо Фавониус','Адепты','Драконы','Комиссия Инадзумы','Академия Сумеру','Суд Фонтейна'].map(v=>({v,label:v})),
                                      {v:'ЛЕГЕНДА КОТОРУЮ МЫ НЕ ЗАСЛУЖИЛИ', label:'ЛЕГЕНДА КОТОРУЮ МЫ НЕ ЗАСЛУЖИЛИ', legend:true}]},
    {id:'my',  title:'Моя коллекция', opts:['main','got','want','none'].map(v=>({v, label:ST[v].label, my:true}))},
  ];
  const sel = {el:new Set(), r:new Set(), w:new Set(), reg:new Set(), f:new Set(), my:new Set()};
  try{ const h = location.hash.slice(1); const e = EL_LIST.find(e=>e.key===h); if (e) sel.el.add(e.name); }catch(e){}

  const test = {
    el:  (ch,v) => v==='bad' ? !!ch.bad : (ch.e===v || ch.e==='Любая'),
    r:   (ch,v) => ch.r===v,
    w:   (ch,v) => ch.w===v,
    reg: (ch,v) => ch.reg===v || (ch.reg2||[]).includes(v),   // reg2 — доп. регионы (Беннет: Мондштадт + Натлан)
    f:   (ch,v) => (ch.f||[]).includes(v),
    my:  (ch,v) => v==='got' ? ['got','main'].includes(stOf(ch)) : stOf(ch)===v,
  };
  const pass = (ch, skip) => GROUPS.every(g => g.id===skip || !sel[g.id].size || [...sel[g.id]].some(v=>test[g.id](ch,v)));

  $('filters').innerHTML = GROUPS.map(g=>`
    <div class="fgroup" data-g="${g.id}">
      <div class="fhead"><h2>${g.title}</h2><button class="chip all" type="button" data-g="${g.id}" data-all="1" aria-pressed="true">Всё</button>
</div>
      <div class="chips">${g.opts.map((o,i)=>`<button class="chip${o.bad?' bad':''}${o.legend?' legend':''}" type="button" data-g="${g.id}" data-i="${i}" aria-pressed="false"
        ${o.el?`style="--c:${o.el.c}"`:o.rc?`style="--c:${o.rc}"`:o.my?`style="--c:${ST[o.v].c}"`:''}>${o.el?icon(o.el):''}${o.legend?`<span class="lt">${esc(o.label)}</span>`:esc(o.label)} <small></small></button>`).join('')}</div>
    </div>`).join('');

  $('filters').addEventListener('click', ev=>{
    const b = ev.target.closest('.chip'); if(!b) return;
    const g = GROUPS.find(g=>g.id===b.dataset.g), s = sel[g.id];
    if (b.dataset.all) s.clear();
    else { const v = g.opts[+b.dataset.i].v; s.has(v) ? s.delete(v) : s.add(v); }
    if (g.id==='el') syncHash();
    render();
  });
  $('reset').addEventListener('click', ()=>{ Object.values(sel).forEach(s=>s.clear()); syncHash(); render(); });
  let fLast = null;
  const openF = () => { fLast = document.activeElement; $('fover').hidden = false; $('fclose').focus(); };
  const closeF = () => { $('fover').hidden = true; if (fLast) fLast.focus(); };
  $('fopen').addEventListener('click', openF);
  $('fclose').addEventListener('click', ()=>{ window.uiClose && window.uiClose(); closeF(); });
  $('fapply').addEventListener('click', closeF);
  $('fover').addEventListener('click', ev=>{ if (ev.target.id==='fover'){ window.uiClose && window.uiClose(); closeF(); } });
  document.addEventListener('keydown', ev=>{ if (ev.key==='Escape' && !$('fover').hidden){ window.uiClose && window.uiClose(); closeF(); } });
  function syncHash(){
    try{
      const one = sel.el.size===1 ? EL_LIST.find(e=>sel.el.has(e.name)) : null;
      history.replaceState(null,'', one ? '#'+one.key : location.pathname);
    }catch(e){}
  }
  function syncChips(){
    document.querySelectorAll('.filters .chip').forEach(b=>{
      const g = GROUPS.find(g=>g.id===b.dataset.g);
      if (b.dataset.all){ b.setAttribute('aria-pressed', String(!sel[g.id].size)); return; }
      const o = g.opts[+b.dataset.i];
      b.setAttribute('aria-pressed', String(sel[g.id].has(o.v)));
      const n = CHARS.filter(ch=>pass(ch,g.id) && test[g.id](ch,o.v)).length;
      b.querySelector('small').textContent = n;
    });
  }
  $('q').addEventListener('input', ev=>{ query = ev.target.value.trim().toLowerCase(); render(); });

  function legendFx(){
    // кристаллы льда, вырастающие из-за карты (точки по периметру, растут наружу)
    const crystals = [];
    const R = (a,b) => a + Math.random()*(b-a);
    const slabShape = () => {
      // зубчатый верх ступеньками + небольшие сколы по бокам, как у ледяных глыб Капитано
      const pts = []; const steps = 2 + Math.floor(Math.random()*3);
      let x = 0, y = R(4,34); pts.push([0, y]);
      for (let s=1; s<=steps; s++){
        const nx = s===steps ? 100 : Math.min(96, x + R(18, 100/steps + 14));
        const ny = R(0,36);
        if (Math.random()<.5){ pts.push([nx, y]); pts.push([nx, ny]); } else { pts.push([nx, ny]); }
        x = nx; y = ny;
      }
      const jy = R(45,80), jx = R(4,14);
      pts.push([100, jy - 6], [100 - jx, jy], [100 - jx*.4, jy + 8], [100, 100], [0, 100]);
      const ly = R(40,85); pts.push([0 + R(3,12), ly], [0, ly - R(6,14)]);
      return pts.map(([a,b]) => `${a.toFixed(0)}% ${b.toFixed(0)}%`).join(',');
    };
    const N = 17;
    for (let k=0;k<N;k++){
      const u = (k + R(.1,.7))/N; let x, y; const P = u*4;
      if (P<1){ x=P*100; y=0; } else if (P<2){ x=100; y=(P-1)*100; } else if (P<3){ x=(3-P)*100; y=100; } else { x=0; y=(4-P)*100; }
      x = 50 + (x-50)*.84; y = 50 + (y-50)*.84;
      const base = Math.atan2((x-50)*4, -(y-50)*3)*180/Math.PI;
      const n = 2 + Math.floor(Math.random()*2);
      for (let m=0;m<n;m++){
        const th = base + R(-16,16), h = Math.round(R(48,135) * (m ? .75 : 1)), w = Math.round(R(24,52) * (m ? .8 : 1));
        const ox = R(-10,10), dl = R(0,.5).toFixed(2);
        crystals.push(`<i class="slab" style="left:calc(${x.toFixed(1)}% + ${ox.toFixed(0)}px);top:${y.toFixed(1)}%;--th:${th.toFixed(0)}deg;--h:${h}px;--w:${w}px;--dl:${dl}s"><b style="clip-path:polygon(${slabShape()})"></b></i>`);
      }
    }
    const specks = Array.from({length:10}, ()=>{
      const a = Math.round(Math.random()*360), d = (2.2 + Math.random()*2).toFixed(2), dl = (Math.random()*2.5).toFixed(2), s = 3 + Math.round(Math.random()*5), sp = Math.round(Math.random()*360-180);
      return `<i class="bshard c${Math.floor(Math.random()*3)}" style="--a:${a}deg;--d:${d}s;--dl:${dl}s;--s:${s}px;--sp:${sp}deg"></i>`;
    }).join('');
    return `<div class="lg-crystals" aria-hidden="true">${crystals.join('')}</div><div class="lg-flakes" aria-hidden="true">${specks}</div>`;
  }
  function legendTop(){
    const corner = c => `<span class="icecorner ${c}"><i></i><i></i><i></i></span>`;
    return `<div class="lg-frame" aria-hidden="true"></div>${['tl','tr','bl','br'].map(corner).join('')}`;
  }
  function mavuikaFx(){
    // кольцо Мавуики по скрину из игры: золотой обод; сверху, снизу и по бокам — шпили-наконечники
    // с угловатыми завитками, между ними четырёхлучевые звёзды. Кольцо не вращается.
    const R = 46;
    const spire = `<g>
      <path class="gold" d="M0 ${-R-21} L5.6 ${-R+2.2} L0 ${-R-2.2} L-5.6 ${-R+2.2} Z"/>
      <path class="core" d="M0 ${-R-15} L3.3 ${-R+.6} L0 ${-R-3.4} L-3.3 ${-R+.6} Z"/>
      <path class="gold" d="M0 ${-R-10} L1.4 ${-R-3.2} L0 ${-R-4.6} L-1.4 ${-R-3.2} Z"/>
      <path class="gold" d="M0 ${-R-1.2} L2.4 ${-R+1.4} L0 ${-R+4.6} L-2.4 ${-R+1.4} Z"/>
      ${[1,-1].map(s=>`<g transform="scale(${s} 1)">
        <path class="hook" d="M5.4 ${-R+1.4} L9.4 ${-R-3.4} L13.6 ${-R+.2} L11.6 ${-R+4} L8.2 ${-R+1.8} L10.2 ${-R-.4}"/>
        <path class="hook in" d="M5.4 ${-R+1.4} L9.4 ${-R-3.4} L13.6 ${-R+.2} L11.6 ${-R+4} L8.2 ${-R+1.8} L10.2 ${-R-.4}"/>
        <path class="gold" d="M13.2 ${-R+.4} L17.5 ${-R+2.4} L13.6 ${-R+2.4} Z"/></g>`).join('')}</g>`;
    const star = `<g>
      <path class="gold" d="M0 ${-R-12} L1.5 ${-R-1.6} L7.5 ${-R} L1.5 ${-R+1.6} L0 ${-R+6} L-1.5 ${-R+1.6} L-7.5 ${-R} L-1.5 ${-R-1.6} Z"/>
      <path class="gold" d="M3.2 ${-R-5.4} L1.6 ${-R-1.2} L2.2 ${-R-1.9} Z M-3.2 ${-R-5.4} L-1.6 ${-R-1.2} L-2.2 ${-R-1.9} Z"/>
      <path class="core" d="M0 ${-R-4.4} L2 ${-R} L0 ${-R+3.2} L-2 ${-R} Z"/>
      <path class="spark" d="M0 ${-R-2.4} L1 ${-R} L0 ${-R+1.6} L-1 ${-R} Z"/></g>`;
    const sc = (k, g) => `<g transform="translate(0 ${-R}) scale(${k}) translate(0 ${R})">${g}</g>`;
    const at = (deg, g) => `<g transform="rotate(${deg})">${g}</g>`;
    const orns = at(0, spire) + at(90, sc(.72, spire)) + at(-90, sc(.72, spire)) + at(180, sc(.8, spire))
      + at(36, star) + at(-36, star) + at(142, sc(.9, star)) + at(-142, sc(.9, star));
    return `<svg class="mring" viewBox="-64 -64 128 128" aria-hidden="true">
        <defs>
          <linearGradient id="mGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe0"/><stop offset=".35" stop-color="#ffd35a"/><stop offset=".75" stop-color="#ff9a22"/><stop offset="1" stop-color="#e2560f"/></linearGradient>
          <radialGradient id="mCore" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#ffb347"/><stop offset=".6" stop-color="#ff6a14"/><stop offset="1" stop-color="#a82c08"/></radialGradient>
        </defs>
        <circle class="band glow" r="${R}"/><circle class="band" r="${R}"/><circle class="band hot" r="${R}"/>
        <circle class="glint" r="${R}" transform="rotate(-90)"/><circle class="glint g2" r="${R}" transform="rotate(-90)"/>
        ${orns}</svg>
      <canvas class="mfire" aria-hidden="true"></canvas>`;
  }
  function raidenFx(){
    // кольцо Райдэн: бусины-огоньки по кругу, сверху Око с томоэ, по бокам и снизу вихри
    const R = 46, rad = d => d*Math.PI/180, P = d => [Math.sin(rad(d))*R, -Math.cos(rad(d))*R];
    const skip = d => { const a = ((d%360)+360)%360; return a < 15 || a > 345 || Math.abs(a-42) < 7 || Math.abs(a-318) < 7 || Math.abs(a-180) < 7; };
    let beads = '';
    for (let d=0, k=0; d<360; d+=4.6, k++){ if (skip(d)) continue; const [x,y] = P(d);
      const big = k%5===0, r = big ? 1.5 : (.75 + Math.random()*.45);
      beads += `<circle class="bead${big?' big':''}" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" style="--d:${(1+Math.random()*1.5).toFixed(2)}s;--dl:${(-Math.random()*2).toFixed(2)}s"/>`; }
    const orb = d => { const [x,y] = P(d); return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)})"><circle class="orb" r="6"/>
      <path class="swirl" d="M0 0 C1.6 -.6 1.8 -2.4 .4 -3 C-2 -3.6 -3.6 -1 -2.8 1.2 C-1.9 3.6 1.8 4 3.4 1.8"><animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1.6s" repeatCount="indefinite"/></path></g>`; };
    const EMB_O = 'M-0.62 8.05C-0.94 8.02 -1.15 7.98 -1.79 7.81C-1.94 7.77 -2.11 7.73 -2.15 7.73C-2.24 7.73 -2.85 7.17 -2.85 7.09C-2.85 7.07 -2.71 6.91 -2.55 6.75L-2.24 6.45 L-1.73 6.45C-1.00 6.45 -0.99 6.37 -1.67 5.94C-1.78 5.87 -2.15 5.52 -2.51 5.16C-3.14 4.52 -3.30 4.31 -3.57 3.77C-3.68 3.54 -3.83 3.02 -3.83 2.84C-3.83 2.73 -3.85 2.57 -3.86 2.49C-3.88 2.41 -3.88 2.19 -3.86 1.99L-3.82 1.62 L-3.54 1.34C-3.39 1.18 -3.25 1.05 -3.23 1.05C-3.21 1.05 -3.05 1.19 -2.87 1.36C-2.40 1.83 -2.12 1.88 -1.46 1.65C-1.25 1.57 -1.02 1.28 -1.02 1.10C-1.02 1.05 -0.98 0.96 -0.95 0.89C-0.89 0.79 -0.88 0.67 -0.88 0.33C-0.89 -0.25 -0.97 -0.54 -1.29 -1.06C-1.52 -1.45 -2.34 -1.76 -3.11 -1.76C-3.44 -1.76 -4.09 -1.65 -4.25 -1.57C-4.28 -1.55 -4.43 -1.48 -4.57 -1.41C-4.89 -1.25 -5.14 -1.05 -5.24 -0.87C-5.28 -0.79 -5.36 -0.65 -5.41 -0.57C-5.53 -0.37 -5.59 -0.24 -5.59 -0.18C-5.59 -0.15 -5.60 -0.11 -5.62 -0.10C-5.75 -0.02 -6.00 1.17 -6.04 1.84C-6.06 2.13 -6.07 2.43 -6.08 2.52C-6.08 2.61 -6.07 2.83 -6.05 3.03L-6.02 3.38 L-6.32 3.68L-6.62 3.98 L-6.92 3.68C-7.15 3.45 -7.26 3.31 -7.37 3.09C-7.64 2.53 -7.74 2.23 -7.96 1.35C-8.13 0.70 -8.13 -1.19 -7.97 -1.60C-7.95 -1.66 -7.91 -1.81 -7.89 -1.95C-7.86 -2.09 -7.83 -2.24 -7.81 -2.27C-7.79 -2.31 -7.76 -2.42 -7.74 -2.51C-7.68 -2.79 -7.52 -3.19 -7.27 -3.69C-6.95 -4.32 -6.96 -4.30 -6.39 -5.03C-6.12 -5.38 -5.31 -6.22 -4.98 -6.49L-4.75 -6.69 L-4.44 -6.37L-4.12 -6.06 L-4.21 -5.94C-4.26 -5.88 -4.30 -5.81 -4.30 -5.79C-4.30 -5.77 -4.32 -5.73 -4.35 -5.71C-4.38 -5.69 -4.47 -5.53 -4.55 -5.37C-4.64 -5.20 -4.76 -4.96 -4.83 -4.83C-4.99 -4.53 -4.95 -4.43 -4.73 -4.60C-4.61 -4.70 -4.45 -4.80 -4.20 -4.95C-3.00 -5.66 -1.51 -5.73 -0.32 -5.14C0.12 -4.93 0.98 -4.23 0.98 -4.08C0.98 -4.06 0.84 -3.91 0.67 -3.75C0.40 -3.48 0.35 -3.44 0.14 -3.40C-0.32 -3.30 -0.37 -3.25 -0.43 -2.83C-0.57 -1.82 0.03 -1.21 1.18 -1.15C1.88 -1.11 2.52 -1.29 2.92 -1.62C3.14 -1.80 3.47 -2.45 3.53 -2.81C3.64 -3.48 3.64 -3.62 3.53 -4.22C3.46 -4.64 3.32 -4.97 3.06 -5.35C3.00 -5.44 2.93 -5.56 2.90 -5.60C2.84 -5.72 2.40 -6.12 2.14 -6.30C1.83 -6.52 1.64 -6.64 1.60 -6.64C1.59 -6.64 1.55 -6.67 1.52 -6.70C1.49 -6.73 1.42 -6.79 1.35 -6.82C1.28 -6.85 1.20 -6.89 1.17 -6.91C1.14 -6.93 1.02 -6.99 0.90 -7.05C0.75 -7.12 0.56 -7.27 0.31 -7.52L-0.06 -7.89 L0.24 -8.18L0.53 -8.48 L0.82 -8.44C0.98 -8.42 1.30 -8.38 1.52 -8.36C1.74 -8.34 2.01 -8.29 2.11 -8.26C2.84 -8.04 3.23 -7.91 3.39 -7.83C3.49 -7.78 3.58 -7.74 3.60 -7.74C3.62 -7.73 4.29 -7.36 4.43 -7.27C4.85 -6.99 5.04 -6.84 5.45 -6.48C6.12 -5.88 7.27 -4.67 7.27 -4.56C7.27 -4.54 7.33 -4.44 7.41 -4.33C7.57 -4.10 8.05 -3.18 8.05 -3.10C8.05 -3.07 8.08 -2.97 8.12 -2.89C8.17 -2.81 8.20 -2.70 8.20 -2.66C8.20 -2.62 8.24 -2.51 8.28 -2.41C8.32 -2.32 8.37 -2.14 8.40 -2.01C8.50 -1.52 8.51 -1.57 8.19 -1.25L7.89 -0.96 L7.60 -1.25C7.33 -1.52 6.95 -2.01 6.95 -2.11C6.95 -2.13 6.91 -2.20 6.85 -2.26C6.71 -2.43 6.65 -2.37 6.67 -2.12C6.70 -1.85 6.62 -1.08 6.53 -0.74C6.44 -0.39 6.34 -0.15 6.00 0.50C5.92 0.66 4.99 1.62 4.65 1.89C4.37 2.11 4.29 2.16 3.83 2.38L3.50 2.55 L3.22 2.26C2.92 1.96 2.89 1.90 2.98 1.73C3.13 1.43 3.16 0.85 3.04 0.61C2.89 0.29 2.13 0.14 1.55 0.31C1.20 0.42 0.82 0.60 0.73 0.69C0.13 1.37 0.03 2.73 0.52 3.59C0.58 3.69 0.66 3.83 0.70 3.91C0.78 4.05 0.95 4.20 1.15 4.30C1.22 4.33 1.30 4.38 1.35 4.40C1.54 4.50 1.83 4.61 2.01 4.65C2.12 4.67 2.30 4.71 2.42 4.73C2.75 4.80 3.43 4.75 3.87 4.63C4.07 4.57 4.33 4.51 4.43 4.48C4.54 4.45 4.77 4.36 4.94 4.28C5.11 4.20 5.33 4.10 5.43 4.06C5.76 3.91 6.00 3.78 6.31 3.57C6.81 3.24 6.74 3.24 7.07 3.57L7.35 3.86 L7.28 3.99C7.25 4.06 7.16 4.19 7.08 4.28C7.01 4.37 6.95 4.46 6.95 4.47C6.95 4.64 5.41 6.16 4.85 6.56C4.78 6.61 4.64 6.70 4.54 6.77C4.35 6.91 3.90 7.16 3.75 7.23C3.70 7.25 3.63 7.28 3.59 7.30C3.53 7.35 3.52 7.35 3.20 7.48C2.71 7.68 2.03 7.89 1.89 7.89C1.85 7.89 1.67 7.93 1.51 7.97C1.16 8.06 -0.03 8.10 -0.62 8.05Z', EMB_I = 'M-0.62 7.50C-0.81 7.49 -1.08 7.44 -1.23 7.41C-1.84 7.25 -2.10 7.19 -2.20 7.17C-2.28 7.15 -2.31 7.13 -2.30 7.08C-2.29 7.02 -2.20 7.01 -1.60 6.99C-0.62 6.95 -0.05 6.86 0.45 6.65C0.81 6.49 0.82 6.47 0.50 6.39C0.39 6.36 0.17 6.29 0.02 6.23C-0.13 6.18 -0.31 6.11 -0.37 6.09C-0.48 6.06 -0.93 5.85 -1.16 5.73C-1.89 5.34 -2.63 4.57 -3.02 3.78C-3.20 3.39 -3.34 2.72 -3.33 2.25C-3.32 1.93 -3.27 1.60 -3.24 1.60C-3.22 1.60 -3.09 1.72 -2.96 1.85C-2.54 2.31 -2.14 2.42 -1.57 2.23C-1.27 2.13 -1.22 2.11 -1.01 1.93C-0.77 1.73 -0.47 1.26 -0.47 1.09C-0.47 1.05 -0.44 0.96 -0.40 0.89C-0.25 0.60 -0.34 -0.34 -0.57 -0.76C-1.10 -1.77 -1.99 -2.31 -3.11 -2.30C-3.44 -2.30 -4.09 -2.19 -4.25 -2.12C-4.28 -2.10 -4.43 -2.02 -4.57 -1.95C-4.98 -1.75 -5.47 -1.34 -5.68 -1.01C-5.74 -0.93 -5.83 -0.79 -5.88 -0.71C-5.93 -0.63 -5.98 -0.54 -5.98 -0.52C-5.98 -0.50 -6.00 -0.46 -6.03 -0.43C-6.07 -0.40 -6.10 -0.32 -6.12 -0.25C-6.13 -0.18 -6.15 -0.11 -6.17 -0.10C-6.21 -0.07 -6.39 0.52 -6.48 0.94C-6.59 1.43 -6.64 2.47 -6.60 3.11C-6.58 3.48 -6.63 3.48 -6.81 3.11C-7.08 2.55 -7.19 2.25 -7.42 1.35C-7.58 0.70 -7.59 -1.19 -7.42 -1.60C-7.40 -1.66 -7.37 -1.81 -7.34 -1.95C-7.32 -2.09 -7.28 -2.24 -7.26 -2.27C-7.24 -2.31 -7.21 -2.42 -7.19 -2.51C-7.13 -2.79 -6.97 -3.19 -6.72 -3.69C-6.40 -4.32 -6.42 -4.29 -5.84 -5.03C-5.59 -5.35 -4.95 -6.02 -4.81 -6.09C-4.69 -6.15 -4.66 -6.07 -4.76 -5.94C-4.81 -5.87 -4.84 -5.81 -4.84 -5.79C-4.84 -5.77 -4.87 -5.73 -4.89 -5.71C-4.94 -5.67 -5.02 -5.53 -5.36 -4.86C-5.59 -4.42 -5.63 -4.33 -5.63 -4.27C-5.63 -4.23 -5.66 -4.13 -5.70 -4.04C-5.74 -3.96 -5.78 -3.83 -5.78 -3.77C-5.78 -3.70 -5.81 -3.55 -5.84 -3.42C-5.92 -3.10 -5.87 -3.06 -5.64 -3.28C-5.54 -3.38 -5.43 -3.48 -5.39 -3.52C-5.35 -3.55 -5.28 -3.61 -5.23 -3.66C-4.99 -3.86 -4.67 -4.11 -4.48 -4.23C-4.37 -4.30 -4.24 -4.38 -4.20 -4.40C-3.69 -4.72 -2.87 -4.96 -2.19 -4.99C-1.31 -5.02 -0.61 -4.82 0.15 -4.32C0.51 -4.09 0.51 -4.03 0.14 -3.94C-0.56 -3.78 -0.89 -3.45 -0.97 -2.83C-1.02 -2.49 -0.96 -2.09 -0.83 -1.88C-0.42 -1.21 -0.15 -0.98 0.54 -0.70C0.80 -0.60 1.51 -0.55 1.89 -0.62C2.78 -0.78 3.59 -1.48 3.96 -2.42C4.06 -2.68 4.07 -2.74 4.14 -3.22C4.24 -3.88 4.02 -4.73 3.61 -5.35C3.55 -5.44 3.48 -5.55 3.45 -5.60C3.30 -5.85 2.59 -6.53 2.14 -6.85C1.84 -7.06 1.64 -7.19 1.60 -7.19C1.59 -7.19 1.55 -7.21 1.52 -7.25C1.49 -7.28 1.42 -7.33 1.35 -7.36C1.28 -7.40 1.20 -7.44 1.17 -7.46C1.14 -7.48 1.01 -7.54 0.89 -7.60C0.68 -7.70 0.47 -7.87 0.51 -7.91C0.53 -7.92 0.67 -7.91 0.82 -7.89C0.98 -7.87 1.30 -7.84 1.52 -7.81C1.74 -7.79 2.01 -7.75 2.11 -7.72C2.84 -7.49 3.23 -7.36 3.39 -7.28C3.49 -7.23 3.58 -7.19 3.60 -7.19C3.62 -7.19 4.29 -6.81 4.43 -6.72C4.96 -6.37 4.97 -6.36 5.59 -5.81C5.92 -5.51 6.67 -4.68 6.72 -4.56C6.72 -4.53 6.79 -4.42 6.87 -4.32C7.02 -4.10 7.50 -3.18 7.50 -3.10C7.50 -3.07 7.54 -2.97 7.58 -2.89C7.62 -2.81 7.66 -2.70 7.66 -2.66C7.66 -2.62 7.69 -2.51 7.73 -2.41C7.85 -2.15 7.97 -1.52 7.90 -1.52C7.86 -1.52 7.57 -1.94 7.47 -2.15C7.26 -2.56 6.80 -3.16 6.39 -3.55C5.92 -3.99 5.73 -4.07 5.87 -3.77C5.91 -3.69 5.94 -3.59 5.94 -3.53C5.94 -3.48 5.97 -3.26 6.01 -3.05C6.16 -2.30 6.15 -1.40 5.98 -0.74C5.89 -0.40 5.77 -0.12 5.46 0.48C5.32 0.76 4.64 1.41 4.28 1.61C4.12 1.70 3.52 1.99 3.50 1.99C3.46 1.99 3.48 1.83 3.52 1.75C3.59 1.62 3.67 1.25 3.67 1.05C3.68 0.35 2.99 -0.27 2.18 -0.31C1.13 -0.35 0.17 0.37 -0.23 1.48C-0.44 2.08 -0.35 3.02 -0.02 3.59C0.03 3.69 0.10 3.82 0.14 3.89C0.28 4.14 0.88 4.72 1.13 4.84C1.21 4.88 1.30 4.93 1.35 4.95C1.54 5.05 1.83 5.16 2.01 5.20C2.12 5.22 2.30 5.25 2.42 5.28C2.75 5.34 3.43 5.30 3.87 5.18C4.07 5.12 4.33 5.05 4.43 5.02C4.54 5.00 4.77 4.91 4.94 4.83C5.11 4.75 5.33 4.65 5.43 4.61C5.76 4.45 6.00 4.32 6.31 4.12C6.66 3.89 6.80 3.81 6.80 3.85C6.80 3.90 6.66 4.13 6.54 4.28C6.47 4.37 6.41 4.46 6.41 4.47C6.41 4.62 5.37 5.65 4.85 6.01C4.78 6.06 4.64 6.16 4.54 6.22C4.35 6.36 3.90 6.62 3.75 6.68C3.70 6.70 3.63 6.74 3.59 6.76C3.53 6.80 3.52 6.80 3.20 6.93C2.71 7.13 2.03 7.35 1.89 7.34C1.85 7.34 1.67 7.38 1.51 7.42C1.16 7.51 -0.03 7.56 -0.62 7.50Z';
    const eye = `<g transform="translate(0 ${-R})">
      <ellipse class="eyeGlow" rx="17" ry="9"/>
      <path class="flare" d="M-20 0 L-10 -1.1 L-10 1.1 Z M20 0 L10 -1.1 L10 1.1 Z"/>
      <path class="lid" d="M-11.5 0 Q0 -8.4 11.5 0 Q0 8.4 -11.5 0 Z"/><circle r="6.4" fill="#b67bff" opacity=".55"/>
      <g transform="scale(.52)"><g class="tomoe"><animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="4s" repeatCount="indefinite"/><path class="embO" d="${EMB_O}"/><path class="embI" d="${EMB_I}"/></g></g></g>`;
    return `<svg class="rring" viewBox="-64 -64 128 128" aria-hidden="true">
        <defs>
          <radialGradient id="rEyeG"><stop offset="0" stop-color="#e7b6ff" stop-opacity=".9"/><stop offset=".5" stop-color="#9a4dff" stop-opacity=".45"/><stop offset="1" stop-color="#6a2cff" stop-opacity="0"/></radialGradient>
          <radialGradient id="rOrbG"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="#e3b0ff"/><stop offset=".65" stop-color="#8b3dff" stop-opacity=".55"/><stop offset="1" stop-color="#5a20d0" stop-opacity="0"/></radialGradient>
        </defs>${beads}${orb(42)}${orb(-42)}${orb(180)}${eye}</svg>
      <img class="rsword" src="musou.webp" alt="" aria-hidden="true">`;
  }
  function raidenTop(){
    const rays = Array.from({length:24},(_,k)=>{ const a = k/24*Math.PI*2 + (Math.random()-.5)*.2, r1 = 8+Math.random()*10, r2 = 30+Math.random()*20;
      return `<line x1="${(Math.cos(a)*r1).toFixed(1)}" y1="${(Math.sin(a)*r1*.5).toFixed(1)}" x2="${(Math.cos(a)*r2).toFixed(1)}" y2="${(Math.sin(a)*r2*.5).toFixed(1)}" stroke-width="${(.5+Math.random()*1.3).toFixed(2)}"/>`; }).join('');
    const spk = Array.from({length:8},(_,k)=>`<i class="rspk" style="--a:${Math.round(k*45+Math.random()*30)}deg;--r:${Math.round(70+Math.random()*80)}px;--s:${Math.round(8+Math.random()*10)}px;--dl:${(Math.random()*.15).toFixed(2)}s"></i>`).join('');
    return `<svg class="rburst" viewBox="-50 -50 100 100" aria-hidden="true"><defs><radialGradient id="rRay" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="50"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e2c0ff"/><stop offset="1" stop-color="#8a4dff" stop-opacity="0"/></radialGradient></defs>${rays}</svg>
      <div class="rflash" aria-hidden="true"></div><div class="rslash" aria-hidden="true"><i></i><b></b></div>${spk}`;
  }
  function nahidaFx(){
    // купол Храма Майи: рёбра-арки сходятся к тёмной звезде, зелёное стекло, стрельчатые окна, лучи света
    const top = -58, base = 24, W = 52;
    const ribX = [-52,-34,-15,15,34,52];
    const ribs = ribX.map(x=>`<path class="rib" d="M0 ${top+6} Q${(x*1.18).toFixed(1)} ${top+8} ${x} ${base}"/>`).join('');
    const hoops = [-36,-14,6].map((y,i)=>{ const w = [34,46,51][i]; return `<path class="rib thin" d="M${-w} ${y} Q0 ${y+10} ${w} ${y}"/>`; }).join('');
    const dome = `M${-W} ${base} Q${-W*1.12} ${top+10} 0 ${top+4} Q${W*1.12} ${top+10} ${W} ${base} Z`;
    const win = (cx,w,h,y) => `<path class="win" d="M${cx-w} ${y} L${cx-w} ${y-h*.55} Q${cx-w} ${y-h} ${cx} ${y-h*1.15} Q${cx+w} ${y-h} ${cx+w} ${y-h*.55} L${cx+w} ${y} Z"/>`;
    const wins = [[-43,5,22,22],[-25,6,26,20],[25,6,26,20],[43,5,22,22]].map(a=>win(...a)).join('');
    const star = (r,ri) => Array.from({length:16},(_,k)=>{ const a = k*Math.PI/8 - Math.PI/2, rr = k%2 ? ri : r; return `${(Math.cos(a)*rr).toFixed(2)} ${(Math.sin(a)*rr).toFixed(2)}`; }).join(' L');
    const sp = Array.from({length:10},()=>`<circle class="sparkle" cx="${(Math.random()*80-40).toFixed(1)}" cy="${(top+14+Math.random()*50).toFixed(1)}" r="${(.5+Math.random()*.7).toFixed(2)}" style="--dl:${(Math.random()*1.5).toFixed(2)}s"/>`).join('');
    return `<svg class="ndome" viewBox="-64 -64 128 128" aria-hidden="true">
      <defs>
        <linearGradient id="nGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9fff0" stop-opacity=".85"/><stop offset=".35" stop-color="#7fe0b4" stop-opacity=".55"/><stop offset=".8" stop-color="#1f8a68" stop-opacity=".45"/><stop offset="1" stop-color="#0d4a3c" stop-opacity=".2"/></linearGradient>
        <linearGradient id="nRay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset="1" stop-color="#b8ffd8" stop-opacity="0"/></linearGradient>
        <radialGradient id="nStarG"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset=".4" stop-color="#b8ffcf" stop-opacity=".5"/><stop offset="1" stop-color="#6fe39a" stop-opacity="0"/></radialGradient>
      </defs>
      <path class="glass" d="${dome}"/>${wins}
      <path class="ray" d="M-6 ${top+8} L6 ${top+8} L22 ${base} L-22 ${base} Z"/><path class="ray" d="M-3 ${top+8} L2 ${top+8} L-26 ${base} L-40 ${base} Z" opacity=".6"/>
      ${ribs}${hoops}<path class="rib" d="M${-W} ${base} L${W} ${base}"/>
      <circle class="starGlow" cx="0" cy="${top+4}" r="12"/>
      <g transform="translate(0 ${top+4})"><path class="star" d="M${star(9,3.6)} Z"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="24s" repeatCount="indefinite"/></path></g>
      ${sp}</svg><div class="npool" aria-hidden="true"></div>`;
  }
  function nahidaTop(){
    const leaves = Array.from({length:12},(_,k)=>{ const dot = k%3===2;
      return `<i class="nleaf${dot?' dot':''}${k%4===3?' rev':''}" style="--r:${(58+(k%4)*4+Math.random()*4).toFixed(1)};--s:${dot?4+Math.round(Math.random()*3):10+Math.round(Math.random()*7)}px;--d:${(7+Math.random()*5).toFixed(1)}s;--dl:${(-Math.random()*12).toFixed(1)}s;--t:${Math.round(Math.random()*60-30)}deg"></i>`; }).join('');
    // растения снизу: вьющиеся стебли с завитками, листья и четырёхлепестковые цветы
    const vines = [
      ['M-60 44 C-52 38 -50 30 -44 26 C-38 22 -34 26 -36 30 C-38 33 -42 31 -41 28', 70, 0],
      ['M-54 48 C-46 42 -36 40 -28 34 C-22 30 -18 33 -20 36', 50, .1],
      ['M60 44 C52 36 50 26 44 20 C38 14 32 18 34 23 C36 27 41 25 40 21', 76, .05],
      ['M56 48 C46 44 38 40 30 34 C25 30 20 34 23 37', 50, .15],
      ['M-8 50 C-6 42 -12 38 -8 33 C-5 30 -1 33 -3 36', 34, .25],
      ['M16 50 C14 44 20 40 17 35', 22, .3]];
    const vs = vines.map(([d,len,dl],i)=>`<path class="vine${i%2?' thin':''}" d="${d}" style="--len:${len};--dl:${dl}s"/>`).join('');
    const leaf = (x,y,a,s,dl) => `<g class="bloom" style="--dl:${dl}s"><path class="leaf" transform="translate(${x} ${y}) rotate(${a}) scale(${s})" d="M0 0 C3 -3 8 -3 11 0 C8 3 3 3 0 0 Z"/></g>`;
    const flower = (x,y,s,dl) => { const pet = 'M0 0 C-2.6 -3 -2.6 -6.5 0 -9 C2.6 -6.5 2.6 -3 0 0 Z';
      return `<g class="bloom" style="--dl:${dl}s"><g transform="translate(${x} ${y}) scale(${s})">${[0,90,180,270].map(a=>`<path class="pet" transform="rotate(${a})" d="${pet}"/>`).join('')}${[45,135,225,315].map(a=>`<path class="pin" transform="rotate(${a}) scale(.45)" d="${pet}"/>`).join('')}<circle class="pdot" r="1.5"/></g></g>`; };
    const beads = [[-48,18,1.1],[-45,13,.8],[-43,9,.6],[48,12,1.1],[50,7,.8],[51,3,.6],[-20,42,.7]].map(([x,y,r],i)=>`<g class="bloom" style="--dl:${(.5+i*.05).toFixed(2)}s"><circle class="bead" cx="${x}" cy="${y}" r="${r}"/></g>`).join('');
    const plants = `<svg class="nplants" viewBox="-64 -64 128 128" aria-hidden="true"><defs>
        <linearGradient id="nVine" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2f8a4a"/><stop offset="1" stop-color="#d6ff9c"/></linearGradient>
        <linearGradient id="nLeafG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8ffc4"/><stop offset=".5" stop-color="#8fdc58"/><stop offset="1" stop-color="#2f8f4a"/></linearGradient></defs>
      ${vs}
      ${leaf(-54,40,-60,1,.25)}${leaf(-48,33,-100,.8,.35)}${leaf(-32,36,-150,.9,.4)}${leaf(52,38,-120,1,.3)}${leaf(46,28,-80,.8,.4)}${leaf(30,36,-30,.9,.45)}${leaf(-6,40,-110,.8,.5)}
      ${flower(-42,36,1.05,.55)}${flower(-57,30,.7,.65)}${flower(40,34,1.15,.6)}${flower(55,22,.75,.7)}${flower(-18,44,.75,.75)}${flower(20,43,.9,.7)}
      ${beads}</svg>`;
    return `${plants}<div class="nleaves" aria-hidden="true">${leaves}</div>`;
  }

  function furinaFx(){
    // кольцо из капель, сверху — маленький цилиндр Фурины
    const R = 46, P = d => [Math.sin(d*Math.PI/180)*R, -Math.cos(d*Math.PI/180)*R];
    let drops = '';
    for (let d=0, k=0; d<360; d+=10, k++){ const a = ((d%360)+360)%360; if (a<16 || a>344) continue;
      const [x,y] = P(d), big = k%3===0, s = big ? 1.25 : .75;
      drops += `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${d}) scale(${s})"><path class="drop${big?'':' s'}" style="--dl:${(-Math.random()*2).toFixed(2)}s" d="M0 -3.4 C1.6 -1.2 2.2 .2 2.2 1.2 A2.2 2.2 0 0 1 -2.2 1.2 C-2.2 .2 -1.6 -1.2 0 -3.4 Z"/></g>`; }
    const hat = `<g transform="translate(0 ${-R-2})">
      <path class="hat" d="M-10 3 Q0 6 10 3 L10 1.4 Q0 3.6 -10 1.4 Z"/>
      <path class="hat" d="M-6 1.8 L-7 -11 Q0 -13 7 -11 L6 1.8 Q0 3 -6 1.8 Z"/>
      <path class="hatband" d="M-6.2 -1 Q0 .4 6.2 -1 L6.1 -3.2 Q0 -1.8 -6.3 -3.2 Z"/>
      <path class="hatgem" d="M0 -4.6 L1.6 -2.2 L0 .2 L-1.6 -2.2 Z"/>
      <path class="hat" d="M5 -10 Q10 -16 13 -12 Q9 -13 7 -9 Z"/></g>`;
    const bubs = Array.from({length:9},()=>`<i class="fbub" style="--x:${Math.round(Math.random()*95)}%;--s:${6+Math.round(Math.random()*9)}px;--d:${(1.8+Math.random()*1.6).toFixed(2)}s;--dl:${(.9+Math.random()*1.8).toFixed(2)}s;--dx:${Math.round(Math.random()*40-20)}px"></i>`).join('');
    return `<svg class="fring" viewBox="-64 -64 128 128" aria-hidden="true"><defs>
        <radialGradient id="fDrop" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#9ad6ff"/><stop offset="1" stop-color="#2a7ae0"/></radialGradient></defs>
        <circle class="band" r="${R}"/><circle class="glint" r="${R}" transform="rotate(-90)"/>${drops}${hat}</svg>
      <div class="fspot l" aria-hidden="true"></div><div class="fspot r" aria-hidden="true"></div>${bubs}`;
  }
  function furinaTop(){
    // салон-солисты: господин Ушер (осьминог в цилиндре), мадемуазель Крабалетта, суринтендантка Шевальмарин
    const bub = `<circle class="bub" r="19"/>`, hl = `<ellipse class="hl" cx="-8" cy="-10" rx="4" ry="2.2" transform="rotate(-35 -8 -10)"/>`;
    const usher = `${bub}<g transform="translate(0 3)"><path class="body" d="M-8 -2 Q-9 -12 0 -12 Q9 -12 8 -2 Q8 4 4 5 L6 11 L2 7 L0 12 L-2 7 L-6 11 L-4 5 Q-8 4 -8 -2 Z"/>
      <path class="dark" d="M-6 -11 L-6.5 -19 Q0 -20.5 6.5 -19 L6 -11 Q0 -9.5 -6 -11 Z"/><path class="dark" d="M-9.5 -11 Q0 -8 9.5 -11 Q0 -12.6 -9.5 -11 Z"/>
      <path class="line" d="M-4 -3 Q-2.5 -4.5 -1 -3 M1 -3 Q2.5 -4.5 4 -3 M-3 1 Q0 3 3 1"/></g>${hl}`;
    const crab = `${bub}<g transform="translate(0 2)"><path class="body" d="M-10 2 Q-10 -8 0 -8 Q10 -8 10 2 Q10 7 0 7 Q-10 7 -10 2 Z"/>
      <path class="body" d="M-10 -2 Q-16 -6 -14 -12 Q-11 -9 -9 -10 Q-10 -6 -8 -4 Z"/><path class="body" d="M10 -2 Q16 -6 14 -12 Q11 -9 9 -10 Q10 -6 8 -4 Z"/>
      <path class="dark" d="M-7 -8 Q0 -14 7 -8 Q0 -9.5 -7 -8 Z"/><circle class="wht" cx="-3.5" cy="-1.5" r="2"/><circle class="wht" cx="3.5" cy="-1.5" r="2"/>
      <circle class="dark" cx="-3.2" cy="-1.3" r="1"/><circle class="dark" cx="3.8" cy="-1.3" r="1"/><path class="line" d="M-2 3.4 Q0 5 2 3.4"/></g>${hl}`;
    const horse = `${bub}<g transform="translate(1 2)"><path class="body" d="M-2 -12 Q6 -13 7 -6 Q8 -2 4 -1 Q9 2 5 8 Q1 12 -3 9 Q-1 6 -4 3 Q-8 -2 -6 -7 Q-5 -11 -2 -12 Z"/>
      <path class="body" d="M7 -7 Q11 -7 11 -5 Q9 -4 7 -4.5 Z"/><path class="dark" d="M-5 -10 Q-2 -16 3 -13 Q-1 -12 -2 -10 Z"/>
      <circle class="wht" cx="-4.5" cy="-12" r="1.4"/><path class="line" d="M0 -6 Q2 -7.5 4 -6"/><path class="dark" d="M-7 0 Q-12 -1 -11 4 Q-8 3 -6 3 Z"/></g>${hl}`;
    const sol = (inner,r,s,d,dl) => `<i class="fsol" style="--r:${r};--s:${s}px;--d:${d}s;--dl:${dl}s"><svg viewBox="-20 -20 40 40">${inner}</svg></i>`;
    const tiny = Array.from({length:4},(_,k)=>`<i class="fsol b" style="--r:${60+k*3};--s:${7+k*2}px;--d:${9+k*2}s;--dl:${-k*3}s"><svg viewBox="-20 -20 40 40">${bub}${hl}</svg></i>`).join('');
    const salon = `<div class="fsalon" aria-hidden="true"><svg width="0" height="0" style="position:absolute"><defs>
      <radialGradient id="fBub" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset=".6" stop-color="#8fd0ff" stop-opacity=".25"/><stop offset="1" stop-color="#3e8fe8" stop-opacity=".55"/></radialGradient></defs></svg>
      ${sol(usher,64,48,12,0)}${sol(crab,64,44,12,-4)}${sol(horse,64,46,12,-8)}${tiny}</div>`;
    const wave = `<svg class="fwave" viewBox="0 0 140 60" preserveAspectRatio="none" aria-hidden="true"><defs>
      <linearGradient id="fWaveG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff4ff" stop-opacity=".95"/><stop offset=".3" stop-color="#6cc0ff" stop-opacity=".85"/><stop offset="1" stop-color="#1c5fd0" stop-opacity=".2"/></linearGradient></defs>
      <path class="w1" d="M0 30 Q12 14 24 24 Q34 32 44 20 Q54 6 66 18 Q76 28 86 16 Q98 4 110 20 Q120 30 130 18 Q136 12 140 16 L140 60 L0 60 Z"/>
      <path class="w2" d="M4 26 Q14 14 24 22 M46 18 Q56 6 66 16 M88 14 Q98 4 108 18 M128 18 Q134 12 139 15"/></svg>`;
    const spl = Array.from({length:12},(_,k)=>`<i class="fsplash" style="--x:${Math.round(5+k*8)}%;--s:${4+Math.round(Math.random()*5)}px;--dx:${Math.round(Math.random()*50-25)}px;--dy:${-Math.round(40+Math.random()*70)}px;--dl:${(Math.random()*.25).toFixed(2)}s"></i>`).join('');
    const cols = ['#f6d27a','#ffe9a8','#6cc0ff','#b8e4ff','#3a64d0','#ffffff'];
    const conf = Array.from({length:22},(_,k)=>`<i class="fconf" style="--x:${Math.round(Math.random()*100)}%;--w:${3+Math.round(Math.random()*3)}px;--c:${cols[k%cols.length]};--d:${(1.6+Math.random()*1.2).toFixed(2)}s;--dl:${(Math.random()*.6).toFixed(2)}s;--dx:${Math.round(Math.random()*70-35)}px;--r:${Math.round(Math.random()*900-450)}deg"></i>`).join('');
    return `<div class="fcurt" aria-hidden="true"><svg width="0" height="0" style="position:absolute"><defs>
      <linearGradient id="fFold" x1="0" x2=".125" spreadMethod="repeat"><stop offset="0" stop-color="#0a1b52"/><stop offset=".3" stop-color="#1f3f9e"/><stop offset=".5" stop-color="#4a73d8"/><stop offset=".62" stop-color="#2a4fb4"/><stop offset="1" stop-color="#0a1b52"/></linearGradient>
      <linearGradient id="fShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
      <linearGradient id="fVal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d2266"/><stop offset=".6" stop-color="#2d56c4"/><stop offset="1" stop-color="#16338a"/></linearGradient></defs></svg><svg class="dl" viewBox="0 0 50 75" preserveAspectRatio="none"><path d="M0 0 L50 0 C49 25 51 50 48 75 L0 75 Z" fill="url(#fFold)"/><path d="M0 0 L50 0 C49 25 51 50 48 75 L0 75 Z" fill="url(#fShade)"/><path d="M0 74 L48 74" stroke="#f3cf73" stroke-width="2.2" stroke-dasharray="1 .7"/><path d="M0 72.4 L48.2 72.4" stroke="#ffe7a6" stroke-width=".7"/></svg><svg class="dr" viewBox="0 0 50 75" preserveAspectRatio="none"><path d="M50 0 L0 0 C1 25 -1 50 2 75 L50 75 Z" fill="url(#fFold)"/><path d="M50 0 L0 0 C1 25 -1 50 2 75 L50 75 Z" fill="url(#fShade)"/><path d="M2 74 L50 74" stroke="#f3cf73" stroke-width="2.2" stroke-dasharray="1 .7"/><path d="M1.8 72.4 L50 72.4" stroke="#ffe7a6" stroke-width=".7"/></svg><svg class="val" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 0 L100 0 L100 9 Q91.7 19 83.3 9 Q75 19 66.7 9 Q58.3 19 50 9 Q41.7 19 33.3 9 Q25 19 16.7 9 Q8.3 19 0 9 Z" fill="url(#fVal)"/>
      <path d="M0 9 Q8.3 19 16.7 9 Q25 19 33.3 9 Q41.7 19 50 9 Q58.3 19 66.7 9 Q75 19 83.3 9 Q91.7 19 100 9" fill="none" stroke="#f3cf73" stroke-width="1.1"/>
      <path d="M0 1.2 L100 1.2" stroke="#f3cf73" stroke-width="1.4"/>
      <g fill="#f3cf73"><path d="M15.7 9.5 L17.7 9.5 L18.099999999999998 15 L15.299999999999999 15 Z"/><circle cx="16.7" cy="9" r="1.1"/><path d="M32.3 9.5 L34.3 9.5 L34.699999999999996 15 L31.9 15 Z"/><circle cx="33.3" cy="9" r="1.1"/><path d="M49 9.5 L51 9.5 L51.4 15 L48.6 15 Z"/><circle cx="50" cy="9" r="1.1"/><path d="M65.7 9.5 L67.7 9.5 L68.10000000000001 15 L65.3 15 Z"/><circle cx="66.7" cy="9" r="1.1"/><path d="M82.3 9.5 L84.3 9.5 L84.7 15 L81.89999999999999 15 Z"/><circle cx="83.3" cy="9" r="1.1"/></g></svg></div>${wave}${spl}${conf}${salon}`;
  }
  // ===== Эффекты стихий: Электро (аниме-VFX: залитые молнии, белое ядро + фиолетовый контур, острые концы) =====
  function jagPts(x1,y1,x2,y2,n,amp){
    const pts = [[x1,y1]], dx = x2-x1, dy = y2-y1, L = Math.hypot(dx,dy), nx = -dy/L, ny = dx/L;
    let side = 1;
    for (let i=1;i<n;i++){ const t = i/n; side = -side; const o = side*(amp*.4 + Math.random()*amp*.8); pts.push([x1+dx*t+nx*o, y1+dy*t+ny*o]); }
    pts.push([x2,y2]); return pts;
  }
  // превращает ломаную в залитую «ленту»: толще в середине, иглы на концах, случайные шипы-зазубрины
  function taper(pts, wmax, barbs){
    const n = pts.length, L = [], R = [];
    for (let i=0;i<n;i++){
      const p = pts[i], a = pts[Math.max(0,i-1)], b = pts[Math.min(n-1,i+1)];
      let tx = b[0]-a[0], ty = b[1]-a[1]; const l = Math.hypot(tx,ty)||1; tx/=l; ty/=l;
      const t = i/(n-1), w = wmax * Math.pow(Math.sin(Math.PI*t), .6) * (.55 + Math.random()*.7);
      L.push([p[0]-ty*w, p[1]+tx*w]); R.push([p[0]+ty*w, p[1]-tx*w]);
      if (barbs && i>0 && i<n-1 && Math.random()<.35){ const s = Math.random()<.5 ? L : R, sg = s===L ? -1 : 1, k = wmax*(2+Math.random()*2.5);
        s.push([p[0]+sg*ty*k + tx*k*.6, p[1]-sg*tx*k + ty*k*.6]); s.push([p[0]-ty*w*sg*-.3 + tx*w, p[1]+tx*w*sg*-.3 + ty*w]); }
    }
    const f = v => v.toFixed(1);
    return 'M' + L.map(p=>f(p[0])+' '+f(p[1])).join(' L') + ' L' + R.reverse().map(p=>f(p[0])+' '+f(p[1])).join(' L') + ' Z';
  }
  function bolt2(pts, w, barbs){ // контур + белое ядро
    return `<path class="bo" d="${taper(pts, w, barbs)}"/><path class="bc" d="${taper(pts, w*.45, false)}"/>`;
  }
  function electroFx(){
    const segs = [[6,6,50,3],[50,4,94,7],[97,8,98,38],[97,38,95,68],[94,71,50,73],[50,72,6,70],[3,68,2,38],[3,37,5,8]];
    let arcs = '';
    segs.forEach(([a,b,c,d],i)=>{ for (let v=0; v<2; v++){ const du = (.8+Math.random()*.5).toFixed(2), dl = (-(i*.27 + v*.45)).toFixed(2);
      arcs += `<g style="--d:${du}s;--dl:${dl}s">${bolt2(jagPts(a,b,c,d,5,3.4), 1.9, true)}</g>`; } });
    const bx = 30 + Math.random()*40;
    const main = jagPts(50,0,50,96,6,18), br = jagPts(main[3][0],main[3][1], main[3][0]+(Math.random()<.5?-26:26), main[3][1]+26, 3, 5);
    const crown = 'M-14 -2 L-9 -18 L-6 -6 L-2 -24 L1 -7 L6 -20 L7 -5 L15 -14 L10 1 Q0 5 -10 1 Z';
    const spk = Array.from({length:10},()=>{ const side = Math.random()<.5, x = side ? (Math.random()<.5?0:100) : Math.random()*100, y = side ? Math.random()*100 : (Math.random()<.5?0:100);
      return `<i class="espk" style="--x:${x.toFixed(0)}%;--y:${y.toFixed(0)}%;--s:${6+Math.round(Math.random()*7)}px;--d:${(.6+Math.random()*.7).toFixed(2)}s;--dl:${(Math.random()*1.2).toFixed(2)}s;--dx:${Math.round((x-50)*.7+Math.random()*20-10)}px;--dy:${Math.round((y-50)*.7+Math.random()*20-10)}px"></i>`; }).join('');
    return { top:`<svg class="earcs" viewBox="0 0 100 75" preserveAspectRatio="none" aria-hidden="true">${arcs}</svg>
      <svg class="ebolt" style="--x:calc(${bx.toFixed(0)}% - 20%)" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${bolt2(main, 11, true)}${bolt2(br, 6, true)}</svg>
      <svg class="eimp" style="--x:${bx.toFixed(0)}%" viewBox="-20 -28 40 36" aria-hidden="true"><ellipse class="eglow" cx="0" cy="2" rx="16" ry="6"/><path class="bo" d="${crown}" transform="scale(1.12) translate(0 .5)"/><path class="bc" d="${crown}"/><ellipse class="edot" cx="0" cy="1.5" rx="4" ry="2"/></svg>
      <div class="eflash" style="--x:${bx.toFixed(0)}%" aria-hidden="true"></div>${spk}` };
  }
  function electroSmoke(){
    // фиолетовая дымка из-за карты: клубы медленно расползаются и клубятся
    const puffs = Array.from({length:9},(_,k)=>{ const a = k/9*Math.PI*2 + Math.random()*.4, r = 30 + Math.random()*8;
      return `<i class="epuff" style="--x:${(50+Math.cos(a)*r).toFixed(0)}%;--y:${(50+Math.sin(a)*r*.9).toFixed(0)}%;--s:${38+Math.round(Math.random()*18)}%;--d:${(4+Math.random()*3).toFixed(1)}s;--dl:${(-Math.random()*6).toFixed(1)}s;--dx:${Math.round(Math.cos(a)*7)}px;--dy:${Math.round(Math.sin(a)*6-3)}px"></i>`; }).join('');
    return `<div class="esmoke" aria-hidden="true">${puffs}</div>`;
  }
  function zhongliFx(){
    // гео-энергия: орбита янтарных кристаллов, ударные кольца, золотая пыль
    const cr = Array.from({length:7},(_,k)=>`<i class="gcrys v${k%3}" style="--o:${(k/7).toFixed(3)};--s:${[26,18,22,16,24,20,17][k]}px"></i>`).join('');
    const dust = Array.from({length:18},(_,k)=>{
      const a = Math.round(Math.random()*360), d = (1.6+Math.random()*1.6).toFixed(2), dl = (Math.random()*2).toFixed(2), s = 2+Math.round(Math.random()*3);
      return `<i class="gdust" style="--a:${a}deg;--d:${d}s;--dl:${dl}s;--s:${s}px"></i>`;
    }).join('');
    return `<div class="gwave w1" aria-hidden="true"></div><div class="gwave w2" aria-hidden="true"></div><div class="gwave w3" aria-hidden="true"></div>
      <div class="gorbit" aria-hidden="true">${cr}</div><div class="gbits" aria-hidden="true">${dust}</div>`;
  }
  function zhongliHero(){
    // стела Dominus Lapidis вырастает из земли: трещины от основания, янтарные кристаллы, печать гео (в стиле купола Нахиды)
    const rnd = (a,b) => a + Math.random()*(b-a), f1 = n => n.toFixed(1);
    const jag = (x0,y0,x1,y1,n,amp) => { const dx = x1-x0, dy = y1-y0, len = Math.hypot(dx,dy) || 1, nx = -dy/len, ny = dx/len, pts = [[x0,y0]];
      for (let i=1;i<n;i++){ const t = i/n + rnd(-.03,.03), o = rnd(-amp,amp)*(1-t*.35); pts.push([x0+dx*t+nx*o, y0+dy*t+ny*o]); }
      pts.push([x1,y1]); return pts; };
    const taper = (pts,w) => { const L = [], R = [];
      pts.forEach((p,i)=>{ const a = pts[Math.max(0,i-1)], b = pts[Math.min(pts.length-1,i+1)], dx = b[0]-a[0], dy = b[1]-a[1], l = Math.hypot(dx,dy) || 1, hw = w*Math.pow(1-i/(pts.length-1),.8) + .06;
        L.push([p[0]-dy/l*hw, p[1]+dx/l*hw]); R.push([p[0]+dy/l*hw, p[1]-dx/l*hw]); });
      return 'M' + L.concat(R.reverse()).map(p=>p.map(f1).join(' ')).join(' L') + ' Z'; };
    const line = pts => 'M' + pts.map(p=>p.map(f1).join(' ')).join(' L');
    const BX = 0, BY = 55;
    // трещины: от основания стелы во все стороны, ломаные, сужаются к концу, с ответвлениями
    const angs = [-4,-26,-52,-98,-128,-154,-176,184,16,38,142];
    let cracks = '';
    angs.forEach((deg,k)=>{
      const a = deg*Math.PI/180, down = Math.sin(a) > .1, len = down ? rnd(26,40) : rnd(62,112) * (Math.abs(Math.cos(a))*.35 + .7);
      const ex = BX + Math.cos(a)*len, ey = BY + Math.sin(a)*len*.95, main = jag(BX,BY,ex,ey,9,5.2), dl = (.5 + k*.012).toFixed(2);
      let g = `<path class="zcr" d="${taper(main,3)}"/><path class="zcl" d="${line(main)}"/>`;
      for (let b=0; b<(down?0:(len>80?2:1)); b++){
        const si = 2 + Math.floor(rnd(0,3)), sp = main[si], ba = a + (b%2 ? -1 : 1) * rnd(.5,.85), bl = len*rnd(.3,.45),
          br = jag(sp[0],sp[1], sp[0]+Math.cos(ba)*bl, sp[1]+Math.sin(ba)*bl, 5, 3);
        g += `<path class="zcr" d="${taper(br,1.6)}"/><path class="zcl" d="${line(br)}"/>`; }
      cracks += `<g class="zck" style="--dl:${dl}s">${g}</g>`;
    });
    // янтарные кристаллы вокруг основания
    const cry = (x,y,w,h,rot,dl) => `<g transform="translate(${x} ${y}) rotate(${rot})"><g class="zcy" style="--dl:${dl}s">
      <path d="M${-w} 0 L${-w} ${f1(-h*.62)} L0 ${-h} L0 0 Z" fill="url(#zcL)"/><path d="M0 0 L0 ${-h} L${w} ${f1(-h*.62)} L${w} 0 Z" fill="url(#zcR)"/>
      <path class="zcs" d="M${-w} ${f1(-h*.62)} L0 ${-h} L${w} ${f1(-h*.62)} M0 ${-h} V0"/></g></g>`;
    const back = [[-38,55,6,21,-20,.5],[36,55,6,23,18,.52],[-27,56,4.5,16,-32,.58],[27,56,4.5,15,30,.6],[-47,57,3.6,12,-26,.64],[47,57,3.8,13,24,.62]].map(a=>cry(...a)).join('');
    const front = [[-14,60,5,15,-12,.62],[17,60,5.5,18,10,.56],[1,62,4,10,0,.68],[-25,61,3.6,10,-38,.7],[31,61,3.6,10,36,.72],[-7,64,3,7,-6,.76],[9,65,3,7,8,.78]].map(a=>cry(...a)).join('');
    const defs = `<defs>
      <linearGradient id="zsL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#34291f"/><stop offset="1" stop-color="#5a4936"/></linearGradient>
      <linearGradient id="zsR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a563f"/><stop offset="1" stop-color="#a38762"/></linearGradient>
      <linearGradient id="zsT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1deb0"/><stop offset="1" stop-color="#b09468"/></linearGradient>
      <linearGradient id="zAm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6cf"/><stop offset=".45" stop-color="#ffc94a"/><stop offset="1" stop-color="#c47a12"/></linearGradient>
      <linearGradient id="zcL" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e09a1c"/><stop offset=".6" stop-color="#ffd24f"/><stop offset="1" stop-color="#fff2a8"/></linearGradient>
      <linearGradient id="zcR" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#9a5a0a"/><stop offset=".6" stop-color="#d8920f"/><stop offset="1" stop-color="#f6c33e"/></linearGradient>
      <clipPath id="zCard"><rect x="-97" y="-104" width="194" height="212" rx="12"/></clipPath>
      <clipPath id="zGround"><rect x="-44" y="-80" width="88" height="140"/></clipPath>
    </defs>`;
    const R = 'matrix(1 -.5 0 1 0 0)', Lm = 'matrix(1 .5 0 1 0 0)';
    const shards = [[-30,52,-1],[28,54,1],[-18,58,-1],[16,59,1],[-38,57,-1],[36,57,1]].map(([x,y,d],k)=>`<path class="zsh" style="--dx:${d*(14+k*3)}px;--dr:${d*(40+k*20)}deg;--dl:${(.46+k*.02).toFixed(2)}s" transform="translate(${x} ${y})" d="M-3 0 L0 -5 L4 -1 L2 3 Z"/>`).join('');
    const body = `<g class="zcks" clip-path="url(#zCard)">${cracks}</g>${back}<ellipse class="zpool" cx="0" cy="54" rx="36" ry="9"/>
      <g clip-path="url(#zGround)"><g class="zpil">
        <path d="M-20 -42 L0 -32 L0 56 L-20 46Z" fill="url(#zsL)"/>
        <path d="M0 -32 L20 -42 L20 46 L0 56Z" fill="url(#zsR)"/>
        <path d="M0 -52 L20 -42 L0 -32 L-20 -42Z" fill="url(#zsT)"/>
        <g transform="${Lm}" class="zgl dim"><path d="M-17 -26 H-3 M-17 -22 H-7 V-14 H-3 M-17 38 H-3 M-17 42 H-7 V50 H-3 M-14 6 H-6 V14 H-14 Z"/></g>
        <g transform="${R}" class="zgl"><path d="M3 -26 H17 M3 42 H17 M10 -22 V-8 M10 24 V38"/><path d="M10 -8 L17 8 L10 24 L3 8 Z"/><path d="M10 -2 L14 8 L10 18 L6 8 Z"/><circle cx="10" cy="8" r="1.6" class="zdot"/></g>
        <path class="zedge" d="M0 -32 V56"/><path class="zedge t" d="M-20 -42 L0 -52 L20 -42 L0 -32 Z"/>
        <path class="zgem" d="M0 -48 L6 -42 L0 -36 L-6 -42 Z"/>
      </g></g>${front}${shards}`;
    return `<div class="zmet" aria-hidden="true"><div class="zaura"></div><svg class="zart" viewBox="-64 -64 128 128" overflow="visible">${defs}${body}</svg></div>`;
  }
  function zhongliTop(){
    // метеор: скала с золотыми гео-рунами
    const meteor = zhongliHero();
    const deb = Array.from({length:12},(_,k)=>`<i class="zdeb" style="--a:${Math.round(k*30+Math.random()*20)}deg;--r:${Math.round(90+Math.random()*90)}px;--s:${Math.round(7+Math.random()*9)}px;--sp:${Math.round(Math.random()*720-360)}deg"></i>`).join('');
    return `<div class="morajump" aria-hidden="true"><img src="${ICONS.mora}" alt=""></div>${meteor}<div class="zflash" aria-hidden="true"></div>
      <div class="zring" aria-hidden="true"></div><div class="zring r2" aria-hidden="true"></div>${deb}`;
  }
  function ventiFx(){
    // анемо-вихрь за картой: спиральные потоки ветра + пёрышки
    const streams = [
      'M50 8 C82 8 96 34 90 56 C84 80 56 94 32 86',
      'M92 44 C94 76 66 96 40 92 C16 88 4 64 10 42',
      'M50 94 C18 94 4 68 10 44 C16 20 44 6 68 14',
      'M8 58 C4 26 32 4 58 8 C84 12 98 36 92 60',
      'M30 12 C60 -2 96 16 96 48',
      'M70 90 C40 104 4 84 4 52'
    ].map((d,k)=>`<path class="ws glow s${k}" d="${d}"/><path class="ws s${k}" d="${d}"/>`).join('');
    const feathers = Array.from({length:6},(_,k)=>`<i class="feather" style="--d:${(4+k*.7).toFixed(1)}s;--dl:${(-k*1.1).toFixed(1)}s;--r:${138+(k%3)*14}px;--s:${.8+(k%3)*.2}"></i>`).join('');
    return `<svg class="wind" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#9ff5dc"/><stop offset="1" stop-color="#3fd6b0"/></linearGradient></defs>
      <g class="wspin">${streams}</g></svg><div class="feathers" aria-hidden="true">${feathers}</div>`;
  }
  function ventiTop(){
    const note = (x,dl,k)=>`<svg class="note" style="--x:${x}px;--dl:${dl}s" viewBox="0 0 20 28" aria-hidden="true"><path d="${k? 'M6 22a4 3 0 1 1-1-4V4l12-3v17a4 3 0 1 1-1-4V6L7 8z' : 'M8 22a4 3 0 1 1-1-4V2c3 2 8 3 8 8-2-3-5-3-7-3z'}"/></svg>`;
    return `<div class="lyre-box" aria-hidden="true">
      <svg class="lyre" viewBox="0 0 80 100">
        <defs><linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8"/><stop offset=".5" stop-color="#e2b95a"/><stop offset="1" stop-color="#9a6a24"/></linearGradient>
        <radialGradient id="lg2" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#c9fff0"/><stop offset="1" stop-color="#2fb894"/></radialGradient></defs>
        <path class="arm" d="M24 84 C10 70 6 50 14 34 C20 22 12 12 6 10 C14 6 24 12 24 22 C24 34 18 44 22 58 C24 66 28 74 32 80"/>
        <path class="arm" d="M56 84 C70 70 74 50 66 34 C60 22 68 12 74 10 C66 6 56 12 56 22 C56 34 62 44 58 58 C56 66 52 74 48 80"/>
        <path class="bar" d="M16 26 Q40 18 64 26"/>
        <g class="strings"><line x1="30" y1="24" x2="33" y2="82"/><line x1="35" y1="23" x2="37" y2="82"/><line x1="40" y1="22" x2="40" y2="82"/><line x1="45" y1="23" x2="43" y2="82"/><line x1="50" y1="24" x2="47" y2="82"/></g>
        <path class="body" d="M22 80 Q40 74 58 80 L54 94 Q40 99 26 94 Z"/>
        <circle class="gem" cx="40" cy="87" r="4"/>
      </svg>${note(-6,0,0)}${note(18,.7,1)}${note(40,1.4,0)}</div>`;
  }
  function card(ch, i){
    const h = cardBase(ch, i);
    return (!ch.legend && (ch.r===5 || ch.r===4)) ? `<div class="pl pl${ch.r}">${h}</div>` : h;
  }
  function cardBase(ch, i){
    const el = elOf(ch);
    const html = `<button class="card${ch.legend?' legendary':''}${!ch.legend && (ch.r===5||ch.r===4) ? ' rr'+ch.r : ''}" type="button" data-i="${i}" style="--c:${el.c}" aria-label="${esc(ch.n)}, ${esc(ch.e)}">
      <div class="strip"><span style="--len:${ch.n.length}">${esc(ch.n)}</span></div>
      <div class="art">
        ${myBadge(ch)}
        ${ch.legend ? '<div class="frostrim" aria-hidden="true"></div>' : ''}
        ${ch.vid ? `<video class="photo vid" autoplay muted loop playsinline preload="auto" aria-hidden="true"><source src="${esc(ch.vid)}.webm" type="video/webm"><source src="${esc(ch.vid)}.mp4" type="video/mp4"></video>` : ch.img ? `<div class="aura" aria-hidden="true"></div><img class="photo" src="${esc(ch.img)}" alt="" loading="lazy">` : `<div class="glyph" aria-hidden="true">${ch.e==='Любая' ? '🌟' : icon(el)}</div>`}
        ${ch.flag ? `<span class="flag legend"><span class="lt">${esc(ch.flag)}</span></span>` : ch.bad ? `<span class="flag">Бесполезное говно</span>` : ''}
        <div class="meta"><span class="stars si${ch.r}" role="img" aria-label="${ch.r} звезды"></span>${ch.e==='Любая' ? '' : `<span class="eic" aria-hidden="true">${icon(el)}</span>`}</div>
      </div></button>`;
    const ELC = {'Пиро':'pyro','Гидро':'hydro','Анемо':'anemo','Электро':'electro','Дендро':'dendro','Крио':'cryo','Гео':'geo'}[ch.e];
    if (ELC && !ch.fx && !ch.legend && !ch.trav) return `<div class="el-wrap el-${ELC}">${electroSmoke()}${html}</div>`;
    if (ch.fx==='furina') return `<div class="ar-wrap furina">${furinaFx()}${html}${furinaTop()}</div>`;
    if (ch.fx==='nahida') return `<div class="ar-wrap nahida">${nahidaFx()}${html}${nahidaTop()}</div>`;
    if (ch.fx==='raiden') return `<div class="ar-wrap raiden">${raidenFx()}${html}${raidenTop()}</div>`;
    if (ch.fx==='mavuika') return `<div class="ar-wrap mavuika">${mavuikaFx()}${html}</div>`;
    if (ch.fx==='zhongli') return `<div class="ar-wrap zhongli">${zhongliFx()}${html}${zhongliTop()}</div>`;
    if (ch.fx==='venti') return `<div class="ar-wrap venti">${ventiFx()}${html}${ventiTop()}</div>`;
    if (ch.trav) return `<div class="tr-wrap"><div class="tr-glow" aria-hidden="true"></div><img class="paimon" src="paimon.webp" alt="" aria-hidden="true" loading="lazy">${html.replace('class="card','class="card trav')}</div>`;
    return ch.legend ? `<div class="lg-wrap">${legendFx()}${html}${legendTop()}</div>` : html;
  }

  function render(){ if (PAGE === 'map') return;   // на карте нет сетки персонажей
    syncChips();
    const list = CHARS.map((ch,i)=>[ch,i]).filter(([ch])=>pass(ch) && (!query || ch.n.toLowerCase().includes(query)))
      .sort((a,b)=>(!!a[0].legend - !!b[0].legend) || a[0].n.localeCompare(b[0].n,'ru'));   // по алфавиту, Капитано (legend) — в самом низу
    const active = GROUPS.flatMap(g=>g.opts.filter(o=>sel[g.id].has(o.v)).map(o=>o.label));
    const nSel = Object.values(sel).reduce((a,s)=>a+s.size,0);
    $('fbadge').hidden = !nSel; $('fbadge').textContent = nSel;
    $('fapply').textContent = `Показать ${list.length}`;
    $('count').innerHTML = `<b>${active.length ? esc(active.join(' · ')) : 'Все'}</b> · ${list.length} ${plural(list.length)}`;
    const nGot = CHARS.filter(ch=>['got','main'].includes(stOf(ch))).length, nWant = CHARS.filter(ch=>stOf(ch)==='want').length, mains = CHARS.filter(ch=>stOf(ch)==='main');
    $('mystat').innerHTML = `Выбито <b>${nGot}</b> из ${CHARS.length}${nWant?` · хочу <b>${nWant}</b>`:''}${mains.length?` · <span style="color:${ST.main.c}">♛ ${mains.length>3?'мейнов '+mains.length:mains.map(c=>esc(c.n)).join(', ')}</span>`:''}`;
    $('grid').innerHTML = list.length ? list.map(([ch,i])=>card(ch,i)).join('')
      : `<p class="empty">Никого не нашли. Проверь написание имени или выбери «Все».</p>`;
    fitAll();
  }
  function plural(n){ const a=n%10,b=n%100; return (a===1&&b!==11)?'персонаж':(a>=2&&a<=4&&(b<10||b>=20))?'персонажа':'персонажей'; }

  // детали
  // звуки окна персонажа: открытие (карточка) и закрытие (крестик)
  const SFX_OPEN = new Audio('sfx_open.mp3'), SFX_CLOSE = new Audio('sfx_close.mp3'); SFX_OPEN.preload = SFX_CLOSE.preload = 'auto';
  const sfx = a => { const v = window.gMusic ? window.gMusic.sfxVol() : .5; if (v > 0){ const x = a.cloneNode(); x.volume = v; x.play().catch(()=>{}); } };
  window.uiClose = () => sfx(SFX_CLOSE);   // звук закрытия любого окна (персонаж, фильтр, инструкция)
  // открытие «Фильтр» / «Инструкция» и выбор пункта в фильтре
  const SFX_PANEL = new Audio('sfx_panel.mp3'), SFX_PICK = new Audio('sfx_pick.mp3'); SFX_PANEL.preload = SFX_PICK.preload = 'auto';
  $('fopen').addEventListener('click', ()=>sfx(SFX_PANEL));
  $('hopen').addEventListener('click', ()=>sfx(SFX_PANEL));
  $('filters').addEventListener('click', ev=>{ if (ev.target.closest('.chip')) sfx(SFX_PICK); });
  $('grid').addEventListener('click', ev=>{ const c = ev.target.closest('.card'); if(c){ sfx(SFX_OPEN); openSheet(+c.dataset.i, c); } });
  let lastFocus = null;
  const ARTS = HVJ('artsdata');
  const WEAP = window.HVD.weapdata ? HVJ('weapdata') : {weapons:{}, sig:{}};   // каталог оружия: weapons — карточки, sig — сигнатурка каждого персонажа
  function sec(title, val){
    return val ? `<div class="sec"><h3>${title}</h3><p>${esc(val)}</p></div>` : '';
  }
  const SLOTN = {flower:'Цветок',plume:'Перо',sands:'Часы',goblet:'Кубок',circlet:'Корона'};
  function artSec(ch){
    const c = ARTS.chars && ARTS.chars[ch.n]; if (!c) return '';
    const names = [c.s, c.s2].filter(n => n && ARTS.sets[n]); if (!names.length) return '';
    const multi = names.length > 1;
    const tile = (n, sub) => { const a = ARTS.sets[n], ic = a.img ? `<img src="${esc(a.img)}?v=1" alt="" loading="lazy" decoding="async">` : '';
      return `<button type="button" class="artlink" data-set="${esc(n)}" data-who="${esc(ch.n)}"><span class="artlink-ic">${ic}</span><span class="artlink-tx"><b>${esc(n)}</b><i>${sub}Статы и почему этот сет</i></span><span class="artlink-ar" aria-hidden="true">›</span></button>`; };
    const alt = c.alt && ARTS.sets[c.alt] ? `<div class="art-sep art-or">или</div>${tile(c.alt, 'Полный сет · 4 части · ')}` : '';
    return `<div class="sec asec"><h3>Артефакты${multi ? ' · 2+2' : ''}</h3><div class="artlinks">${names.map(n => tile(n, multi ? '2 части · ' : '')).join('<div class="art-sep art-plus">+</div>')}${alt}</div></div>`;
  }
  // сворачиваемые разделы карточки (Команды, Навыки): состояние помним
  const FOLD = (() => { try { return new Set(JSON.parse(localStorage.getItem('sheetFold') || '[]')); } catch(e){ return new Set(); } })();
  const foldSave = () => { try { localStorage.setItem('sheetFold', JSON.stringify([...FOLD])); } catch(e){} };
  const foldSec = (key, title, body, cls) => { const shut = FOLD.has(key);
    return `<div class="sec fold${cls ? ' ' + cls : ''}${shut ? ' shut' : ''}" data-fold="${key}"><h3 role="button" tabindex="0" aria-expanded="${!shut}" title="Свернуть / развернуть">${title}<i class="fold-ar" aria-hidden="true"></i></h3><div class="fold-b"><div class="fold-i">${body}</div></div></div>`; };
  const foldToggle = h => { const s = h.closest('.fold'); if (!s) return; const shut = s.classList.toggle('shut'); h.setAttribute('aria-expanded', String(!shut));
    shut ? FOLD.add(s.dataset.fold) : FOLD.delete(s.dataset.fold); foldSave(); };
  const TROLE = {main:'Мейн ДД', sub:'Саб-ДД', sup:'Саппорт'};
  function teamBody(ch){
    const c = ARTS.chars && ARTS.chars[ch.n]; if (!c || !c.teams || !c.teams.length) return '';
    const team = (tm, k) => { const top = (c.top || []).indexOf(k) + 1; return `<div class="team${top ? ' top' : ''}">${top ? `<span class="team-top">★ TOP ${top}</span>` : ''}${tm.map(m => { const p = CHARS.find(x => x.n === m[0]); if (!p) return '';
      const e = byName[p.e] || ANY, cur = m[0] === ch.n;
      return `<button type="button" class="tm${m[1] === 'main' ? ' main' : ''}" data-tm="${esc(m[0])}" style="--tc:${e.c}"${cur ? ' disabled style="--tc:' + e.c + ';cursor:default"' : ''}><span class="tm-av"><img class="p" src="${p.img}" alt="${esc(m[0])}" loading="lazy" decoding="async">${e.emoji ? '' : `<span class="tm-el">${icon(e)}</span>`}${m[2] ? `<span class="tm-c">${esc(m[2])}</span>` : ''}</span><span class="tm-r">${TROLE[m[1]] || ''}</span><span class="tm-n">${esc(m[0])}</span><span class="tm-e">${esc(p.e)}</span></button>`; }).join('')}</div>`; };
    return `<div class="teams">${c.teams.map(team).join('')}</div>${c.tn && c.tn.length ? `<ul class="sk-notes">${c.tn.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}`;
  }
  $('sheet').addEventListener('keydown', ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('.fold > h3')){ ev.preventDefault(); foldToggle(ev.target); } });
  // раздел справа: кнопки в карточке (Команды / Навыки / Ротация), панель выезжает справа, карточка уезжает влево
  let spKey = null, spCh = null, spSkills = '';
  const SPT = {team:'Команды', skills:'Навыки', rot:'Ротация', wp:'Оружие', con:'Созвездия', syn:'Синергия'};
  const isNat = ch => ch.reg === 'Натлан' || ch.reg2 === 'Натлан';
  const spHas = (k, ch) => k === 'team' ? !!teamBody(ch) : k === 'rot' ? !!(ch.rot && ch.rot.length) : k === 'wp' ? !!((ch.wp && ch.wp.length) || WEAP.sig[ch.n]) : k === 'con' ? !!(ch.con && ch.con.length) : k === 'syn' ? isNat(ch) : true;
  const spBtns = ch => `<div class="sbtns" role="group" aria-label="Разделы">${['team','skills','rot','wp','con','syn'].filter(k => spHas(k, ch)).map(k =>
    `<button type="button" class="sbtn${k === 'syn' ? ' ns' : ''}" data-sp="${k}" aria-pressed="false"><span>${SPT[k]}</span><i class="sbtn-ar" aria-hidden="true"></i></button>`).join('')}</div>`;
  const spBody = (k, ch) => k === 'team' ? `<div class="sec tsec">${teamBody(ch)}</div>` : k === 'rot' ? rotBody(ch) : k === 'wp' ? wpBody(ch) : k === 'con' ? conBody(ch) : k === 'syn' ? synBody(ch) : spSkills;
  function spRender(ch){
    const ov = $('overlay'), p = $('spanel'); if (!p) return;
    if (spKey && !spHas(spKey, ch)) spKey = null;
    $('sheet').querySelectorAll('.sbtn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sp === spKey)));
    if (!spKey){ ov.classList.remove('sp-open'); p.setAttribute('aria-hidden', 'true'); return; }
    p.style.setProperty('--c', elOf(ch).c); p.classList.toggle('syn-mode', spKey === 'syn');
    $('spTitle').textContent = SPT[spKey]; $('spBody').innerHTML = spBody(spKey, ch); $('spBody').scrollTop = 0;
    p.style.setProperty('--sph', $('sheet').offsetHeight + 'px');
    ov.classList.add('sp-open'); p.setAttribute('aria-hidden', 'false');
  }
  // электро-рамка кнопки «Синергия»: ток трещит по обводке (SVG-фильтры из index.html / map.html)
  let nsRun = false, nsLast = 0, nsBtn = null, nsRO = null;
  const NSNS = 'http://www.w3.org/2000/svg';
  function nsFit(){ const b = nsBtn, s = b && b._ns; if (!s) return; const w = b.offsetWidth, h = b.offsetHeight; if (!w) return;
    s.setAttribute('width', w + 14); s.setAttribute('height', h + 14); s.setAttribute('viewBox', `0 0 ${w + 14} ${h + 14}`);
    s.querySelectorAll('rect').forEach(r => { r.setAttribute('x', 7); r.setAttribute('y', 7); r.setAttribute('width', w); r.setAttribute('height', h); }); }
  function nsTick(t){
    const b = nsBtn;
    if (!b || !b.isConnected || $('overlay').hidden){ nsRun = false; return; }
    if (t - nsLast > 70 && !document.hidden && !matchMedia('(prefers-reduced-motion:reduce)').matches){ nsLast = t;
      const t1 = document.getElementById('nst1'), t2 = document.getElementById('nst2');
      if (t1) t1.setAttribute('seed', (Math.random() * 500) | 0); if (t2) t2.setAttribute('seed', (Math.random() * 500) | 0);
      const on = b.getAttribute('aria-pressed') === 'true';
      b._ns.style.opacity = Math.min(1, (0.55 + Math.random() * 0.45) * (on ? 1 : .8) + .15);
      b._ns.style.filter = `drop-shadow(0 0 ${on ? 7 : 4}px rgb(170 130 255 / .9))`;
    }
    requestAnimationFrame(nsTick);
  }
  function nsArcs(){
    const b = $('sheet').querySelector('.sbtn.ns'); if (nsRO){ nsRO.disconnect(); nsRO = null; }
    nsBtn = b; if (!b) return;
    const s = document.createElementNS(NSNS, 'svg'); s.setAttribute('class', 'arcs'); s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<rect rx="12" fill="none" stroke="url(#nsg1)" stroke-width="2" filter="url(#nsb1)"/>'
      + '<rect rx="12" fill="none" stroke="url(#nsg2)" stroke-width="1.1" filter="url(#nsb2)"/>'
      + '<rect rx="12" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".7"/>';
    b.appendChild(s); b._ns = s; nsFit();
    if (window.ResizeObserver){ nsRO = new ResizeObserver(nsFit); nsRO.observe(b); }
    if (!nsRun){ nsRun = true; requestAnimationFrame(nsTick); }
  }
  // памятник для неиграбельных героев (ch.memo): плашка редкости, венок и плачущие гифки
  const memoBody = () => {
    const im = 'display:block;margin:0 auto;max-width:100%;height:auto;border-radius:10px';
    return `<div class="memo" style="display:flex;flex-direction:column;align-items:center;gap:18px;margin:4px 0 16px;text-align:center">`
      + `<img class="memo-rar" src="memo_rarity.webp?v=1" alt="Редкость: SUPERMEGAULTRANANO LEGENDARY" style="${im};width:100%;max-width:520px;background:#000;border-radius:12px">`
      + `<img class="memo-wr" src="memo_wreath.webp?v=1" alt="Венок" loading="lazy" style="${im};width:170px">`
      + Array.from({length:13}, (_, k) => `<img class="memo-gif" src="memo_cry${String(k+1).padStart(2,'0')}.webp?v=1" alt="" loading="lazy" style="${im};width:auto;max-width:min(100%,240px)">`).join('')
      + `</div>`;
  };
  // «Синергия» у натланцев: что такое Ночной дух простыми словами
  const NSOUL = [
    ['Что это', 'Ночной дух — «ночной режим» натланцев. В нём герой быстрее бегает, а навыки сильнее или меняются.'],
    ['Как включить', 'Нажми <b>Е</b>. Слева от героя появится шкала. У Кинича режим включён сразу.'],
    ['Очки = топливо', 'Шкала слева — очки Ночного духа. Тратятся со временем и на действия. Кончились — режим выключился.']
  ];
  const NSCD = [['1 натланец','18 сек'],['2 натланца','12 сек'],['3 и больше','9 сек']];
  function synBody(ch){
    return `<div class="syn">${NSOUL.map(([h,t]) => `<div class="syn-c"><h4>${h}</h4><p>${t}</p></div>`).join('')}
      <div class="syn-c syn-key"><h4>Синергия: собирай натланцев вместе</h4>
        <p><b>Вспышка</b> — автобонус при уроне стихией. Чем больше натланцев в отряде, тем чаще она срабатывает:</p>
        <div class="syn-cd">${NSCD.map(([w,s]) => `<div><b>${s}</b><span>${w}</span></div>`).join('')}</div>
        <p>С тремя Вспышка срабатывает вдвое чаще, чем с одним.</p></div>
      ${ch.synn ? `<div class="syn-c syn-me"><h4>У ${esc(ch.n)}</h4><p>${esc(ch.synn)}</p></div>` : ''}
      <p class="syn-src">Цифры могут меняться в обновлениях.</p></div>`;
  }
  // ротация: шаги с иконками навыков (ch.rot = [{s:['e','a','pl','q'], t:'...'}], ch.rotn — примечание)
  const ROTIC = {a:'sk_varesa_a.webp?v=1', e:'sk_varesa_e.webp?v=1', q:'sk_varesa_q.webp?v=1'};
  // оружие: сигнатурка идёт первой, записи со ссылкой на каталог открывают карточку оружия
  const wpNorm = n => String(n).replace(/\s*\([^)]*\)\s*/g, ' ').trim().toLowerCase();
  const wpKey = x => { if (x.k && WEAP.weapons[x.k]) return x.k; const t = wpNorm(x.n); return Object.keys(WEAP.weapons).find(k => k.toLowerCase() === t) || null; };
  function wpBody(ch){
    const sgs = [].concat(WEAP.sig[ch.n] || []).filter(Boolean), list = (ch.wp || []).slice();
    const sgOf = x => sgs.find(v => wpNorm(x.n) === v.toLowerCase()) || (sgs.length === 1 && /сигнатур/i.test(x.n) ? sgs[0] : null);
    const isSig = x => !!sgOf(x);
    sgs.slice().reverse().forEach(v => { if (!list.some(x => sgOf(x) === v)) list.unshift({n: v, sg: 1, t: 'Описание для этого персонажа пока не написано.'}); });
    return `<div class="syn">${list.map(x => { const sg = sgOf(x), k = wpKey(x) || (sg && WEAP.weapons[sg] ? sg : null), w = k && WEAP.weapons[k];
      const cd = w && (w.card || w.img), ic = cd ? `<img class="wp-ic" src="${esc(cd)}" alt="" loading="lazy">` : '';
      const tag = (x.sg || isSig(x)) ? `<span class="wp-sg">${(WEAP.rec || []).includes(ch.n) ? 'Рекомендуемое' : 'Сигнатурное'}</span>` : '';
      return `<div class="syn-c${k ? ' wp-link' : ''}${ic ? ' wp-has' : ''}"${k ? ` role="button" tabindex="0" data-wp="${esc(k)}"` : ''}>${ic}<div class="wp-tx"><h4>${x.r ? x.r + '. ' : ''}${esc(tag ? x.n.replace(/\s*\(сигнатурное\)\s*/i, '') : x.n)}${tag}</h4><p>${esc(x.t)}</p>${k ? '<span class="wp-go">Карточка оружия ›</span>' : ''}</div></div>`; }).join('')}${ch.wpn ? `<div class="syn-c syn-key"><h4>Разрыв между оружием</h4><p>${esc(ch.wpn)}</p></div>` : ''}</div>`; }
  // созвездия: фон по стихии, 6 кружков; по клику на кружок показывается описание (ch.con = [{c:'C0',t}, {c:'C1',t,n?,ic?}, ...])
  const CNSLUG = {'Пиро':'pyro','Гидро':'hydro','Анемо':'anemo','Гео':'geo','Электро':'electro','Дендро':'dendro','Крио':'cryo'};
  const CNPOS = [[1525,277],[1580,389],[1616,500],[1616,611],[1580,722],[1508,832]].map(([x,y]) => [((x-1380)/520*100).toFixed(2), ((y-215)/680*100).toFixed(2)]);
  const cnInfo = (ch, i) => { const x = ch.con.find(y => y.c === (i < 0 ? 'C0' : 'C' + (i+1))); if (!x) return '';
    return `<h4>${i < 0 ? 'Общее' : esc(x.c) + (x.n ? ' · ' + esc(x.n) : '')}</h4><p>${esc(x.t)}</p>`; };
  function conBody(ch){
    const slug = CNSLUG[ch.e];
    if (!slug) return `<div class="syn">${ch.con.map(x => `<div class="syn-c"><h4>${esc(x.c)}</h4><p>${esc(x.t)}</p></div>`).join('')}</div>`;
    const nodes = CNPOS.map(([l,t], i) => { const x = ch.con.find(y => y.c === 'C' + (i+1)); if (!x) return '';
      return `<button type="button" class="cn-node" data-i="${i}" aria-pressed="false" aria-label="Созвездие ${i+1}" style="left:${l}%;top:${t}%"><span class="cn-ic">${x.ic ? `<img src="${esc(x.ic)}" alt="" loading="lazy">` : ''}</span><b>C${i+1}</b></button>`; }).join('');
    return `<div class="cn"><div class="cn-sky" style="background-image:url('con_${slug}.webp?v=1')">${nodes}</div><p class="cn-hint">Нажми на созвездие, чтобы увидеть, что оно даёт</p><div class="syn"><div class="syn-c" id="cnInfo">${cnInfo(ch, -1)}</div></div></div>`;
  }
  if ($('spBody')) $('spBody').addEventListener('click', ev => { const n = ev.target.closest('.cn-node'); if (!n || !spCh) return;
    sfx(SFX_PICK); const on = n.getAttribute('aria-pressed') !== 'true';
    $('spBody').querySelectorAll('.cn-node').forEach(b => b.setAttribute('aria-pressed', 'false'));
    if (on) n.setAttribute('aria-pressed', 'true');
    $('cnInfo').innerHTML = cnInfo(spCh, on ? +n.dataset.i : -1); });
  function rotBody(ch){
    if (!ch.rot || !ch.rot.length) return '';
    const ric = ch.ric || (ch.n === 'Вареса' ? ROTIC : null);   // иконки навыков для ротации: ch.ric или (пока) только у Вареси, иначе подписи
    const chip = k => (k === 'pl' || !ric || !ric[k]) ? `<span class="rot-pl">${k==='pl'?'Планж':k==='e'?'Е':k==='q'?'Q':k==='a'?'Атака':esc(k)}</span>` : `<img class="rot-ic" src="${ric[k]}" alt="${k==='e'?'Е':k==='q'?'Q':'Тычка'}">`;
    const steps = ch.rot.map((r,i)=>`<li><span class="rot-n">${i+1}</span><span class="rot-ch">${(r.s||[]).map(chip).join('<i class="rot-ar">›</i>')}</span><span class="rot-t">${esc(r.t)}</span></li>`).join('');
    return `<ol class="rot">${steps}</ol>${ch.rotn ? `<p class="rot-note">${esc(ch.rotn)}</p>` : ''}`;
  }
  function openSheet(i, from, keepSp){
    const ch = CHARS[i], el = elOf(ch); lastFocus = from; if (!keepSp) spKey = null; spCh = ch;
    const tags = ch.e==='Любая'
      ? ELEMENTS.slice(1).map(e=>`<span class="tag" style="--tc:${e.c}">${icon(e)}${e.name}</span>`).join('')
      : `<span class="tag">${icon(el)}${esc(ch.e)}</span>`;
    const skills = ch.skx && ch.skx.length
      ? `<ul class="skills skx">${ch.skx.map(s=>`<li>${s.ic ? `<img class="sk-ic" src="${esc(s.ic)}" alt="" loading="lazy">` : ''}<span class="sk-tx"><b>${esc(s.n)}</b><span>${esc(s.t||'')}</span></span>${s.pas ? `<span class="prio pas"><small>ПАССИВ</small></span>` : `<span class="prio"><small>ПРИОР.</small>${s.p}</span>`}</li>`).join('')}</ul>`
        + (ch.skn && ch.skn.length ? `<ul class="sk-notes">${ch.skn.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>` : '')
      : ch.sk && ch.sk.length
      ? `<ul class="skills">${ch.sk.map(s=>{ const m = s.match(/^(.*?)\s*—\s*(\d+)\s*$/);
          return m ? `<li><span class="prio"><small>ПРИОР.</small>${m[2]}</span><span>${esc(m[1])}</span></li>` : `<li><span>${esc(s)}</span></li>`; }).join('')}</ul>`
      : `<p class="none">Пока не заполнено</p>`;
    $('sheet').style.setProperty('--c', el.c);
    $('sheet').classList.toggle('legendary', !!ch.legend);
    $('sheet').classList.toggle('hasside', !!(ARTS.chars && ARTS.chars[ch.n] && ARTS.chars[ch.n].side));
    $('sheet').innerHTML = `
      <button class="close" type="button" id="close" aria-label="Закрыть">×</button>
      ${(() => { const sd = ARTS.chars && ARTS.chars[ch.n] && ARTS.chars[ch.n].side, s2 = sd && ARTS.chars[ch.n].side2; return sd ? `<div class="side-art" aria-hidden="true" style="background-image:url('${esc(sd)}')">${s2 ? `<div class="sa2" style="background-image:url('${esc(s2)}')"></div>` : ''}</div>` : ''; })()}
      <div class="sheet-sc">
      <div class="sheet-head">
        ${(ARTS.chars && ARTS.chars[ch.n] && ARTS.chars[ch.n].side) ? `<div class="sheet-av"><img src="${ch.img}" alt="${esc(ch.n)}"></div>` : `<div class="strip"><span style="--len:${ch.n.length}">${esc(ch.n)}</span></div>`}
        <div class="sheet-title"><h2 id="sheet-name">${esc(ch.n)}</h2>
          <div class="tags">${tags}${ch.r ? `<span class="tag" style="--tc:var(--gold)">${'★'.repeat(ch.r)}</span>` : ''}<span class="tag" style="--tc:var(--muted)">${esc(ch.w||'')}</span><span class="tag" style="--tc:var(--muted)">${esc(ch.reg||'')}</span>${(ch.reg2||[]).map(r=>`<span class="tag" style="--tc:var(--muted)">${esc(r)}</span>`).join('')}${(ch.f||[]).map(f=>`<span class="tag" style="--tc:${f.startsWith('ЛЕГЕНДА')?'var(--gold)':'#B9A8FF'}">${esc(f)}</span>`).join('')}</div></div>
      </div>
      <div class="sheet-body">
        <div class="sec"><h3>Моя коллекция</h3><div class="mypick" role="group" aria-label="Моя коллекция">${['want','got','main','none'].map(k=>`<button type="button" class="mypb" data-st="${k}" style="--mc:${ST[k].c}" aria-pressed="${stOf(ch)===k}">${ST[k].ic?`<i>${ST[k].ic}</i>`:''}${ST[k].label}</button>`).join('')}</div></div>
        ${ch.memo ? memoBody() : (ch.no ? `<div class="sec"><h3>Примечание</h3><p>${esc(ch.no)}</p></div>` : '')}
        ${sec('Нужные статы', ch.st)}
         ${artSec(ch)}
        ${ch.memo ? '' : spBtns(ch)}
        <div class="sec cmt" id="cmt"></div>
      </div>
      </div>`;
    spSkills = skills;
    { const sd = ARTS.chars && ARTS.chars[ch.n] && ARTS.chars[ch.n].side, sh = $('sheet');   // ширина боковой арки = реальная пропорция постера
      sh.style.removeProperty('--par');
      if (sd) { const im = new Image(); im.onload = () => { if (im.naturalWidth && im.naturalHeight && sh.classList.contains('hasside')) sh.style.setProperty('--par', (im.naturalWidth / im.naturalHeight).toFixed(4)); }; im.src = sd; } }
    $('overlay').hidden = false;
    spRender(ch); nsArcs();
    window.dispatchEvent(new CustomEvent('hv:sheet', {detail:{name: ch.n}}));   // комментарии (модуль аккаунтов)
    fitNames($('sheet'));
    $('close').focus();
  }
  $('sheet').addEventListener('click', ev=>{
    const fh = ev.target.closest('.fold > h3'); if (fh){ foldToggle(fh); return; }
    const sb = ev.target.closest('.sbtn'); if (sb){ sfx(SFX_PICK); spKey = spKey === sb.dataset.sp ? null : sb.dataset.sp; spRender(spCh); return; }
    const tb = ev.target.closest('.tm'); if (tb && !tb.disabled){ const j = CHARS.findIndex(c => c.n === tb.dataset.tm); if (j >= 0){ sfx(SFX_OPEN); openSheet(j, tb); } return; }
    const b = ev.target.closest('.mypb'); if (!b) return;
    const ch = CHARS.find(c=>c.n===$('sheet-name').textContent); if (!ch) return;
    setSt(ch, b.dataset.st);
    $('sheet').querySelectorAll('.mypb').forEach(x=>x.setAttribute('aria-pressed', String(x.dataset.st===stOf(ch))));
    render();
  });
  $('spanel').addEventListener('keydown', ev => { const wl = ev.target.closest && ev.target.closest('.wp-link'); if (wl && (ev.key === 'Enter' || ev.key === ' ') && window.openWeapon){ ev.preventDefault(); window.openWeapon(wl.dataset.wp, wl); } });
  $('spanel').addEventListener('click', ev => {
    if (ev.target.closest('.sp-x')){ sfx(SFX_CLOSE); spKey = null; spRender(spCh); return; }
    const wl = ev.target.closest('[data-wp]'); if (wl && window.openWeapon){ window.openWeapon(wl.dataset.wp, wl); return; }
    const tb = ev.target.closest('.tm'); if (tb && !tb.disabled){ const j = CHARS.findIndex(c => c.n === tb.dataset.tm); if (j >= 0){ sfx(SFX_OPEN); openSheet(j, tb, true); } }
  });
  // перенос коллекции кодом
  const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
  const dec = t => JSON.parse(decodeURIComponent(escape(atob(t.trim()))));
  const msg = t => { $('mymsg').textContent = t; clearTimeout(msg.t); msg.t = setTimeout(()=>$('mymsg').textContent='', 3500); };
  ($('mytools') || document.querySelector('.mytools')).addEventListener('toggle', e=>{ if (e.target.open) $('mycode').value = enc(COLL); });
  $('mycopy').addEventListener('click', async ()=>{ $('mycode').value = enc(COLL); $('mycode').select();
    try{ await navigator.clipboard.writeText($('mycode').value); msg('Код скопирован'); }catch(e){ try{ document.execCommand('copy'); msg('Код скопирован'); }catch(_){ msg('Выдели код и скопируй вручную'); } } });
  $('myload').addEventListener('click', ()=>{ try{ const o = dec($('mycode').value); if (!o || typeof o!=='object') throw 0;
      const ok = {}; for (const k in o) if (ST[o[k]] && o[k]!=='none') ok[k] = o[k]; COLL = ok; saveColl(); render(); msg('Коллекция загружена'); }catch(e){ msg('Код не подходит'); } });
  let resetArm = 0;
  $('myreset').addEventListener('click', ()=>{ if (Date.now()-resetArm > 3000){ resetArm = Date.now(); msg('Нажми ещё раз, чтобы стереть все отметки'); return; }
    COLL = {}; saveColl(); $('mycode').value = enc(COLL); render(); msg('Отметки сброшены'); });
  function closeSheet(){ window.dispatchEvent(new Event('hv:sheetclose')); spKey = null; $('overlay').hidden = true; $('overlay').classList.remove('onrp', 'sp-open'); if (lastFocus) lastFocus.focus(); }
  // коллекция для модуля аккаунтов (Firebase): прочитать / заменить целиком
  window.collApi = { get: () => ({...COLL}), set: o => { COLL = {...o}; saveColl(true); render();
    const nm = !$('overlay').hidden && $('sheet-name'); if (nm){ const ch = CHARS.find(c=>c.n===nm.textContent); if (ch) $('sheet').querySelectorAll('.mypb').forEach(x=>x.setAttribute('aria-pressed', String(x.dataset.st===stOf(ch)))); } } };
  // открыть карточку персонажа из другого места (плашка региона на глобусе)
  window.openChar = (name, from) => { const i = CHARS.findIndex(c => c.n === name); if (i < 0) return false;
    sfx(SFX_OPEN); openSheet(i, from || document.activeElement); $('overlay').classList.add('onrp'); return true; };
  $('overlay').addEventListener('click', ev=>{ if (ev.target.closest('#close') || ev.target.id==='overlay'){ sfx(SFX_CLOSE); closeSheet(); } });
  document.addEventListener('keydown', ev=>{ if (ev.key==='Escape' && !$('overlay').hidden){ ev.stopImmediatePropagation(); sfx(SFX_CLOSE); if (spKey){ spKey = null; spRender(spCh); } else closeSheet(); } });

  // подгоняем вертикальные имена, чтобы не вылезали за полоску
  function fitNames(root){
    root.querySelectorAll('.strip span').forEach(s=>{
      const box = s.parentElement;
      const maxH = box.clientHeight * 0.88, maxW = box.clientWidth * 0.6;
      const cap = box.closest('.sheet') ? 28 : 24;
      let fs = Math.floor(Math.min(cap, maxW)); s.style.fontSize = fs + 'px';
      let guard = 40;
      while (guard-- > 0 && fs > 9 && (s.getBoundingClientRect().height > maxH || s.getBoundingClientRect().width > maxW)){
        fs -= 1; s.style.fontSize = fs + 'px';
      }
    });
  }
  const fitAll = () => fitNames($('grid'));
  let rt; window.addEventListener('resize', ()=>{ clearTimeout(rt); rt = setTimeout(fitAll, 120); });
  try{ document.fonts && document.fonts.ready.then(fitAll); }catch(e){}

  render();
  // ===== Пламя Мавуики: загорается по кругу кольца только при наведении (от верха вниз по обе стороны) =====
  (function mavuikaFire(){
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // бело-жёлтое ядро → оранжевый → алый → тёмно-красный, как в её ульте
    const RAMP = [[255,240,200],[255,190,90],[255,120,50],[248,64,44],[222,30,42],[160,14,34],[80,6,20]];
    const sprites = RAMP.map(([r,g,b])=>{
      const c = document.createElement('canvas'); c.width = 64; c.height = 128; const x = c.getContext('2d');
      for (let k=0;k<7;k++){ const t = k/6, cy = 96 - t*70, rad = 30*(1-t*.82);
        const gr = x.createRadialGradient(32,cy,0,32,cy,rad);
        gr.addColorStop(0,`rgba(${r},${g},${b},${.55-t*.25})`); gr.addColorStop(.45,`rgba(${r},${g},${b},${.28-t*.12})`); gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
        x.fillStyle = gr; x.fillRect(0,0,64,128); }
      return c;
    });
    const states = new Map(); let raf = 0, last = 0;
    const R = (a,b)=>a+Math.random()*(b-a);
    function st(wrap){
      let s = states.get(wrap); if (s) return s;
      const cv = wrap.querySelector('canvas.mfire'); if (!cv) return null;
      s = {wrap, cv, ctx:cv.getContext('2d'), p:[], e:[], k:[], inten:0, burn:0, acc:0, eacc:0, kacc:.3, t:0, hot:false};
      states.set(wrap, s); return s;
    }
    function size(s){
      const dpr = Math.min(2, devicePixelRatio||1), r = s.cv.getBoundingClientRect(), ring = s.wrap.querySelector('.mring').getBoundingClientRect();
      const W = Math.round(r.width*dpr), H = Math.round(r.height*dpr);
      if (s.cv.width!==W || s.cv.height!==H){ s.cv.width = W; s.cv.height = H; }
      s.dpr = dpr; s.W = r.width; s.H = r.height;
      s.ox = ring.left - r.left + ring.width/2; s.oy = ring.top - r.top + ring.height/2; s.rr = ring.width * 46/128;
    }
    // точка на кольце; угол от верха, огонь «прогорает» от верха вниз на долю burn
    function ringPt(s){
      const lim = Math.PI * s.burn; if (lim < .05) return null;
      const a = R(-lim, lim), sx = Math.sin(a), cy = -Math.cos(a);
      return {x:s.ox + sx*s.rr, y:s.oy + cy*s.rr, nx:sx, ny:cy, tx:Math.cos(a), ty:Math.sin(a), a};
    }
    function step(s, dt){
      s.t += dt;
      const hov = s.wrap.matches(':hover, :focus-within');
      s.inten += ((hov?1:0) - s.inten) * Math.min(1, dt*(hov?5:3));
      s.burn = hov ? Math.min(1, s.burn + dt*1.6) : Math.max(0, s.burn - dt*2.2);
      size(s);
      const scale = Math.max(.6, Math.min(1.3, s.rr/140));
      // языки пламени по кругу
      s.acc += dt * 2600 * s.inten * s.burn;
      while (s.acc > 1){ s.acc--; const q = ringPt(s); if (!q) break;
        const f = .55 + .45*Math.sin(q.a*9 + s.t*5) * Math.sin(q.a*4 - s.t*3.3);
        if (Math.random() > .3 + f*.7) continue;
        // пламя тянется вверх и по касательной (закручивается вокруг кольца), чуть наружу
        const swirl = R(20,60)*scale;
        s.p.push({x:q.x + q.nx*R(-3,4), y:q.y + q.ny*R(-3,4), vx:q.nx*R(10,34)*scale + q.tx*swirl*.5, vy:-R(40,95)*scale*(.7+f*.5) + q.ny*R(6,20) + q.ty*swirl*.5,
          life:0, max:R(.25,.55)*(.8+f*.4), r:R(6,13)*scale*(.8+f*.4), sd:Math.random()*6.28}); }
      // искры-штрихи
      s.eacc += dt * 60 * s.inten * s.burn;
      while (s.eacc > 1){ s.eacc--; const q = ringPt(s); if (!q) break;
        const sp = R(90,260)*scale;
        s.e.push({x:q.x, y:q.y, vx:q.nx*sp*.6 + q.tx*sp*.5, vy:q.ny*sp*.4 - R(40,140)*scale, life:0, max:R(.4,1), w:R(.8,1.8)}); }
      // вспышки-шипы наружу от кольца
      if (s.inten > .6){ s.kacc -= dt; if (s.kacc < 0){ s.kacc = R(.15,.45); const q = ringPt(s);
        if (q) s.k.push({x:q.x, y:q.y, a:Math.atan2(q.ny,q.nx)+R(-.35,.35), len:R(30,70)*scale, w:R(3,5.5)*scale, life:0, max:R(.22,.36)}); } }
      const ctx = s.ctx; ctx.setTransform(s.dpr,0,0,s.dpr,0,0); ctx.clearRect(0,0,s.W,s.H); ctx.globalCompositeOperation = 'lighter';
      for (let i=s.p.length-1;i>=0;i--){ const p = s.p[i]; p.life += dt; const t = p.life/p.max; if (t>=1){ s.p.splice(i,1); continue; }
        p.vx += Math.sin(s.t*7 + p.sd + p.y*.045)*120*dt; p.vx *= (1-1.4*dt); p.vy -= 70*dt; p.x += p.vx*dt; p.y += p.vy*dt;
        const r = p.r * (1 - t*.7), idx = Math.min(RAMP.length-1, Math.floor(Math.pow(t,.8)*RAMP.length));
        ctx.globalAlpha = (t<.08 ? t/.08 : 1) * (1-t) * .6 * Math.min(1, s.inten*1.3);
        const sp = 1 + Math.min(.8, Math.abs(p.vy)/150);
        ctx.drawImage(sprites[idx], p.x-r, p.y-r*3*sp, r*2, r*4*sp); }
      for (let i=s.k.length-1;i>=0;i--){ const k = s.k[i]; k.life += dt; const t = k.life/k.max; if (t>=1){ s.k.splice(i,1); continue; }
        const L = k.len * (t<.3 ? t/.3 : 1);
        ctx.save(); ctx.translate(k.x,k.y); ctx.rotate(k.a); ctx.globalAlpha = (1-t) * s.inten;
        const g = ctx.createLinearGradient(0,0,L,0); g.addColorStop(0,'rgba(255,250,230,1)'); g.addColorStop(.4,'rgba(255,190,90,.9)'); g.addColorStop(1,'rgba(255,60,40,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0,-k.w); ctx.lineTo(L,0); ctx.lineTo(0,k.w); ctx.closePath(); ctx.fill(); ctx.restore(); }
      ctx.lineCap = 'round';
      for (let i=s.e.length-1;i>=0;i--){ const e = s.e[i]; e.life += dt; const t = e.life/e.max; if (t>=1){ s.e.splice(i,1); continue; }
        e.vy += 30*dt; e.vx *= (1-1.2*dt); e.vy *= (1-1.2*dt); e.x += e.vx*dt; e.y += e.vy*dt;
        ctx.globalAlpha = (1-t) * Math.min(1, s.inten*1.5); ctx.strokeStyle = t<.4 ? '#fff4c8' : '#ffb04a'; ctx.lineWidth = e.w;
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x - e.vx*.05, e.y - e.vy*.05); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      return hov || s.inten > .01 || s.p.length || s.e.length || s.k.length;
    }
    function frame(ts){
      const dt = Math.min(.05, last ? (ts-last)/1000 : .016); last = ts; let any = false;
      for (const w of document.querySelectorAll('.ar-wrap.mavuika')){ const s = st(w); if (s && step(s, dt)) any = true; }
      for (const w of states.keys()) if (!w.isConnected) states.delete(w);
      raf = any ? requestAnimationFrame(frame) : 0; if (!raf) last = 0;
    }
    function kick(){ if (!raf){ last = 0; raf = requestAnimationFrame(frame); } }
    document.addEventListener('pointerover', ev=>{ if (ev.target.closest && ev.target.closest('.ar-wrap.mavuika')) kick(); });
    document.addEventListener('focusin', ev=>{ if (ev.target.closest && ev.target.closest('.ar-wrap.mavuika')) kick(); });
  })();

  // ===== Живой фон =====
  (function bgfx(){
    const box = document.querySelector('.bgfx'); if (!box) return;
    const pan = box.querySelector('.pan'), sl = box.querySelectorAll('.slide');
    const list = [1,2,3,5,6,7,8,9,10,11,12,13,14].map(i=>'bg'+String(i).padStart(2,'0')+'.webp'), N = list.length;
    for (let i=N-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [list[i],list[j]] = [list[j],list[i]]; }
    let k = 0, cur = 0;
    const load = src => new Promise(r=>{ const im = new Image(); im.onload = im.onerror = ()=>r(); im.src = src; });
    async function show(){
      const src = list[k % N]; await load(src);
      const nx = sl[1-cur]; nx.style.backgroundImage = `url(${src})`;
      nx.classList.remove('on'); void nx.offsetWidth; nx.classList.add('on'); sl[cur].classList.remove('on'); cur = 1-cur;
      k++; load(list[k % N]);
    }
    show(); setInterval(show, 10000);
    // паралакс только от курсора
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(pointer:fine)').matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    addEventListener('mousemove', e=>{ if (document.documentElement.classList.contains('v-home')) return; tx = (e.clientX/innerWidth - .5) * -24; ty = (e.clientY/innerHeight - .5) * -16; if (!raf) raf = requestAnimationFrame(tick); }, {passive:true});
    function tick(){ x += (tx-x)*.07; y += (ty-y)*.07; pan.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
      raf = (Math.abs(tx-x)>.05 || Math.abs(ty-y)>.05) ? requestAnimationFrame(tick) : 0; }
  })();

  // ===== Главная ↔ персонажи =====
  (function views(){ if (!document.getElementById('welcome')) return;
    const root = document.documentElement, W = document.getElementById('welcome'), vid = document.getElementById('wvid'), wv = W.querySelector('.wv');
    function apply(){ if (/^#(map|карта)/i.test(decodeURI(location.hash))){ location.replace('map.html'); return; }   // карта теперь на map.html
      const h = decodeURI(location.hash), dict = /^#(dict|словарь)/i.test(h), map = /^#(map|карта)/i.test(h), arts = /^#(arts|артефакты)/i.test(h), weap = /^#(weapons|оружие)/i.test(h), home = !dict && !map && !arts && !weap && !/^#(chars|персонажи)/i.test(h); root.classList.toggle('v-home', home); root.classList.toggle('v-dict', dict); root.classList.toggle('v-map', map); root.classList.toggle('v-arts', arts); root.classList.toggle('v-weap', weap);
      if (home){ vid.play && vid.play().catch(()=>{}); } else { vid.pause && vid.pause(); } }
    // ряд стихий на экранах загрузки (как в Геншине): заполняются цветом слева направо, при заполнении — вспышка своим цветом
    const ELS = [['pyro','#FF7B5C'],['hydro','#4FD3F7'],['anemo','#6FE3C1'],['electro','#C58CFF'],['dendro','#9BDB4E'],['cryo','#A8EEF5'],['geo','#F5C84C']];
    document.querySelectorAll('.elrow').forEach(r => r.innerHTML = ELS.map(([k,c]) => `<span class="eli" style="--ec:${c}"><img class="g" src="el_${k}.webp" alt=""><img class="c" src="el_${k}.webp" alt=""></span>`).join(''));
    function setRow(row, k){ { const pc = row.parentNode && row.parentNode.querySelector('.pct'); if (pc) pc.textContent = (pc.dataset.t || 'Загрузка…') + ' ' + Math.round(k * 100) + '%'; }
      row.querySelectorAll('.eli').forEach((e,i)=>{ const f = Math.max(0, Math.min(1, k*ELS.length - i));
      e.style.setProperty('--f', (f*100).toFixed(1)+'%'); if (f >= 1) e.classList.add('lit'); else e.classList.remove('lit'); }); }
    const ease = k => k<.5 ? 2*k*k : 1-Math.pow(-2*k+2,2)/2;
    // персонажи: экран загрузки на фоне сайта
    const CL = document.getElementById('cload'), CROW = CL.querySelector('.elrow');
    function charsLoad(){
      setRow(CROW, 0); CL.classList.remove('ready'); root.classList.add('cl-on'); CL.classList.add('on');
      location.hash = 'chars'; scrollTo(0,0);
      let t0 = performance.now(); const dur = 2600;
      (function step(ts){ const k = ease(Math.min(1, ((ts||t0)-t0)/dur)); setRow(CROW, k);
        if (k < 1){ requestAnimationFrame(step); return; }
        CL.classList.add('ready');
        const finish = e => { if (e.type==='keydown' && !['Enter',' ','Escape'].includes(e.key)) return;
          CL.removeEventListener('click', finish); removeEventListener('keydown', finish);
          CL.classList.remove('on'); root.classList.remove('cl-on'); };
        setTimeout(()=>{ CL.addEventListener('click', finish); addEventListener('keydown', finish); }, 150);
      })();
    }
    // «влёт» с главной в раздел
    let flying = false;
    function fly(cb){
      if (flying) return; flying = true;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches){ cb(); flying = false; return; }
      const FL = document.getElementById('wflash'); FL.classList.remove('go'); void FL.offsetWidth; FL.classList.add('go');
      setTimeout(cb, 520);                                  // экран загрузки появляется под полностью белым сиянием
      setTimeout(()=>{ FL.classList.remove('go'); flying = false; }, 1400);
    }
    document.getElementById('goChars').addEventListener('click', ()=>fly(charsLoad));
    // карта (отдельная страница map.html): экран загрузки идёт ЗДЕСЬ, на главной. Пока полоса бежит, браузер тихо
    // докачивает всё для глобуса (только качает, не распаковывает — анимация не лагает). 100% — сразу переход на глобус.
    const ML = document.getElementById('mload'), MROW = ML.querySelector('.elrow'), MV2 = document.getElementById('mlvid');
    function mapPrefetch(){
      const MOB = matchMedia('(hover:none) and (pointer:coarse)').matches, mem = navigator.deviceMemory || 4,
            scr = Math.max(screen.width, screen.height) * (devicePixelRatio || 1);
      let mts = 4096; try { const g = document.createElement('canvas').getContext('webgl'); if (g){ mts = g.getParameter(g.MAX_TEXTURE_SIZE); const x = g.getExtension('WEBGL_lose_context'); x && x.loseContext(); } } catch(e){}
      const TQ = MOB || mts < 8192 ? '2k' : (mts >= 16384 && mem >= 8 && scr > 1800 ? '16k' : '8k');   // та же логика, что в глобусе (map.js)
      const files = ['map.html', 'map.js?v=7', 'gearth' + TQ + '.jpg?v=20', 'gland' + TQ + '.png?v=20', 'gcloud.png?v=21', 'snzl.png?v=20', (TQ === '2k' ? 'grid.png' : 'grid8k.png') + '?v=21'];
      const ps = files.map(f => fetch(f).then(r => r.blob()).catch(()=>{}));
      ps.push(fetch('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', {mode: 'no-cors'}).then(r => r.blob()).catch(()=>{}));
      let n = 0; ps.forEach(p => p.then(() => n++));
      return () => n / ps.length;   // доля скачанного
    }
    let mapGoing = false;
    function mapLoad(){
      if (mapGoing) return; mapGoing = true;
      const part = mapPrefetch();
      delete ML.querySelector('.pct').dataset.t; setRow(MROW, 0); ML.classList.remove('ready'); ML.classList.add('on');
      // видео экрана загрузки на главной не качается заранее: источники подставляются только сейчас
      if (!MV2.dataset.on){ MV2.dataset.on = '1'; MV2.querySelectorAll('source[data-src]').forEach(x => x.src = x.dataset.src); MV2.preload = 'auto'; MV2.load(); }
      try { MV2.currentTime = 0; } catch(e){} MV2.play().catch(()=>{});
      // не быстрее 2,8 с (как раньше); на медленном интернете ждёт на 90%, пока не скачается (не дольше 12 с)
      const t0 = performance.now(), dur = 2800, hardStop = t0 + 12000; let shown = 0, prev = t0;
      (function step(ts){ const now = Math.max(prev, ts || performance.now()), p = part(), all = p >= 1 || now > hardStop;
        const k = ease(Math.min(1, (now - t0) / dur)), target = all ? k : Math.min(k, .9 * (.3 + .7 * p));
        shown = Math.max(shown, Math.min(target, shown + (now - prev) / 700)); prev = now;   // плавно, без скачков
        setRow(MROW, shown);
        if (shown < 1){ requestAnimationFrame(step); return; }
        // 100%: «пожалуйста подождите», стихии «дышат» 2,8 с, потом переход на глобус
        const D = ML.querySelector('.done'); if (!D.dataset.t0) D.dataset.t0 = D.textContent;
        D.textContent = 'Загрузка завершена, пожалуйста подождите'; ML.classList.add('wait'); MROW.classList.add('breathe');
        setTimeout(() => {
          try { sessionStorage.setItem('hv_fromload', JSON.stringify({t: MV2.currentTime || 0, at: Date.now()})); } catch(e){}
          location.href = 'map.html';
        }, 2800);
      })();
    }
    document.getElementById('goMap').addEventListener('click', ()=>{ window.gMusic && window.gMusic.leave(); new Image().src = 'loading.jpg?v=2'; fly(mapLoad); });
    // «Назад» с карты: страница может вернуться из кеша браузера — убираем вспышку и экран загрузки, музыка снова
    addEventListener('pageshow', e => { if (!e.persisted) return; document.getElementById('wflash').classList.remove('go'); flying = false;
      mapGoing = false; ML.classList.remove('on', 'wait'); MROW.classList.remove('breathe'); MV2.pause();
      { const D = ML.querySelector('.done'); if (D.dataset.t0) D.textContent = D.dataset.t0; } window.gMusic && window.gMusic.back(); });
    // словарь: сначала экран загрузки с баннером
    const DL = document.getElementById('dload'), DP = document.getElementById('dpct');
    function dictLoad(){
      DL.style.setProperty('--p','0%'); DL.classList.remove('ready'); DL.classList.add('on'); DP.textContent = 'Загрузка… 0%';
      // мем за баннером: еле видно, еле слышно, один раз; музыка главной на это время замолкает
      try { window.gMusic && window.gMusic.hush(); } catch(e){}
      const MV = document.getElementById('dmeme');
      try { MV.currentTime = 0; } catch(e){}
      MV.volume = window.gMusic ? window.gMusic.memeVol() : .2; MV.muted = MV.volume === 0;
      MV.classList.add('play'); MV.play().catch(()=>{});
      const img = DL.querySelector('.col'), DROW = DL.querySelector('.elrow'); setRow(DROW, 0); let t0 = 0, dur = 3200, raf = 0;
      const go = () => { t0 = performance.now(); raf = requestAnimationFrame(step); };
      function step(ts){
        let k = Math.min(1, (ts-t0)/dur);
        k = k<.5 ? 2*k*k : 1-Math.pow(-2*k+2,2)/2;             // плавно: медленно-быстро-медленно
        const p = (k*100).toFixed(1)+'%'; DL.style.setProperty('--p',p); DP.textContent = 'Загрузка… '+Math.round(k*100)+'%'; setRow(DROW, k);
        if (k < 1){ raf = requestAnimationFrame(step); return; }
        DL.style.setProperty('--eo','0'); DL.classList.add('ready'); DP.textContent = '100%';
        const finish = e => { if (e.type==='keydown' && !['Enter',' ','Escape'].includes(e.key)) return;
          DL.removeEventListener('click', finish); removeEventListener('keydown', finish);
          MV.pause(); MV.classList.remove('play');
          location.hash = 'dict'; scrollTo(0,0); DL.classList.remove('on'); setTimeout(()=>DL.style.setProperty('--eo','1'),600);
          window.gMusic && window.gMusic.unhush(); };
        setTimeout(()=>{ DL.addEventListener('click', finish); addEventListener('keydown', finish); }, 150);
      }
      img.complete ? go() : (img.onload = go, img.onerror = go);
    }
    document.getElementById('goDict').addEventListener('click', ()=>fly(dictLoad));
    document.getElementById('goArts').addEventListener('click', ()=>fly(()=>{ location.hash = 'arts'; scrollTo(0,0); }));
    document.getElementById('goWeap').addEventListener('click', ()=>fly(()=>{ location.hash = 'weapons'; scrollTo(0,0); }));
    // звук кнопки «На главную»
    const HOME_SFX = new Audio('sfx_home.mp3'); HOME_SFX.preload = 'auto';
    // звук кнопок на главной: любая кнопка внутри .welcome (Словарь, Персонажи и будущие)
    const BTN_SFX = new Audio('sfx_btn.mp3'), WHOOSH = new Audio('sfx_whoosh.mp3'), BUBBLE = new Audio('sfx_bubble.mp3'); BTN_SFX.preload = WHOOSH.preload = BUBBLE.preload = 'auto';
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('.welcome button, .welcome a'); if (!b) return;
      const v = window.gMusic ? window.gMusic.sfxVol() : .5;
      if (v > 0){ const a = BTN_SFX.cloneNode(); a.volume = v; a.play().catch(()=>{});
        // «влёт» при переходе в раздел (как загрузка в Геншине)
        if (b.id === 'goDict' || b.id === 'goChars' || b.id === 'goMap' || b.id === 'goArts' || b.id === 'goWeap'){ const w = WHOOSH.cloneNode(), u = BUBBLE.cloneNode(); w.volume = u.volume = v;
          setTimeout(()=>{ w.play().catch(()=>{}); u.play().catch(()=>{}); }, 90);} }   // влёт + «буль-буль» телепорта, как в игре
    }, true);
    document.getElementById('goHome').addEventListener('click', ()=>{
      const v = window.gMusic ? window.gMusic.sfxVol() : .5;
      if (v > 0){ const a = HOME_SFX.cloneNode(); a.volume = v; a.play().catch(()=>{}); }
      history.pushState(null,'',location.pathname+location.search); apply(); });
    addEventListener('hashchange', apply); addEventListener('popstate', apply); apply();
    // паралакс: видео рисуется в canvas на каждом кадре экрана (60/144 Гц) вместе со смещением —
    // сдвиг не зависит от частоты кадров самого видео (30 fps), поэтому не дрожит
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(pointer:fine)').matches;
    const cv = document.getElementById('wcan'), ctx = cv.getContext('2d', {alpha:false});
    let tx=0, ty=0, x=0, y=0, raf=0, last=0, W0=0, H0=0;
    // слабое устройство: без паралакса видео играет напрямую, без canvas (меньше нагрузки на CPU/GPU и память)
    const nav = navigator, conn = nav.connection || {};
    let lite = reduce || conn.saveData === true || (nav.deviceMemory && nav.deviceMemory <= 2) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2);
    try { if (sessionStorage.getItem('hv_lite') === '1') lite = true; } catch(e){}
    let nF = 0, nM = 0, sumDt = 0;   // замер реальной частоты кадров canvas-цикла: если ниже ~40 fps — отключаем паралакс
    function goLite(){ lite = true; try { sessionStorage.setItem('hv_lite','1'); } catch(e){}
      if (raf){ cancelAnimationFrame(raf); raf = 0; } last = 0; W.classList.remove('cv'); cv.width = cv.height = 1; }
    if (fine && !reduce) addEventListener('pointermove', e=>{ if (e.pointerType!=='mouse') return; tx = (e.clientX/innerWidth-.5)*-2; ty = (e.clientY/innerHeight-.5)*-2; }, {passive:true});
    function size(){ const d = Math.min(1.5, devicePixelRatio||1), w = Math.round(innerWidth*d), h = Math.round(innerHeight*d); if (w!==W0||h!==H0){ cv.width = W0 = w; cv.height = H0 = h; } }
    function t(ts){
      if (lite){ raf = 0; return; }
      const raw = last ? ts-last : 0, dt = last ? Math.min(64, raw) : 16; last = ts;
      const k = 1 - Math.exp(-dt/220); x += (tx-x)*k; y += (ty-y)*k;
      if (vid.readyState >= 2){
        if (!W.classList.contains('cv')) W.classList.add('cv');
        size(); const vw = vid.videoWidth, vh = vid.videoHeight, sc = Math.max(W0/vw, H0/vh) * 1.05;
        const dw = vw*sc, dh = vh*sc, ox = (W0-dw)/2 + x*W0*.016, oy = (H0-dh)/2 + y*H0*.012;
        ctx.drawImage(vid, ox, oy, dw, dh);
        if (!nF) nF = ts;   // момент первого кадра
        if (nF > 0 && ts - nF > 800 && raw > 0 && raw < 2000){ sumDt += raw; nM++;   // первые кадры не считаем; паузы вкладки (>2 с) тоже
          if (nM >= 60 || (sumDt >= 2500 && nM >= 4)){ if (sumDt/nM > 25) { goLite(); return; } nF = -1e9; } }   // средний кадр >25 мс (<40 fps) — паралакс выключается; иначе замер завершён
      }
      raf = root.classList.contains('v-home') ? requestAnimationFrame(t) : 0; if (!raf) last = 0;
    }
    wv.style.transform = 'none';
    const start = () => { if (!fine || lite) return; if (!raf && root.classList.contains('v-home')) raf = requestAnimationFrame(t); };
    start(); addEventListener('hashchange', start); addEventListener('popstate', start);
    document.getElementById('goHome').addEventListener('click', start);
  })();


  // ===== Инструкция =====
  (function help(){ if (!document.getElementById('hover')) return;
    const ov = document.getElementById('hover'), ICN = HVJ('icons');
    ov.querySelectorAll('img[data-ic]').forEach(im => im.src = ICN[im.dataset.ic]);
    let back = null;
    const open = () => { back = document.activeElement; ov.hidden = false; document.body.style.overflow = 'hidden'; document.getElementById('hok').focus(); };
    const close = () => { window.uiClose && window.uiClose(); ov.hidden = true; document.body.style.overflow = ''; back && back.focus && back.focus(); };
    document.getElementById('hopen').addEventListener('click', open);
    document.getElementById('hclose').addEventListener('click', close);
    document.getElementById('hok').addEventListener('click', close);
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !ov.hidden) close(); });
  })();


  // ===== Музыка: на главной — только главная тема (по кругу); в разделах — плейлист вперемешку (без повторов подряд).
  //       Новый трек = добавить имя файла в PLAYLIST (нужен name.mp3, 128 кбит/с). Громкость и «выкл» запоминаются.
  (function music(){
    const HOME = 'theme';                       // Genshin Impact Main Theme
    const PLAYLIST = [                          // сюда добавлять новые
      'music',          // Moonlit Wilderness
      'theme',          // Genshin Impact Main Theme
      'sweetsmile',     // A Sweet Smile
      'mooncup',        // Moon in One's Cup
      'relaxliyue',     // Relaxation in Liyue
      'liyue',          // Liyue
      'mondafternoon',  // Bustling Afternoon in Mondstadt
      'jellyfish',      // Melody of Jellyfish
      'snowtales',      // Snow-Buried Tales
      'elegance',       // Streets of Elegance
      'sepdream',       // Separated Dream
      'inazuma',        // Inazuma
      ['dusk', 'hymn'], // Malinalco's Dusk → Mountain's Hymn: связка, всегда подряд и в этом порядке
    ];
    const MAPLIST = ['choosemoon', 'fecundity', 'oldlong', 'peptoke', 'eightyworlds', 'insidecage'];   // только карта и глобус: We Choose the Moon, Sea of Fecundity, Old Long Since, Peptoke Chrysous Oikos, Around the Moon in Eighty Worlds, Inside the Cage (основной плейлист там не играет)
    // музыка региона: открыта плашка региона → играют ТОЛЬКО его треки (вперемешку, без повторов подряд); закрыли — снова музыка карты
    const REGMUS = {                               // другие регионы — добавлять сюда (нужны .mp3)
      mond: ['rmus_mond', 'rmus_mond2', 'rmus_mond3', 'rmus_mond4', 'rmus_mond5', 'rmus_mond6'],   // Bustling Afternoon in Mondstadt, Say My Name, Knights of Favonius, Gold Waves in Sunlight, Moonlit Wilderness, Stealing Words of the Moon
    };
    const regBag = {}, regLast = {};
    const regPick = (id, avoid) => { const L = REGMUS[id], b = regBag[id] || (regBag[id] = []);
      if (!b.length) b.push(...shuffle(L.slice()));
      if (b[0] === avoid && L.length > 1){ if (b.length === 1) b.push(...shuffle(L.filter(x => x !== avoid))); const j = 1 + (Math.random() * (b.length - 1) | 0); [b[0], b[j]] = [b[j], b[0]]; }
      return b[0]; };
    const RP = document.getElementById('rpanel');
    let mapLast = null, mapBag = [];
    const mapPick = avoid => { if (!mapBag.length) mapBag = shuffle(MAPLIST.slice());   // «мешок»: каждый трек по разу, потом новый
      if (mapBag[0] === avoid && MAPLIST.length > 1){ if (mapBag.length === 1) mapBag.push(...shuffle(MAPLIST.filter(x => x !== avoid))); const j = 1 + (Math.random() * (mapBag.length - 1) | 0); [mapBag[0], mapBag[j]] = [mapBag[j], mapBag[0]]; }
      return mapBag[0]; };
    const box = document.getElementById('snd'), btn = document.getElementById('sndBtn'), rng = document.getElementById('sndVol'), root = document.documentElement;
    const $s = id => document.getElementById(id), volBtn = $s('sndBtn'), playBtn = $s('sndPlay'), valEl = $s('sndVal'), HOVER = matchMedia('(hover:hover)').matches;
    const TITLES = {music:'Moonlit Wilderness', theme:'Genshin Impact Main Theme', sweetsmile:'A Sweet Smile', mooncup:"Moon in One's Cup", relaxliyue:'Relaxation in Liyue', liyue:'Liyue',
      mondafternoon:'Bustling Afternoon in Mondstadt', jellyfish:'Melody of Jellyfish', snowtales:'Snow-Buried Tales', elegance:'Streets of Elegance', sepdream:'Separated Dream', inazuma:'Inazuma',
      dusk:"Malinalco's Dusk", hymn:"Mountain's Hymn", choosemoon:'We Choose the Moon', fecundity:'Sea of Fecundity', oldlong:'Old Long Since', peptoke:'Peptoke Chrysous Oikos',
      eightyworlds:'Around the Moon in Eighty Worlds', insidecage:'Inside the Cage', rmus_mond:'Bustling Afternoon in Mondstadt', rmus_mond2:'Say My Name', rmus_mond3:'Knights of Favonius',
      rmus_mond4:'Gold Waves in Sunlight', rmus_mond5:'Moonlit Wilderness', rmus_mond6:'Stealing Words of the Moon'};
    let paused = false, curName = null, curLoop = false; const hist = [];
    const LS = k => { try { return localStorage.getItem(k); } catch(e){ return null; } }, SS = (k,v) => { try { localStorage.setItem(k,v); } catch(e){} };
    let vol = +(LS('mvol') ?? 40), muted = LS('mmute') === '1', ctx = null, gain = null, started = false, useEl = false;
    let cur = null, mode = null, token = 0, bag = [], last = null, seq = [];
    // элемент плейлиста: строка — один трек; массив — связка треков, играют подряд в своём порядке
    const first1 = u => typeof u === 'string' ? u : u[0];
    // «мешок»: все треки в случайном порядке, каждый по разу; потом новый мешок. Подряд один и тот же не играет.
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--){ const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
    function ensure(avoid){
      if (!bag.length) bag = shuffle(PLAYLIST.slice());
      if (first1(bag[0]) === avoid && PLAYLIST.length > 1){
        if (bag.length === 1) bag.push(...shuffle(PLAYLIST.filter(x => first1(x) !== avoid)));
        const j = 1 + (Math.random() * (bag.length - 1) | 0); [bag[0], bag[j]] = [bag[j], bag[0]];
      }
    }
    const bufs = {};
    rng.value = vol;
    const ext = 'mp3', oggOk = !!(new Audio()).canPlayType('audio/ogg; codecs=opus');   // музыка только .mp3 (играет везде); .ogg — только шум ветра
    let duckK = 1; const target = () => muted ? 0 : Math.pow(vol/100, 2) * .8 * duckK;
    function ui(){ const v = muted ? 0 : vol; box.dataset.level = v === 0 ? 0 : v < 45 ? 1 : 2;
      btn.setAttribute('aria-label', muted || vol === 0 ? 'Включить музыку' : 'Выключить музыку'); valEl.textContent = v;
      const on = started && !paused; box.dataset.state = on ? 'play' : 'pause'; playBtn.setAttribute('aria-label', on ? 'Пауза' : 'Играть');
    }
    function apply(){ ui(); if (gain) gain.gain.setTargetAtTime(target(), ctx.currentTime, .08); else { if (cur && cur.el) cur.el.volume = target(); if (wind && wind.el) wind.el.volume = target() * WIND_LVL; } }
    function load(name){ return bufs[name] || (bufs[name] = fetch(name + '.' + ext).then(r => r.arrayBuffer()).then(a => ctx.decodeAudioData(a))); }
    // держим в памяти только главную тему, текущий и следующий трек (чтобы телефон не захлебнулся)
    function keep(names){ for (const k in bufs) if (!names.includes(k)) delete bufs[k]; }
    function fadeOut(t){ if (!t) return;
      if (t.g){ t.g.gain.setTargetAtTime(0, ctx.currentTime, .35); t.s.onended = null; setTimeout(()=>{ try { t.s.stop(); } catch(e){} }, 1800); }
      else if (t.el){ const el = t.el; el.onended = null; let v = el.volume; const iv = setInterval(()=>{ v -= .05; if (v <= 0){ clearInterval(iv); el.pause(); } else el.volume = v; }, 60); } }
    // название трека: плашка в правом верхнем углу, показывается 10 секунд после начала песни
    let toast = null, toastT = 0;
    function showTitle(name){ const txt = TITLES[name] || name; if (!txt) return;
      if (!toast){ toast = document.createElement('div'); toast.className = 'snd-toast'; toast.setAttribute('aria-live', 'polite'); toast.innerHTML = '<span class="snd-toast-k">Сейчас играет</span><b></b>'; document.body.appendChild(toast); }
      toast.querySelector('b').textContent = txt; void toast.offsetWidth; toast.classList.add('show');
      clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 10000); }
    async function play(name, loop, noHist){
      const my = ++token, old = cur; cur = null; curName = name; curLoop = loop; ui();
      if (!paused) showTitle(name);
      if (!noHist && hist[hist.length - 1] !== name){ hist.push(name); if (hist.length > 40) hist.shift(); }
      if (!useEl){
        try {
          const buf = await load(name); if (my !== token) return;
          fadeOut(old);
          const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf; s.loop = loop;
          g.gain.value = 0; s.connect(g); g.connect(gain); s.start(); g.gain.setTargetAtTime(1, ctx.currentTime, .5);
          if (!loop) s.onended = () => { if (cur && cur.s === s) next(); };
          cur = {s, g, t0: ctx.currentTime}; return;
        } catch(e){ useEl = true; }
      }
      fadeOut(old);
      const el = new Audio(name + '.' + ext); el.loop = loop; el.volume = target(); if (!paused) el.play().catch(()=>{});
      if (!loop) el.onended = () => { if (cur && cur.el === el) next(); };
      cur = {el};
    }
    function next(){
      if (mode && mode.startsWith('reg:')){                               // регион: только его треки
        const id = mode.slice(4), L = REGMUS[id]; regPick(id, regLast[id]); const n = regBag[id].shift(); regLast[id] = n;
        play(n, L.length === 1);
        if (ctx && !useEl){ const up = regPick(id, n); keep([HOME, n, up]); load(up).catch(()=>{}); }
        return; }
      if (mode === 'map'){                                                 // карта/глобус: свои треки по очереди, без повторов подряд
        mapPick(mapLast); const n = mapBag.shift(); mapLast = n;
        play(n, MAPLIST.length === 1);
        if (ctx && !useEl){ const up = mapPick(n); keep([HOME, n, up]); load(up).catch(()=>{}); }
        return; }
      if (!seq.length){ ensure(last); const u = bag.shift(); seq = typeof u === 'string' ? [u] : u.slice(); }
      const n = seq.shift(); last = n;
      play(n, PLAYLIST.length === 1 && typeof PLAYLIST[0] === 'string');
      if (ctx && !useEl){                                                  // заранее готовим следующий
        let up; if (seq.length) up = seq[0]; else { ensure(n); up = first1(bag[0]); }
        keep([HOME, n, up]); load(up).catch(()=>{}); }
    }
    let hushed = false;
    // шум ветра на главной: идёт параллельно с музыкой, бесшовная петля (Web Audio loop — без щелчков и пауз)
    const WIND_LVL = .8; let wind = null;
    function windSet(on){
      if (!started) return;
      const wext = oggOk ? 'ogg' : 'wav';
      if (ctx && !useEl){
        if (!wind){ wind = {g: ctx.createGain()}; wind.g.gain.value = 0; wind.g.connect(gain);
          fetch('wind.' + wext).then(r => r.arrayBuffer()).then(a => ctx.decodeAudioData(a)).then(b => {
            const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; s.connect(wind.g); s.start(); }).catch(()=>{}); }
        wind.g.gain.setTargetAtTime(on ? WIND_LVL : 0, ctx.currentTime, on ? .8 : .35);
      } else {
        if (!wind || !wind.el){ wind = {el: new Audio('wind.' + wext)}; wind.el.loop = true; }
        wind.el.volume = target() * WIND_LVL; on && !paused ? wind.el.play().catch(()=>{}) : wind.el.pause();
      }
    }
    window.gMusic = {
      leave(){ try { sessionStorage.setItem('hv_mus', started && !paused && !muted && vol > 0 ? '1' : '0'); } catch(e){}   // уход на другую страницу: плавно гасим
        hushed = true; token++; fadeOut(cur); cur = null; mode = null; windSet(false); },
      back(){ hushed = false; mode = null; if (ctx && !useEl && !paused) ctx.resume().catch(()=>{}); route(); },
      hush(){ hushed = true; token++; fadeOut(cur); cur = null; mode = null; windSet(false); },     // тишина на время загрузки словаря
      unhush(){ hushed = false; mode = null; setTimeout(route, 80); },   // к этому моменту уже открыт словарь
      memeVol(){ return muted || vol === 0 ? 0 : Math.min(.25, .04 + vol/100 * .18); },
      sfxVol(){ return muted || vol === 0 ? 0 : Math.min(1, .15 + vol/100 * .75); },
      duck(on){ duckK = on ? .12 : 1; if (gain) gain.gain.setTargetAtTime(target(), ctx.currentTime, on ? .25 : .6); else apply(); }   // видео со звуком: музыку тише
    };
    function route(){ if (!started || hushed) return; const reg = RP && !RP.hidden && REGMUS[RP.dataset.region] && RP.dataset.region;
      const m = root.classList.contains('v-home') ? 'home' : root.classList.contains('v-map') ? (reg ? 'reg:' + reg : 'map') : 'list';
      windSet(m === 'home');
      if (m === mode) return; mode = m;
      if (m === 'home') play(HOME, true); else if (m.startsWith('reg:')) next(); else if (m === 'map') next(); else { if (!seq.length) last = HOME; next(); } }   // из главной не начинаем снова с главной темы
    async function start(){
      if (started) return; started = true; box.classList.remove('hint'); removeEventListener('pointerdown', first, true); removeEventListener('keydown', first, true);
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); gain = ctx.createGain(); gain.gain.value = target(); gain.connect(ctx.destination); }
      catch(e){ ctx = gain = null; useEl = true; }
      route(); ui();
    }
    // смена экрана (главная ↔ разделы); класс v-home ставит роутер
    new MutationObserver(route).observe(root, {attributes:true, attributeFilter:['class']});
    if (RP) new MutationObserver(route).observe(RP, {attributes:true, attributeFilter:['hidden', 'data-region']});
    const first = e => { if (e.target.closest && e.target.closest('#snd')) return; start(); };   // клики по плееру обрабатывает сам плеер
    addEventListener('pointerdown', first, true); addEventListener('keydown', first, true);
    // пауза: Web Audio — останавливаем весь звук (музыку и ветер); <audio> — паузим элементы
    function setPaused(p){ paused = p;
      if (ctx && !useEl){ if (!document.hidden) p ? ctx.suspend() : ctx.resume(); }
      else { if (cur && cur.el) p ? cur.el.pause() : cur.el.play().catch(()=>{}); if (wind && wind.el) (p || mode !== 'home') ? wind.el.pause() : wind.el.play().catch(()=>{}); }
      ui(); }
    const elapsed = () => !cur ? 0 : cur.el ? cur.el.currentTime : ctx ? ctx.currentTime - (cur.t0 || 0) : 0;
    playBtn.addEventListener('click', ()=>{ if (!started){ start(); return; } setPaused(!paused); });
    $s('sndNext').addEventListener('click', ()=>{ if (!started){ start(); return; } if (paused) setPaused(false); if (!mode) return; next(); });
    $s('sndPrev').addEventListener('click', ()=>{ if (!started){ start(); return; } if (paused) setPaused(false); if (!mode || !curName) return;
      if (elapsed() > 3 || hist.length < 2) { play(curName, curLoop, true); return; }            // больше 3 сек — с начала, иначе — предыдущий
      hist.pop(); const p = hist[hist.length - 1]; play(p, p === HOME && mode === 'home', true); });
    // громкость: кнопка открывает окошко (на компе — ещё и при наведении)
    const setOpen = o => { box.classList.toggle('open', o); volBtn.setAttribute('aria-expanded', o ? 'true' : 'false'); };
    volBtn.addEventListener('click', e => { e.stopPropagation();
      if (!HOVER && !box.classList.contains('open')){ setOpen(true); return; }   // телефон: первый тап показывает ползунок, следующий — mute
      toggleMute(); });
    document.addEventListener('pointerdown', e => { if (!box.contains(e.target)) setOpen(false); });
    box.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('open')){ e.stopPropagation(); setOpen(false); volBtn.focus(); } });
    function toggleMute(){ if (vol === 0){ vol = 40; rng.value = 40; muted = false; } else muted = !muted; SS('mmute', muted ? '1' : '0'); SS('mvol', vol); if (!started) start(); apply(); }
    rng.addEventListener('input', ()=>{ vol = +rng.value; muted = false; SS('mvol', vol); SS('mmute','0'); if (!started) start(); apply(); });
    document.addEventListener('visibilitychange', ()=>{ if (!ctx || useEl) return; document.hidden ? ctx.suspend() : (!paused && ctx.resume()); });
    setTimeout(()=>box.classList.remove('hint'), 6000);
    // пришли с другой страницы сайта, где музыка играла: пробуем включить сразу. Если браузер не разрешил
    // (iPhone и др.) — звук включится на первом клике, как обычно
    { let was = null; try { was = sessionStorage.getItem('hv_mus'); sessionStorage.removeItem('hv_mus'); } catch(e){}
      if (was === '1'){ start();
        if (ctx && ctx.state !== 'running'){ const wake = () => { removeEventListener('pointerdown', wake, true); removeEventListener('keydown', wake, true); if (!paused) ctx.resume().catch(()=>{}); };
          addEventListener('pointerdown', wake, true); addEventListener('keydown', wake, true); } } }
    ui();
  })();

  // ===== Словарь =====
  (function dict(){ if (!document.getElementById('dictv')) return;
    const DATA = HVJ('dictdata');
    const COL = {'Сленг':'#FF9ACB','Молитвы':'#E9C46A','Валюта':'#6FE3C1','Персонажи':'#F4A261','Прокачка':'#C58CFF','Артефакты':'#FF7B5C','Бой':'#4FD3F7','Реакции':'#9BDB4E'};
    const cats = ['Все', ...Object.keys(COL)];
    const box = document.getElementById('dictv');
    const E = s => s.replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    box.innerHTML = `<div class="dhead"><div><h2>Словарь <span>для не понимающих</span></h2>
        <p class="dmeme">Если ты думаешь, что <b>«пити»</b> — это напиток, а <b>«гарант»</b> — гарантия счастья, ты по адресу. Читай, пока не проиграл очередные 50/50.</p></div>
        <div class="dtools"><label class="search" for="dq"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input id="dq" type="search" placeholder="Найти термин" autocomplete="off" aria-label="Поиск по словарю"></label></div></div>
      <div class="dcats" role="group" aria-label="Категории">${cats.map((c,i)=>`<button type="button" class="chip${i?'':' all'}" data-c="${c}" aria-pressed="${i?'false':'true'}" style="--c:${COL[c]||'var(--gold)'}">${c} <small>${i?DATA.filter(d=>d[0]===c).length:DATA.length}</small></button>`).join('')}</div>
      <div class="dcount" id="dcount"></div><div class="dgrid" id="dgrid"></div>`;
    let cat = 'Все', q = '';
    const hl = (t) => { if (!q) return E(t); const i = t.toLowerCase().indexOf(q); return i<0 ? E(t) : E(t.slice(0,i))+'<mark>'+E(t.slice(i,i+q.length))+'</mark>'+E(t.slice(i+q.length)); };
    function render(){
      const list = DATA.filter(d => (cat==='Все' || d[0]===cat) && (!q || (d[1]+' '+d[2]).toLowerCase().includes(q)))
        .sort((a,b)=> (q ? (b[1].toLowerCase().includes(q)) - (a[1].toLowerCase().includes(q)) : 0));
      document.getElementById('dcount').textContent = `${list.length} ${list.length%10===1&&list.length%100!==11?'термин':(list.length%10>=2&&list.length%10<=4&&(list.length%100<10||list.length%100>=20))?'термина':'терминов'}`;
      const card = d => `<article class="dterm" style="--tc:${COL[d[0]]}"><h3>${hl(d[1])}<small>${d[0]}</small></h3><p>${hl(d[2]).replace(/\n/g,'<br>')}</p>${d[3]?`<q>${E(d[3]).replace(/\n/g,'<br>')}</q>`:''}</article>`;
      const subs = (c, items) => { const g = [...new Set(items.map(d=>d[4]).filter(Boolean))]; return g.length ? g.map(n=>`<h4 class="dsub">${n}</h4><div class="dgrid2">${items.filter(d=>d[4]===n).map(card).join('')}</div>`).join('') : `<div class="dgrid2">${items.map(card).join('')}</div>`; };
      const hero = (!q || 'гашня genshin impact геншин'.includes(q)) && cat==='Все' ? `<article class="dhero"><span class="tag">Самый главный термин</span>
        <h3><b>ГАШНЯ</b> <span>— GENSHIN IMPACT</span></h3>
        <p>Красивая замечальная игра с кучей механик, богатым открытым миром, интересными персонажами, сложной но насыщенной историей, приключениями на всю жизнь.</p>
        <q>Спасибо Ане за термин. Все мы тут аутисты и это нормально.</q></article>` : '';
      document.getElementById('dgrid').innerHTML = hero + (list.length
        ? Object.keys(COL).filter(c => list.some(d=>d[0]===c)).map(c => `<section class="dsec" style="--tc:${COL[c]}"><h3 class="dsech">${c}:</h3>${subs(c, list.filter(d=>d[0]===c))}</section>`).join('')
        : (hero ? '' : '<div class="dempty">Такого слова нет. Возможно, ты его придумал, пока крутил баннер.</div>'));
    }
    box.querySelector('.dcats').addEventListener('click', e=>{ const b = e.target.closest('.chip'); if (!b) return; cat = b.dataset.c;
      box.querySelectorAll('.dcats .chip').forEach(x=>x.setAttribute('aria-pressed', x===b ? 'true' : 'false')); render(); });
    document.getElementById('dq').addEventListener('input', e=>{ q = e.target.value.trim().toLowerCase(); render(); });
    render();
  })();

  // ===== Артефакты (раздел) =====
  (function artsView(){
    const box = document.getElementById('artsv'); if (!box) return;
    const SETS = Object.keys(ARTS.sets).sort((a,b) => a.localeCompare(b,'ru'));
    box.innerHTML = `<div class="dhead"><div><h2>Артефакты <span>во что одеть страдальца</span></h2>
        <p class="dmeme">Все сеты в одном месте. А если стата на кубке опять не та — <b>это не баг, это Геншин</b>.</p></div>
        <div class="dtools"><label class="search" for="aq"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input id="aq" type="search" placeholder="Найти сет" autocomplete="off" aria-label="Поиск по артефактам"></label></div></div>
      <div class="dcount" id="acount"></div><div class="agrid" id="agrid"></div>`;
    let q = '';
    const hl = t => { if (!q) return esc(t); const i = t.toLowerCase().indexOf(q); return i < 0 ? esc(t) : esc(t.slice(0,i)) + '<mark>' + esc(t.slice(i,i+q.length)) + '</mark>' + esc(t.slice(i+q.length)); };
    const CHN = Object.fromEntries(CHARS.map(c => [c.n, c]));
    function whoOf(setName){
      return Object.entries(ARTS.chars || {}).filter(([, c]) => c.s === setName || c.s2 === setName).map(([nm]) => CHN[nm]).filter(Boolean)
        .map(c => `<button type="button" class="who-a r${c.r||0}" data-ch="${esc(c.n)}" title="${esc(c.n)}" aria-label="${esc(c.n)}" style="--ec:${(byName[c.e]||ANY).c}"><img src="${c.img}" alt="" loading="lazy" decoding="async"></button>`).join('');
    }
    function render(){
      const list = SETS.filter(n => !q || n.toLowerCase().includes(q));
      const k = list.length, w = k%10===1 && k%100!==11 ? 'сет' : (k%10>=2 && k%10<=4 && (k%100<10 || k%100>=20)) ? 'сета' : 'сетов';
      document.getElementById('acount').textContent = `${k} ${w}`;
      document.getElementById('agrid').innerHTML = k ? list.map(n => { const a = ARTS.sets[n];
        const ic = a.img ? `<img src="${esc(a.img)}?v=1" alt="" loading="lazy">` : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3c2.2 2.6 2.2 5.4 0 8-2.2-2.6-2.2-5.4 0-8zM12 11c3.3-.8 5.8.5 7.5 3.5-3.3.8-5.8-.5-7.5-3.5zM12 11c-3.3-.8-5.8.5-7.5 3.5 3.3.8 5.8-.5 7.5-3.5zM12 11v10"/></svg>`;
        const wh = whoOf(n);
        return `<article class="aset" tabindex="0" role="button" data-n="${esc(n)}"><div class="art-c"><div class="art-ic">${ic}</div><div class="art-tx"><div class="art-n">${hl(n)}</div>${a.j ? `<p class="art-j">${esc(a.j)}</p>` : ''}</div></div>${wh ? `<div class="aset-who" aria-label="Кому подходит">${wh}</div>` : ''}</article>`; }).join('')
        : '<div class="dempty">Такого сета нет. Наверное, его ещё не выбили из данжа.</div>';
    }
    document.getElementById('aq').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); render(); });

    // карточка сета
    const OV = document.getElementById('aov'), AC = document.getElementById('acard'), AC2 = document.getElementById('acard2');
    const SLOTS = [['flower','Цветок'],['plume','Перо'],['sands','Часы'],['goblet','Кубок'],['circlet','Корона']];
    let lastA = null;
    function openSet(n, from, who){
      const a = ARTS.sets[n]; if (!a) return; lastA = from;
      const cd = who && ARTS.chars && ARTS.chars[who] && [ARTS.chars[who].s, ARTS.chars[who].s2, ARTS.chars[who].alt].includes(n) ? ARTS.chars[who] : null; AC.dataset.who = cd ? who : '';
      const pic = k => a.p ? `${a.p}_${k}.webp?v=1` : (a.img ? a.img + '?v=1' : '');
      const bn = (a.b2 || a.b4) ? `<div class="bn"><i>2 части</i><p>${esc(a.b2||'—')}</p><i>4 части</i><p>${esc(a.b4||'—')}</p></div>` : `<p class="none">Пока не заполнено</p>`;
      const hasP2 = !!(cd && (cd.builds || (cd.val && cd.val.length) || cd.why || cd.note));
      AC.dataset.b = '0';
      const bdOf = i => cd ? (cd.builds ? cd.builds[i] : cd) : null;
      const p2 = bd => { const valH = bd && bd.val && bd.val.length ? `<h4>Оптимальные значения</h4>${bd.note ? `<p class="ac-note">${esc(bd.note)}</p>` : ''}<div class="ac-vals">${bd.val.map(v => `<div class="ac-v2${v[2] ? '' : ' nob'}">${v[2] ? `<b class="vn">${esc(v[2])}${v[3] ? `<small>${esc(v[3])}</small>` : ''}</b>` : ''}<span><u>${esc(v[0])}</u>${esc(v[1])}</span></div>`).join('')}</div>` : '';
      const wy = !cd ? '' : (cd.whys && cd.whys[n]) ? cd.whys[n] : (n === cd.alt && n !== cd.s && n !== cd.s2) ? '' : (cd.why || '');   // у запасного сета (alt) свой текст в cd.whys; если его нет, чужой не показываем
      const whyH = wy ? `<h4>Почему этот сет для ${esc(cd.g || who)}</h4><p class="ac-why">${esc(wy)}</p>` : '';
      return `<div class="ac-top2"></div><div class="ac-b ac-b2">${valH}${whyH}</div>`; };
      AC._p2 = p2; AC._bd = bdOf;
      const bldH = cd && cd.builds ? `<div class="ac-bld" role="group" aria-label="Сборка">${cd.builds.map((x,i) => `<button type="button" class="ac-bl" data-i="${i}" aria-pressed="${i?'false':'true'}">${esc(x.name)}</button>`).join('')}</div>` : '';
      AC.innerHTML = `<h3 class="ac-h" id="acName">${esc(n)}<button class="ac-x" type="button" aria-label="Закрыть">×</button></h3>
        <div class="ac-ban"><span class="ac-slot">${a.p ? 'Цветок' : ''}</span>${pic('flower') ? `<img src="${pic('flower')}" alt="">` : ''}<div class="ac-st" aria-label="${a.r||5} звёзд">${'★'.repeat(a.r||5)}</div></div>
        ${a.p ? `<div class="ac-tabs" role="group" aria-label="Части сета">${SLOTS.map(([k,t],i) => `<button type="button" class="ac-tab" data-k="${k}" data-t="${t}" aria-pressed="${i?'false':'true'}" title="${t}" aria-label="${t}"><img src="slot_${k}.webp" alt=""></button>`).join('')}</div>` : ''}
        ${bldH}${cd ? `<div class="ac-s" id="acS"></div>` : ''}
        <div class="ac-b"><h4>Бонус сета</h4>${bn}${a.j ? `<p class="ac-j">${esc(a.j)}</p>` : ''}</div>`;
      AC2.hidden = !hasP2;
      AC2.innerHTML = hasP2 ? p2(bdOf(0)) : '';
      AC2.setAttribute('aria-label', 'Для ' + (cd ? (cd.g || who) : ''));
      if (cd) showStats('flower');
      OV.hidden = false; sfx(SFX_OPEN); AC.querySelector('.ac-x').focus();
    }
    function showStats(k){
      const w = AC.dataset.who, box = AC.querySelector('#acS'); if (!w || !box) return;
      const c = AC._bd(+AC.dataset.b||0), m = (c.m && c.m[k]) || [], sub = [].concat((c.ss && c.ss[k]) || c.sub || []);
      const row = (arr, cls) => arr.map(t => `<span class="chip ${cls}">${esc(t)}</span>`).join('<em class="or">или</em>');
      box.innerHTML = `<h4>${SLOTN[k]}</h4><div class="ac-panel">
        <div class="ac-r"><span class="ac-l">★ Мейн-стат</span><div class="ac-ch">${m.length ? row(m,'main') : '<span class="none">Пока не заполнено</span>'}</div></div>
        <div class="ac-r"><span class="ac-l">◆ Доп. статы</span><div class="ac-ch">${sub.length ? sub.map(t => `<span class="chip sub">${esc(t)}</span>`).join('') : '<span class="none">Пока не заполнено</span>'}</div></div></div>`;
    }
    function closeSet(){ if (OV.hidden) return; OV.hidden = true; sfx(SFX_CLOSE); if (lastA) lastA.focus(); }
    AC.addEventListener('click', e => {
      if (e.target.closest('.ac-x')) return closeSet();
      const bl = e.target.closest('.ac-bl');
      if (bl){ AC.querySelectorAll('.ac-bl').forEach(x => x.setAttribute('aria-pressed', x === bl ? 'true' : 'false')); AC.dataset.b = bl.dataset.i;
        const cur = AC.querySelector('.ac-tab[aria-pressed=true]'); showStats(cur ? cur.dataset.k : 'flower'); AC2.innerHTML = AC._p2(AC._bd(+bl.dataset.i)); sfx(SFX_PICK); return; }
      const t = e.target.closest('.ac-tab'); if (!t) return;
      AC.querySelectorAll('.ac-tab').forEach(x => x.setAttribute('aria-pressed', x === t ? 'true' : 'false'));
      const a = ARTS.sets[AC.querySelector('#acName').firstChild.textContent], im = AC.querySelector('.ac-ban img');
      im.src = `${a.p}_${t.dataset.k}.webp?v=1`; im.style.animation = 'none'; void im.offsetWidth; im.style.animation = '';
      AC.querySelector('.ac-slot').textContent = t.dataset.t; showStats(t.dataset.k); sfx(SFX_PICK);
    });
    OV.addEventListener('click', e => { if (e.target === OV || e.target.classList.contains('aov-in')) closeSet(); });
    AC2.addEventListener('click', e => { if (e.target.closest('.ac-x')) closeSet(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && !OV.hidden){ e.stopPropagation(); closeSet(); } }, true);
    new MutationObserver(() => { if (!document.documentElement.classList.contains('v-arts')) { OV.hidden = true; } }).observe(document.documentElement, {attributes:true, attributeFilter:['class']});
    const ag = document.getElementById('agrid');
    ag.addEventListener('click', e => { const w = e.target.closest('.who-a'); if (w){ e.stopPropagation(); if (window.openChar) window.openChar(w.dataset.ch, w); return; } const c = e.target.closest('.aset'); if (c) openSet(c.dataset.n, c); });
    ag.addEventListener('keydown', e => { if (e.target.closest('.who-a')) return; const c = e.target.closest('.aset'); if (c && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); openSet(c.dataset.n, c); } });
    window.openArtSet = (n, from, who) => openSet(n, from, who);
    render();
  })();

  // ===== Оружие (раздел-каталог) =====
  (function weapView(){
    const box = document.getElementById('weapv'); if (!box) return;
    const WT = ['Одноручное','Двуручное','Древковое','Стрелковое','Катализатор'];
    const WTI = {'Одноручное':'wt_sword','Двуручное':'wt_claymore','Древковое':'wt_polearm','Стрелковое':'wt_bow','Катализатор':'wt_catalyst'};
    const NAMES = () => Object.keys(WEAP.weapons);
    box.innerHTML = `<div class="dhead"><div><h2>Оружие <span>чем бить, чтобы не плакать</span></h2>
        <p class="dmeme">Каталог оружия. Сигнатурка — это красиво, но <b>иногда копьё за 3 звезды делает ровно то же самое</b>.</p></div>
        <div class="dtools"><label class="search" for="wq"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input id="wq" type="search" placeholder="Найти оружие" autocomplete="off" aria-label="Поиск по оружию"></label></div></div>
      <div class="wfl" id="wfl" role="group" aria-label="Фильтр"></div>
      <div class="wfl" id="wfl2" role="group" aria-label="Доп. стат и сортировка"></div>
      <div class="dcount" id="wcount"></div><div class="grid wgrid" id="wgrid" role="list"></div>`;
    let q = '', ft = '', fr = 0, fs = '', so = '';
    const SUBS = ['Крит. урон','Шанс крит. попадания','Сила атаки','HP','Защита','Мастерство стихий','Восст. энергии','Бонус физ. урона'];
    const subOf = w => w.sub ? w.sub.replace(/\s+[\d,]+%?$/, '') : '';
    const atkMax = w => { const m = (w.atk || '').match(/(\d+)\s*$/); return m ? +m[1] : 0; };
    const CHN = Object.fromEntries(CHARS.map(c => [c.n, c]));
    const hl = t => { if (!q) return esc(t); const i = t.toLowerCase().indexOf(q); return i < 0 ? esc(t) : esc(t.slice(0,i)) + '<mark>' + esc(t.slice(i,i+q.length)) + '</mark>' + esc(t.slice(i+q.length)); };
    // кто использует: сигнатурка персонажа + записи в его разделе «Оружие»
    function usersOf(k){
      const set = new Set();
      Object.entries(WEAP.sig).forEach(([nm, s]) => { if ([].concat(s || []).some(v => v && v.toLowerCase() === k.toLowerCase())) set.add(nm); });
      CHARS.forEach(c => (c.wp || []).forEach(x => { if (wpKey(x) === k) set.add(c.n); }));
      return [...set].map(n => CHN[n]).filter(Boolean);
    }
    const whoBtns = k => usersOf(k).map(c => `<button type="button" class="who-a r${c.r||0}" data-ch="${esc(c.n)}" title="${esc(c.n)}" aria-label="${esc(c.n)}" style="--ec:${(byName[c.e]||ANY).c}"><img src="${c.img}" alt="" loading="lazy" decoding="async"></button>`).join('');
    function filters(){
      const types = WT.filter(t => NAMES().some(k => WEAP.weapons[k].t === t));
      const stars = [5,4,3,2,1].filter(r => NAMES().some(k => WEAP.weapons[k].r === r));
      document.getElementById('wfl').innerHTML = (types.length > 1 ? types.map(t => `<button type="button" class="chip" data-t="${t}" aria-pressed="${ft === t}">${t}</button>`).join('') : '')
        + (stars.length > 1 ? stars.map(r => `<button type="button" class="chip" data-r="${r}" aria-pressed="${fr === r}">${r}★</button>`).join('') : '');
      const ss = SUBS.filter(x => NAMES().some(k => subOf(WEAP.weapons[k]) === x));
      document.getElementById('wfl2').innerHTML = ss.map(x => `<button type="button" class="chip" data-s="${esc(x)}" aria-pressed="${fs === x}">${esc(x)}</button>`).join('')
        + `<button type="button" class="chip" data-o="atk" aria-pressed="${so === 'atk'}">Сначала сильнее по атаке</button>`;
    }
    function render(){
      const list = NAMES().filter(n => { const w = WEAP.weapons[n]; return (!q || n.toLowerCase().includes(q)) && (!ft || w.t === ft) && (!fr || w.r === fr) && (!fs || subOf(w) === fs); })
        .sort((a,b) => so === 'atk' ? atkMax(WEAP.weapons[b]) - atkMax(WEAP.weapons[a]) || a.localeCompare(b,'ru') : (WEAP.weapons[b].r||0) - (WEAP.weapons[a].r||0) || a.localeCompare(b,'ru'));
      const k = list.length, w = k%10===1 && k%100!==11 ? 'позиция' : (k%10>=2 && k%10<=4 && (k%100<10 || k%100>=20)) ? 'позиции' : 'позиций';
      document.getElementById('wcount').textContent = `${k} ${w}`;
      document.getElementById('wgrid').innerHTML = k ? list.map(n => { const o = WEAP.weapons[n], r = o.r || 0;
        const cd = `<button class="card wset wk${r}${r===5||r===4 ? ' rr'+r : ''}" type="button" data-n="${esc(n)}" aria-label="${esc(n)}, ${esc(o.t || '')}, ${r} звёзд">
          <div class="strip">${WTI[o.t] ? `<img class="wti" src="${WTI[o.t]}.webp?v=2" alt="" title="${esc(o.t)}" width="40" height="40">` : ''}<span style="--len:${n.length};--lw:${Math.max(...n.split(/\s+/).map(x=>x.length))};--wf:${n.length <= 14 ? 24 : n.length <= 20 ? 21 : 19}px">${hl(n)}</span></div>
          <div class="art"><div class="aura" aria-hidden="true"></div>${o.img ? `<img class="photo wph" src="${esc(o.img)}" alt="" loading="lazy">` : ''}
            <div class="meta"><span class="stars si${r}" role="img" aria-label="${r} звёзд"></span></div></div></button>`;
        return (r===5 || r===4) ? `<div class="pl pl${r}">${cd}</div>` : cd; }).join('')
        : `<div class="dempty">${NAMES().length ? 'Такого оружия нет. Наверное, его ещё не выбили.' : 'Каталог пока пуст: оружие добавляем пачками.'}</div>`;
    }
    document.getElementById('wq').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); render(); });
    document.getElementById('wfl').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return;
      if (b.dataset.t !== undefined) ft = ft === b.dataset.t ? '' : b.dataset.t; else fr = fr === +b.dataset.r ? 0 : +b.dataset.r; filters(); render(); sfx(SFX_PICK); });
    document.getElementById('wfl2').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return;
      if (b.dataset.s !== undefined) fs = fs === b.dataset.s ? '' : b.dataset.s; else so = so ? '' : 'atk'; filters(); render(); sfx(SFX_PICK); });

    // карточка оружия
    const OV = document.getElementById('wov'), WC = document.getElementById('wcard'); let lastW = null;
    function openWeap(n, from){
      const o = WEAP.weapons[n]; if (!o) return false; lastW = from || document.activeElement;
      const rows = [['Базовая атака', o.atk], ['Доп. стат', o.sub]].filter(r => r[1]);
      const wh = whoBtns(n);
      WC.dataset.r = o.r || 5;
      WC.innerHTML = `<h3 class="ac-h" id="wcName">${esc(n)}<button class="ac-x" type="button" aria-label="Закрыть">×</button></h3>
        <div class="ac-ban"><span class="ac-slot">${esc(o.t || '')}</span>${o.img ? `<img src="${esc(o.img)}" alt="">` : ''}<div class="ac-st" aria-label="${o.r||5} звёзд">${'★'.repeat(o.r||5)}</div></div>
        ${rows.length ? `<div class="ac-b"><h4>Характеристики</h4><div class="wc-rows">${rows.map(r => `<div><i>${r[0]}</i><b>${esc(r[1])}</b></div>`).join('')}</div></div>` : ''}
        <div class="ac-b"><h4>${o.pn ? esc(o.pn) : 'Пассивка'}</h4>${o.pt ? `<p class="wc-pt">${esc(o.pt)}</p>` : '<p class="none">Пока не заполнено</p>'}${o.j ? `<p class="ac-j">${esc(o.j)}</p>` : ''}</div>
        ${wh ? `<div class="ac-b"><h4>Кому подходит</h4><div class="aset-who wc-who">${wh}</div></div>` : ''}`;
      OV.hidden = false; sfx(SFX_OPEN); WC.querySelector('.ac-x').focus(); return true;
    }
    function closeWeap(){ if (OV.hidden) return; OV.hidden = true; sfx(SFX_CLOSE); if (lastW && lastW.focus) lastW.focus(); }
    WC.addEventListener('click', e => { if (e.target.closest('.ac-x')) return closeWeap();
      const w = e.target.closest('.who-a'); if (w){ closeWeap(); if (window.openChar) window.openChar(w.dataset.ch, w); } });
    OV.addEventListener('click', e => { if (e.target === OV || e.target.classList.contains('aov-in')) closeWeap(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && !OV.hidden){ e.stopPropagation(); closeWeap(); } }, true);
    const wg = document.getElementById('wgrid');
    wg.addEventListener('click', e => { const c = e.target.closest('.wset'); if (c) openWeap(c.dataset.n, c); });
    window.openWeapon = (n, from) => openWeap(n, from);
    filters(); render();
  })();
  document.addEventListener('click', e => { const b = e.target.closest('.artlink, .artlink-alt'); if (b && window.openArtSet) window.openArtSet(b.dataset.set, b, b.dataset.who); });
})();

/* ===== «Что нового»: кнопка и окно журнала обновлений (данные — news.js, window.HVNEWS) ===== */
(function(){
  const NEWS = window.HVNEWS; if (!Array.isArray(NEWS) || !NEWS.length) return;
  const KEY = 'hv_news_seen';
  const LS = { get(){ try { return localStorage.getItem(KEY); } catch(e){ return null; } }, set(v){ try { localStorage.setItem(KEY, v); } catch(e){} } };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const seen = LS.get();
  let unread = seen == null ? NEWS.length : NEWS.findIndex(n => n.id === seen);   // сколько записей новее последней виденной
  if (unread < 0) unread = NEWS.length;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.id = 'newsBtn'; btn.className = 'news-btn'; btn.setAttribute('aria-label', 'Что нового'); btn.title = 'Что нового';
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2.5l2.2 6.3 6.3 2.2-6.3 2.2L12 19.5l-2.2-6.3L3.5 11l6.3-2.2z" fill="currentColor"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" fill="currentColor" opacity=".7"/></svg><span class="news-lb">Что нового</span><i class="news-dot" aria-hidden="true"></i>';
  btn.classList.toggle('has-new', unread > 0);
  const ov = document.createElement('div'); ov.className = 'news-ov'; ov.hidden = true;
  ov.innerHTML = '<div class="news-sheet" role="dialog" aria-modal="true" aria-labelledby="newsTitle"><button class="close" type="button" aria-label="Закрыть">×</button><h2 id="newsTitle">Что нового</h2><div class="news-body"></div></div>';
  const body = ov.querySelector('.news-body');
  function render(newCount){
    body.innerHTML = NEWS.map((n, i) => '<section class="news-it' + (i < newCount ? ' is-new' : '') + '"><div class="news-hd"><span class="news-d">' + esc(n.d) + '</span>' + (i < newCount ? '<span class="news-tag">новое</span>' : '') + '</div><h3>' + esc(n.t) + '</h3><ul>' + n.l.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></section>').join('');
  }
  let opener = null;
  const open = () => { render(unread); opener = document.activeElement; ov.hidden = false; document.documentElement.classList.add('news-open'); body.scrollTop = 0;
    LS.set(NEWS[0].id); btn.classList.remove('has-new'); const c = ov.querySelector('.close'); c && c.focus(); };
  const close = () => { if (ov.hidden) return; ov.hidden = true; document.documentElement.classList.remove('news-open'); unread = 0; if (opener && opener.focus) try { opener.focus(); } catch(e){} };
  btn.addEventListener('click', open);
  ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('.close')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !ov.hidden){ e.stopImmediatePropagation(); close(); } }, true);
  // кнопка стоит левее кнопки входа (на главной): ширину кнопки входа берём с неё самой
  const acct = () => document.getElementById('acctBtn');
  function place(){ const a = acct(), w = a && a.offsetWidth ? a.offsetWidth : 0, small = innerWidth <= 720;
    btn.style.right = (w ? (small ? 12 : 14) + w + 10 : (small ? 12 : 14)) + 'px'; }
  const mount = () => { document.body.appendChild(btn); document.body.appendChild(ov); place(); const a = acct(); if (a && window.ResizeObserver) new ResizeObserver(place).observe(a); addEventListener('resize', place); };
  if (document.body) mount(); else addEventListener('DOMContentLoaded', mount);
  window.addEventListener('load', place);
})();
