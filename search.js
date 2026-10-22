/* Глобальный поиск по сайту: персонажи, оружие, артефакты, словарь. Открывается по Ctrl/Cmd+K, «/» или кнопке «Найти всё».
   Данные берёт из window.HVD (data.js). Карточку открывает на месте (window.openChar/openWeapon/openArtSet из app.js),
   иначе переходит на страницу раздела и открывает там (sessionStorage hv_find, без экрана загрузки). */
(function(){
  'use strict';
  var H = window.HVD; if (!H) return;
  var de = document.documentElement, SEC = de.dataset.sec || '', PAGE = de.dataset.page || 'main';
  var PG = {chars:'characters.html', weapons:'weapons.html', arts:'artifacts.html', dict:'dictionary.html'};
  var LBL = {chars:'Персонаж', weapons:'Оружие', arts:'Артефакты', dict:'Словарь'};
  var TABS = [['all','Всё'],['chars','Персонажи'],['weapons','Оружие'],['arts','Артефакты'],['dict','Словарь']];
  var norm = function(s){ return String(s == null ? '' : s).toLowerCase().replace(/ё/g, 'е'); };
  var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var IDX = null;
  function build(){
    var a = [], i, o, k;
    (H.data || []).forEach(function(c){ a.push({t:'chars', n:c.n, k:norm(c.n), x:norm([c.e, c.w, c.reg].concat(c.f || []).join(' ')), m:[c.e, c.r ? c.r + '★' : '', c.w].filter(Boolean).join(' · '), im:c.img || ''}); });
    var W = (H.weapdata && H.weapdata.weapons) || {};
    Object.keys(W).forEach(function(n){ o = W[n]; a.push({t:'weapons', n:n, k:norm(n), x:norm([o.t, o.pn, o.sub].join(' ')), m:[o.t, o.r ? o.r + '★' : ''].filter(Boolean).join(' · '), im:o.img || ''}); });
    var S = (H.artsdata && H.artsdata.sets) || {};
    Object.keys(S).forEach(function(n){ o = S[n]; a.push({t:'arts', n:n, k:norm(n), x:norm([o.b2, o.b4].join(' ')), m:o.r ? o.r + '★ сет' : 'Сет', im:o.img || ''}); });
    (H.dictdata || []).forEach(function(d){ a.push({t:'dict', n:d[1], k:norm(d[1]), x:norm(d[2]), m:d[0] || '', im:''}); });
    return a;
  }
  var TB = {chars:3, weapons:2, arts:1, dict:0};
  function find(q, tab){
    if (!IDX) IDX = build();
    var toks = norm(q).trim().split(/\s+/).filter(Boolean), out = [];
    if (!toks.length) return out;
    IDX.forEach(function(it){
      if (tab !== 'all' && it.t !== tab) return;
      var sc = 0, ok = true;
      for (var j = 0; j < toks.length && ok; j++){
        var t = toks[j], p = it.k.indexOf(t);
        if (p === 0) sc += 100;
        else if (p > 0 && /[\s\-:«(]/.test(it.k.charAt(p - 1))) sc += 80;
        else if (p > 0) sc += 55;
        else if (it.x.indexOf(t) >= 0) sc += 15;
        else ok = false;
      }
      if (ok) out.push({it:it, sc:sc + TB[it.t] - it.k.length * .01});
    });
    out.sort(function(a, b){ return b.sc - a.sc; });
    return out.slice(0, 60).map(function(r){ return r.it; });
  }
  function hl(name, q){
    var toks = norm(q).trim().split(/\s+/).filter(Boolean), n = norm(name), best = -1, len = 0;
    for (var i = 0; i < toks.length; i++){ var p = n.indexOf(toks[i]); if (p >= 0 && (best < 0 || p < best)){ best = p; len = toks[i].length; } }
    return best < 0 ? esc(name) : esc(name.slice(0, best)) + '<mark>' + esc(name.slice(best, best + len)) + '</mark>' + esc(name.slice(best + len));
  }
  /* недавние */
  var RK = 'hv_srch_recent';
  function recent(){ try { var r = JSON.parse(localStorage.getItem(RK) || '[]'); return Array.isArray(r) ? r : []; } catch(e){ return []; } }
  function remember(it){ try { var r = recent().filter(function(x){ return !(x.t === it.t && x.n === it.n); }); r.unshift({t:it.t, n:it.n}); localStorage.setItem(RK, JSON.stringify(r.slice(0, 6))); } catch(e){} }
  function fromRecent(){ if (!IDX) IDX = build(); return recent().map(function(r){ return IDX.filter(function(it){ return it.t === r.t && it.n === r.n; })[0]; }).filter(Boolean); }

  var box, inp, list, tabsEl, cur = [], act = 0, tab = 'all', lastFocus = null, built = false;
  var SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  function make(){
    if (built) return; built = true;
    box = document.createElement('div'); box.className = 'hvs'; box.id = 'hvs'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Поиск по сайту');
    box.innerHTML = '<div class="hvs-box"><div class="hvs-in">' + SVG + '<input id="hvsq" type="search" placeholder="Персонаж, оружие, артефакт, термин" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Поиск по сайту" aria-controls="hvsl" aria-autocomplete="list"><button type="button" class="hvs-x" aria-label="Закрыть">Esc</button></div>' +
      '<div class="hvs-tabs" role="group" aria-label="Где искать">' + TABS.map(function(t, i){ return '<button type="button" class="hvs-tab" data-t="' + t[0] + '" aria-pressed="' + (i ? 'false' : 'true') + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<ul class="hvs-l" id="hvsl" role="listbox"></ul><div class="hvs-f"><span>↑ ↓ выбрать</span><span>Enter открыть</span><span>Esc закрыть</span></div></div>';
    document.body.appendChild(box);
    inp = box.querySelector('#hvsq'); list = box.querySelector('#hvsl'); tabsEl = box.querySelector('.hvs-tabs');
    inp.addEventListener('input', function(){ act = 0; draw(); });
    box.addEventListener('mousedown', function(e){ if (e.target === box) { e.preventDefault(); close(); } });
    box.querySelector('.hvs-x').addEventListener('click', close);
    tabsEl.addEventListener('click', function(e){ var b = e.target.closest('.hvs-tab'); if (!b) return; tab = b.dataset.t; [].forEach.call(tabsEl.children, function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); act = 0; draw(); inp.focus(); });
    list.addEventListener('click', function(e){ var li = e.target.closest('.hvs-it'); if (li) go(cur[+li.dataset.i]); });
    list.addEventListener('mousemove', function(e){ var li = e.target.closest('.hvs-it'); if (li && +li.dataset.i !== act) setAct(+li.dataset.i, true); });
    inp.addEventListener('keydown', function(e){
      if (e.key === 'ArrowDown'){ e.preventDefault(); setAct(Math.min(cur.length - 1, act + 1)); }
      else if (e.key === 'ArrowUp'){ e.preventDefault(); setAct(Math.max(0, act - 1)); }
      else if (e.key === 'Enter'){ e.preventDefault(); if (cur[act]) go(cur[act]); }
      else if (e.key === 'Tab'){ e.preventDefault(); var i = TABS.map(function(t){ return t[0]; }).indexOf(tab); i = (i + (e.shiftKey ? TABS.length - 1 : 1)) % TABS.length; tabsEl.children[i].click(); }
    });
  }
  function setAct(i, noScroll){
    act = i; var items = list.querySelectorAll('.hvs-it');
    for (var j = 0; j < items.length; j++){ var on = j === i; items[j].setAttribute('aria-selected', on ? 'true' : 'false'); items[j].classList.toggle('on', on); }
    var el = items[i]; if (el){ inp.setAttribute('aria-activedescendant', el.id); if (!noScroll) el.scrollIntoView({block:'nearest'}); }
  }
  function draw(){
    var q = inp.value.trim(), head = '';
    if (!q){ cur = fromRecent(); head = cur.length ? '<li class="hvs-h" role="presentation">Недавние</li>' : ''; }
    else cur = find(q, tab);
    if (!cur.length){
      list.innerHTML = q ? '<li class="hvs-e" role="presentation">Ничего не нашлось. Возможно, ты это придумал, пока крутил баннер.</li>'
        : '<li class="hvs-e" role="presentation">Начни печатать: <i>Фурина</i>, <i>Фавоний</i>, <i>гарант</i>, <i>Лунный</i>…</li>';
      inp.removeAttribute('aria-activedescendant'); return;
    }
    list.innerHTML = head + cur.map(function(it, i){
      return '<li class="hvs-it" role="option" id="hvso' + i + '" data-i="' + i + '" data-t="' + it.t + '">' +
        '<span class="hvs-im">' + (it.im ? '<img src="' + esc(it.im) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' : '') + '</span>' +
        '<span class="hvs-tx"><b>' + hl(it.n, q) + '</b><small>' + esc(it.m) + '</small></span><span class="hvs-ty">' + LBL[it.t] + '</span></li>';
    }).join('');
    setAct(Math.min(act, cur.length - 1), true);
  }
  function open(){
    make(); if (box.classList.contains('on')) { inp.focus(); inp.select(); return; }
    lastFocus = document.activeElement; box.classList.add('on'); de.classList.add('hvs-open'); inp.value = ''; tab = 'all'; act = 0;
    [].forEach.call(tabsEl.children, function(x, i){ x.setAttribute('aria-pressed', i ? 'false' : 'true'); });
    draw(); setTimeout(function(){ inp.focus(); }, 30);
  }
  function close(){
    if (!box || !box.classList.contains('on')) return;
    box.classList.remove('on'); de.classList.remove('hvs-open');
    try { inp.blur(); lastFocus && lastFocus.focus && lastFocus.focus({preventScroll:true}); } catch(e){}
  }
  /* открыть карточку на текущей странице: вернуть true, если получилось (функции из app.js доступны там, где есть нужная карточка) */
  function dictOpen(n){
    var i = document.getElementById('dq'), g = document.getElementById('dgrid'); if (SEC !== 'dict' || !i || !g) return false;
    var all = document.querySelector('#dictv .dcats .chip.all'); if (all && all.getAttribute('aria-pressed') !== 'true') all.click();
    i.value = n; i.dispatchEvent(new Event('input', {bubbles:true}));
    setTimeout(function(){
      var cards = [].slice.call(g.querySelectorAll('.dterm')), key = norm(n);
      var c = cards.filter(function(x){ var h = x.querySelector('h3'); return h && norm(h.textContent).indexOf(key) === 0; })[0] || cards[0]; if (!c) return;
      c.scrollIntoView({block:'center', behavior:'smooth'}); c.classList.remove('hit'); void c.offsetWidth; c.classList.add('hit');
    }, 80);
    return true;
  }
  function tryOpen(it){
    try {
      if (it.t === 'dict') return dictOpen(it.n);
      var f = it.t === 'chars' ? window.openChar : it.t === 'weapons' ? window.openWeapon : window.openArtSet;
      if (typeof f !== 'function') return false;
      return f(it.n, document.activeElement) !== false;
    } catch(e){ return false; }
  }
  function go(it){
    if (!it) return; remember(it);
    var here = SEC || (PAGE === 'map' ? 'map' : 'home');
    close();
    if (here !== 'home'){ setTimeout(function(){ if (!tryOpen(it)) nav(it); }, 40); return; }
    nav(it);
  }
  function nav(it){
    try { sessionStorage.setItem('hv_find', JSON.stringify({t:it.t, n:it.n})); sessionStorage.setItem('hv_noload', '1'); } catch(e){}
    try { window.gMusic && window.gMusic.leave(); } catch(e){}
    location.href = PG[it.t];
  }
  window.hvSearch = {open: open, close: close};

  /* горячие клавиши */
  addEventListener('keydown', function(e){
    var open_ = box && box.classList.contains('on');
    if (open_ && e.key === 'Escape'){ e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.code === 'KeyK' || String(e.key).toLowerCase() === 'k')){ e.preventDefault(); e.stopImmediatePropagation(); open_ ? close() : open(); return; }
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !open_){
      var t = e.target, tag = t && t.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      e.preventDefault(); open();
    }
  }, true);

  /* кнопки */
  function bind(){
    var g = document.getElementById('goSearch'); if (g) g.addEventListener('click', function(){ open(); });
    var nav = document.getElementById('snav');
    if (nav && !nav.querySelector('.hvs-chip')){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'schip hvs-chip'; b.setAttribute('aria-label', 'Найти всё по сайту'); b.title = 'Найти всё (Ctrl+K или /)';
      b.innerHTML = '<span class="si" aria-hidden="true">' + SVG + '</span><span class="sl">Найти всё</span>';
      b.addEventListener('click', open); nav.appendChild(b);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();

  /* пришли с другой страницы: открыть найденную карточку */
  (function pending(){
    var p = null; try { p = JSON.parse(sessionStorage.getItem('hv_find') || 'null'); sessionStorage.removeItem('hv_find'); } catch(e){}
    if (!p || !p.n || p.t !== SEC) return;
    var n = 0; (function t(){ if (tryOpen(p)) return; if (++n < 30) setTimeout(t, 200); })();
  })();
})();
