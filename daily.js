// Ежедневный сбор: книги талантов по дням недели и кому они нужны.
// Данные: игровые таблицы (genshin-db). d — дни недели (1=пн ... 6=сб), в воскресенье открыто всё.
window.HVDAILY = {"books":[{"id":"freedom","n":"Свобода","reg":"Мондштадт","pl":"Забытый каньон","d":[1,4]},{"id":"resistance","n":"Борьба","reg":"Мондштадт","pl":"Забытый каньон","d":[2,5]},{"id":"ballad","n":"Поэзия","reg":"Мондштадт","pl":"Забытый каньон","d":[3,6]},{"id":"prosperity","n":"Процветание","reg":"Ли Юэ","pl":"Тайшаньфу","d":[1,4]},{"id":"diligence","n":"Усердие","reg":"Ли Юэ","pl":"Тайшаньфу","d":[2,5]},{"id":"gold","n":"Золото","reg":"Ли Юэ","pl":"Тайшаньфу","d":[3,6]},{"id":"transience","n":"Бренность","reg":"Инадзума","pl":"Фиалковый зал","d":[1,4]},{"id":"elegance","n":"Изящество","reg":"Инадзума","pl":"Фиалковый зал","d":[2,5]},{"id":"light","n":"Свет","reg":"Инадзума","pl":"Фиалковый зал","d":[3,6]},{"id":"admonition","n":"Наставления","reg":"Сумеру","pl":"Башня невежества","d":[1,4]},{"id":"ingenuity","n":"Остроумие","reg":"Сумеру","pl":"Башня невежества","d":[2,5]},{"id":"praxis","n":"Честность","reg":"Сумеру","pl":"Башня невежества","d":[3,6]},{"id":"equity","n":"Беспристрастие","reg":"Фонтейн","pl":"Бледный забытый цветок","d":[1,4]},{"id":"justice","n":"Справедливость","reg":"Фонтейн","pl":"Бледный забытый цветок","d":[2,5]},{"id":"order","n":"Порядок","reg":"Фонтейн","pl":"Бледный забытый цветок","d":[3,6]},{"id":"contention","n":"Соперничество","reg":"Натлан","pl":"Огненные руины","d":[1,4]},{"id":"kindling","n":"Сжигание","reg":"Натлан","pl":"Огненные руины","d":[2,5]},{"id":"conflict","n":"Раздор","reg":"Натлан","pl":"Огненные руины","d":[3,6]},{"id":"charity","n":"Милосердие","reg":"Снежная","pl":"Заброшенные святыни","d":[1,4]},{"id":"fortitude","n":"Стойкость","reg":"Снежная","pl":"Заброшенные святыни","d":[2,5]},{"id":"glory","n":"Слава","reg":"Снежная","pl":"Заброшенные святыни","d":[3,6]},{"id":"moonlight","n":"Лунный свет","reg":"Нод-Край","pl":"Столица непроглядной тьмы","d":[1,4]},{"id":"elysium","n":"Рай","reg":"Нод-Край","pl":"Столица непроглядной тьмы","d":[2,5]},{"id":"vagrancy","n":"Скитание","reg":"Нод-Край","pl":"Столица непроглядной тьмы","d":[3,6]}],"who":{"Райдэн":["light"],"Фремине":["justice"],"Варка":["freedom"],"Ка Мин":["prosperity"],"Фарузан":["admonition"],"Синь Янь":["gold"],"Кэйа":["ballad"],"Нёвиллет":["equity"],"Лань Янь":["diligence"],"Вареса":["conflict"],"Навия":["equity"],"Кли":["freedom"],"Лини":["equity"],"Инеффа":["conflict"],"Нахида":["ingenuity"],"Сетос":["praxis"],"Сянь Юнь":["gold"],"Айно":["elysium"],"Коллеи":["praxis"],"Мидзуки":["transience"],"Сандроне":["vagrancy"],"Чжун Ли":["gold"],"Сайно":["admonition"],"Кавех":["ingenuity"],"Шилонен":["kindling"],"Мика":["ballad"],"Весна":["glory"],"Сиджвин":["equity"],"Эмбер":["freedom"],"Саю":["light"],"Нилу":["praxis"],"Флинс":["vagrancy"],"Алёша":["fortitude"],"Юнь Цзинь":["diligence"],"Син Цю":["gold"],"Лайла":["ingenuity"],"Барбара":["freedom"],"Николь":["elysium"],"Кинич":["kindling"],"Чун Юнь":["diligence"],"Качина":["conflict"],"Шарлотта":["justice"],"Аль-Хайтам":["ingenuity"],"Нин Гуан":["prosperity"],"Дори":["ingenuity"],"Гань Юй":["diligence"],"Янь Фэй":["gold"],"Дилюк":["resistance"],"Нефер":["elysium"],"Коломбина":["moonlight"],"Аяка":["elegance"],"Сяо":["prosperity"],"Лоэн":["resistance"],"Яо Яо":["diligence"],"Яэ Мико":["light"],"Тиори":["light"],"Кокоми":["transience"],"Тарталья":["freedom"],"Мавуика":["contention"],"Дурин":["ballad"],"Эскофье":["justice"],"Водяница":["fortitude"],"Иансан":["contention"],"Розария":["ballad"],"Итто":["elegance"],"Кирара":["transience"],"Эола":["resistance"],"Фурина":["justice"],"Горо":["light"],"Клоринда":["justice"],"Беннет":["resistance"],"Кадзуха":["diligence"],"Муалани":["contention"],"Джинн":["resistance"],"Кэ Цин":["prosperity"],"Ифа":["conflict"],"Странник":["praxis"],"Хэйдзо":["transience"],"Сахароза":["freedom"],"Е Лань":["prosperity"],"Цзы Бай":["gold"],"Часка":["conflict"],"Бэй Доу":["gold"],"Синобу":["elegance"],"Диона":["freedom"],"Аято":["elegance"],"Тома":["transience"],"Рэйзор":["resistance"],"Одетта":["charity"],"Линнея":["vagrancy"],"Шэнь Хэ":["prosperity"],"Эмилия":["order"],"Ноэлль":["resistance"],"Скирк":["contention"],"Бай Чжу":["gold"],"Прюн":["resistance"],"Ху Тао":["diligence"],"Линетт":["order"],"Лаума":["moonlight"],"Оророн":["kindling"],"Тигнари":["admonition"],"Дэхья":["praxis"],"Иллуги":["elysium"],"Кандакия":["admonition"],"Элой":["freedom"],"Шеврёз":["order"],"Ягода":["vagrancy"],"Сара":["elegance"],"Сян Лин":["diligence"],"Арлекино":["order"],"Ёимия":["transience"],"Лиза":["ballad"],"Альбедо":["ballad"],"Мона":["resistance"],"Венти":["ballad"],"Далия":["ballad"],"Фишль":["ballad"],"Ци Ци":["prosperity"],"Ситлали":["kindling"],"Ризли":["order"],"Путешественник":["freedom","prosperity","transience","admonition","equity","contention","charity"]}};
(function(){
  var D = window.HVDAILY, root = document.getElementById('wdaily'); if (!D || !root) return;
  var SERVER_UTC = 1;                       // Европа = UTC+1; смена дня в 04:00 по серверу
  var DAYS = [['Пн',1,'Понедельник'],['Вт',2,'Вторник'],['Ср',3,'Среда'],['Чт',4,'Четверг'],['Пт',5,'Пятница'],['Сб',6,'Суббота'],['Вс',0,'Воскресенье']];
  function gameDay(){ return new Date(Date.now() + (SERVER_UTC - 4) * 3600e3).getUTCDay(); }
  var today = gameDay(), sel = today, mode = null;
  var $ = function(s){ return root.querySelector(s); };
  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]; }); };
  var chars = (window.HVD && window.HVD.data) || [];
  function mine(){ var c = {}; try { c = JSON.parse(localStorage.getItem('hv_coll_v1') || '{}') || {}; } catch(e){} return c; }
  function isMine(c, coll){ return coll[c] === 'got' || coll[c] === 'main'; }
  function render(){
    var coll = mine(), hasMine = chars.some(function(c){ return isMine(c.n, coll); });
    var m = mode || 'all';   // по умолчанию показываем всех
    var days = $('.wd-days'); days.innerHTML = DAYS.map(function(d){
      return '<button type="button" class="wd-day'+(d[1]===sel?' on':'')+(d[1]===today?' now':'')+'" data-d="'+d[1]+'" role="tab" aria-selected="'+(d[1]===sel)+'" title="'+d[2]+(d[1]===today?' (сегодня)':'')+'">'+d[0]+'</button>';
    }).join('');
    root.querySelectorAll('.wd-m').forEach(function(b){ b.classList.toggle('on', b.dataset.m === m); });
    var name = DAYS.filter(function(d){ return d[1]===sel; })[0][2];
    $('.wd-t').innerHTML = (sel===today ? 'Сегодня' : 'Выбран день') + ': <b>' + name + '</b>';
    var body = $('.wd-body'); body.scrollTop = 0;
    if (sel === 0){ body.innerHTML = '<div class="wd-sun"><div class="wd-sun-t">Йо, фармила!</div><div class="wd-sun-s">Сегодня всё открыто — давай за работу</div></div>'; return; }
    var html = '', shown = 0;
    D.books.forEach(function(b){
      if (b.d.indexOf(sel) < 0) return;
      var list = chars.filter(function(c){ var w = D.who[c.n]; return w && w.indexOf(b.id) >= 0 && (m === 'all' || isMine(c.n, coll)); });
      if (!list.length) return; shown++;
      html += '<div class="wd-row"><div class="wd-bk"><b>'+esc(b.n)+'</b><span>'+esc(b.reg)+'</span></div><div class="wd-av">' +
        list.map(function(c){ return '<img src="'+esc(c.img)+'" alt="'+esc(c.n)+'" title="'+esc(c.n)+'" loading="lazy" draggable="false" class="wd-c">'; }).join('') + '</div></div>';
    });
    body.innerHTML = shown ? html : '<div class="wd-empty">Из твоих персонажей сегодня никому ничего не нужно.<br><small>Отметь «Выбил(а)» в разделе «Персонажи» или нажми «Все».</small></div>';
  }
  root.addEventListener('click', function(e){
    var d = e.target.closest('.wd-day'), m = e.target.closest('.wd-m');
    if (d){ sel = +d.dataset.d; render(); }
    else if (m){ mode = m.dataset.m; render(); }
  });
  window.addEventListener('storage', render);
  document.addEventListener('visibilitychange', function(){ if (!document.hidden){ var t = gameDay(); if (t !== today){ if (sel === today) sel = t; today = t; } render(); } });
  render();
})();
