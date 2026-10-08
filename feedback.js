/* Відгуки / баги / ідеї: без акаунта, без картинок, список публічний (Firestore, коллекция "feedback") */
(() => {
  const cfg = {
    apiKey: "AIzaSyCLyGlVTLtZ4rGURm3Ou6RTuOT_0gf5XHk",
    authDomain: "genshin-memguide.firebaseapp.com",
    projectId: "genshin-memguide",
    storageBucket: "genshin-memguide.firebasestorage.app",
    messagingSenderId: "608891395892",
    appId: "1:608891395892:web:79ebb1a1a9db1083534f61"
  };
  const V = '10.12.2', G = `https://www.gstatic.com/firebasejs/${V}/`;
  const TYPES = { review: 'Отзыв', bug: 'Баг', idea: 'Идея' };
  const COOLDOWN = 45000, LSK = 'hv_fb_last', LSN = 'hv_fb_name';
  const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const ls = { get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }, set(k,v){ try { localStorage.setItem(k,v); } catch(e){} } };
  const fmt = ts => { try { return ts ? ts.toDate().toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }) : 'только что'; } catch(e){ return ''; } };

  let F, db, ov, unsub = null, fbPromise = null, type = 'review';

  const btn = document.createElement('button');
  btn.type = 'button'; btn.id = 'fbBtn'; btn.className = 'fb-btn';
  btn.setAttribute('aria-label', 'Отзывы и баги'); btn.title = 'Отзывы и баги';
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg><span>Отзыв / баг</span>';
  document.body.appendChild(btn);

  function loadFb() {
    return fbPromise || (fbPromise = (async () => {
      const [app, f] = await Promise.all([import(G + 'firebase-app.js'), import(G + 'firebase-firestore.js')]);
      F = f;
      const fb = app.getApps().find(a => a.name === 'fb') || app.initializeApp(cfg, 'fb');
      db = f.getFirestore(fb);
    })());
  }

  function build() {
    ov = document.createElement('div');
    ov.className = 'overlay acct-ov fb-ov'; ov.hidden = true;
    ov.innerHTML = `<div class="acct-sheet fb-sheet" role="dialog" aria-modal="true" aria-labelledby="fbTitle">
      <button class="close" type="button" id="fbClose" aria-label="Закрыть">×</button>
      <h2 id="fbTitle">Отзывы и баги</h2>
      <form class="fb-form" novalidate>
        <div class="fb-types" role="radiogroup" aria-label="Тип">
          ${Object.entries(TYPES).map(([k, v]) => `<button type="button" role="radio" class="fb-t" data-t="${k}" aria-checked="${k === type}">${v}</button>`).join('')}
        </div>
        <input class="acct-in fb-name" maxlength="30" placeholder="Имя (необязательно)" autocomplete="nickname" aria-label="Имя">
        <textarea class="fb-text" maxlength="1000" placeholder="Что понравилось, что сломалось или чего не хватает?" aria-label="Текст"></textarea>
        <input class="fb-hp" tabindex="-1" autocomplete="off" aria-hidden="true" name="website">
        <p class="fb-hint"></p>
        <div class="cmt-fr"><small><span class="fb-n">0</span> / 1000</small><button type="submit" class="cmt-send" disabled>Отправить</button></div>
        <p class="acct-msg fb-msg" aria-live="polite"></p>
      </form>
      <h3 class="fb-h3">Последние записи</h3>
      <ul class="cmt-list fb-list" aria-live="polite"><li class="cmt-empty">Загрузка…</li></ul>
    </div>`;
    document.body.appendChild(ov);
    const q = s => ov.querySelector(s);
    const form = q('.fb-form'), ta = q('.fb-text'), sb = q('.cmt-send'), nm = q('.fb-name'), msg = q('.fb-msg'), hint = q('.fb-hint');
    nm.value = ls.get(LSN) || '';
    const setType = t => {
      type = t;
      ov.querySelectorAll('.fb-t').forEach(b => b.setAttribute('aria-checked', b.dataset.t === t));
      hint.textContent = t === 'bug' ? 'Опиши, где это случилось и что ты делал(а) — страница и размер экрана добавятся автоматически.' : '';
      ta.placeholder = t === 'bug' ? 'Что сломалось? Что ты нажимал(а), что ожидал(а) увидеть?' : t === 'idea' ? 'Чего не хватает сайту?' : 'Что понравилось или не понравилось?';
    };
    setType(type);
    ov.querySelector('.fb-types').addEventListener('click', e => { const b = e.target.closest('.fb-t'); if (b) setType(b.dataset.t); });
    ta.addEventListener('input', () => { q('.fb-n').textContent = ta.value.length; sb.disabled = ta.value.trim().length < 3; });
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) form.requestSubmit(); });
    q('#fbClose').addEventListener('click', close);
    ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && !ov.hidden) close(); });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const text = ta.value.trim();
      if (text.length < 3) return;
      if (q('.fb-hp').value) return;                                  // бот
      const wait = COOLDOWN - (Date.now() - (+ls.get(LSK) || 0));
      if (wait > 0) { msg.className = 'acct-msg fb-msg'; msg.textContent = `Подожди ещё ${Math.ceil(wait / 1000)} с перед следующим отправлением.`; return; }
      sb.disabled = true; msg.className = 'acct-msg fb-msg'; msg.textContent = '';
      try {
        await loadFb();
        const name = nm.value.trim().slice(0, 30);
        ls.set(LSN, name);
        const page = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '').slice(0, 40);
        const env = `${innerWidth}x${innerHeight} dpr${devicePixelRatio || 1} ${navigator.userAgent}`.slice(0, 160);
        await F.addDoc(F.collection(db, 'feedback'), { type, text: text.slice(0, 1000), name, page, env, createdAt: F.serverTimestamp() });
        ls.set(LSK, String(Date.now()));
        ta.value = ''; q('.fb-n').textContent = '0';
        msg.className = 'acct-msg ok fb-msg'; msg.textContent = 'Спасибо! Записано.';
      } catch (err) {
        sb.disabled = false; msg.className = 'acct-msg fb-msg';
        msg.textContent = 'Не отправилось: ' + (err.code || err.message || 'ошибка');
      }
    });
  }

  async function open() {
    if (!ov) build();
    ov.hidden = false; document.documentElement.classList.add('fb-open');
    ov.querySelector('.fb-text').focus({ preventScroll: true });
    const list = ov.querySelector('.fb-list');
    try {
      await loadFb();
      if (unsub) return;
      const q = F.query(F.collection(db, 'feedback'), F.orderBy('createdAt', 'desc'), F.limit(50));
      unsub = F.onSnapshot(q, snap => {
        if (snap.empty) { list.innerHTML = '<li class="cmt-empty">Пока пусто. Будь первым!</li>'; return; }
        list.innerHTML = snap.docs.map(d => { const x = d.data(), t = TYPES[x.type] ? x.type : 'review';
          return `<li><div class="cmt-h"><span class="fb-tag fb-tag-${t}">${TYPES[t]}</span><b>${esc(x.name || 'Гость')}</b><time>${esc(fmt(x.createdAt))}</time></div><p class="cmt-t">${esc(x.text || '')}</p></li>`; }).join('');
      }, err => { unsub = null; list.innerHTML = `<li class="cmt-empty">Не удалось загрузить список (${esc(err.code || '')}).</li>`; });
    } catch (e) { list.innerHTML = '<li class="cmt-empty">Не удалось подключиться. Проверь интернет.</li>'; }
  }
  function close() { if (!ov) return; ov.hidden = true; document.documentElement.classList.remove('fb-open'); if (unsub) { unsub(); unsub = null; } btn.focus({ preventScroll: true }); }
  btn.addEventListener('click', open);
})();
