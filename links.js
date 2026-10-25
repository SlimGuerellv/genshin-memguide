/* «Полезные ссылки»: кнопка слева от «Отзыв / баг» + окно со ссылками на внешние ресурсы (открываются в новой вкладке) */
(() => {
  const LINKS = [
    { t: 'Хронология Тейвата', d: 'Интерактивная доска со всей историей мира (Figma)', h: 'figma.com',
      u: 'https://www.figma.com/board/bYuFFCStIPmZhh3bItV2Fz/Хронология-Тейвата?node-id=0-1&p=f&t=4JH0zvvl2fQpmlve-0',
      i: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
    { t: 'Интерактивная карта', d: 'Официальная карта HoYoLAB: сундуки, ресурсы, телепорты', h: 'act.hoyolab.com',
      u: 'https://act.hoyolab.com/ys/app/interactive-map/index.html?lang=ru-ru#/map/2?shown_types=2,3,154,508,174&center=-2243.00,-4783.75&zoom=1.00',
      i: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>' },
    { t: 'Форум HoYoLAB', d: 'Сообщество игроков: новости, арты, обсуждения', h: 'hoyolab.com',
      u: 'https://www.hoyolab.com/home',
      i: '<path d="M4 5h16v11H9l-5 4z"/>' },
    { t: 'Ввести промокод', d: 'Страница активации кодов на награды', h: 'genshin.hoyoverse.com',
      u: 'https://genshin.hoyoverse.com/ru/gift',
      i: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 8v12M3 13h18M12 8c-2-4-6-3-5 0M12 8c2-4 6-3 5 0"/>' }
  ];
  const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';

  const btn = document.createElement('button');
  btn.type = 'button'; btn.id = 'lkBtn'; btn.className = 'fb-btn lk-btn';
  btn.setAttribute('aria-label', 'Полезные ссылки'); btn.title = 'Полезные ссылки'; btn.setAttribute('aria-haspopup', 'dialog');
  btn.innerHTML = ICON + '<span>Полезные ссылки</span>';
  document.body.appendChild(btn);

  // стоит левее «Отзыв / баг» (а если её нет — левее «Что нового» / кнопки входа), на той же высоте
  const vis = el => (el && el.offsetWidth && getComputedStyle(el).display !== 'none') ? el.getBoundingClientRect() : null;
  function place() {
    const r = vis(document.getElementById('fbBtn')) || vis(document.getElementById('newsBtn')) || vis(document.getElementById('acctBtn'));
    if (!r) { btn.style.right = '14px'; return; }
    const small = innerWidth <= 760, h = small ? 40 : r.height;
    btn.style.top = Math.round(r.top + (r.height - h) / 2) + 'px';
    btn.style.right = Math.round(innerWidth - r.left + 10) + 'px';
  }
  const later = () => requestAnimationFrame(place);
  addEventListener('resize', later); addEventListener('load', later);
  [200, 700, 1600].forEach(t => setTimeout(later, t));
  const fb = document.getElementById('fbBtn');
  if (fb && window.MutationObserver) new MutationObserver(later).observe(fb, { attributes: true, attributeFilter: ['style', 'class'] });
  if (window.ResizeObserver) { const ro = new ResizeObserver(later); ['fbBtn', 'newsBtn', 'acctBtn'].forEach(id => { const e = document.getElementById(id); if (e) ro.observe(e); }); }
  place();

  let ov = null, last = null;
  function build() {
    ov = document.createElement('div');
    ov.className = 'overlay acct-ov lk-ov'; ov.hidden = true;
    ov.innerHTML = `<div class="acct-sheet lk-sheet" role="dialog" aria-modal="true" aria-labelledby="lkTitle">
      <button class="close" type="button" id="lkClose" aria-label="Закрыть">×</button>
      <h2 id="lkTitle">Полезные ссылки</h2>
      <p class="lk-sub">Откроется в новой вкладке</p>
      <ul class="lk-list">${LINKS.map(l => `<li><a class="lk-item" href="${esc(l.u)}" target="_blank" rel="noopener noreferrer">
        <span class="lk-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${l.i}</svg></span>
        <span class="lk-tx"><b>${esc(l.t)}</b><small>${esc(l.d)}</small><em>${esc(l.h)}</em></span>
        <span class="lk-go" aria-hidden="true">↗</span></a></li>`).join('')}</ul>
    </div>`;
    document.body.appendChild(ov);
    ov.querySelector('#lkClose').addEventListener('click', close);
    ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && !ov.hidden) close(); });
  }
  function open() {
    if (!ov) build();
    last = document.activeElement;
    ov.hidden = false; document.documentElement.classList.add('lk-open');
    const a = ov.querySelector('.lk-item'); if (a) a.focus({ preventScroll: true });
  }
  function close() {
    if (!ov) return;
    ov.hidden = true; document.documentElement.classList.remove('lk-open');
    if (last && last.focus) { try { last.focus({ preventScroll: true }); } catch (e) {} }
  }
  btn.addEventListener('click', open);
  const gl = document.getElementById('goLinks'); if (gl) gl.addEventListener('click', open);   // телефон, главная: кнопка в меню
})();
