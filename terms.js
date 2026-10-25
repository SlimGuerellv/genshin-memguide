/* ядро поиска терминов словаря в тексте (без DOM): строит алиасы из H.dictdata, находит их в строке */
(function (root) {
  'use strict';
  var L = 'А-Яа-яЁёA-Za-z0-9';
  var END = /(ами|ями|ый|ий|ой|ая|яя|ое|ее|ые|ие|ов|ев|ом|ем|ах|ях|ам|ям|а|я|у|ю|е|ё|и|ы|о|ь|й)$/;
  var ABBR = /^[A-ZА-ЯЁ0-9][A-ZА-ЯЁa-zа-яё0-9]*$/;          // ХП, АТК, CV, AoE, F2P, ВЭ
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function stem(w) { var s = w.replace(END, ''); return s.length >= 3 ? s : w; }
  function isAbbr(a) { return a.length <= 5 && /[A-ZА-ЯЁ]{2}|[0-9]/.test(a) && a === a.toUpperCase() || /^[A-Za-z][A-Za-z0-9]{1,5}$/.test(a) && /[A-Z].*[A-Z]|[0-9]/.test(a); }
  function aliasesOf(term) {
    var out = [];
    String(term).split(/\s*\/\s*/).forEach(function (part) {
      var m = part.match(/^([^(]*)\(([^)]*)\)\s*$/), main = part, inner = '';
      if (m) { main = m[1]; inner = m[2]; }
      out.push(main);
      inner.split(/\s*[,;]\s*/).forEach(function (x) { out.push(x); });
    });
    return out.map(function (a) { return a.replace(/\s+/g, ' ').trim(); }).filter(function (a) {
      if (a.length < 2) return false;
      if (!/^[A-Za-zА-Яа-яЁё0-9\-'’. ★+%]+$/.test(a)) return false;     // убирает «C0–C6», «читать как…»
      if (a.split(' ').length > 3) return false;
      if (/^[0-9\-.%★ ]+$/.test(a)) return false;
      return true;
    });
  }
  /* regex-строка для одного алиаса */
  function patOf(a, exact) {
    if (isAbbr(a)) return { src: esc(a), cs: true };
    var ws = a.split(/[ \-]+/).filter(Boolean);
    return { src: ws.map(function (w) { var st = stem(w); return (exact || st.length <= 3) ? esc(w) : esc(st) + '[' + L + ']{0,3}'; }).join('[\\s\\-]+'), cs: false };
  }
  function build(dict, opt) {
    opt = opt || {};
    var skip = opt.skip || {}, exact = opt.exact || {}, extra = opt.extra || {}, ctx = opt.ctx || null;
    var items = [];
    dict.forEach(function (d, i) {
      var al = aliasesOf(d[1]).concat(extra[d[1]] || []);
      al.forEach(function (a) {
        var k = a.toLowerCase();
        if (skip[k]) return;
        var p = patOf(a, exact[k]);
        items.push({ i: i, a: a, k: k, src: p.src, cs: p.cs, len: a.length });
      });
    });
    items.sort(function (x, y) { return y.len - x.len; });
    var ci = items.filter(function (x) { return !x.cs; }), cs = items.filter(function (x) { return x.cs; });
    function mk(arr, flags) {
      if (!arr.length) return null;
      return new RegExp('(^|[^' + L + '])(' + arr.map(function (x) { return x.src; }).join('|') + ')(?![' + L + '])(?!-[' + L + '])', flags);
    }
    var reCi = mk(ci, 'gi'), reCs = mk(cs, 'g');
    var tests = items.map(function (x) { return { i: x.i, cs: x.cs, a: x.a, re: new RegExp('^(?:' + x.src + ')$', x.cs ? '' : 'i') }; });
    function who(txt) { for (var j = 0; j < tests.length; j++) if (tests[j].re.test(txt)) return tests[j]; return null; }
    /* все совпадения в строке: [{start, end, i, a}] без пересечений, слева направо */
    function find(str) {
      var hits = [];
      [reCi, reCs].forEach(function (re) {
        if (!re) return; re.lastIndex = 0; var m;
        while ((m = re.exec(str))) {
          var s = m.index + m[1].length, t = m[2];
          var w = who(t); if (w && (!ctx || ctx(dict[w.i], str, { start: s, end: s + t.length }))) hits.push({ start: s, end: s + t.length, i: w.i, a: w.a });
          if (m[0].length === 0) re.lastIndex++;
        }
      });
      hits.sort(function (x, y) { return x.start - y.start || y.end - x.end; });
      var res = [], last = -1;
      hits.forEach(function (h) { if (h.start >= last) { res.push(h); last = h.end; } });
      return res;
    }
    return { find: find, items: items };
  }
  var api = { build: build, aliasesOf: aliasesOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HVTermCore = api;
})(typeof window !== 'undefined' ? window : this);

/* ===== Подсказки терминов: наводишь на слово из словаря — всплывает плашка с пояснением =====
   Работает в карточках персонажей/оружия/артефактов, панелях карточки, инструкции по фарму и «Что нового».
   Слова находит HVTermCore (выше) по H.dictdata; подчёркивает только ПЕРВОЕ вхождение каждого термина в окне.
   Исключения (слишком общие слова, ложные срабатывания) — в CFG ниже. Телефон: тап по слову; повторный тап или тап в сторону закрывает. */
(function () {
  'use strict';
  var H = window.HVD, Core = window.HVTermCore;
  if (!H || !H.dictdata || !Core || !window.MutationObserver) return;
  var de = document.documentElement;
  if (de.dataset.sec === 'dict') return;

  var CFG = {
    skip: {'атака':1,'навыки':1,'таланты':1,'сет':1,'защита':1,'зщт':1,'хп':1,'атк':1,'сила атаки':1,'заряжен':1,'синий':1,'судьбы':1,'лега':1,'кристалл':1,'кристаллы':1,'сопротивление':1,'вспышка':1,'звёздный блеск':1,'пыль':1,'звёздная пыль':1,'е':1,'q':1,'артефакты':1,'натлан':1},
    exact: {'пар':1,'сабы':1,'допы':1,'допстаты':1,'сабстаты':1,'хил':1,'дд':1},
    /* «корона» без слова «талант» рядом — это слот артефакта, а не корона талантов */
    ctx: function (d, s, h) { return /^Корон/.test(d[1]) ? /талант|навык|прокач/i.test(s.slice(h.end, h.end + 40)) : true; },
    extra: {'Звёздные реакции (Звёздное рассеивание, Звёздный проводник)':['Звёздного блеска','Звёздные реакции','Звёздных реакциях'],'Саб-ДПС / карманный персонаж':['Саб-ДД']}
  };
  var COL = {'Сленг':'#FF9ACB','Молитвы':'#E9C46A','Валюта':'#6FE3C1','Персонажи':'#F4A261','Прокачка':'#C58CFF','Артефакты':'#FF7B5C','Бой':'#4FD3F7','Реакции':'#9BDB4E'};
  var SCOPES = '#sheet, #spanel, #acard, #acard2, #wcard, .ag-panel, .news-sheet';
  var SKIP = 'a,button,input,textarea,select,script,style,svg,h1,h2,h3,h4,h5,summary,label,.tm-t,.tm-pop,[data-no-tm]';
  var D = H.dictdata, T = Core.build(D, CFG);

  /* ---------- подчёркивание ---------- */
  function wrapNode(node, seen) {
    var txt = node.nodeValue, hits = T.find(txt).filter(function (h) { if (seen[h.i]) return false; seen[h.i] = 1; return true; });
    if (!hits.length) return;
    var frag = document.createDocumentFragment(), pos = 0;
    hits.forEach(function (h) {
      if (h.start > pos) frag.appendChild(document.createTextNode(txt.slice(pos, h.start)));
      var s = document.createElement('span'); s.className = 'tm-t'; s.tabIndex = 0; s.setAttribute('data-tm', h.i); s.textContent = txt.slice(h.start, h.end);
      frag.appendChild(s); pos = h.end;
    });
    if (pos < txt.length) frag.appendChild(document.createTextNode(txt.slice(pos)));
    node.parentNode.replaceChild(frag, node);
  }
  function scanScope(root) {
    var seen = {}, i;
    [].forEach.call(root.querySelectorAll('.tm-t'), function (s) { seen[s.getAttribute('data-tm')] = 1; });
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    while ((n = w.nextNode())) {
      if (n.nodeValue.length < 3 || !/[А-Яа-яЁёA-Za-z]/.test(n.nodeValue)) continue;
      var p = n.parentNode; if (!p || (p.closest && p.closest(SKIP))) continue;
      nodes.push(n);
    }
    for (i = 0; i < nodes.length; i++) wrapNode(nodes[i], seen);
  }
  var obs, timer = 0;
  function scanAll() {
    timer = 0; obs.disconnect();
    try { [].forEach.call(document.querySelectorAll(SCOPES), scanScope); } catch (e) {}
    obs.observe(document.body, {childList: true, subtree: true});
  }
  function inScope(n) { var el = n && n.nodeType === 1 ? n : n && n.parentElement; return !!(el && (el.closest(SCOPES) || (el.querySelector && el.querySelector(SCOPES)))); }
  obs = new MutationObserver(function (recs) {
    if (timer) return;
    for (var i = 0; i < recs.length; i++) {
      var r = recs[i], hit = inScope(r.target);
      for (var j = 0; !hit && j < r.addedNodes.length; j++) hit = inScope(r.addedNodes[j]);
      if (hit) { timer = setTimeout(scanAll, 60); return; }
    }
  });

  /* ---------- плашка ---------- */
  var pop = null, cur = null, showT = 0, hideT = 0, pinned = false;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function short(s, max) {
    s = String(s).replace(/\s+/g, ' ').trim(); if (s.length <= max) return s;
    var cut = s.slice(0, max), k = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
    if (k > max * 0.5) return cut.slice(0, k + 1) + ' …';
    k = cut.lastIndexOf(' '); return cut.slice(0, k > 0 ? k : max) + '…';
  }
  function ensure() {
    if (pop) return pop;
    pop = document.createElement('div'); pop.className = 'tm-pop'; pop.id = 'tmPop'; pop.setAttribute('role', 'tooltip'); pop.hidden = true;
    pop.addEventListener('pointerenter', function () { clearTimeout(hideT); });
    pop.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !pinned) schedHide(); });
    pop.addEventListener('click', function (e) { var a = e.target.closest('.tm-go'); if (!a) return; e.preventDefault(); e.stopPropagation(); goDict(+a.getAttribute('data-i')); });
    document.body.appendChild(pop); return pop;
  }
  function goDict(i) {
    var d = D[i]; if (!d) return; hide();
    try { sessionStorage.setItem('hv_find', JSON.stringify({t: 'dict', n: d[1]})); sessionStorage.setItem('hv_noload', '1'); } catch (e) {}
    try { window.gMusic && window.gMusic.leave(); } catch (e) {}
    location.href = 'dictionary.html';
  }
  function title(t) { return String(t).split(/\s*\/\s*/)[0].replace(/\s*\(.*$/, '').trim() || t; }
  function fill(i) {
    var d = D[i], desc = short(d[2], 260), ex = desc.length <= 170 && d[3] && d[3].length <= 150 ? '<q class="tm-e">' + esc(d[3]) + '</q>' : '';
    pop.style.setProperty('--tc', COL[d[0]] || '#E9C46A');
    pop.innerHTML = '<div class="tm-h"><b>' + esc(title(d[1])) + '</b><i>' + esc(d[0]) + '</i></div><p class="tm-d">' + esc(desc) + '</p>' + ex +
      '<a class="tm-go" href="dictionary.html" data-i="' + i + '">В словаре ›</a>';
  }
  function place(el) {
    var r = el.getClientRects()[0] || el.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight, m = 10;
    pop.style.left = '0px'; pop.style.top = '0px'; pop.style.maxWidth = Math.min(340, vw - m * 2) + 'px';
    var pw = pop.offsetWidth, ph = pop.offsetHeight, cx = r.left + r.width / 2;
    var left = Math.max(m, Math.min(cx - pw / 2, vw - pw - m)), up = r.top - ph - 10 >= m || r.bottom + ph + 10 > vh;
    var top = up ? Math.max(m, r.top - ph - 10) : r.bottom + 10;
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
    pop.style.setProperty('--ax', Math.max(14, Math.min(pw - 14, cx - left)) + 'px');
    pop.classList.toggle('below', !up);
  }
  function show(el) {
    clearTimeout(showT); clearTimeout(hideT); ensure();
    if (cur && cur !== el) cur.removeAttribute('aria-describedby');
    cur = el; fill(+el.getAttribute('data-tm')); pop.hidden = false; place(el); el.setAttribute('aria-describedby', 'tmPop');
    requestAnimationFrame(function () { pop.classList.add('on'); });
  }
  function hide() {
    clearTimeout(showT); clearTimeout(hideT); pinned = false;
    if (pop) { pop.classList.remove('on'); pop.hidden = true; }
    if (cur) { cur.removeAttribute('aria-describedby'); cur = null; }
  }
  function schedHide() { clearTimeout(hideT); hideT = setTimeout(hide, 180); }
  function termOf(t) { return t && t.closest ? t.closest('.tm-t') : null; }

  document.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse') return; var el = termOf(e.target); if (!el || pinned) return;
    clearTimeout(hideT); clearTimeout(showT); showT = setTimeout(function () { show(el); }, 140);
  });
  document.addEventListener('pointerout', function (e) {
    if (e.pointerType !== 'mouse') return; var el = termOf(e.target); if (!el || pinned) return;
    clearTimeout(showT); if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.tm-pop')) return; schedHide();
  });
  /* клик/тап по слову: закрепляет плашку (на телефоне это единственный способ), повторный клик закрывает */
  document.addEventListener('click', function (e) {
    var el = termOf(e.target);
    if (el) { e.preventDefault(); e.stopPropagation(); if (cur === el && pinned) { hide(); return; } show(el); pinned = true; return; }
    if (pop && !pop.hidden && !e.target.closest('.tm-pop')) hide();
  }, true);
  document.addEventListener('keydown', function (e) {
    var el = termOf(document.activeElement);
    if (e.key === 'Escape' && pop && !pop.hidden) { hide(); return; }
    if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); if (cur === el && pinned) hide(); else { show(el); pinned = true; } }
  }, true);
  document.addEventListener('focusin', function (e) { var el = termOf(e.target); if (el && !pinned) show(el); });
  document.addEventListener('focusout', function (e) { if (termOf(e.target) && !pinned) schedHide(); });
  window.addEventListener('scroll', function () { if (pop && !pop.hidden) hide(); }, true);
  window.addEventListener('resize', function () { if (pop && !pop.hidden) hide(); });

  function start() { obs.observe(document.body, {childList: true, subtree: true}); scanAll(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.hvTerms = {rescan: scanAll, hide: hide};
})();
