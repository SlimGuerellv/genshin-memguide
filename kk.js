/* К. · К.: скрытый слот в самом низу сетки персонажей. Внизу страницы экран темнеет, из тени проявляется карточка,
   потом озвучка и текст в такт ей. Карточка не кликабельна. Назад — всё прячется. Файлы: kk.css, av/kk.png, av/kk_voice.mp3, av/kk_hum.mp3 */
(function(){
  const grid=document.getElementById('grid'), SEC=document.documentElement.dataset.sec||'';
  if(!grid || SEC!=='chars') return;   // только отдельная страница «Персонажи» (characters.html); главный экран index.html — меню
  const zone=document.createElement('div'); zone.className='kk-zone'; zone.setAttribute('aria-hidden','true'); grid.after(zone);
  const kk=document.createElement('div'); kk.id='kk'; kk.setAttribute('aria-hidden','true');
  kk.innerHTML='<div class="kk-box" id="kkbox"><div class="kk-glow"></div><div class="kk-card"><img src="av/kk.png?v=1" alt="" draggable="false"></div></div><div class="kk-quote" id="kkq"></div>';
  document.body.appendChild(kk);
  const box=document.getElementById('kkbox');

// текст: каждая буква проявляется по прогрессу (обратимо)
const TEXT='“The world you once knew is but dust, and the wonders you knew but rubble. Though you should have your own world, and your own people — lamenting what is already lost...”';
const SIGN='— К. К.';
const q=document.getElementById('kkq');
const red=new Set(); for(const m of TEXT.matchAll(/dust|rubble|lost/g)) for(let i=m.index;i<m.index+m[0].length;i++) red.add(i);
q.innerHTML=[...TEXT].map((ch,i)=>`<span class="c${red.has(i)?' r':''}">${ch}</span>`).join('')+`<span class="kk-sign">${[...SIGN].map(ch=>`<span class="c r">${ch}</span>`).join('')}</span>`;
const letters=[...q.querySelectorAll('.c')];
let seed=7;const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;
letters.forEach(el=>{ el.style.setProperty('--d',(.25+rnd()*.7).toFixed(2)+'s'); el.style.setProperty('--dl',(-rnd()).toFixed(2)+'s'); el.style.setProperty('--x',(rnd()*1.6).toFixed(2)+'px'); el.style.setProperty('--y',(rnd()*1.6-.8).toFixed(2)+'px'); });
// тайминги слов: Бро отметил на слух начало каждого из 31 слова в kk_voice.mp3 (сек). Конец слова считаем сами.
const MARKS=[0.029,0.346,0.813,1.526,2.735,3.702,4.005,4.373,6.803,7.001,7.143,7.601,9.81,10.259,10.989,12.089,12.383,12.58,12.894,13.541,14.525,14.873,16.404,17.939,18.192,18.479,22.065,24.123,26.495,27.191,27.839];
const WORDS=TEXT.split(' ').filter(t=>t!=='—');
const WT=MARKS.map((on,i)=>{ const next=i+1<MARKS.length?MARKS[i+1]:on+1.2; return [on, Math.min(next-.04, on+.2+.09*WORDS[i].length)]; });
// время появления каждой буквы: растягиваем по длине слова в озвучке
const tokens=TEXT.split(' '); const LT=[]; let w=0, prevOff=0;
tokens.forEach((tok,ti)=>{
  const L=[...tok];
  if(tok==='—'){ LT.push(prevOff); }
  else { const on=WT[w][0], off=Math.max(WT[w][1],on+.1); L.forEach((c,j)=>LT.push(on+(off-on)*j/L.length)); prevOff=off; w++; }
  if(ti<tokens.length-1) LT.push(null);          // пробел
});
for(let i=LT.length-1;i>=0;i--) if(LT[i]===null) LT[i]=LT[i+1]??prevOff;
[...SIGN].forEach((c,j)=>LT.push(prevOff+.6+j*.18));   // подпись — после конца озвучки

const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const ease=t=>t*t*(3-2*t);
// озвучка: текст идёт по времени воспроизведения; если браузер не дал включить звук — по тихому таймеру, звук включится по первому клику/нажатию
const au=new Audio('av/kk_voice.mp3?v=1'); au.preload='auto';
// фоновый гул: зациклен, громкость 3%, плавно нарастает вместе с тенью и затихает при выходе
const hum=new Audio('av/kk_hum.mp3?v=1'); hum.loop=true; hum.preload='auto'; const HUM_VOL=0.03; let humWant=false;
function humUpdate(shade){
  if(shade>0.02){ if(!humWant){ humWant=true; duck(true); } hum.volume=muted()?0:HUM_VOL*shade; if(hum.paused) hum.play().catch(()=>{}); }
  else if(humWant){ humWant=false; duck(false); hum.pause(); try{hum.currentTime=0;}catch(e){} }
}
let entered=false, startT=null, raf=null, t0=0, usingAudio=false, pendingUnlock=false, fallback=false, finished=false;
au.addEventListener('playing',()=>{usingAudio=true;pendingUnlock=false;});
au.addEventListener('pause',()=>{ if(!au.ended) usingAudio=false; });
au.addEventListener('ended',()=>{ finished=true; });
const muted=()=>{ try{ return !!(window.gMusic && window.gMusic.sfxVol && window.gMusic.sfxVol()===0); }catch(e){ return false; } };   // звуки сайта выключены — молчим
const vol=()=> muted() ? 0 : .9;
const duck=on=>{ try{ if(window.gMusic) on ? window.gMusic.hush() : window.gMusic.unhush(); }catch(e){} };   // музыку сайта приглушаем на время сцены
const clock=()=> (finished||au.ended) ? Infinity : usingAudio ? au.currentTime : fallback ? Math.min((performance.now()-t0)/1000, 1e6) : -1;
let glT=null;
const NOISE='#@%&▓░01?!/\\|<>';
const letEls=()=>[...document.querySelectorAll('.kk-quote .c.on')];
const flash=(el,cls,ms)=>{ el.classList.add(cls); setTimeout(()=>el.classList.remove(cls),ms); };
// подмена символов на время: хранит оригинал и надёжно возвращает
function swap(els,fn,ms,cls){
  const run=els.filter(e=>!e.dataset.sw && /\S/.test(e.textContent));
  run.forEach(e=>{ e.dataset.sw=1; e.dataset.o=e.textContent; e.textContent=fn(e); if(cls) e.classList.add(cls); });
  setTimeout(()=>run.forEach(e=>{ e.textContent=e.dataset.o; delete e.dataset.sw; if(cls) e.classList.remove(cls); }),ms);
}
const rndCh=()=>NOISE[Math.floor(Math.random()*NOISE.length)];
const GL=[
  function allNoise(){ swap(letEls(),rndCh,160+Math.random()*160,'g2'); },                                   // весь текст на миг превращается в символы
  function blockout(){ swap(letEls().filter(e=>!e.classList.contains('r')),()=>'▓',280+Math.random()*220); },    // всё закрашено ▓, кроме красных букв
  function split(){ const on=letEls(); for(let i=0;i<Math.min(on.length,2+Math.floor(Math.random()*4));i++) flash(on[Math.floor(Math.random()*on.length)],Math.random()<.5?'g':'g2',90+Math.random()*140); },   // RGB-раскол букв
  function corrupt(){ const on=letEls().filter(e=>/\S/.test(e.textContent)); if(!on.length) return; const i=Math.floor(Math.random()*on.length); swap(on.slice(i,i+3+Math.floor(Math.random()*4)),rndCh,110+Math.random()*120,'g2'); },   // буквы на миг превращаются в мусор
  function stutter(){ const on=letEls(); if(!on.length) return; const i=Math.floor(Math.random()*on.length); on.slice(i,i+5).forEach(e=>flash(e,'st',260)); },   // кусок дёргается туда-сюда
  function rgb(){ const q=document.getElementById('kkq'); flash(q,'rgb',160); },   // весь текст с RGB-расколом
  function dip(){ const q=document.getElementById('kkq'); q.style.visibility='hidden'; setTimeout(()=>q.style.visibility='',70); setTimeout(()=>{q.style.visibility='hidden';setTimeout(()=>q.style.visibility='',50);},160); },   // пропал и вернулся
  function img(){ const im=document.querySelector('.kk-card img'); flash(im,'gl',150); },   // картинка на миг дёргается
  function tear(){ const on=letEls(); if(!on.length) return; const i=Math.floor(Math.random()*on.length); on.slice(i,i+14).forEach(e=>flash(e,'tear',200)); }   // горизонтальный разрыв строки
];
let lastGl=-1;
function glitchLoop(){
  let k; do{ k=Math.floor(Math.random()*GL.length); }while(k===lastGl); lastGl=k;
  try{ GL[k](); }catch(e){}
  glT=setTimeout(glitchLoop,2800+Math.random()*1500);   // примерно раз в 3.5 с
}
function tick(){
  if(!entered) return;
  const t=clock();
  letters.forEach((el,i)=>{ const on=t>=LT[i]; if(on!==el.classList.contains('on')) el.classList.toggle('on',on); });
  raf=requestAnimationFrame(tick);
}
function startVoice(){
  if(!entered) return;
  au.currentTime=0; au.volume=vol(); fallback=false; finished=false;
  au.play().catch(()=>{ usingAudio=false; pendingUnlock=true; fallback=true; t0=performance.now(); });   // не дали автозвук — идём по таймеру
  tick(); clearTimeout(glT); glT=setTimeout(glitchLoop,1200);
}
['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,()=>{ if(humWant && hum.paused) hum.play().catch(()=>{}); if(entered && pendingUnlock){ au.currentTime=Math.max(0,clock()); fallback=false; au.volume=vol(); au.play().catch(()=>{}); } },{passive:true}));
function enter(){            // полностью зашли в тень: сначала карточка, потом озвучка + текст
  entered=true; document.documentElement.classList.add('kk-in'); box.classList.add('show');
  startT=setTimeout(startVoice,2300);
}
function leave(){            // вышли из тени: всё прячется, звук стоп
  entered=false; document.documentElement.classList.remove('kk-in'); clearTimeout(startT); cancelAnimationFrame(raf); clearTimeout(glT); pendingUnlock=false; fallback=false; finished=false;
  au.pause(); try{au.currentTime=0;}catch(e){} usingAudio=false;
  box.classList.remove('show'); letters.forEach(el=>el.classList.remove('on'));
}
function upd(){
  const vis = grid.offsetParent!==null && grid.children.length>0;     // сетка персонажей видна (не другой раздел, не пусто)
  zone.style.display = vis ? '' : 'none';
  const vh=innerHeight, top=zone.getBoundingClientRect().top;
  const p = vis ? clamp((vh-top)/(vh*1.25)) : 0;   // 0 — зона показалась снизу, 1 — полностью в тени
  const shade=ease(clamp(p/.9));
  humUpdate(shade); kk.style.opacity=shade; kk.classList.toggle('on',shade>0.001);
  if(p>=0.99 && !entered) enter(); else if(p<0.95 && entered) leave();
}
addEventListener('scroll',upd,{passive:true});addEventListener('resize',upd);
new MutationObserver(upd).observe(grid,{childList:true});
upd();

})();
