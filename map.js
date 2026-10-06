// Код страницы карты (map.html): карта Тейвата, плашки регионов, масштаб, глобус, экран загрузки.
(function(){
  // ===== Карта Тейвата: регионы и плашка =====
  (function tmap(){
    const RD = HVJ('regiondata');
    const CH = HVJ('data');
    const ELC = {'Анемо':'#6FE3C1','Гео':'#F5C84C','Электро':'#C58CFF','Дендро':'#9BDB4E','Гидро':'#4FD3F7','Пиро':'#FF7B5C','Крио':'#A8EEF5'};
    const TABS = [['hist','История','ti_hist.webp'],['chars','Персонажи региона','ti_chars.webp'],['events','События','ti_events.webp'],['places','Места','ti_places.webp'],['bosses','Боссы','ti_bosses.webp'],['domains','Данжи','ti_domains.webp'],['items','Предметы региона','ti_items.webp'],['wood','Древесина','ic_wood.webp']];
    const E = s => String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const P = document.getElementById('rpanel'), IN = P.querySelector('.rp-in'), SL = document.getElementById('rpSlides'), DOTS = document.getElementById('rpDots'), NAV = document.getElementById('rpNav');
    const snd = n => { try { const a = new Audio(n); const v = window.gMusic ? window.gMusic.sfxVol() : .5; if (v > 0){ a.volume = v; a.play().catch(()=>{}); } } catch(e){} };
    let R = null, back = null;
    function slides(tab){
      if (tab === 'chars'){
        const list = CH.filter(c => c.reg === R.name || (c.reg2||[]).includes(R.name));
        return list.map(c => { const t = R.chars[c.n] || ['Персонаж региона ' + R.name + '. Описание скоро появится.', ''];
          const sp = R.splash && R.splash[c.n], cd = R.card && R.card[c.n];
          return {k:'Персонаж', h:c.n, p:t[0], q:t[1], av:sp || c.img, sp:!!sp, fit:(R.fit||{})[c.n], card:cd, skins:(R.skins||{})[c.n], ec:ELC[c.e], ek:{'Анемо':'anemo','Гео':'geo','Электро':'electro','Дендро':'dendro','Гидро':'hydro','Пиро':'pyro','Крио':'cryo'}[c.e], tags:[c.e, '★'.repeat(c.r||0), c.w].filter(Boolean)}; });
      }
      return (R.tabs[tab] || []).map(x => ({k:'', h:x[0], p:x[1], q:x[2], pic:x[3], tr:x[4] === 't', drop:[].concat(x.slice(4)).find(v => Array.isArray(v)), res:x.slice(4).find(v => v && typeof v === 'object' && !Array.isArray(v))})).map(x => ({...x, gems: x.res && x.res.gems, rare: x.res && x.res.rare, rst: x.res && x.res.resist, dmg: x.res && x.res.dmg, dmgn: x.res && x.res.dmgn, tac: x.res && x.res.tac, pin: x.res && x.res.pin, need: x.res && x.res.need}));
    }
    // картинки слайда: одна или галерея (плавная смена, стрелки, точки, сама листается)
    // «Кому нужен дроп»: аватарки персонажей (клик — карточка персонажа)
    const CHM = Object.fromEntries(CH.map(c => [c.n, c]));
    const WHO_IC = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="9" cy="8" r="3.6" fill="currentColor"/><path d="M2.5 20c.4-4 3-6.2 6.5-6.2s6.1 2.2 6.5 6.2z" fill="currentColor"/><circle cx="17" cy="9" r="2.8" fill="currentColor" opacity=".7"/><path d="M15.8 14.2c3 .1 5.1 2 5.6 5.8h-4.3c-.2-2.3-.7-4.2-1.3-5.8z" fill="currentColor" opacity=".7"/></svg>';
    const whoAv = n => { const c = CHM[n]; if (!c) return ''; return `<button type="button" class="who-a r${c.r||0}" data-ch="${E(n)}" title="${E(n)}" style="--ec:${ELC[c.e]||'#D9DCE6'}"><img src="${c.img}" alt="${E(n)}" loading="lazy" decoding="async"></button>`; };
    const whoRow = (nm, pic, list) => `<div class="who-r"><img class="who-it" src="${pic}" alt="" loading="lazy" decoding="async"><div class="who-b"><div class="who-h">${E(nm)} <small>${list.length}</small></div><div class="who-l">${list.map(whoAv).join('')}</div></div></div>`;
    const whoHtml = x => `<div class="rs-say rs-say1 who-w"><h5>Кому нужен дроп</h5>${x.drop ? `<div class="who-k">Уникальный дроп</div>` + x.drop.filter(d => x.need[d[0]]).map(d => whoRow(d[0], d[1], x.need[d[0]])).join('') : ''}${x.gems ? `<div class="who-k">Камни возвышения</div>` + x.gems.filter(g => x.need[g[0]]).map(g => whoRow(g[0], g[1], x.need[g[0]])).join('') : ''}<p class="who-f">Нажми на персонажа — откроется его карточка.</p></div>`;
    const dropHtml = (x, c) => `<div class="rs-drop ${c}"><div class="rs-dk">Уникальный <br>дроп</div><div class="rs-dl">${x.drop.map(d => `<span class="rs-di${x.need && x.need[d[0]] ? ' rs-whoi' : ''}" tabindex="0" data-n="${E(d[0])}"${x.need && x.need[d[0]] ? ` data-w="${E(x.need[d[0]].join('|'))}"` : ''}><img src="${d[1]}" alt="${E(d[0])}" loading="lazy" decoding="async"></span>`).join('')}</div></div>`;
    const RN = {phys:'Физический', pyro:'Пиро', hydro:'Гидро', electro:'Электро', cryo:'Крио', dendro:'Дендро', anemo:'Анемо', geo:'Гео'};
    const PHYS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 3l1 1-9.5 9.5-1-1zM4 20l3.2-6.2 3 3zM9.4 12.7l1.9 1.9-1.4 1.4-1.9-1.9z" fill="#e9eef8"/><path d="M14.5 3.5L20.5 9.5" stroke="#e9eef8" stroke-width="1.6" stroke-linecap="round"/></svg>';
    // «Простыми словами» про резист: текст собирается сам из цифр босса
    const RNL = {phys:'физ. урон', pyro:'Пиро', hydro:'Гидро', electro:'Электро', cryo:'Крио', dendro:'Дендро', anemo:'Анемо', geo:'Гео'};
    const listRu = a => a.length < 2 ? a.join('') : a.slice(0,-1).join(', ') + ' и ' + a[a.length-1];
    function rsSay(m, short){ // m: {ключ: число | 'imm'}
      const ks = Object.keys(m), imm = ks.filter(k => m[k] === 'imm'), nums = ks.filter(k => m[k] !== 'imm').map(k => m[k]);
      if (nums.length && Math.min(...nums) >= 300) return '<b class="t-h">Почти неуязвим.</b> Проходит всего ~7% урона. Не трать ульты — подожди или бей другого.';
      if (nums.length && Math.max(...nums) < 0){ const mn = Math.min(...nums); return `<b class="t-l">Ослаб!</b> Резист в минусе — он получает <b>больше</b> урона (до +${Math.round(-mn/2)}%). Жми всё, что есть.`; }
      const hi = ks.filter(k => m[k] !== 'imm' && m[k] >= 50), out = [];
      if (imm.length) out.push(`<b class="t-i">${listRu(imm.map(k => RNL[k]))} — иммунитет:</b> урон этой стихией вообще не проходит. Не бей ${imm.length > 1 ? 'ими' : 'ею'}.`);
      if (hi.length) out.push(`<b class="t-m">${listRu(hi.map(k => RNL[k]))} — ${m[hi[0]]}%:</b> пробивается только ${100 - m[hi[0]]}% урона. Лучше бить другим.`);
      if (!(short && (imm.length || hi.length))) out.push(imm.length || hi.length ? 'Всем остальным — бей спокойно, проходит почти весь урон.' : '<b class="t-n">Обычный враг:</b> 10% ко всему. Бей чем хочешь — проходит 90% урона.');
      return out.join('<br>'); }
    function rsGroupsHelp(R){ const toM = r => Object.fromEntries(R.cols.map((c,ci) => [c, r[1][ci]]));
      const norm = new Map(), hard = [], weak = [];
      R.groups.forEach(g => g.rows.forEach((r,ri) => { const v = r[1];
        if (Math.min(...v) >= 300){ if (!hard.includes(r[0])) hard.push(r[0]); }
        else if (Math.max(...v) < 0){ if (!weak.includes(r[0])) weak.push(r[0]); }
        else { const t = rsSay(toM(r), true); norm.set(t, (norm.get(t) || []).concat(g.n)); } }));
      const q = a => a.map(n => '«' + E(n) + '»').join(', ');
      return `<div class="rs-say rs-say1"><h5>Простыми словами</h5>`
        + [...norm].map(([t, names]) => `<p><span class="rs-st">${listRu(names.map(E))}:</span> ${t}</p>`).join('') + `<p>Остальными стихиями в обычном состоянии бей спокойно — проходит почти весь урон.</p>`
        + (hard.length ? `<p><span class="rs-st">Когда ${q(hard)}:</span> ${rsSay({a:310})}</p>` : '')
        + (weak.length ? `<p><span class="rs-st">Когда ${q(weak)}:</span> ${rsSay({a:-70})}</p>` : '')
        + `<p class="rs-note">Раскрой фигуру в «Резист · ${R.groups.length} фигуры», чтобы увидеть все цифры.</p></div>`; }
    const RS_LEGEND = `<div class="rs-help"><h5>Как читать цифры</h5><ul>
      <li><i class="c-n">10%</i><span>Норма. Враг «съедает» 10%, до него доходит 90% урона.</span></li>
      <li><i class="c-m">70%</i><span>Много. Доходит только 30% — эта стихия почти не работает.</span></li>
      <li><i class="c-i">ИММ</i><span>Иммунитет. Этой стихией урон = 0.</span></li>
      <li><i class="c-h">310%</i><span>Почти неуязвим. Доходит ~7% урона — лучше переждать.</span></li>
      <li><i class="c-l">−70%</i><span>Минус — враг ослаб и получает <b>больше</b> урона (−70% → +35%). Самый момент бить!</span></li>
    </ul><p>Резист можно срезать — см. «Шред / Срез резиста» в Словаре.</p></div>`;
    const gemHtml = (x, c) => `<div class="rs-drop rs-gems ${c}"><div class="rs-dk">Дроп</div><div class="rs-dl">${x.gems.map(g => `<div class="rs-gem"><span class="rs-di rs-gm" tabindex="0" role="button" aria-expanded="false" data-n="${E(g[0])}"><img src="${g[1]}" alt="${E(g[0])}" loading="lazy" decoding="async"></span><div class="rs-gx">${(g[2]||[]).map(m => `<span class="rs-di" tabindex="0" data-n="${E(m[0])}"><img src="${m[1]}" alt="${E(m[0])}" loading="lazy" decoding="async"></span>`).join('')}</div></div>`).join('')}</div></div>`;
    const rareHtml = (x, c) => `<div class="rs-drop rs-rare ${c}"><div class="rs-dk">Шанс</div><div class="rs-dl">${x.rare.map(r => `<div class="rs-ri"><span class="rs-di" tabindex="0" data-n="${E(r[0])} · шанс ${E(r[2])}"><img src="${r[1]}" alt="${E(r[0])}" loading="lazy" decoding="async"></span><b data-p="${E(r[2])}">Шанс</b></div>`).join('')}</div></div>`;
    function gal(x){ const L = [].concat(x.pic), n = L.length;
      return `<div class="rs-img rs-pic${x.drop || x.gems ? ' hasdrop' : ''}${String(L[0]).startsWith('vid:') ? ' vcur' : ''}" data-ph="" data-n="${n}" data-i="0">${x.drop ? dropHtml(x, 'rs-dside') : ''}${x.gems ? gemHtml(x, 'rs-dside rs-dright') : ''}<div class="rs-gw">${L.map((u,k) => String(u).startsWith('vid:') ? `<video class="pic rs-vid${k ? '' : ' on'}" controls playsinline preload="none" poster="${u.slice(4)}.jpg?v=1" aria-label="${E(x.h)} — видео"><source src="${u.slice(4)}.webm?v=1" type="video/webm"><source src="${u.slice(4)}.mp4?v=1" type="video/mp4"></video>` : `<img class="pic${k ? '' : ' on'}" src="${u}" alt="${E(x.h)}" loading="${k ? 'lazy' : 'eager'}" decoding="async">`).join('')}`
        + (n > 1 ? `<button type="button" class="rs-gb rs-gp" aria-label="Предыдущая картинка">‹</button><button type="button" class="rs-gb rs-gn" aria-label="Следующая картинка">›</button>${n > 15 ? `<div class="rs-gc" aria-live="polite">1 / ${n}</div>` : `<div class="rs-gd">${L.map((_,k) => `<button type="button" aria-label="Картинка ${k+1}" aria-current="${k ? 'false' : 'true'}"></button>`).join('')}</div>`}` : '') + `</div></div>`; }
    function galGo(g, i){ const n = +g.dataset.n; i = (i % n + n) % n; g.dataset.i = i;
      g.querySelectorAll('.rs-gw > .pic').forEach((im,k) => { im.classList.toggle('on', k === i); if (k !== i && im.tagName === 'VIDEO') im.pause(); }); g.classList.toggle('vcur', !!g.querySelector('.rs-gw > video.pic.on')); const gc = g.querySelector('.rs-gc'); if (gc) gc.textContent = (i + 1) + ' / ' + n; g.querySelectorAll('.rs-gd button').forEach((b,k) => b.setAttribute('aria-current', k === i ? 'true' : 'false')); }
    setInterval(() => { if (P.hidden) return; SL.querySelectorAll('.rs-pic[data-n]').forEach(g => { if (+g.dataset.n > 1 && !g.classList.contains('vcur') && !g.querySelector('.rs-gw').matches(':hover')) galGo(g, +g.dataset.i + 1); }); }, 4500);
    function render(tab){
      NAV.querySelectorAll('.rp-tab').forEach(b => b.setAttribute('aria-selected', b.dataset.t === tab ? 'true' : 'false'));
      const name = TABS.find(t => t[0] === tab)[1], list = slides(tab);
      SL.innerHTML = list.map((x,i) => `<article${x.k === 'Персонаж' ? ` data-ch="${E(x.h)}"` : ''} class="rs${x.k === 'Персонаж' ? ' rsch' : ''}${x.card ? ' rsart rscard' : x.sp ? ' rsart' : ''}${tab === 'items' ? ' rsitem' : ''}${tab === 'bosses' ? ' rsboss' : ''}${x.tr ? ' rstr' : ''}${x.rare ? ' hassol' : ''}" style="${x.ec ? '--ec:'+x.ec : ''}${x.ek ? `;--eic:url(el_${x.ek}.webp)` : ''}">
        ${x.card ? `<div class="rs-bg" aria-hidden="true"><img class="rs-cdb" src="${x.card}" alt="" loading="lazy" decoding="async">${x.skins ? x.skins.map((k,j) => `<img class="rs-cd sk${j ? '' : ' on'}" src="${k[1]}" alt="" loading="lazy" decoding="async">`).join('') : `<img class="rs-cd" src="${x.card}" alt="" loading="lazy" decoding="async">`}</div>` : x.sp ? `<div class="rs-bg" aria-hidden="true" style="${x.fit||''}"><span class="rs-glow"></span><img class="rs-sp" src="${x.av}" alt="" loading="lazy" decoding="async"></div>`
          : x.pic ? gal(x)
          : `<div class="rs-img" data-ph="${x.av ? '' : 'Здесь будет картинка'}">${x.av ? `<img class="av" src="${x.av}" alt="${E(x.h)}" loading="lazy" decoding="async">` : `<div class="ph">${E(x.h)}</div>`}</div>`}
        ${x.skins ? `<div class="rs-skin" role="group" aria-label="Костюм"><span>Костюм</span>${x.skins.map((k,j) => `<button type="button" class="rs-skb" data-j="${j}" aria-pressed="${j ? 'false' : 'true'}">${E(k[0])}</button>`).join('')}</div>` : ''}
        <div class="rs-txt"><div class="rs-k">${E(name)} · ${i+1} / ${list.length}</div><h3>${E(x.h)}${x.dmg ? `<span class="rs-dmg" tabindex="0" data-n="Бьёт уроном: ${x.dmg.map(k => k === 'mirror' ? 'твоими же стихиями' : RN[k]).join(' + ')}${x.dmgn ? '. ' + E(x.dmgn) : ''}"><small>урон</small>${x.dmg.map(k => k === 'phys' ? PHYS : k === 'mirror' ? '<i class="dmg-rb" aria-hidden="true"><b>↺</b></i>' : `<img src="el_${k}.webp" alt="${RN[k]}">`).join('')}</span>` : ''}</h3>
          ${x.tags ? `<div class="tags">${x.tags.map((t,k)=>`<span class="tag" style="--tc:${k===0 && x.ec ? x.ec : k===1 ? 'var(--gold)' : 'var(--muted)'}">${E(t)}</span>`).join('')}</div>` : ''}
          <div class="rs-meta">${x.res ? `<div class="rs-res" title="${x.res.res2 ? `Первородная смола: ${x.res.res} за первые 3 еженедельных босса за неделю, потом ${x.res.res2}` : 'Первородная смола'}"><img src="ic_resin.webp?v=1" alt="" aria-hidden="true"><b>${x.res.res}</b>${x.res.res2 ? `<span>первые 3 за неделю · потом <b>${x.res.res2}</b></span>` : `<span>за награду</span>`}</div>` : ''}${x.tac ? `<button type="button" class="rs-rbtn rs-tac" aria-expanded="false" title="Тактика против босса"><span aria-hidden="true">⚔</span> Как бить</button><div class="rs-rpop" hidden><div class="rs-say rs-say1"><h5>Как бить</h5>${x.tac.map(t => `<p>${E(t)}</p>`).join('')}</div></div>` : ''}${x.need ? `<button type="button" class="rs-rbtn rs-who" aria-expanded="false" title="Кому нужен дроп"><span aria-hidden="true">${WHO_IC}</span> Кому нужен</button><div class="rs-rpop" hidden>${whoHtml(x)}</div>` : ''}${x.pin && i >= 0 ? `<button type="button" class="rs-gpin" data-i="${i}" title="Показать на глобусе" aria-label="Показать на глобусе"><span aria-hidden="true">📍</span></button>` : ''}${x.rst ? (x.rst.groups ? `<button type="button" class="rs-rst rs-rbtn" aria-expanded="false" title="Сопротивление (резист) по фигурам и фазам"><span class="rs-rk">Резист</span><em>${x.rst.groups.length} фигуры</em><i class="rs-chev" aria-hidden="true">▾</i></button>
          <div class="rs-rpop" hidden>${x.rst.groups.map((g,gi) => `<details class="rs-rg" name="rsrg"${gi ? '' : ' open'}><summary><small>${E(g.ph)}</small>${E(g.n)}</summary><div class="rs-rtw"><table class="rs-rtab"><thead><tr><th></th>${x.rst.cols.map(c => `<th title="${RN[c]}">${c === 'phys' ? PHYS : `<img src="el_${c}.webp" alt="${RN[c]}">`}</th>`).join('')}</tr></thead><tbody>${g.rows.map(r => `<tr><th>${E(r[0])}</th>${r[1].map(v => `<td class="${v >= 300 ? 'vh' : v >= 50 ? 'vm' : v < 0 ? 'vl' : ''}">${v}<span class="pc">%</span></td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`).join('')}</div><button type="button" class="rs-rbtn rs-qbtn" aria-expanded="false" aria-label="Что значат эти цифры?" title="Что значат эти цифры?">?</button>
          <div class="rs-rpop" hidden>${rsGroupsHelp(x.rst)}${RS_LEGEND}</div>` : `<button type="button" class="rs-rst rs-rbtn rs-rsim" aria-expanded="false" title="Что значат эти цифры?"><span class="rs-rk">Резист</span>${[['pyro','Пиро'],['hydro','Гидро'],['anemo','Анемо'],['electro','Электро'],['dendro','Дендро'],['cryo','Крио'],['geo','Гео']].map(([k,n]) => { const v = x.rst[k]; if (v == null) return ''; const im = v === 'imm';
            return `<span class="rs-rv${im ? ' imm' : ''}" data-n="${n}: ${im ? 'иммунитет' : v + '%'}"><img src="el_${k}.webp" alt="${n}"><i>${im ? 'имм' : v + '%'}</i></span>`; }).join('')}<i class="rs-q" aria-hidden="true">?</i></button>
          <div class="rs-rpop" hidden><div class="rs-say rs-say1"><h5>Простыми словами</h5><p>${rsSay(Object.fromEntries(Object.entries(x.rst)))}</p></div>${RS_LEGEND}</div>`) : ''}</div><p>${E(x.p)}</p>${x.q ? `<q>${E(x.q)}</q>` : ''}${x.drop ? dropHtml(x, x.pic ? 'rs-dtxt' : '') : ''}${x.gems ? gemHtml(x, x.pic ? 'rs-dtxt' : '') : ''}${x.rare ? rareHtml(x, 'rs-dtxt rs-rtxt') : ''}</div>${x.rare ? rareHtml(x, 'rs-rside') : ''}</article>`).join('');
      DOTS.innerHTML = list.map((_,i) => `<button type="button" aria-label="Слайд ${i+1}" aria-current="${i ? 'false' : 'true'}"></button>`).join('') + (list.length > 1 ? '<span class="rp-more" aria-hidden="true">↓</span>' : '');
      SL.scrollTop = 0; IN.classList.remove('scrolled'); para(); hintUpd();
    }
    // параллакс сплеш-артов: от курсора (сам арт) и от прокрутки (слой фона едет медленнее текста)
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches; let praf = 0;
    function para(){ if (still) return; cancelAnimationFrame(praf); praf = requestAnimationFrame(() => {
      const h = SL.clientHeight || 1;
      SL.querySelectorAll('.rs.rsart').forEach(el => { const r = Math.max(-1, Math.min(1, (el.offsetTop - SL.scrollTop) / h)); el.style.setProperty('--sy', r.toFixed(3)); }); }); }
    IN.addEventListener('pointermove', e => { if (still || e.pointerType !== 'mouse') return; const b = IN.getBoundingClientRect();
      IN.style.setProperty('--mx', ((e.clientX - b.left) / b.width * 2 - 1).toFixed(3)); IN.style.setProperty('--my', ((e.clientY - b.top) / b.height * 2 - 1).toFixed(3)); });
    IN.addEventListener('pointerleave', () => { IN.style.setProperty('--mx', 0); IN.style.setProperty('--my', 0); });
    SL.addEventListener('scroll', () => { let i = 0, bd = 1e9; [...SL.children].forEach((c,k) => { const d = Math.abs(c.offsetTop - SL.scrollTop); if (d < bd){ bd = d; i = k; } });
      DOTS.querySelectorAll('button').forEach((b,j) => b.setAttribute('aria-current', j === i ? 'true' : 'false'));
      IN.classList.toggle('scrolled', SL.scrollTop > 20); para(); }, {passive:true});
    DOTS.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const i = [...DOTS.children].indexOf(b); const t = SL.children[i]; SL.scrollTo({top: t ? t.offsetTop : i * SL.clientHeight, behavior:'smooth'}); });
    NAV.innerHTML = TABS.map(([k,n,ic]) => `<button type="button" class="rp-tab" role="tab" data-t="${k}"><i aria-hidden="true">${/\.webp$/.test(ic) ? `<img src="${ic}?v=1" alt="">` : ic}</i>${n}</button>`).join('');
    // камни: клик по 5★ раскрывает маленькие, клик мимо — закрывает
    function gemTog(m, on){ const w = m.closest('.rs-gem'); w.classList.toggle('open', on); m.setAttribute('aria-expanded', on ? 'true' : 'false'); }
    SL.addEventListener('click', e => { const m = e.target.closest('.rs-gm');
      SL.querySelectorAll('.rs-gem.open').forEach(w => { const mm = w.querySelector('.rs-gm'); if (mm !== m && !w.contains(e.target)) gemTog(mm, false); });
      if (m){ const on = !m.closest('.rs-gem').classList.contains('open'); gemTog(m, on); snd('sfx_pick.mp3'); } });
    SL.addEventListener('keydown', e => { const m = e.target.closest('.rs-gm'); if (m && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); m.click(); } });
    // сопротивления шахмат: кнопка открывает список фигур, клик мимо — закрыть
    SL.addEventListener('toggle', e => { const d = e.target; if (!d.matches || !d.matches('.rs-rg') || !d.open) return; d.parentNode.querySelectorAll('.rs-rg[open]').forEach(o => { if (o !== d) o.open = false; }); }, true);
    SL.addEventListener('click', e => { const bt = e.target.closest('.rs-rbtn');
      SL.querySelectorAll('.rs-rbtn[aria-expanded="true"]').forEach(x => { if (x !== bt && !x.nextElementSibling.contains(e.target)){ x.setAttribute('aria-expanded','false'); x.nextElementSibling.hidden = true; } });
      if (bt){ const on = bt.getAttribute('aria-expanded') !== 'true', pop = bt.nextElementSibling; bt.setAttribute('aria-expanded', on); pop.hidden = !on; snd('sfx_pick.mp3');
        if (on && innerWidth > 720){ const room = bt.getBoundingClientRect().top - SL.getBoundingClientRect().top - 14; pop.style.maxHeight = Math.max(160, room) + 'px'; } } });
    // переключатель костюма на постере персонажа
    SL.addEventListener('click', e => { const b = e.target.closest('.rs-skb'); if (!b || b.getAttribute('aria-pressed') === 'true') return;
      const a = b.closest('.rs'), j = +b.dataset.j; snd('sfx_pick.mp3');
      a.querySelectorAll('.rs-skb').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      a.querySelectorAll('.rs-cd.sk').forEach((im,k) => im.classList.toggle('on', k === j));
      const cb = a.querySelector('.rs-cdb'), cur = a.querySelectorAll('.rs-cd.sk')[j]; if (cb && cur) cb.src = cur.src; });
    SL.addEventListener('click', e => { const g = e.target.closest('.rs-pic'); if (!g) return; const i = +g.dataset.i;
      if (e.target.closest('.rs-gp')) galGo(g, i - 1); else if (e.target.closest('.rs-gn')) galGo(g, i + 1);
      else { const b = e.target.closest('.rs-gd button'); if (b) galGo(g, [...b.parentNode.children].indexOf(b)); } });
    // клик по персонажу в «Персонажи региона» — открывается его карточка, как на странице «Персонажи»
    SL.addEventListener('click', e => { const a = e.target.closest('.rs.rsch'); if (!a) return;
      if (e.target.closest('button, a, input, details, .rs-rpop, .rs-skin, .tags')) return;
      if (window.getSelection && String(window.getSelection()).length) return;
      window.openChar && window.openChar(a.dataset.ch, a); });
    NAV.addEventListener('click', e => { const b = e.target.closest('.rp-tab'); if (!b || b.getAttribute('aria-selected') === 'true') return; snd('sfx_pick.mp3'); render(b.dataset.t); });
    // ===== телефон: карточка листается внутри себя до конца; на следующую/прошлую — «подтянуть» (стрелка тянется, «давай, тяги…») =====
    const NARROW = matchMedia('(max-width:760px)');
    const PULL = document.createElement('div'); PULL.className = 'rp-pull'; PULL.hidden = true; PULL.setAttribute('aria-hidden', 'true');
    PULL.innerHTML = '<i class="pp-hd"></i><i class="pp-sk"></i><span class="pp-t"></span>'; IN.appendChild(PULL);
    const PT = PULL.querySelector('.pp-t'), PW = ['давай', 'тяги', 'давай', 'давай', 'давай…'], TH = 105;
    var pg = null;
    const atEnd = a => a.scrollTop + a.clientHeight >= a.scrollHeight - 3;
    function hintUpd(){ if (pg) return; const a = NARROW.matches && !P.hidden && curSlide(), on = !!(a && a.nextElementSibling && atEnd(a));
      PULL.hidden = !on; PULL.classList.remove('top', 'ready'); PULL.classList.toggle('idle', on); PULL.style.setProperty('--p', 0); if (on) PT.textContent = 'потяни вверх — дальше'; }
    function goTo(n){ const old = curSlide(); n.scrollTop = 0; SL.scrollTo({top: n.offsetTop, behavior: 'smooth'}); snd('sfx_pick.mp3');
      PULL.hidden = true; setTimeout(() => { if (old && old !== n) old.scrollTop = 0; hintUpd(); }, 520); }
    SL.addEventListener('scroll', () => { if (!pg) requestAnimationFrame(hintUpd); }, true);
    NARROW.addEventListener && NARROW.addEventListener('change', hintUpd);
    SL.addEventListener('touchstart', e => { pg = null; if (!NARROW.matches || e.touches.length !== 1) return; const a = e.target.closest('.rs');
      if (!a || a !== curSlide()) return; pg = {y: e.touches[0].clientY, a, base: a.offsetTop, end: atEnd(a), top: a.scrollTop <= 1, dir: 0, raw: 0}; }, {passive: true});
    SL.addEventListener('touchmove', e => { if (!pg) return; const dy = e.touches[0].clientY - pg.y;
      if (!pg.dir){ if (Math.abs(dy) < 8) return; const d = dy < 0 ? 1 : -1;   // 1: тянем вверх (к следующей), -1: вниз (к прошлой)
        if (!(d === 1 ? pg.end && pg.a.nextElementSibling : pg.top && pg.a.previousElementSibling)){ pg = null; return; }
        pg.dir = d; PULL.hidden = false; PULL.classList.remove('idle'); PULL.classList.toggle('top', d === -1); PULL.style.setProperty('--st', SL.offsetTop + 'px'); }
      e.preventDefault(); const raw = Math.max(0, -dy * pg.dir - 8); pg.raw = raw;
      SL.scrollTop = pg.base + pg.dir * Math.min(raw * .6, 170);
      PULL.style.setProperty('--p', raw.toFixed(0)); const ok = raw >= TH; PULL.classList.toggle('ready', ok);
      PT.textContent = ok ? 'отпускай!' : raw < 8 ? '' : PW.slice(0, 1 + Math.floor(raw / TH * PW.length)).join(', '); }, {passive: false});
    const pgEnd = () => { if (!pg) return; const g = pg; pg = null; PULL.hidden = true; PULL.classList.remove('ready');
      const n = g.dir === 1 ? g.a.nextElementSibling : g.dir === -1 ? g.a.previousElementSibling : null;
      if (g.dir && n && g.raw >= TH) goTo(n); else { if (g.dir) SL.scrollTo({top: g.base, behavior: 'smooth'}); setTimeout(hintUpd, 350); } };
    SL.addEventListener('touchend', pgEnd); SL.addEventListener('touchcancel', pgEnd);
    // колесо мыши на узком окне (десктоп с узким окном): то же самое, но без натягивания
    let wl = 0; SL.addEventListener('wheel', e => { if (!NARROW.matches) return; const a = e.target.closest('.rs'); if (!a || a !== curSlide() || Date.now() - wl < 700) return;
      const n = e.deltaY > 30 && atEnd(a) ? a.nextElementSibling : e.deltaY < -30 && a.scrollTop <= 1 ? a.previousElementSibling : null; if (n){ wl = Date.now(); goTo(n); } }, {passive: true});
    function open(id){
      R = RD[id]; if (!R) return; back = document.activeElement;
      IN.style.setProperty('--rc', R.color); document.getElementById('rpSide').style.setProperty('--rc', R.color); IN.style.setProperty('--rbg', R.bg ? `url(${R.bg})` : 'none'); IN.style.setProperty('--pbg', R.pbg ? `url(${R.pbg})` : 'none'); IN.classList.toggle('haspbg', !!R.pbg);
      document.getElementById('rpIc').src = 'el_' + R.el + '.webp'; const EM = document.getElementById('rpEmb'); EM.hidden = !R.emb; if (R.emb) EM.src = R.emb;
      document.getElementById('rpTitle').textContent = R.name;
      document.getElementById('rpSub').textContent = R.motto + ' · Архонт: ' + R.archon;
      document.getElementById('rpDiff').innerHTML = `Сложность<b>${'★'.repeat(R.diff)}<span>${'★'.repeat(5-R.diff)}</span></b>${E(R.diffText)}`;
      NAV.querySelectorAll('.rp-tab[data-t=wood]').forEach(b => b.hidden = !(R.tabs && R.tabs.wood)); P.dataset.region = id; P.hidden = false; render('hist'); snd('sfx_open.mp3'); document.getElementById('rpClose').focus();
    }

    // боковые кнопки справа от плашки (для боссов): «Как бить» и «На карте» — действуют на текущий слайд
    const SIDE = document.getElementById('rpSide'), SPOP = document.getElementById('rpsPop'), STAC = document.getElementById('rpsTac'), SMAP = document.getElementById('rpsMap'), SWHO = document.getElementById('rpsWho');
    const curSlide = () => { let i = 0, bd = 1e9; [...SL.children].forEach((c,k) => { const d = Math.abs(c.offsetTop - SL.scrollTop); if (d < bd){ bd = d; i = k; } }); return SL.children[i]; };
    function sideUpd(){ const a = curSlide(), r = IN.getBoundingClientRect(), room = innerWidth - r.right >= 96 && innerWidth > 720;
      const t = a && a.querySelector('.rs-tac'), w = a && a.querySelector('.rs-who'), m = a && a.querySelector('.rs-gpin'), on = !P.hidden && room && !!(t || m || w);
      SIDE.hidden = !on; P.classList.toggle('sideon', on); if (!on) return;
      SIDE.style.left = (r.right + 14) + 'px'; SIDE.style.top = (r.top + 8) + 'px'; STAC.hidden = !t; SWHO.hidden = !w; SMAP.hidden = !m;
      if (!SPOP.hidden && SIDE.dataset.slide !== String([...SL.children].indexOf(a))) sideTac(false); }
    // одно окно на две кнопки: «Как бить» / «Кому нужен»
    function sidePop(btn, on){ const a = curSlide(), src = a && a.querySelector(btn === SWHO ? '.rs-who' : '.rs-tac');
      [STAC, SWHO].forEach(b => b.setAttribute('aria-expanded', on && b === btn ? 'true' : 'false')); SPOP.hidden = !on; SPOP.classList.toggle('who', on && btn === SWHO);
      if (on && src){ SPOP.innerHTML = src.nextElementSibling.innerHTML; SIDE.dataset.slide = [...SL.children].indexOf(a); } }
    function sideTac(on){ sidePop(STAC, on); }
    STAC.addEventListener('click', e => { e.stopPropagation(); snd('sfx_pick.mp3'); sidePop(STAC, STAC.getAttribute('aria-expanded') !== 'true'); });
    SWHO.addEventListener('click', e => { e.stopPropagation(); snd('sfx_pick.mp3'); sidePop(SWHO, SWHO.getAttribute('aria-expanded') !== 'true'); });
    SMAP.addEventListener('click', e => { e.stopPropagation(); const a = curSlide(), m = a && a.querySelector('.rs-gpin'); sideTac(false); if (m) m.click(); });
    SPOP.addEventListener('click', e => { e.stopPropagation(); const b = e.target.closest('.who-a'); if (b && window.openChar) window.openChar(b.dataset.ch, b); });
    SL.addEventListener('click', e => { const b = e.target.closest('.who-a'); if (b && window.openChar){ e.stopPropagation(); window.openChar(b.dataset.ch, b); } }, true);
    // наведение / тап по уникальному дропу — всплывашка с аватарками
    const WHO = document.createElement('div'); WHO.className = 'who-pop'; WHO.hidden = true; P.appendChild(WHO);
    let whoT = 0, whoEl = null, whoPin = false;
    function whoShow(el){ clearTimeout(whoT); if (whoEl === el && !WHO.hidden) return; whoHide(true); whoEl = el; el.classList.add('whoon');
      const list = el.dataset.w.split('|');
      WHO.innerHTML = `<div class="who-h">${E(el.dataset.n)} <small>нужен ${list.length}</small></div><div class="who-l">${list.map(whoAv).join('')}</div>`;
      WHO.style.setProperty('--rc', getComputedStyle(IN).getPropertyValue('--rc')); WHO.hidden = false;
      const r = el.getBoundingClientRect(), w = WHO.offsetWidth, h = WHO.offsetHeight; let x, y;
      if (r.right + 12 + w <= innerWidth - 8){ x = r.right + 12; y = r.top + r.height/2 - h/2; } else { x = r.left + r.width/2 - w/2; y = r.bottom + 10; if (y + h > innerHeight - 8) y = r.top - h - 10; }
      WHO.style.left = Math.max(8, Math.min(innerWidth - w - 8, x)) + 'px'; WHO.style.top = Math.max(8, Math.min(innerHeight - h - 8, y)) + 'px'; }
    function whoHide(now){ clearTimeout(whoT); const go = () => { WHO.hidden = true; whoPin = false; if (whoEl) whoEl.classList.remove('whoon'); whoEl = null; }; if (now) go(); else whoT = setTimeout(go, 260); }
    SL.addEventListener('pointerover', e => { if (e.pointerType !== 'mouse') return; const el = e.target.closest('.rs-whoi'); if (el) whoShow(el); });
    SL.addEventListener('pointerout', e => { if (e.pointerType !== 'mouse' || whoPin) return; const el = e.target.closest('.rs-whoi'); if (el && !el.contains(e.relatedTarget)) whoHide(); });
    WHO.addEventListener('pointerenter', () => clearTimeout(whoT));
    WHO.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !whoPin) whoHide(); });
    WHO.addEventListener('click', e => { e.stopPropagation(); const b = e.target.closest('.who-a'); if (b && window.openChar){ const n = b.dataset.ch, f = whoEl; whoHide(true); window.openChar(n, f); } });
    SL.addEventListener('click', e => { const el = e.target.closest('.rs-whoi'); if (!el){ if (!WHO.hidden && !WHO.contains(e.target)) whoHide(true); return; }
      if (whoEl === el && !WHO.hidden && whoPin){ whoHide(true); return; } whoShow(el); whoPin = true; snd('sfx_pick.mp3'); });
    SL.addEventListener('keydown', e => { const el = e.target.closest('.rs-whoi'); if (el && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); el.click(); } });
    SL.addEventListener('scroll', () => { if (!WHO.hidden) whoHide(true); }, {passive:true});
    new MutationObserver(() => whoHide(true)).observe(SL, {childList:true});
    new MutationObserver(() => { if (P.hidden) whoHide(true); }).observe(P, {attributes:true, attributeFilter:['hidden']});
    P.addEventListener('click', e => { if (!SIDE.contains(e.target)) sideTac(false); }, true);
    SL.addEventListener('scroll', () => requestAnimationFrame(sideUpd), {passive:true}); addEventListener('resize', sideUpd);
    new MutationObserver(() => { sideTac(false); setTimeout(sideUpd, 60); }).observe(P, {attributes:true, attributeFilter:['hidden']});
    new MutationObserver(() => setTimeout(sideUpd, 30)).observe(SL, {childList:true});
    // видео в слайдах: музыка тише, пока играет; пауза при закрытии плашки и уходе со слайда
    const vids = () => SL.querySelectorAll('video.rs-vid');
    const vduck = () => { const on = [...vids()].some(v => !v.paused && !v.ended && !v.muted && v.volume > 0); window.gMusic && window.gMusic.duck && window.gMusic.duck(on); };
    ['play','playing','pause','ended','volumechange','emptied'].forEach(t => SL.addEventListener(t, e => { if (e.target.matches && e.target.matches('video.rs-vid')) vduck(); }, true));
    SL.addEventListener('play', e => { const v = e.target; if (!v.matches || !v.matches('video.rs-vid')) return; vids().forEach(o => { if (o !== v) o.pause(); }); }, true);
    const vio = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting) en.target.pause(); }), {root: SL, threshold: .25}) : null;
    new MutationObserver(() => { vio && vio.disconnect(); vids().forEach(v => vio && vio.observe(v)); vduck(); }).observe(SL, {childList:true});
    new MutationObserver(() => { if (P.hidden){ vids().forEach(v => v.pause()); vduck(); } }).observe(P, {attributes:true, attributeFilter:['hidden']});
    window.rpOpen = open; window.rpRD = RD; window.rpSnd = snd;
    // открыть вкладку и пролистать к слайду (для меток боссов на глобусе)
    window.rpShow = (tab, i) => { render(tab); requestAnimationFrame(() => { const t = SL.children[i]; if (t) SL.scrollTop = t.offsetTop; }); };
    SL.addEventListener('click', e => { const b = e.target.closest('.rs-gpin'); if (!b) return; snd('sfx_pick.mp3');
      window.gBossFocus && window.gBossFocus(+b.dataset.i); document.getElementById('rpClose').click(); });
    function close(){ if (P.hidden) return; window.uiClose && window.uiClose(); P.hidden = true; if (back && back.focus) back.focus(); }
    document.getElementById('rpClose').addEventListener('click', close);
    P.addEventListener('click', e => { if (e.target === P) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !P.hidden) close(); });
    // регионы на карте: наведение — подсветка суши региона; клик — плашка; на телефоне первый тап подсвечивает, второй открывает
    const regs = document.querySelectorAll('.tmhit .rg'); let hot = null;
    function setHot(id){ hot = id;
      document.querySelectorAll('.tmhl').forEach(x => { x.classList.toggle('hot', x.dataset.r === id); x.classList.toggle('off', !!id && x.dataset.r === id && !RD[id]); });
      document.querySelectorAll('.rl').forEach(x => x.classList.toggle('hot', x.dataset.r === id)); }
    regs.forEach(g => {
      g.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') setHot(g.dataset.r); });
      g.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && hot === g.dataset.r) setHot(null); });
      g.addEventListener('pointerup', e => {
        if (window.__tmDragged) return;
        if (e.pointerType !== 'mouse' && hot !== g.dataset.r){ setHot(g.dataset.r); return; }
        if (g.classList.contains('on')) open(g.dataset.r);
      });
      g.addEventListener('focus', () => setHot(g.dataset.r)); g.addEventListener('blur', () => setHot(null));
      g.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && g.classList.contains('on')){ e.preventDefault(); open(g.dataset.r); } });
    });
    // уход с карты — плашку закрываем
    new MutationObserver(() => { if (!document.documentElement.classList.contains('v-map') && !P.hidden){ P.hidden = true; } }).observe(document.documentElement, {attributes:true, attributeFilter:['class']});
  })();

  // ===== Карта: масштаб и перетаскивание =====
  (function tmzoom(){
    const box = document.querySelector('.mapv .mbox'), wr = box.querySelector('.tmwrap');
    let s = 1, x = 0, y = 0, base = null; const MIN = 1, MAX = 8;
    const TL = {"w":11218,"h":9472,"tiles":[["tmt/t_3_0.webp",3072,0,1024,1024],["tmt/t_4_0.webp",4096,0,1024,1024],["tmt/t_5_0.webp",5120,0,1024,1024],["tmt/t_3_1.webp",3072,1024,1024,1024],["tmt/t_4_1.webp",4096,1024,1024,1024],["tmt/t_5_1.webp",5120,1024,1024,1024],["tmt/t_2_2.webp",2048,2048,1024,1024],["tmt/t_3_2.webp",3072,2048,1024,1024],["tmt/t_4_2.webp",4096,2048,1024,1024],["tmt/t_5_2.webp",5120,2048,1024,1024],["tmt/t_6_2.webp",6144,2048,1024,1024],["tmt/t_2_3.webp",2048,3072,1024,1024],["tmt/t_3_3.webp",3072,3072,1024,1024],["tmt/t_4_3.webp",4096,3072,1024,1024],["tmt/t_5_3.webp",5120,3072,1024,1024],["tmt/t_6_3.webp",6144,3072,1024,1024],["tmt/t_7_3.webp",7168,3072,1024,1024],["tmt/t_8_3.webp",8192,3072,1024,1024],["tmt/t_0_4.webp",0,4096,1024,1024],["tmt/t_1_4.webp",1024,4096,1024,1024],["tmt/t_2_4.webp",2048,4096,1024,1024],["tmt/t_3_4.webp",3072,4096,1024,1024],["tmt/t_4_4.webp",4096,4096,1024,1024],["tmt/t_5_4.webp",5120,4096,1024,1024],["tmt/t_6_4.webp",6144,4096,1024,1024],["tmt/t_7_4.webp",7168,4096,1024,1024],["tmt/t_8_4.webp",8192,4096,1024,1024],["tmt/t_9_4.webp",9216,4096,1024,1024],["tmt/t_0_5.webp",0,5120,1024,1024],["tmt/t_1_5.webp",1024,5120,1024,1024],["tmt/t_2_5.webp",2048,5120,1024,1024],["tmt/t_3_5.webp",3072,5120,1024,1024],["tmt/t_4_5.webp",4096,5120,1024,1024],["tmt/t_5_5.webp",5120,5120,1024,1024],["tmt/t_6_5.webp",6144,5120,1024,1024],["tmt/t_7_5.webp",7168,5120,1024,1024],["tmt/t_8_5.webp",8192,5120,1024,1024],["tmt/t_9_5.webp",9216,5120,1024,1024],["tmt/t_10_5.webp",10240,5120,978,1024],["tmt/t_0_6.webp",0,6144,1024,1024],["tmt/t_1_6.webp",1024,6144,1024,1024],["tmt/t_2_6.webp",2048,6144,1024,1024],["tmt/t_3_6.webp",3072,6144,1024,1024],["tmt/t_4_6.webp",4096,6144,1024,1024],["tmt/t_5_6.webp",5120,6144,1024,1024],["tmt/t_6_6.webp",6144,6144,1024,1024],["tmt/t_7_6.webp",7168,6144,1024,1024],["tmt/t_8_6.webp",8192,6144,1024,1024],["tmt/t_9_6.webp",9216,6144,1024,1024],["tmt/t_10_6.webp",10240,6144,978,1024],["tmt/t_1_7.webp",1024,7168,1024,1024],["tmt/t_2_7.webp",2048,7168,1024,1024],["tmt/t_3_7.webp",3072,7168,1024,1024],["tmt/t_4_7.webp",4096,7168,1024,1024],["tmt/t_5_7.webp",5120,7168,1024,1024],["tmt/t_6_7.webp",6144,7168,1024,1024],["tmt/t_7_7.webp",7168,7168,1024,1024],["tmt/t_8_7.webp",8192,7168,1024,1024],["tmt/t_9_7.webp",9216,7168,1024,1024],["tmt/t_10_7.webp",10240,7168,978,1024],["tmt/t_8_8.webp",8192,8192,1024,1024],["tmt/t_9_8.webp",9216,8192,1024,1024],["tmt/t_10_8.webp",10240,8192,978,1024],["tmt/t_8_9.webp",8192,9216,1024,256],["tmt/t_9_9.webp",9216,9216,1024,256]]}, TBOX = wr.querySelector('.tmtiles'), shown = {};
    // чёткие тайлы полной карты подгружаются только при приближении и только видимые
    let tq = 0;
    function tiles(){ if (s < 1.3 || !base) return; clearTimeout(tq); tq = setTimeout(() => {
      const vw = base.bw, vh = base.bh, W = base.w * s, H = base.h * s, ox = base.ox + x, oy = base.oy + y;
      const fx0 = (-ox) / W, fy0 = (-oy) / H, fx1 = (vw - ox) / W, fy1 = (vh - oy) / H;
      TL.tiles.forEach(([f, tx, ty, tw, th]) => { if (shown[f]) return;
        const a = tx / TL.w, b = ty / TL.h, c = (tx + tw) / TL.w, d = (ty + th) / TL.h;
        if (c < fx0 || a > fx1 || d < fy0 || b > fy1) return;
        const im = new Image(); im.decoding = 'async'; im.alt = ''; im.draggable = false;
        im.style.cssText = `left:${a*100}%;top:${b*100}%;width:${(c-a)*100 + .09}%;height:${(d-b)*100 + .1}%`;
        im.onload = () => im.classList.add('ok'); im.src = f + '?v=3'; TBOX.appendChild(im); shown[f] = 1; }); }, 120); }

    function fit(){ wr.style.transform = 'none'; const b = box.getBoundingClientRect(), r = wr.getBoundingClientRect();
      base = {ox: r.left - b.left, oy: r.top - b.top, w: r.width, h: r.height, bw: b.width, bh: b.height}; }
    function clamp(){ const w = base.w * s, h = base.h * s;
      const minX = Math.min(0, base.bw - w - base.ox) - 40, maxX = Math.max(0, -base.ox) + 40;
      const minY = Math.min(0, base.bh - h - base.oy) - 40, maxY = Math.max(0, -base.oy) + 40;
      if (s <= 1){ x = 0; y = 0; } else { x = Math.min(maxX, Math.max(minX, x)); y = Math.min(maxY, Math.max(minY, y)); } }
    function apply(anim){ clamp(); wr.classList.toggle('anim', !!anim); wr.style.transform = `translate(${x}px,${y}px) scale(${s})`; wr.style.setProperty('--ls', (1/Math.sqrt(s)).toFixed(3)); wr.style.setProperty('--ht', s > 1.6 ? .35 : 1); box.style.backgroundSize = (1400*s)+'px'; box.style.backgroundPosition = (base ? base.ox + x : x)+'px '+(base ? base.oy + y : y)+'px'; tiles(); }
    function zoomAt(ns, cx, cy, anim){ if (!base) fit(); ns = Math.min(MAX, Math.max(MIN, ns));
      const px = cx - base.ox, py = cy - base.oy; x = px - (px - x) * ns / s; y = py - (py - y) * ns / s; s = ns; apply(anim); }
    const rel = e => { const b = box.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    box.addEventListener('wheel', e => { if (window.__globeOn) return; e.preventDefault(); const [cx, cy] = rel(e); zoomAt(s * Math.exp(-e.deltaY * .0015), cx, cy); }, {passive:false});
    const pts = new Map(); let start = null, moved = 0, pinch = null;
    box.addEventListener('pointerdown', e => { if (window.__globeOn || e.target.closest('.tmzoom')) return; if (!base) fit();
      pts.set(e.pointerId, rel(e)); moved = 0; window.__tmDragged = false; start = {x, y, p: rel(e)};
      if (pts.size === 2){ const [a, b] = [...pts.values()]; pinch = {d: Math.hypot(a[0]-b[0], a[1]-b[1]), s, cx:(a[0]+b[0])/2, cy:(a[1]+b[1])/2}; } });
    box.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, rel(e));
      if (pinch && pts.size === 2){ const [a, b] = [...pts.values()]; const d = Math.hypot(a[0]-b[0], a[1]-b[1]); zoomAt(pinch.s * d / pinch.d, pinch.cx, pinch.cy); window.__tmDragged = true; return; }
      const p = rel(e), dx = p[0] - start.p[0], dy = p[1] - start.p[1]; moved = Math.max(moved, Math.hypot(dx, dy));
      if (moved > 6 && s > 1){ if (!window.__tmDragged){ window.__tmDragged = true; box.classList.add('drag'); try { box.setPointerCapture(e.pointerId); } catch(_){} }
        x = start.x + dx; y = start.y + dy; apply(); } });
    const end = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; box.classList.remove('drag');
      if (window.__tmDragged) setTimeout(() => { window.__tmDragged = false; }, 0); };
    box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
    box.addEventListener('dblclick', e => { if (window.__globeOn || e.target.closest('.tmzoom')) return; const [cx, cy] = rel(e); zoomAt(s < 2.5 ? s * 2 : 1, cx, cy, true); });
    box.querySelector('.tmzoom').addEventListener('click', e => { if (window.__globeOn) return; const b = e.target.closest('button[data-z]'); if (!b) return; if (!base) fit();
      const k = b.dataset.z; if (k === 'reset'){ s = 1; x = y = 0; apply(true); } else zoomAt(s * (k === 'in' ? 1.6 : 1/1.6), base.bw/2, base.bh/2, true); });
    addEventListener('resize', () => { s = 1; x = y = 0; base = null; wr.style.transform = 'none'; });
    new MutationObserver(() => { if (document.documentElement.classList.contains('v-map')){ base = null; s = 1; x = y = 0; wr.style.transform = 'none'; } })
      .observe(document.documentElement, {attributes:true, attributeFilter:['class']});
  })();
  // ===== Глобус Тейвата (three.js): кнопка «Глобус» на карте, переключение через экран загрузки =====
  (function globe(){
    const MAPV = document.getElementById('mapv'), box = MAPV.querySelector('.mbox'), GV = document.getElementById('gview');
    const BG = GV.querySelector('.gbg'), CV = GV.querySelector('.ggl'), LB = GV.querySelector('.glabels'), TIP = GV.querySelector('.gtip');
    const MODE = document.getElementById('gmode'), HINT = MAPV.querySelector('.mhint'), HINT0 = HINT.textContent;
    const REG = [['mond','Мондштадт','#6FE3C1'],['liyue','Ли Юэ','#F5C84C'],['fontaine','Фонтейн','#4FD3F7'],['sumeru','Сумеру','#9BDB4E'],
                 ['nodkrai','Нод-Край','#B9B2FF'],['natlan','Натлан','#FF7B5C'],['snezh','Снежная','#A8EEF5'],['inazuma','Инадзума','#C58CFF']];
    const CRISP = new Set([1, 2, 3, 4, 5, 6, 7, 8]);   // регионы с новыми чёткими границами (grid.png по моим кордонам): 1 Мондштадт, 3 Фонтейн, 6 Натлан, 7 Снежная
    const RPOS = [[0.4619,0.0038],[0.1212,-0.2736],[-0.4033,0.2207],[-0.4788,-0.5265],[-1.4106,0.2537],[-1.4674,-0.6397],[-0.9169,0.9892],[0.8945,-0.946]];
    const URL3 = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    const RD = () => window.rpRD || {};
    let on = false, S = null, raf = 0, last = 0;
    // вид: долгота/широта в центре, масштаб; анимация перелёта
    let lon = 0.4644, lat = -0.0763, zoom = 1, vl = 0, vt = 0, fly = null, flown = false, idle = 0, hover = 0, liftV = 0, tIdx = 0;
    window.__globeOn = false;

    function loadThree(cb){ if (window.THREE) return cb(true);
      const sc = document.createElement('script'); sc.src = URL3; sc.async = true; sc.onload = () => cb(true); sc.onerror = () => cb(false); document.head.appendChild(sc); }

    const MOB = matchMedia('(hover:none) and (pointer:coarse)').matches, SHN = MOB ? 4 : 8, SHA = (6.2831853 / SHN).toFixed(6); let lastR = 0;   // телефон: легче рендер
    function stars(){ const w = BG.clientWidth, h = BG.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2); if (!w) return;
      BG.width = w * dpr; BG.height = h * dpr; const x = BG.getContext('2d'); x.scale(dpr, dpr);
      x.fillStyle = '#040914'; x.fillRect(0, 0, w, h);
      let s = 7; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 260; i++){ const t = R(), px = w * (-.1 + t * 1.2), py = h * (.15 + t * .55) + (R() - .5) * h * .35, r = 40 + R() * 160;
        const g = x.createRadialGradient(px, py, 0, px, py, r), a = .05 + R() * .07, hue = R() < .25 ? '255,214,150' : (R() < .6 ? '70,190,255' : '40,120,230');
        g.addColorStop(0, `rgba(${hue},${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r); }
      for (let i = 0; i < w * h / 1000; i++){ const px = R() * w, py = R() * h, r = R() < .97 ? R() * 1.1 + .2 : R() * 1.8 + 1;
        x.fillStyle = `rgba(${200 + R() * 55 | 0},${220 + R() * 35 | 0},255,${.3 + R() * .7})`; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); } }

    function init(cb){
      const T = window.THREE;
      const ren = new T.WebGLRenderer({canvas: CV, antialias: true, alpha: true});
      ren.setPixelRatio(Math.min(devicePixelRatio || 1, MOB ? 1.5 : 2));
      const scene = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, .1, 100);
      const mgr = new T.LoadingManager(), tl = new T.TextureLoader(mgr);
      const mem = navigator.deviceMemory || 4, mts = ren.capabilities.maxTextureSize, scr = Math.max(screen.width, screen.height) * (devicePixelRatio || 1);
      const TQ = MOB || mts < 8192 ? '2k' : (mts >= 16384 && mem >= 8 && scr > 1800 ? '16k' : '8k');   // новый глобус по официальной карте v7.1.50: 16k ПК / 8k средний / 2k телефон
      const tex = tl.load('gearth' + TQ + '.jpg?v=20'); tex.anisotropy = Math.min(8, ren.capabilities.getMaxAnisotropy());
      const landT = tl.load('gland' + TQ + '.png?v=20'), cloudT = tl.load('gcloud.png?v=20'); cloudT.minFilter = T.LinearFilter; cloudT.generateMipmaps = false;
      const ridT = tl.load((TQ === '2k' ? 'grid.png' : 'grid8k.png') + '?v=21'); ridT.minFilter = ridT.magFilter = T.NearestFilter; ridT.generateMipmaps = false;
      // карта регионов для клика (на процессоре)
      let RID = null; const ri = new Image(); ri.onload = () => { const c = document.createElement('canvas'); c.width = ri.width; c.height = ri.height;
        const x = c.getContext('2d'); x.drawImage(ri, 0, 0); RID = {w: ri.width, h: ri.height, d: x.getImageData(0, 0, ri.width, ri.height).data}; fillHoles(); }; ri.src = (TQ === '2k' ? 'grid.png' : 'grid8k.png') + '?v=21';
      // озёра/дыры внутри региона считаем частью региона — они поднимаются вместе с ним
      function fillHoles(){ const W = RID.w, H = RID.h, d = RID.d, id = new Uint8Array(W * H);
        for (let i = 0; i < W * H; i++){ const v = Math.round(d[i * 4] / 30); id[i] = v > 0 && v <= 8 ? v : 0; }
        const seen = new Uint8Array(W * H), qu = new Int32Array(W * H);
        for (let r = 1; r <= 8; r++){ let x0 = W, y0 = H, x1 = -1, y1 = -1;
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (id[y * W + x] === r){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
          if (x1 < 0) continue; x0 = Math.max(0, x0 - 1); y0 = Math.max(0, y0 - 1); x1 = Math.min(W - 1, x1 + 1); y1 = Math.min(H - 1, y1 + 1);
          let qh = 0, qt = 0; const push = (x, y) => { const k = y * W + x; if (seen[k] !== r && id[k] !== r){ seen[k] = r; qu[qt++] = k; } };
          for (let x = x0; x <= x1; x++){ push(x, y0); push(x, y1); } for (let y = y0; y <= y1; y++){ push(x0, y); push(x1, y); }
          while (qh < qt){ const k = qu[qh++], x = k % W, y = (k - x) / W;
            if (x > x0) push(x - 1, y); if (x < x1) push(x + 1, y); if (y > y0) push(x, y - 1); if (y < y1) push(x, y + 1); }
          for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){ const k = y * W + x; if (id[k] === 0 && seen[k] !== r){ id[k] = r; d[k * 4] = r * 30; } } }
        const px = new Uint8Array(W * H); for (let y = 0; y < H; y++) px.set(id.subarray((H - 1 - y) * W, (H - y) * W).map(v => v * 30), y * W);
        const ft = new T.DataTexture(px, W, H, T.LuminanceFormat, T.UnsignedByteType); ft.minFilter = ft.magFilter = T.NearestFilter; ft.generateMipmaps = false; ft.needsUpdate = true;
        U.rid.value = ft; }
      // сфера с долготой/широтой как у текстуры
      const NX = 256, NY = 128, pos = [], uv = [], idx = [];
      for (let j = 0; j <= NY; j++){ const la = Math.PI / 2 - j / NY * Math.PI;
        for (let i = 0; i <= NX; i++){ const lo = -Math.PI + i / NX * 2 * Math.PI; pos.push(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)); uv.push(i / NX, 1 - j / NY); } }
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++){ const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      const geo = new T.BufferGeometry(); geo.setIndex(idx);
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.computeBoundingSphere();
      const U = {map:{value:tex}, land:{value:landT}, rid:{value:ridT}, sun:{value:new T.Vector3(-.75, .35, .55).normalize()}, hover:{value:0}, crisp:{value:0}, rm:{value:null}, time:{value:0}, box:{value:new T.Vector4(0,0,1,1)}, hcol:{value:new T.Color('#6FE3C1')}, sl:{value:(() => { const t = tl.load('snzl.png?v=20'); t.minFilter = T.LinearFilter; t.generateMipmaps = false; return t; })()}, slb:{value:new T.Vector4(0.256996,0.661020,0.440172,0.907320)}, aur:{value:0}, frost:{value:0}, lift:{value:0}, cl:{value:cloudT}, cty:{value:(A => { const v = []; for (let i = 0; i < A.length; i += 3) v.push(new T.Vector3(A[i], A[i+1], A[i+2])); return v; })([0.5750,0.5053,0.0181,0.5595,0.4873,0.0075,0.6001,0.5100,0.0067,0.5595,0.5748,0.0093,0.5588,0.6135,0.0076,0.5408,0.3448,0.0168,0.5446,0.3930,0.0066,0.5452,0.3650,0.0055,0.4767,0.3795,0.0065,0.4783,0.2773,0.0056,0.4821,0.5141,0.0096,0.4720,0.4583,0.0054,0.4242,0.5771,0.0229,0.4441,0.5766,0.0084,0.4059,0.5393,0.0080,0.4303,0.4424,0.0062,0.4718,0.3588,0.0148,0.4605,0.3212,0.0060,0.4255,0.3046,0.0065,0.6812,0.2246,0.0122,0.6598,0.2550,0.0054,0.6728,0.1774,0.0055,0.6354,0.1371,0.0035,0.6208,0.2101,0.0045,0.6427,0.2101,0.0038,0.5744,0.2097,0.0045,0.2692,0.5595,0.0162,0.2839,0.5253,0.0079,0.2659,0.4726,0.0074,0.2486,0.4997,0.0067,0.2741,0.6972,0.0094,0.2668,0.3693,0.0071,0.2948,0.2843,0.0077,0.2569,0.2396,0.0066,0.3229,0.2724,0.0062,0.3107,0.3087,0.0059,0.2792,0.2504,0.0047,0.3573,0.8298,0.0279,0.3644,0.8013,0.0101,0.3371,0.8359,0.0103,0.3316,0.7739,0.0087,0.3940,0.8582,0.0104])}};   // города: u, v, радиус — ночью светятся только они
      const earth = new T.Mesh(geo, new T.ShaderMaterial({uniforms: U,
        vertexShader:`varying vec2 vUv; varying vec3 vN; varying vec3 vW,vE,vNo; void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*position); vec3 le=normalize(vec3(position.z,0.,-position.x)+vec3(1e-5,0.,0.)); vE=normalize(mat3(modelMatrix)*le); vNo=normalize(mat3(modelMatrix)*cross(normalize(position),le)); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
        fragmentShader:`uniform sampler2D map,land,rid,sl; uniform vec4 slb; uniform vec3 sun,hcol; uniform float hover,time,lift; uniform vec3 cty[42];
          float rail(vec2 u){ vec2 q=(u-slb.xy)/(slb.zw-slb.xy); if(q.x<0.||q.y<0.||q.x>1.||q.y>1.) return 0.; vec3 r=texture2D(sl,q).rgb; return r.r*(.8+.2*sin(time*2.3+u.x*2400.))+r.g*.35; } varying vec2 vUv; varying vec3 vN,vW,vE,vNo;
          uniform sampler2D rm; uniform vec4 box; float mR(vec2 u){ vec2 q=(u-box.xy)/(box.zw-box.xy); if(q.x<0.||q.y<0.||q.x>1.||q.y>1.) return 0.; return texture2D(rm,q).r; }
          float fRid(vec2 u){ return smoothstep(.4,.6,mR(u)); }
          vec3 focus(vec3 c, vec2 u, vec3 n, vec3 e, vec3 no, float onLand){
            if(hover<.5||lift<.01) return c;
            float mm=mR(u); float inR=smoothstep(.45,.55,mm);
            // тень «летящего острова»: регион, сдвинутый от солнца, мягко (8 выборок)
            vec2 dir=-vec2(dot(sun,e)/(6.2831853*max(sqrt(1.-n.y*n.y),.2)), dot(sun,no)/3.14159265);
            vec2 o=dir*.035*lift*(1.-inR); float sh=0.;
            for(int i=0;i<${SHN};i++){ float a=float(i)*${SHA}; sh+=fRid(u-o+vec2(cos(a),sin(a))*vec2(.0022,.0034)); }
            sh=sh/${SHN}.*(1.-inR);
            c*=1.-.5*sh*lift;
            float gw=0.; for(int i=0;i<${SHN};i++){ float a=float(i)*${SHA}+.39; gw+=fRid(u+vec2(cos(a),sin(a))*vec2(.00055,.00085)); }
            float glow=smoothstep(.04,.42,mm)*(1.-inR);
            // остальной глобус темнее и бесцветнее
            float g=dot(c,vec3(.299,.587,.114)); c=mix(c,mix(vec3(g),c,.35)*.62,(1.-inR)*lift);
            c=mix(c,vec3(.02,.05,.08)+vec3(g)*.12,inR*lift);   // под поднятым регионом — тёмная «яма»-тень, без второй копии карты c+=hcol*smoothstep(0.,.6,glow)*.45*lift;
            return c; }
          float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          void main(){ vec3 n=normalize(vN); vec3 v=normalize(cameraPosition-vW);
            vec3 alb=texture2D(map,vUv).rgb; float L=texture2D(land,vUv).r;
            vec3 sea=alb*vec3(1.25,1.75,1.85)+vec3(0.,.05,.09); vec3 col=mix(sea,alb*1.12,L);
            float nd=dot(n,sun); float day=smoothstep(-.18,.35,nd); float dif=max(nd,0.)*.85+.25;
            vec3 lit=col*dif; vec3 hv=normalize(sun+v); lit+=(1.-L)*pow(max(dot(n,hv),0.),60.)*vec3(.8,.95,1.)*.6*day;
            float cm=0.; for(int i=0;i<42;i++){ vec3 q=cty[i]; vec2 dd=vec2((vUv.x-q.x)*2.,vUv.y-q.y); cm+=exp(-dot(dd,dd)/(q.z*q.z)); } cm=min(cm,1.);
            float cell=h(floor(vUv*vec2(2600.,1300.))); float city=max(L,.35)*(1.-day)*(step(1.-.26*cm*cm,cell)*cm*.7+cm*cm*cm*.14+rail(vUv)*.6);   // приглушённо: редкие огоньки + слабое свечение
            vec3 c=mix(col*.06+vec3(1.,.6,.25)*city*1.3,lit,day);
            c=focus(c,vUv,n,normalize(vE),normalize(vNo),L);
            float fr=pow(1.-max(dot(n,v),0.),2.6); c+=vec3(.35,.75,1.)*fr*(.25+.9*day);
            gl_FragColor=vec4(c,1.); }`}));
      scene.add(earth);
      const clouds = new T.Mesh(new T.SphereGeometry(1.014, 160, 80), new T.ShaderMaterial({uniforms: U, transparent: true, depthWrite: false,
        vertexShader:`varying vec3 vP; varying vec3 vN; void main(){ vP=position; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }`,
        fragmentShader:`uniform float time; uniform vec3 sun; uniform sampler2D cl; varying vec3 vP,vN;
          vec3 hh(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return fract(sin(p)*43758.5453)*2.-1.;}
          float nz(vec3 p){vec3 i=floor(p),f=fract(p);vec3 u=f*f*(3.-2.*f);
            return mix(mix(mix(dot(hh(i),f),dot(hh(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),mix(dot(hh(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(hh(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
                       mix(mix(dot(hh(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(hh(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),mix(dot(hh(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(hh(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);}
          float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<6;i++){s+=a*nz(p);p=p*2.07+vec3(1.7,9.2,3.1);a*=.5;}return s;}
          vec3 sw(vec3 p,vec3 c,float st,float r){float d=distance(p,c);float k=st*exp(-d*d/(r*r));float cs=cos(k),sn=sin(k);return p*cs+cross(c,p)*sn+c*dot(c,p)*(1.-cs);}
          void main(){ vec3 p=normalize(vP); vec3 q=p;
            q=sw(q,normalize(vec3(.55,.35,.75)),3.2,.32); q=sw(q,normalize(vec3(-.8,.5,-.3)),-2.8,.28);
            q=sw(q,normalize(vec3(.2,-.55,-.8)),3.,.3); q=sw(q,normalize(vec3(-.3,-.35,.9)),-2.4,.26);
            vec3 s=vec3(q.x*1.6,q.y*4.2,q.z*1.6)+vec3(time*.015,0.,0.);
            vec3 w=vec3(fbm(s*1.3+2.),fbm(s*1.3+5.2),fbm(s*1.3+9.1)); float d=fbm(s*1.9+w*1.4);
            vec2 uv=vec2(atan(p.x,p.z)/6.2831853+.5, asin(clamp(p.y,-1.,1.))/3.14159265+.5); vec2 cm=texture2D(cl,uv).rg;
            float pol=smoothstep(.88,.98,abs(p.y));            // полюса
            float bo=.12*(1.-cm.g)*(1.-.6*smoothstep(.6,.85,abs(p.y)))+.2*pol;                     // вдали от регионов и у полюсов — гуще
            float a=smoothstep(-.06-bo,.22-bo,d); a*=mix(.6+.4*smoothstep(-.25,.25,fbm(p*3.+11.)),1.,.5*max(1.-cm.g,pol));
            a*=mix(1.,.08,cm.r);                               // над сушей — только лёгкая дымка
            vec3 n=normalize(vN); float nd=dot(n,sun); float day=smoothstep(-.15,.3,nd);
            vec3 c=mix(vec3(.75,.85,.95),vec3(1.),smoothstep(.2,.6,d))*(.3+.8*max(nd,0.));
            gl_FragColor=vec4(c,min(a*1.05,.92+.06*pol)*mix(.06,1.,day)); }`}));
      scene.add(clouds);
      const atm = new T.Mesh(new T.SphereGeometry(1.18, 96, 48), new T.ShaderMaterial({uniforms: U, transparent: true, side: T.BackSide, depthWrite: false, blending: T.AdditiveBlending,
        vertexShader:`varying vec3 vN,vW; void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
        fragmentShader:`uniform vec3 sun; varying vec3 vN,vW; void main(){ vec3 v=normalize(cameraPosition-vW); float r=dot(-vN,v);
          float g=pow(smoothstep(0.,.62,r),3.); float s=.35+.65*smoothstep(-.4,.6,-dot(-vN,sun)+.2); float k=g*1.1*s; gl_FragColor=vec4(vec3(.3,.72,1.)*k,k); }`}));
      scene.add(atm);
      const lift = new T.Mesh(geo, new T.ShaderMaterial({uniforms: U, transparent: true, depthWrite: false,
        vertexShader:`uniform float lift; varying vec2 vUv; varying vec3 vN; void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*position); gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position*(1.+0.035*lift),1.); }`,
        fragmentShader:`uniform sampler2D map,rid,land; uniform vec3 sun,hcol; uniform float hover,time,lift,crisp,frost; varying vec2 vUv; varying vec3 vN;
          uniform sampler2D rm; uniform vec4 box; float mR(vec2 u){ vec2 q=(u-box.xy)/(box.zw-box.xy); if(q.x<0.||q.y<0.||q.x>1.||q.y>1.) return 0.; return texture2D(rm,q).r; }
          void main(){ float m=mR(vUv); float a=smoothstep(.44,.56,m); if(hover<.5||lift<.01||a<.01) discard;
            float edge=1.-smoothstep(.56,.8,m);
            vec3 n=normalize(vN); vec3 c=texture2D(map,vUv).rgb*1.15*(max(dot(n,sun),0.)*.9+.3);
            float pul=.5+.5*sin(time*3.); c=mix(c,hcol,.05+.04*pul); c=mix(c,hcol*1.3,edge*.8);
            if(frost>.01){ c=mix(c,vec3(.93,.98,1.),edge*.45*frost); float sp=fract(sin(dot(floor(vUv*vec2(5200.,2600.)),vec2(12.9898,78.233)))*43758.5453); c+=vec3(.9,.97,1.)*frost*edge*step(.93,sp)*(.5+.5*sin(time*4.+sp*40.)); }   // Снежная: иней и искры по краю
            gl_FragColor=vec4(c,lift*a); }   // вода внутри региона (озёра/заливы, fillHoles) поднимается вместе с сушей`}));
      scene.add(lift);
      // белая «стенка» под поднятым регионом (стопка слоёв между поверхностью и поднятой сушей)
      const walls = new T.Group(), WN = 32;
      const wv = `uniform float lift,wk; varying vec2 vUv; varying vec3 vN; void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*position); gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position*(1.+.06*lift*wk),1.); }`;
      const wf = `uniform sampler2D rid,land; uniform vec3 sun; uniform vec4 box; uniform float hover,lift,wk,crisp; varying vec2 vUv; varying vec3 vN;
          float isr(vec2 u){ return abs(floor(texture2D(rid,u).r*255./30.+.5)-hover)<.5 ? 1. : 0.; }
          void main(){ if(hover<.5||lift<.01||vUv.x<box.x||vUv.y<box.y||vUv.x>box.z||vUv.y>box.w) discard;
            vec2 px=vec2(1./4096.,1./2048.); float R=1.4+.8*(1.-wk)*(1.-wk); float m=isr(vUv);
            if(m<.5){ for(int i=0;i<16;i++){ float a=float(i)*.39269908; vec2 d=vec2(cos(a),sin(a))*px*R; m=max(m,isr(vUv+d)); } }
            if(m<.5) discard; if(crisp>.5 && texture2D(land,vUv).r<.5) discard;
            vec3 n=normalize(vN); float nd=dot(n,sun); float day=smoothstep(-.18,.35,nd);
            float sh=mix(.58,1.,pow(wk,.8)); vec3 c=vec3(.94,.97,1.)*sh*(.62+.45*max(nd,0.));
            c=mix(c*.28,c,day); c+=vec3(.25,.55,.7)*(1.-sh)*.25;
            gl_FragColor=vec4(c,lift); }`;
      for (let i = 1; i <= WN; i++){ const m = new T.Mesh(geo, new T.ShaderMaterial({uniforms: Object.assign({}, U, {wk: {value: .015 + .985 * i / WN}}),
        vertexShader: wv, fragmentShader: wf, transparent: true, depthWrite: false})); m.renderOrder = 5 + i / 1000; walls.add(m); }
      walls.visible = false; scene.add(walls); lift.renderOrder = 6;
      // северное сияние над Снежной при наведении (оболочка над поднятым регионом, аддитивно)
      const aur = new T.Mesh(geo, new T.ShaderMaterial({uniforms: U, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        vertexShader:`uniform float aur; varying vec2 vUv; varying vec3 vN,vW; void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*position); vec4 w=modelMatrix*vec4(position*(1.+.085*aur),1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
        fragmentShader:`uniform sampler2D rm; uniform vec4 box; uniform vec3 sun; uniform float aur,time; varying vec2 vUv; varying vec3 vN,vW;
          float mR(vec2 u){ vec2 q=(u-box.xy)/(box.zw-box.xy); if(q.x<0.||q.y<0.||q.x>1.||q.y>1.) return 0.; return texture2D(rm,q).r; }
          float hs(float x){ return fract(sin(x*127.1)*43758.5453); } float n1(float x){ float i=floor(x),f=fract(x); f=f*f*(3.-2.*f); return mix(hs(i),hs(i+1.),f); }
          void main(){ if(aur<.01) discard;
            vec2 q=(vUv-box.xy)/(box.zw-box.xy); if(q.x<-.1||q.y<-.1||q.x>1.1||q.y>1.1) discard;
            float reg=smoothstep(.0,.5,mR(vUv)); reg=max(reg,.6*smoothstep(.0,.5,mR(vUv+vec2(.004,0.)))+.0); float x=q.x*6.+time*.05;
            float y0=.45+.22*(n1(x*.7+time*.08)-.5)+.12*sin(q.x*7.+time*.3);
            float a=0.;
            for(int k=0;k<3;k++){ float fk=float(k); float yc=y0+(fk-1.)*.16+.05*sin(q.x*11.+fk*2.+time*.5);
              float d=q.y-yc; float band=exp(-d*d/(.0016+.0012*fk)); float rays=.55+.45*n1(q.x*90.+fk*13.+time*.9); a+=band*rays*(1.-.25*fk); }
            float ed=smoothstep(-.05,.15,q.x)*smoothstep(1.05,.85,q.x)*smoothstep(-.05,.2,q.y)*smoothstep(1.05,.8,q.y);
            vec3 n=normalize(vN); float day=smoothstep(-.18,.35,dot(n,sun));
            vec3 col=mix(vec3(.2,1.,.65),vec3(.55,.45,1.),smoothstep(.0,.9,q.y-y0+.35));
            float k=a*ed*aur*mix(1.,.7,day)*(.3+.7*reg);
            gl_FragColor=vec4(col*k*1.5,1.); }`}));
      aur.renderOrder = 8; aur.frustumCulled = false; scene.add(aur);
      // детальный слой суши: тайлы официальной карты 1024² (gh_X_Y.webp), подгружаются при приближении
      // карта → глобус: u = a + b·fx; меркатор Y = A − B·fy (fx,fy — доли холста 11218×9472)
      const HMF = {a:0.085125, b:0.642092, A:1.800681, B:3.484241, W:22528, H:19456, ts:1024, pre:'gn_', list:[[13,0],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[7,4],[8,4],[9,4],[10,4],[5,5],[6,5],[7,5],[8,5],[5,6],[6,6],[7,6],[11,6],[12,6],[6,7],[10,7],[11,7],[12,7],[13,7],[16,7],[5,8],[6,8],[7,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],[17,8],[5,9],[6,9],[7,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],[0,10],[1,10],[2,10],[5,10],[6,10],[7,10],[9,10],[10,10],[11,10],[13,10],[14,10],[15,10],[16,10],[17,10],[18,10],[1,11],[2,11],[5,11],[6,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],[17,11],[2,12],[5,12],[6,12],[7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],[17,12],[5,13],[6,13],[7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[19,13],[20,13],[5,14],[6,14],[7,14],[8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[19,14],[20,14],[4,15],[5,15],[6,15],[7,15],[9,15],[10,15],[11,15],[12,15],[16,15],[17,15],[18,15],[19,15],[20,15],[16,16],[17,16],[18,16],[19,16],[20,16],[18,17],[19,17],[18,18],[19,18]]};
      const HMC = {a:0.085125, b:0.642092, A:1.800681, B:3.484241, W:11264, H:9728, ts:1024, pre:'gm_', list:[[4,0],[5,0],[6,0],[7,0],[3,1],[4,1],[5,1],[6,1],[7,1],[2,2],[3,2],[4,2],[5,2],[2,3],[3,3],[5,3],[6,3],[8,3],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[2,7],[3,7],[4,7],[5,7],[6,7],[8,7],[9,7],[10,7],[8,8],[9,8],[10,8],[9,9]]};
      const HM = TQ === '2k' ? HMC : HMF;   // тайли з повної офіційної карти: 1 м/px (ПК) або 2 м/px (телефон)
      U.hi = {value: 0};
      const hiG = new T.Group(); scene.add(hiG); clouds.renderOrder = 2;   // у групи НЕ ставити renderOrder: в three.js він стає groupOrder і перебиває порядок (патчі лягали поверх поднятого региона и облаков)
      const hiTL = new T.TextureLoader(), hiMax = TQ === '16k' ? 40 : TQ === '8k' ? 56 : 18, hiAni = Math.min(8, ren.capabilities.getMaxAnisotropy());
      const hiV = `attribute vec2 guv; varying vec2 vT,vG; varying vec3 vN,vW,vE,vNo; void main(){ vT=uv; vG=guv; vN=normalize(mat3(modelMatrix)*position); vec3 le=normalize(vec3(position.z,0.,-position.x)+vec3(1e-5,0.,0.)); vE=normalize(mat3(modelMatrix)*le); vNo=normalize(mat3(modelMatrix)*cross(normalize(position),le)); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;
      const hiF = `uniform sampler2D tex,rid,sl; uniform vec4 slb; uniform vec3 sun,hcol; uniform float hover,lift,hi,time; uniform vec3 cty[42];
          float rail(vec2 u){ vec2 q=(u-slb.xy)/(slb.zw-slb.xy); if(q.x<0.||q.y<0.||q.x>1.||q.y>1.) return 0.; vec3 r=texture2D(sl,q).rgb; return r.r*(.8+.2*sin(time*2.3+u.x*2400.))+r.g*.35; } varying vec2 vT,vG; varying vec3 vN,vW,vE,vNo;
          uniform sampler2D rm; uniform vec4 box; float mR(vec2 u){ vec2 q=(u-box.xy)/(box.zw-box.xy); if(q.x<0.||q.y<0.||q.x>1.||q.y>1.) return 0.; return texture2D(rm,q).r; }
          float fRid(vec2 u){ return smoothstep(.4,.6,mR(u)); }
          vec3 focus(vec3 c, vec2 u, vec3 n, vec3 e, vec3 no, float onLand){
            if(hover<.5||lift<.01) return c;
            float mm=mR(u); float inR=smoothstep(.45,.55,mm);
            // тень «летящего острова»: регион, сдвинутый от солнца, мягко (8 выборок)
            vec2 dir=-vec2(dot(sun,e)/(6.2831853*max(sqrt(1.-n.y*n.y),.2)), dot(sun,no)/3.14159265);
            vec2 o=dir*.035*lift*(1.-inR); float sh=0.;
            for(int i=0;i<${SHN};i++){ float a=float(i)*${SHA}; sh+=fRid(u-o+vec2(cos(a),sin(a))*vec2(.0022,.0034)); }
            sh=sh/${SHN}.*(1.-inR);
            c*=1.-.5*sh*lift;
            float gw=0.; for(int i=0;i<${SHN};i++){ float a=float(i)*${SHA}+.39; gw+=fRid(u+vec2(cos(a),sin(a))*vec2(.00055,.00085)); }
            float glow=smoothstep(.04,.42,mm)*(1.-inR);
            // остальной глобус темнее и бесцветнее
            float g=dot(c,vec3(.299,.587,.114)); c=mix(c,mix(vec3(g),c,.35)*.62,(1.-inR)*lift);
            c=mix(c,vec3(.02,.05,.08)+vec3(g)*.12,inR*lift);   // под поднятым регионом — тёмная «яма»-тень, без второй копии карты c+=hcol*smoothstep(0.,.6,glow)*.45*lift;
            return c; }
          float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          void main(){ vec4 t=texture2D(tex,vT); float a=t.a*hi; if(a<.004) discard;
            vec3 n=normalize(vN); vec3 v=normalize(cameraPosition-vW); vec3 col=t.rgb*1.12;
            float nd=dot(n,sun); float day=smoothstep(-.18,.35,nd); float dif=max(nd,0.)*.85+.25; vec3 lit=col*dif;
            float cm=0.; for(int i=0;i<42;i++){ vec3 q=cty[i]; vec2 dd=vec2((vG.x-q.x)*2.,vG.y-q.y); cm+=exp(-dot(dd,dd)/(q.z*q.z)); } cm=min(cm,1.);
            float cell=h(floor(vG*vec2(2600.,1300.))); float city=(1.-day)*(step(1.-.26*cm*cm,cell)*cm*.7+cm*cm*cm*.14+rail(vG)*.6);
            vec3 c=mix(col*.06+vec3(1.,.6,.25)*city*1.3,lit,day);
            c=focus(c,vG,n,normalize(vE),normalize(vNo),1.);
            float fr=pow(1.-max(dot(n,v),0.),2.6); c+=vec3(.35,.75,1.)*fr*(.25+.9*day);
            gl_FragColor=vec4(c,a); }`;
      const sph = (fx, fy, r) => { const u = HM.a + HM.b * fx, lo = -Math.PI + u * 2 * Math.PI, la = Math.atan(Math.sinh(HM.A - HM.B * fy));
        return [Math.cos(la) * Math.sin(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.cos(lo) * r, u, .5 + la / Math.PI]; };
      const hiTiles = HM.list.map(([tx, ty]) => { const c = sph((tx + .5) * HM.ts / HM.W, (ty + .5) * HM.ts / HM.H, 1);
        return {tx, ty, c: new T.Vector3(c[0], c[1], c[2]), m: null, st: 0, seen: 0}; });
      function hiMesh(P, tex){ const N = 16, pos = [], uv = [], uv2 = [], idx = [];
        for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++){ const p = sph((P.tx + i / N) * HM.ts / HM.W, (P.ty + j / N) * HM.ts / HM.H, 1.0007);
          pos.push(p[0], p[1], p[2]); uv.push(i / N, 1 - j / N); uv2.push(p[3], p[4]); }
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++){ const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
        const g = new T.BufferGeometry(); g.setIndex(idx); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
        g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setAttribute('guv', new T.Float32BufferAttribute(uv2, 2)); g.computeBoundingSphere();
        const m = new T.Mesh(g, new T.ShaderMaterial({uniforms: Object.assign({}, U, {tex: {value: tex}}), vertexShader: hiV, fragmentShader: hiF, transparent: true, depthWrite: false}));
        m.renderOrder = 1;
        const up = new T.Mesh(g, new T.ShaderMaterial({uniforms: m.material.uniforms, vertexShader: hiLV, fragmentShader: hiLF, transparent: true, depthWrite: false}));
        up.renderOrder = 7; up.frustumCulled = false; m.userData.up = up; return m; }
      // поднятый регион (наведение) — тоже в детальной текстуре; только для регионов с новыми чёткими границами (U.crisp)
      const hiLV = `uniform float lift; attribute vec2 guv; varying vec2 vT,vG; varying vec3 vN; void main(){ vT=uv; vG=guv; vN=normalize(mat3(modelMatrix)*position); gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position*(1.+0.035*lift)/1.0007,1.); }`;
      const hiLF = `uniform sampler2D tex,rid; uniform vec3 sun,hcol; uniform float hover,time,lift,hi,crisp,frost; varying vec2 vT,vG; varying vec3 vN;
          uniform sampler2D rm; uniform vec4 box; float mR(vec2 u){ vec2 q=(u-box.xy)/(box.zw-box.xy); if(q.x<0.||q.y<0.||q.x>1.||q.y>1.) return 0.; return texture2D(rm,q).r; }
          void main(){ float m=mR(vG); float a=smoothstep(.44,.56,m); if(hover<.5||lift<.01||crisp<.5||hi<.01||a<.01) discard;
            vec4 t=texture2D(tex,vT); if(t.a<.02) discard;
            vec2 e=vec2(1.6/1024.); float ce=1.-min(min(texture2D(tex,vT+vec2(e.x,0.)).a,texture2D(tex,vT-vec2(e.x,0.)).a),min(texture2D(tex,vT+vec2(0.,e.y)).a,texture2D(tex,vT-vec2(0.,e.y)).a));
            float ie=1.-smoothstep(.56,.8,m);
            vec3 n=normalize(vN); vec3 c=t.rgb*1.15*(max(dot(n,sun),0.)*.9+.3);
            float pul=.5+.5*sin(time*3.); c=mix(c,hcol,.05+.04*pul); c=mix(c,hcol*1.3,clamp(max(ce*.9,ie*.8),0.,.85));
            if(frost>.01){ float ed=max(ce,ie); c=mix(c,vec3(.93,.98,1.),ed*.45*frost); float sp=fract(sin(dot(floor(vG*vec2(26000.,13000.)),vec2(12.9898,78.233)))*43758.5453); c+=vec3(.9,.97,1.)*frost*ed*step(.9,sp)*(.5+.5*sin(time*4.+sp*40.)); }
            gl_FragColor=vec4(c,lift*t.a*hi*a); }`;
      let hiBusy = 0, hiT = 0;
      function hiUpdate(g, cp, ts, dt){
        const want = zoom > (TQ === '2k' ? 1.2 : 1.6) ? 1 : 0; U.hi.value += (want - U.hi.value) * Math.min(1, dt * 5); hiG.visible = U.hi.value > .01;
        if (!want || ts - hiT < 250) return; hiT = ts;
        const vis = [];
        hiTiles.forEach(P => { const v = P.c.clone().applyEuler(g); const f = v.dot(cp.clone().sub(v).normalize());
          if (f < -.05) return; const p = v.clone().project(S.cam); if (Math.abs(p.x) > 1.6 || Math.abs(p.y) > 1.6) return;
          P.seen = ts; vis.push([p.x * p.x + p.y * p.y, P]); });
        vis.sort((x, y) => x[0] - y[0]);
        for (const [, P] of vis){ if (hiBusy >= 4) break; if (P.st) continue; P.st = 1; hiBusy++;
          hiTL.load(HM.pre + P.tx + '_' + P.ty + '.webp?v=20', t => { hiBusy--; t.anisotropy = hiAni; if (P.st !== 1){ t.dispose(); return; }
            P.m = hiMesh(P, t); hiG.add(P.m); hiG.add(P.m.userData.up); P.st = 2; }, undefined, () => { hiBusy--; P.st = 0; }); }
        const live = hiTiles.filter(P => P.st === 2); if (live.length > hiMax){ live.sort((x, y) => x.seen - y.seen);
          for (const P of live.slice(0, live.length - hiMax)){ if (P.seen === ts) break; hiG.remove(P.m); hiG.remove(P.m.userData.up); P.m.userData.up.material.dispose(); P.m.material.uniforms.tex.value.dispose(); P.m.material.dispose(); P.m.geometry.dispose(); P.m = null; P.st = 0; } } }

      const lbls = REG.map(([k, n, c]) => { const e = document.createElement('div'); e.className = 'glb'; e.textContent = n; e.style.setProperty('--rc', c); LB.appendChild(e); return e; });
      // метки боссов (всегда на глобусе): данные из regiondata.<регион>.tabs.bosses → метаданные pin/pic
      const PL = document.createElement('div'); PL.className = 'gpins'; GV.appendChild(PL);
      const pins = [];
      REG.forEach(([k, , c], ri) => { const B = (RD()[k] && RD()[k].tabs && RD()[k].tabs.bosses) || [];
        B.forEach((x, bi) => { const m = x[x.length - 1]; if (!m || !m.pin) return;
          const e = document.createElement('button'); e.type = 'button'; e.className = 'gpin'; e.style.setProperty('--rc', c);
          e.innerHTML = `<img src="${m.pic}" alt="" draggable="false"><span class="gpn">${x[0]}</span>`; e.setAttribute('aria-label', x[0]);
          e.addEventListener('pointerdown', ev => ev.stopPropagation());
          e.addEventListener('click', ev => { ev.stopPropagation();
            if (!matchMedia('(hover:hover)').matches && !e.classList.contains('tap')){ pins.forEach(p => p.e.classList.remove('tap')); e.classList.add('tap'); return; }
            bossGo(pins.indexOf(P)); });
          const P = {e, k, ri, bi, lo: m.pin[0], la: m.pin[1]}; pins.push(P); PL.appendChild(e); }); });
      S = {T, ren, scene, cam, earth, clouds, atm, lift, walls, aur, hiG, hiUpdate, U, lbls, pins, rid: () => RID, ray: new T.Raycaster(), w: 0, h: 0};
      let fired = false; const go = () => { if (fired) return; fired = true; cb(true); };
      mgr.onLoad = go; mgr.onError = () => {}; setTimeout(go, 15000);
    }

    function size(){ if (!S) return; const w = GV.clientWidth, h = GV.clientHeight; if (!w || !h) return;
      if (w !== S.w || h !== S.h){ S.w = w; S.h = h; S.ren.setSize(w, h, false); S.cam.aspect = w / h; S.cam.updateProjectionMatrix(); stars(); } }
    const dist = () => Math.max(4.6, 4.5 / (S.cam.aspect || 1)) / 1.2 / zoom;
    const eio = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    function frame(ts){
      raf = requestAnimationFrame(frame);
      if (MOB && !fly){   // телефон: плашка открыта — глобус стоит; просто вращается сам — 30 кадров/с
        if (!document.getElementById('rpanel').hidden){ last = ts; return; }
        if (!drag && !pinch && Math.abs(vl) + Math.abs(vt) < .02 && ts - lastR < 30) return; }
      lastR = ts;
      const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; size(); if (!S.w) return;
      const U = S.U; U.time.value = ts / 1000;
      if (fly){ const k = Math.min(1, (ts - fly.t0) / fly.dur), e = eio(k);
        let dl = fly.lon - fly.l0; dl = Math.atan2(Math.sin(dl), Math.cos(dl));
        lon = fly.l0 + dl * e; lat = fly.a0 + (fly.lat - fly.a0) * e; zoom = fly.z0 + (fly.zoom - fly.z0) * e;
        if (k >= 1){ const f = fly.then; fly = null; f && f(); } }
      else if (!drag){ lon += vl * dt; lat += vt * dt; vl *= Math.pow(.04, dt); vt *= Math.pow(.04, dt);
        idle += dt; if (idle > 4 && !hover && !flown) lon += .05 * dt * Math.min(1, (idle - 4) / 2); }
      lat = Math.max(-1.2, Math.min(1.25, lat));
      liftV += ((hover ? 1 : 0) - liftV) * Math.min(1, dt * 12); U.lift.value = liftV; U.aur.value = hover === 7 ? liftV : 0; U.frost.value = hover === 7 ? 1 : 0; S.walls.visible = false;   // стенки убраны: «летящий остров» (тень + фокус)
      const g = new S.T.Euler(lat, -lon, 0, 'XYZ'); [S.earth, S.clouds, S.lift, S.walls, S.aur, S.hiG].forEach(m => m.rotation.copy(g));
      S.cam.position.set(0, 0, dist()); S.cam.lookAt(0, 0, 0);
      S.hiUpdate(g, S.cam.position, ts, dt);
      S.ren.render(S.scene, S.cam);
      const cp = S.cam.position;
      S.lbls.forEach((e, i) => { const [lo, la] = RPOS[i];
        const v = new S.T.Vector3(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)).applyEuler(g);
        const face = v.dot(cp.clone().sub(v).normalize()); const p = v.clone().project(S.cam);
        e.style.transform = `translate(${(p.x + 1) / 2 * S.w}px,${(1 - p.y) / 2 * S.h}px) translate(-50%,-50%)`;
        e.style.opacity = face > .2 && !flown ? 1 : 0; e.classList.toggle('hot', hover === i + 1); });
      const far = zoom < 1.3, big = zoom >= 2, sz = big ? Math.min(52, 34 + (zoom - 2) * 14) : 12;   // далеко — нет меток, средне — точки, близко — иконки
      S.pins.forEach(P => { const up = hover === P.ri + 1 ? 1 + 0.035 * liftV : 1.002;
        const v = new S.T.Vector3(Math.cos(P.la) * Math.sin(P.lo), Math.sin(P.la), Math.cos(P.la) * Math.cos(P.lo)).multiplyScalar(up).applyEuler(g);
        const face = v.clone().normalize().dot(cp.clone().sub(v).normalize()), p = v.clone().project(S.cam), vis = face > .15;
        P.e.style.transform = `translate(${(p.x + 1) / 2 * S.w}px,${(1 - p.y) / 2 * S.h}px) translate(-50%,-50%)`;
        P.e.style.setProperty('--s', sz + 'px'); P.e.classList.toggle('big', big); P.e.classList.toggle('off', !vis || (far && !P.e.classList.contains('focus'))); });
    }
    function start(){ if (!raf){ last = 0; raf = requestAnimationFrame(frame); } }
    function stop(){ cancelAnimationFrame(raf); raf = 0; }

    // выбор региона лучом → id 1..8 (0 — море)
    function pick(cx, cy){ const R = S && S.rid(); if (!R) return 0; const r = GV.getBoundingClientRect();
      const m = new S.T.Vector2((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      S.ray.setFromCamera(m, S.cam); const hit = S.ray.intersectObject(S.earth)[0]; if (!hit || !hit.uv) return 0;
      const x = Math.min(R.w - 1, Math.floor(hit.uv.x * R.w)), y = Math.min(R.h - 1, Math.floor((1 - hit.uv.y) * R.h));
      return Math.round(R.d[(y * R.w + x) * 4] / 30); }
    // рамка региона в uv (для белой стенки — чтобы шейдер не считал весь шар)
    function rbox(id){ const R = S.rid(); if (!R) return [0, 0, 1, 1];
      if (!S.bb){ const b = []; for (let i = 0; i <= 8; i++) b.push([1e9, 1e9, -1, -1]);
        for (let y = 0; y < R.h; y++) for (let x = 0; x < R.w; x++){ const v = Math.round(R.d[(y * R.w + x) * 4] / 30);
          if (v > 0 && v <= 8){ const q = b[v]; if (x < q[0]) q[0] = x; if (y < q[1]) q[1] = y; if (x > q[2]) q[2] = x; if (y > q[3]) q[3] = y; } }
        S.bb = b; }
      const q = S.bb[id], m = 12; return q[2] < 0 ? [0, 0, 1, 1] : [(q[0] - m) / R.w, 1 - (q[3] + 1 + m) / R.h, (q[2] + 1 + m) / R.w, 1 - (q[1] - m) / R.h]; }
    // гладкая маска наведённого региона (вместо пиксельной grid.png): вырезка по рамке региона, ×3 с размытием, линейная фильтрация
    const RMC = {};
    function rmask(id, bx){ if (RMC[id]) return RMC[id]; const R = S.rid(); if (!R) return null;
      const x0 = Math.max(0, Math.floor(bx[0] * R.w)), x1 = Math.min(R.w, Math.ceil(bx[2] * R.w)), y0 = Math.max(0, Math.floor((1 - bx[3]) * R.h)), y1 = Math.min(R.h, Math.ceil((1 - bx[1]) * R.h));
      const w = x1 - x0, h = y1 - y0; if (w < 2 || h < 2) return null;
      const a = document.createElement('canvas'); a.width = w; a.height = h; const ax = a.getContext('2d'), im = ax.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ const v = Math.round(R.d[((y0 + y) * R.w + x0 + x) * 4] / 30) === id ? 255 : 0, k = (y * w + x) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = v; im.data[k + 3] = 255; }
      ax.putImageData(im, 0, 0);
      const K = 3, c = document.createElement('canvas'); c.width = w * K; c.height = h * K; const cx = c.getContext('2d');
      cx.imageSmoothingEnabled = true; cx.filter = 'blur(' + (K * .9) + 'px)'; cx.drawImage(a, 0, 0, w * K, h * K);
      const t = new S.T.CanvasTexture(c); t.minFilter = t.magFilter = S.T.LinearFilter; t.generateMipmaps = false;
      // рамка точно по вырезанным пикселям
      bx[0] = x0 / R.w; bx[2] = x1 / R.w; bx[1] = 1 - y1 / R.h; bx[3] = 1 - y0 / R.h; RMC[id] = t; RMC[id].bx = bx.slice(); return t; }
    function setHover(id, cx, cy){
      if (id !== hover){ hover = id; liftV = 0; if (id){ const [k, , c] = REG[id - 1], act = !!RD()[k]; S.U.hover.value = id; S.U.crisp.value = CRISP.has(id) ? 1 : 0; const t = rmask(id, rbox(id)); S.U.rm.value = t; S.U.box.value.set(...(t ? t.bx : rbox(id))); S.U.hcol.value.set(act ? c : '#9aa3b8'); } }
      GV.style.cursor = drag ? 'grabbing' : (id && RD()[REG[id - 1][0]] ? 'pointer' : 'grab');
      if (id && !RD()[REG[id - 1][0]]){ const r = GV.getBoundingClientRect(); TIP.textContent = REG[id - 1][1] + ' — скоро';
        TIP.style.transform = `translate(${cx - r.left + 14}px,${cy - r.top + 16}px)`; TIP.classList.add('on'); } else TIP.classList.remove('on'); }
    function go(id){ const [k] = REG[id - 1]; if (!RD()[k]) return;
      window.rpSnd && window.rpSnd('sfx_open.mp3'); flown = true; TIP.classList.remove('on');
      const [lo, la] = RPOS[id - 1]; fly = {l0: lon, a0: lat, z0: zoom, lon: lo, lat: Math.max(-1, Math.min(1, la)), zoom: 2.1, t0: performance.now(), dur: 850,
        then: () => window.rpOpen && window.rpOpen(k, true)}; }
    // панель закрыли — камера отлетает назад
    new MutationObserver(() => { const P = document.getElementById('rpanel'); if (on && P.hidden && pend != null && pend >= 0){ const n = pend; pend = null; flown = false; focusPin(n); return; } pend = null; if (on && flown && P.hidden){ flown = false; hover = 0; S.U.hover.value = 0;
      fly = {l0: lon, a0: lat, z0: zoom, lon: lon, lat: lat, zoom: 1, t0: performance.now(), dur: 700}; idle = 0; } })
      .observe(document.getElementById('rpanel'), {attributes: true, attributeFilter: ['hidden']});

    // управление: тянуть — вращать, колесо/щипок — масштаб, клик — регион (на телефоне: первый тап подсвечивает)
    const pts = new Map(); let drag = false, st = null, moved = 0, pinch = null;
    const Z = z => Math.max(.75, Math.min(3, z));
    GV.addEventListener('pointerdown', e => { if (!S || fly) return; pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; idle = 0; vl = vt = 0;
      st = {x: e.clientX, y: e.clientY, lon, lat, t: performance.now()};
      if (pts.size === 2){ const [a, b] = [...pts.values()]; pinch = {d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: zoom}; } });
    GV.addEventListener('pointermove', e => { if (!S) return; idle = 0;
      if (!pts.has(e.pointerId)){ if (e.pointerType === 'mouse' && !fly && !flown) setHover(pick(e.clientX, e.clientY), e.clientX, e.clientY); return; }
      const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pinch && pts.size === 2){ const [a, b] = [...pts.values()]; zoom = Z(pinch.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d); moved = 99; return; }
      const dx = e.clientX - st.x, dy = e.clientY - st.y; moved = Math.max(moved, Math.hypot(dx, dy));
      if (moved > 5){ if (!drag){ drag = true; try { GV.setPointerCapture(e.pointerId); } catch(_){} setHover(0); }
        const k = 2.4 / (S.h * zoom); lon = st.lon - dx * k; lat = st.lat + dy * k;
        const now = performance.now(), ddt = Math.max(.008, (now - (st.pt || st.t)) / 1000); vl = -(e.clientX - prev[0]) * k / ddt; vt = (e.clientY - prev[1]) * k / ddt; st.pt = now; } });
    const up = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
      if (drag){ drag = false; if (performance.now() - (st.pt || 0) > 90) vl = vt = 0; GV.style.cursor = 'grab'; return; }
      if (moved > 5 || e.type === 'pointercancel' || fly || flown) return;
      const id = pick(e.clientX, e.clientY);
      if (e.pointerType !== 'mouse' && id !== hover){ setHover(id, e.clientX, e.clientY); return; }
      S.pins.forEach(p => p.e.classList.remove('tap')); if (id) go(id); else setHover(0); };
    GV.addEventListener('pointerup', up); GV.addEventListener('pointercancel', up);
    GV.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !drag) setHover(0); });
    GV.addEventListener('wheel', e => { e.preventDefault(); if (fly || flown) return; idle = 0; zoom = Z(zoom * Math.exp(-e.deltaY * .0015)); }, {passive: false});
    box.querySelector('.tmzoom').addEventListener('click', e => { if (!on) return; const b = e.target.closest('button[data-z]'); if (!b || fly || flown) return; idle = 0;
      const k = b.dataset.z; fly = {l0: lon, a0: lat, z0: zoom, lon: k === 'reset' ? 0 : lon, lat: k === 'reset' ? .35 : lat, zoom: k === 'reset' ? 1 : Z(zoom * (k === 'in' ? 1.5 : 1 / 1.5)), t0: performance.now(), dur: 450}; });

    // клик по метке босса: подлетаем и открываем плашку региона на слайде этого босса
    function bossGo(n){ const P = S && S.pins[n]; if (!P || fly) return; const k = P.k; if (!RD()[k]) return;
      window.rpSnd && window.rpSnd('sfx_open.mp3'); flown = true; TIP.classList.remove('on'); P.e.classList.remove('tap');
      fly = {l0: lon, a0: lat, z0: zoom, lon: P.lo, lat: Math.max(-1, Math.min(1, P.la)), zoom: Math.max(zoom, 2.4), t0: performance.now(), dur: 850,
        then: () => { window.rpOpen && window.rpOpen(k, true); window.rpShow && window.rpShow('bosses', P.bi); }}; }
    // кнопка «На глобусе» на слайде: после закрытия плашки летим к метке и подсвечиваем её
    let pend = null;
    window.gBossFocus = bi => { const R = document.getElementById('rpanel'), k = R && R.dataset.region; pend = S ? S.pins.findIndex(p => p.k === k && p.bi === bi) : -1; };
    function focusPin(n){ const P = S.pins[n]; if (!P) return; hover = 0; S.U.hover.value = 0; idle = 0;
      fly = {l0: lon, a0: lat, z0: zoom, lon: P.lo, lat: Math.max(-1, Math.min(1, P.la)), zoom: 2.6, t0: performance.now(), dur: 900,
        then: () => { S.pins.forEach(p => p.e.classList.remove('focus', 'tap')); P.e.classList.add('focus', 'tap'); clearTimeout(focusPin.t);
          focusPin.t = setTimeout(() => P.e.classList.remove('focus', 'tap'), 6000); }}; }
    // переключение режимов (под экраном загрузки)
    function setMode(g, done){
      if (!g){ on = false; window.__globeOn = false; stop(); MAPV.classList.remove('globe'); MODE.textContent = '🌐 Глобус'; MODE.setAttribute('aria-label', 'Показать глобус');
        HINT.textContent = HINT0; setHover && S && setHover(0); done && done(); return; }
      loadThree(ok => { if (!ok || !window.THREE){ done && done(); return; }
        const show = () => { on = true; window.__globeOn = true; MAPV.classList.add('globe'); MODE.textContent = '🗺 Карта'; MODE.setAttribute('aria-label', 'Показать плоскую карту');
          HINT.textContent = 'Выбери регион · тяни — вращать, колесо — масштаб'; lon = 0.4644; lat = -0.0763; zoom = 1; vl = vt = 0; fly = null; flown = false; hover = 0; idle = 0;
          S.U.hover.value = 0; S.w = 0; start(); done && done(); };
        if (S) show(); else { try { init(ok2 => show()); } catch(err){ done && done(); } } }); }
    MODE.addEventListener('click', () => { window.rpSnd && window.rpSnd('sfx_btn.mp3');
      const to = !on; (window.mapSwitchLoad || ((l, w) => w(() => {})))(to ? 'Загрузка глобуса…' : 'Загрузка карты…', done => setMode(to, done)); });
    // плоской карты больше нет: в разделе «Карта» сразу глобус; ушли с карты — глобус останавливаем
    let want = false;
    const sync = () => { const m = document.documentElement.classList.contains('v-map');
      if (m && !on && !want){ want = true; setMode(true, () => { want = false; }); }
      else if (!m && on) setMode(false); };
    new MutationObserver(sync).observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
    sync();
    addEventListener('resize', () => { if (S) S.w = 0; });
  })();

  // ===== Экран загрузки карты (как в Геншине) =====
  (function loader(){
    const root = document.documentElement, FL = document.getElementById('wflash');
    const ELS = [['pyro','#FF7B5C'],['hydro','#4FD3F7'],['anemo','#6FE3C1'],['electro','#C58CFF'],['dendro','#9BDB4E'],['cryo','#A8EEF5'],['geo','#F5C84C']];
    document.querySelectorAll('.elrow').forEach(r => r.innerHTML = ELS.map(([k,c]) => `<span class="eli" style="--ec:${c}"><img class="g" src="el_${k}.webp" alt=""><img class="c" src="el_${k}.webp" alt=""></span>`).join(''));
    function setRow(row, k){ { const pc = row.parentNode && row.parentNode.querySelector('.pct'); if (pc) pc.textContent = (pc.dataset.t || 'Загрузка…') + ' ' + Math.round(k * 100) + '%'; }
      row.querySelectorAll('.eli').forEach((e,i)=>{ const f = Math.max(0, Math.min(1, k*ELS.length - i));
      e.style.setProperty('--f', (f*100).toFixed(1)+'%'); if (f >= 1) e.classList.add('lit'); else e.classList.remove('lit'); }); }
    const ease = k => k<.5 ? 2*k*k : 1-Math.pow(-2*k+2,2)/2;
    const ML = document.getElementById('mload'), MROW = ML.querySelector('.elrow'), MV2 = document.getElementById('mlvid');

    // пришли с главной: белая вспышка тает (класс fromwhite ставится ещё в <head>)
    FL.addEventListener('animationend', e => { if (e.animationName === 'wFlashIn') root.classList.remove('fromwhite'); });
    setTimeout(() => root.classList.remove('fromwhite'), 1500);
    // пришли с экрана загрузки главной: он уже дошёл до 100%. Здесь тот же кадр стоит на 100% (видео с того же места)
    // и растворяется, как только глобус готов
    let FROM = null; try { FROM = JSON.parse(sessionStorage.getItem('hv_fromload') || 'null'); sessionStorage.removeItem('hv_fromload'); } catch(e){}
    if (FROM && Date.now() - FROM.at < 30000){
      // стихии продолжают «дышать» (не меньше 1,5 с и пока глобус не готов) → «Добро пожаловать в Тейват» → вжух, белая вспышка → глобус
      const D = ML.querySelector('.done'), D0 = D.textContent;
      D.textContent = 'Загрузка завершена, пожалуйста подождите';
      ML.classList.add('on', 'hold'); setRow(MROW, 1); MROW.classList.add('breathe');
      const seek = () => { try { const d = MV2.duration || 0; if (d) MV2.currentTime = (FROM.t + (Date.now() - FROM.at) / 1000) % d; } catch(e){} MV2.play().catch(()=>{}); };
      MV2.readyState >= 1 ? seek() : MV2.addEventListener('loadedmetadata', seek, {once:true});
      const t0 = performance.now();
      (function wait(){ const dt = performance.now() - t0;
        if (dt < 1500 || (!window.__globeOn && dt < 15000)) return setTimeout(wait, 150);
        D.classList.add('swap'); setTimeout(() => { D.textContent = 'Добро пожаловать в Тейват'; D.classList.remove('swap'); }, 300);
        setTimeout(() => {
          const v = window.gMusic ? window.gMusic.sfxVol() : .5;
          if (v > 0){ const w = new Audio('sfx_whoosh.mp3'); w.volume = v; w.play().catch(()=>{}); }   // вжух (без «буль-буль»)
          FL.classList.remove('go'); void FL.offsetWidth; FL.classList.add('go');
          setTimeout(() => { ML.classList.add('cut'); ML.classList.remove('on', 'hold'); MROW.classList.remove('breathe'); MV2.pause(); D.textContent = D0;   // под полностью белым
            setTimeout(() => ML.classList.remove('cut'), 100); }, 520);
          setTimeout(() => FL.classList.remove('go'), 1400);
        }, 1800);
      })();
    } else {
    // настоящая загрузка: глобус (three.js и текстуры) и видео экрана загрузки. Полоса идёт не быстрее 2,8 с (как раньше),
    // на медленном интернете ждёт на 90%, пока глобус не догрузится (но не дольше 20 с)
    const waits = [];
    waits.push(new Promise(r => { const t = setInterval(() => { if (window.__globeOn){ clearInterval(t); r(); } }, 200); }));   // глобус готов (текстуры загружены)
    waits.push(new Promise(r => { if (MV2.readyState >= 3) return r(); ['canplay', 'error'].forEach(ev => MV2.addEventListener(ev, r, {once:true})); setTimeout(r, 8000); }));
    let done = 0; waits.forEach(p => p.then(() => done++));   // (прямой заход на карту, по ссылке)
    const hardStop = performance.now() + 20000;
    try { MV2.currentTime = 0; } catch(e){} MV2.play().catch(()=>{});
    delete ML.querySelector('.pct').dataset.t; setRow(MROW, 0); ML.classList.remove('ready'); ML.classList.add('on');
    const t0 = performance.now(), dur = 2800; let shown = 0, prev = t0;
    (function step(ts){ const now = Math.max(prev, ts || performance.now()), all = done >= waits.length || now > hardStop;
      const k = ease(Math.min(1, (now - t0) / dur));
      const target = all ? k : Math.min(k, .9 * (.3 + .7 * done / waits.length));
      shown = Math.max(shown, Math.min(target, shown + (now - prev) / 700)); prev = now;   // догоняет плавно (вся полоса максимум за 0,7 с), без скачков
      setRow(MROW, shown);
      if (shown < 1){ requestAnimationFrame(step); return; }
      ML.classList.add('ready');
      const finish = e => { if (e.type==='keydown' && !['Enter',' ','Escape'].includes(e.key)) return;
        ML.removeEventListener('click', finish); removeEventListener('keydown', finish);
        ML.classList.remove('on'); setTimeout(()=>MV2.pause(), 600); };
      setTimeout(()=>{ ML.addEventListener('click', finish); addEventListener('keydown', finish); }, 150);
    })();

    }
    // переключение карта ⇄ глобус: тот же экран загрузки, закрывается сам
    const MLAB = ML.querySelector('.mlabel');
    window.mapSwitchLoad = function(label, work){
      setRow(MROW, 0); ML.classList.remove('ready'); ML.classList.add('sw', 'on'); MLAB.textContent = label; ML.querySelector('.pct').dataset.t = label.replace(/…$/, '') + '…'; setRow(MROW, 0);
      { const v = window.gMusic ? window.gMusic.sfxVol() : .5;   // влёт + «буль-буль», как при входе в разделы
        if (v > 0){ const w = new Audio('sfx_whoosh.mp3'), u = new Audio('sfx_bubble.mp3'); w.volume = u.volume = v;
          setTimeout(() => { w.play().catch(()=>{}); u.play().catch(()=>{}); }, 90); } }
      try { MV2.currentTime = 0; } catch(e){} MV2.play().catch(()=>{});
      const t0 = performance.now(), dur = 2400; let ok = false;
      setTimeout(() => work(() => { ok = true; }), 550);
      (function step(ts){ const raw = Math.min(1, ((ts||t0)-t0)/dur); setRow(MROW, ease(ok ? raw : Math.min(raw, .9)));
        if (raw < 1 || !ok){ requestAnimationFrame(step); return; }
        setTimeout(() => { ML.classList.remove('on'); setTimeout(() => { ML.classList.remove('sw'); MV2.pause(); }, 600); }, 350);
      })();
    };

    // «На главную»: звук, музыка затихает, белая вспышка, переход на главную
    const HOME_SFX = new Audio('sfx_home.mp3'); HOME_SFX.preload = 'auto';
    let going = false;
    document.getElementById('mapHome').addEventListener('click', () => { if (going) return; going = true;
      const v = window.gMusic ? window.gMusic.sfxVol() : .5;
      if (v > 0){ const a = HOME_SFX.cloneNode(); a.volume = v; a.play().catch(()=>{}); }
      window.gMusic && window.gMusic.leave();
      const go = () => { try { sessionStorage.setItem('hv_fromwhite', '1'); } catch(e){} location.href = './'; };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return go();
      FL.classList.remove('go'); void FL.offsetWidth; FL.classList.add('go'); setTimeout(go, 520); });
    addEventListener('pageshow', e => { if (!e.persisted) return; FL.classList.remove('go'); going = false; window.gMusic && window.gMusic.back(); });
  })();
})();
