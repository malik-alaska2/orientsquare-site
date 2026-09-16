/* ==========================================================================
   OrientSquare — общее ядро для новых разделов сайта
   Калькуляторы, планы оплаты, акции, подбор, избранное, уведомления, кабинет.
   Никакого бэкенда: данные лежат тут и в data/units.json,
   состояние клиента — в localStorage браузера.

   >>> ВСЕ ЦИФРЫ НИЖЕ — ДЕМО. Замените на реальные, когда будет прайс. <<<
   ========================================================================== */
(function (w) {
  'use strict';

  var CFG = {
    currency: 'USD',

    /* ДЕМО: цена за м² по этажам (одинаково для всех блоков).
       0 — подвал (кладовые), 1..4 — жилые этажи. */
    pricePerM2: { 0: 450, 1: 950, 2: 1020, 3: 1050, 4: 1080 },

    /* ДЕМО: коэффициент блока (если блоки отличаются по цене) */
    blockCoef: { 1: 1.00, 2: 1.00, 3: 1.00, 4: 1.00, 5: 1.00, 6: 1.03 },

    /* ДЕМО: наценка за балкон считается как 30% от цены м² */
    balconyCoef: 0.30,

    /* ДЕМО: условия рассрочки — срок в годах: годовая ставка в % */
    terms: [
      { years: 3,  rate: 0,  minDown: 30 },
      { years: 5,  rate: 6,  minDown: 25 },
      { years: 10, rate: 9,  minDown: 20 }
    ],
    defaultDown: 30,

    /* ДЕМО: аренда $ за м² в месяц + расходы для расчёта ROI */
    rentPerM2: 7.5,
    occupancy: 90,        /* % загрузки в году */
    opexPct: 18,          /* % от арендного дохода на налоги/обслуживание */
    growthPct: 8,         /* ДЕМО: годовой рост стоимости, % */

    /* ДЕМО: срок сдачи */
    delivery: { tr: '2027 4. çeyrek', en: 'Q4 2027' },

    /* Контакты для заявок */
    phone: '+905461997101',
    email: 'info@orientsquare.com'
  };

  /* ---------- ДЕМО: акции ---------- */
  var OFFERS = [
    {
      id: 'launch',
      until: '2026-12-31',
      badge: { tr: '-7%', en: '-7%' },
      title: { tr: '5 ve 6. blokların satış lansmanı', en: 'Sales launch: blocks 5 and 6' },
      text: {
        tr: 'Rezervasyondan sonraki 30 gün içinde peşin ödemede 5 ve 6. blokların tüm dairelerinde %7 indirim.',
        en: '7% off every apartment in blocks 5 and 6 when paid in full within 30 days of booking.'
      },
      blocks: [5, 6],
      kind: 'discount', value: 7
    },
    {
      id: 'zero',
      until: '2026-11-30',
      badge: { tr: '0%', en: '0%' },
      title: { tr: '3 yıl %0 faizli taksit', en: '0% installment for 3 years' },
      text: {
        tr: '%30 peşinat, kalan tutar 36 ay eşit taksitle ve faizsiz.',
        en: '30% down payment, the rest in 36 equal monthly instalments with no interest.'
      },
      blocks: [1, 2, 3, 4, 5, 6],
      kind: 'installment', value: 0
    },
    {
      id: 'storage',
      until: '2026-10-31',
      badge: { tr: 'Hediye', en: 'Gift' },
      title: { tr: 'Depo hediye', en: 'Free storage room' },
      text: {
        tr: '1–4. bloklarda 3 odalı daire alımında bodrumdaki depo ücretsiz verilir.',
        en: 'Buy a 3-room apartment in blocks 1–4 and get a basement storage room for free.'
      },
      blocks: [1, 2, 3, 4],
      kind: 'gift', value: 0
    },
    {
      id: 'corner',
      until: '2026-12-15',
      badge: { tr: '-4%', en: '-4%' },
      title: { tr: '4. katın köşe daireleri', en: 'Corner units on the 4th floor' },
      text: {
        tr: 'Tüm bloklarda üst kat köşe dairelerinde %4 indirim — sınırlı sayıda.',
        en: '4% off top-floor corner apartments in all blocks — limited availability.'
      },
      blocks: [1, 2, 3, 4, 5, 6],
      kind: 'discount', value: 4
    }
  ];

  /* ---------- ДЕМО: ход строительства ---------- */
  var PROGRESS = {
    updated: '2026-09-01',
    blocks: [
      { b: 1, pct: 82, stage: { tr: 'İç imalatlar', en: 'Interior finishing' } },
      { b: 2, pct: 74, stage: { tr: 'Cephe işleri',    en: 'Facade works' } },
      { b: 3, pct: 61, stage: { tr: 'Cephe işleri',    en: 'Facade works' } },
      { b: 4, pct: 48, stage: { tr: 'Duvar ve döşemeler', en: 'Masonry and slabs' } },
      { b: 5, pct: 35, stage: { tr: 'Karkas',             en: 'Structural frame' } },
      { b: 6, pct: 22, stage: { tr: 'Temel ve subasman', en: 'Foundation and basement' } }
    ],
    stages: [
      { key: 'found',  tr: 'Temel',          en: 'Foundation',     done: '2025-06' },
      { key: 'frame',  tr: 'Karkas',             en: 'Structure',      done: '2025-12' },
      { key: 'walls',  tr: 'Duvar ve döşemeler', en: 'Masonry',       done: '2026-05' },
      { key: 'facade', tr: 'Cephe ve pencereler',       en: 'Facade',         done: '2026-09' },
      { key: 'fit',    tr: 'Mekanik ve iç imalatlar', en: 'MEP & finishing', done: '2027-06' },
      { key: 'keys',   tr: 'Teslim ve anahtar',      en: 'Handover',       done: '2027-12' }
    ]
  };

  /* ---------- язык ---------- */
  function lang() { return localStorage.getItem('os_lang') === 'en' ? 'en' : 'tr'; }
  function setLang(l) { localStorage.setItem('os_lang', l === 'en' ? 'en' : 'tr'); }
  function L(o) { return o ? (o[lang()] !== undefined ? o[lang()] : o.tr) : ''; }

  /* ---------- формат ---------- */
  function money(v) {
    var s = Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return '$' + s;
  }
  function num(v, d) {
    d = d === undefined ? 1 : d;
    return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toString().replace('.', ',');
  }
  function pct(v) { return num(v, 1) + '%'; }

  /* ---------- цена ---------- */
  function priceOf(block, floor, area, balcony) {
    var ppm = CFG.pricePerM2[floor];
    if (!ppm) return null;
    var k = CFG.blockCoef[block] || 1;
    var total = area * ppm * k + (balcony || 0) * ppm * k * CFG.balconyCoef;
    return { total: Math.round(total), ppm: Math.round(ppm * k) };
  }

  /* ---------- рассрочка (аннуитет) ---------- */
  function plan(price, downPct, years, ratePct) {
    price = Math.max(0, +price || 0);
    downPct = Math.min(100, Math.max(0, +downPct || 0));
    years = Math.max(1, +years || 1);
    ratePct = Math.max(0, +ratePct || 0);

    var down = price * downPct / 100;
    var body = price - down;
    var n = Math.round(years * 12);
    var i = ratePct / 100 / 12;
    var monthly = i === 0 ? body / n : body * i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1);
    var paid = monthly * n;
    return {
      price: price, down: down, body: body, months: n, rate: ratePct,
      monthly: monthly, paid: paid, total: down + paid, overpay: paid - body
    };
  }

  /* график платежей по месяцам */
  function schedule(p) {
    var rows = [], bal = p.body, i = p.rate / 100 / 12;
    for (var m = 1; m <= p.months; m++) {
      var int = bal * i, prin = p.monthly - int;
      bal = Math.max(0, bal - prin);
      rows.push({ m: m, pay: p.monthly, principal: prin, interest: int, balance: bal });
    }
    return rows;
  }

  /* ---------- инвестиция / ROI ---------- */
  function roi(price, area, rentM2, occ, opex, years, growth) {
    price = +price || 0;
    var monthRent = area * (rentM2 === undefined ? CFG.rentPerM2 : rentM2);
    var gross = monthRent * 12 * ((occ === undefined ? CFG.occupancy : occ) / 100);
    var net = gross * (1 - (opex === undefined ? CFG.opexPct : opex) / 100);
    var yieldPct = price ? net / price * 100 : 0;
    var payback = net ? price / net : 0;
    var g = (growth === undefined ? CFG.growthPct : growth) / 100;
    var future = price * Math.pow(1 + g, years);
    var rentSum = net * years;
    var profit = (future - price) + rentSum;
    return {
      monthRent: monthRent, grossYear: gross, netYear: net,
      yieldPct: yieldPct, payback: payback, future: future,
      rentSum: rentSum, profit: profit, roi: price ? profit / price * 100 : 0
    };
  }

  /* ---------- localStorage ---------- */
  function read(k, d) { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { return JSON.parse(d); } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function favs() { return read('os_favs', '[]'); }
  function favData() { return read('os_favs_data', '{}'); }

  /* просмотренные объекты — основа «похожих вариантов» */
  function pushViewed(item) {
    if (!item || !item.key) return;
    var v = read('os_viewed', '[]').filter(function (x) { return x.key !== item.key; });
    item.ts = Date.now();
    v.unshift(item);
    write('os_viewed', v.slice(0, 24));
  }
  function viewed() { return read('os_viewed', '[]'); }

  /* профиль клиента, собранный из поведения */
  function profile() {
    var v = viewed(), f = favData(), items = [];
    Object.keys(f).forEach(function (k) { items.push(f[k]); });
    v.forEach(function (x) { items.push(x); });
    if (!items.length) return null;
    var areas = [], rooms = {}, blocks = {}, prices = [];
    items.forEach(function (x) {
      if (x.a) areas.push(x.a);
      if (x.r) rooms[x.r] = (rooms[x.r] || 0) + 1;
      var b = x.b_no || (x.page ? +String(x.page).replace(/\D+/g, '') : 0);
      if (b) blocks[b] = (blocks[b] || 0) + 1;
      if (x.price) prices.push(x.price);
    });
    function top(o) {
      var k = null, n = -1;
      Object.keys(o).forEach(function (x) { if (o[x] > n) { n = o[x]; k = +x; } });
      return k;
    }
    var avgA = areas.length ? areas.reduce(function (a, b) { return a + b; }, 0) / areas.length : 0;
    var avgP = prices.length ? prices.reduce(function (a, b) { return a + b; }, 0) / prices.length : 0;
    return {
      count: items.length, avgArea: avgA, avgPrice: avgP,
      rooms: top(rooms), block: top(blocks)
    };
  }

  /* ---------- похожие объекты ----------
     Вес: комнаты 3, цена ±15% — 2, тот же блок 1, близкая площадь 1 */
  function similar(base, pool, limit) {
    limit = limit || 6;
    var bp = base.price || (priceOf(base.block, base.f, base.a, base.b) || {}).total || 0;
    return pool
      .filter(function (u) { return !(u.block === base.block && u.f === base.f && u.n === base.n); })
      .filter(function (u) { return u.k === 'flat'; })
      .map(function (u) {
        var s = 0;
        if (base.r && u.r === base.r) s += 3;
        var up = u.price || (priceOf(u.block, u.f, u.a, u.b) || {}).total || 0;
        if (bp && up && Math.abs(up - bp) / bp <= 0.15) s += 2;
        if (u.block === base.block) s += 1;
        if (base.a && Math.abs(u.a - base.a) / base.a <= 0.12) s += 1;
        u._score = s; u._price = up;
        return u;
      })
      .filter(function (u) { return u._score > 0; })
      .sort(function (a, b) { return b._score - a._score || Math.abs(a.a - base.a) - Math.abs(b.a - base.a); })
      .slice(0, limit);
  }

  /* ---------- каталог квартир (data/units.json) ---------- */
  var _units = null;
  function loadUnits(cb) {
    if (_units) { cb(_units); return; }
    var x = new XMLHttpRequest();
    x.open('GET', 'data/units.json', true);
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      var flat = [];
      try {
        var d = JSON.parse(x.responseText);
        Object.keys(d).forEach(function (b) {
          d[b].floors.forEach(function (fl) {
            fl.units.forEach(function (u) {
              var p = priceOf(+b, fl.f, u.a, u.b);
              flat.push({
                block: +b, f: fl.f, floorTr: fl.tr, floorEn: fl.en, lvl: fl.lvl,
                n: u.n, a: u.a, r: u.r || 0, b: u.b || 0, p: u.p || 0, k: u.k,
                row: u.row, price: p ? p.total : 0, ppm: p ? p.ppm : 0,
                page: 'block-' + b + '.html', hash: fl.f + '-' + u.n
              });
            });
          });
        });
      } catch (e) {}
      _units = flat;
      cb(flat);
    };
    x.send();
  }

  /* ---------- бронь / платежи / документы (демо, localStorage) ---------- */
  function bookings() { return read('os_bookings', '[]'); }
  function book(unit) {
    var b = bookings();
    if (b.some(function (x) { return x.id === unit.id; })) return false;
    b.push(unit);
    write('os_bookings', b);
    notify({
      tr: 'Rezervasyon talebi gönderildi',
      en: 'Booking request sent'
    }, {
      tr: 'Daire No ' + unit.n + ', ' + unit.title + '. Danışmanımız bir iş günü içinde sizinle iletişime geçecek.',
      en: 'Apartment ' + unit.n + ', ' + unit.title + '. A manager will contact you within one business day.'
    });
    return true;
  }
  function unbook(id) {
    write('os_bookings', bookings().filter(function (x) { return x.id !== id; }));
  }

  /* ---------- уведомления ---------- */
  function notes() { return read('os_notes', '[]'); }
  function notify(title, text) {
    var n = notes();
    n.unshift({ id: 'n' + Date.now(), t: title, x: text, ts: Date.now(), read: false });
    write('os_notes', n.slice(0, 40));
    paintBell();
  }
  function readAll() {
    write('os_notes', notes().map(function (n) { n.read = true; return n; }));
    paintBell();
  }
  function unread() { return notes().filter(function (n) { return !n.read; }).length; }

  /* стартовые уведомления — чтобы раздел не был пустым при первом заходе */
  function seedNotes() {
    if (localStorage.getItem('os_notes_seed')) return;
    localStorage.setItem('os_notes_seed', '1');
    var base = [
      [{ tr: 'Yeni kampanya: 3 yıl %0 faizli taksit', en: 'New offer: 0% installment for 3 years' },
       { tr: '%30 peşinat, kalan 36 ay faizsiz. 30.11.2026 tarihine kadar geçerli.',
         en: '30% down, 36 months with no interest. Valid until 30.11.2026.' }],
      [{ tr: '6. blok satışa açıldı', en: 'Block 6 is now on sale' },
       { tr: '84 daire ve 21 depo. Yerleşim diğer bloklardan farklı.',
         en: '84 apartments and 21 storage rooms. Layout differs from the other blocks.' }],
      [{ tr: 'Eylül ayı inşaat raporu', en: 'September construction report' },
       { tr: '1. blok %82 seviyesinde, iç imalatlara başlandı.',
         en: 'Block 1 is 82% complete, interior finishing has started.' }]
    ];
    var n = base.map(function (b, i) {
      return { id: 'seed' + i, t: b[0], x: b[1], ts: Date.now() - (i + 1) * 86400000, read: false };
    });
    write('os_notes', n);
  }

  /* колокольчик в шапке — вставляется на всех страницах */
  function paintBell() {
    var b = document.getElementById('osBellCount');
    if (!b) return;
    var u = unread();
    b.textContent = u > 9 ? '9+' : u;
    b.style.display = u ? 'flex' : 'none';
  }
  function mountBell() {
    var nav = document.querySelector('header .hidden.md\\:flex.items-center.space-x-4');
    if (!nav || document.getElementById('osBell')) return;
    var wrap = document.createElement('div');
    wrap.className = 'relative group';
    wrap.id = 'osBell';
    wrap.innerHTML =
      '<a href="cabinet.html#notes" class="relative flex items-center text-gray-700 hover:text-primary-500 transition-colors p-1" aria-label="Notifications">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">' +
        '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>' +
        '<span id="osBellCount" style="display:none;position:absolute;top:-2px;right:-4px;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:#F57C00;color:#fff;font-size:10px;font-weight:700;align-items:center;justify-content:center;line-height:1">0</span>' +
      '</a>';
    nav.insertBefore(wrap, nav.firstChild);
    paintBell();
  }

  /* ---------- заявка менеджеру ---------- */
  function requestLink(text) {
    return 'https://wa.me/' + CFG.phone.replace(/\D/g, '') + '?text=' + encodeURIComponent(text);
  }
  function mailLink(subject, body) {
    return 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  /* ---------- активные акции ---------- */
  function offers() {
    var today = new Date().toISOString().slice(0, 10);
    return OFFERS.filter(function (o) { return o.until >= today; });
  }
  function offerFor(block) {
    return offers().filter(function (o) { return o.blocks.indexOf(block) >= 0; });
  }

  w.OS = {
    CFG: CFG, OFFERS: OFFERS, PROGRESS: PROGRESS,
    lang: lang, setLang: setLang, L: L,
    money: money, num: num, pct: pct,
    priceOf: priceOf, plan: plan, schedule: schedule, roi: roi,
    read: read, write: write, favs: favs, favData: favData,
    pushViewed: pushViewed, viewed: viewed, profile: profile,
    similar: similar, loadUnits: loadUnits,
    bookings: bookings, book: book, unbook: unbook,
    notes: notes, notify: notify, readAll: readAll, unread: unread,
    requestLink: requestLink, mailLink: mailLink,
    offers: offers, offerFor: offerFor
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { seedNotes(); mountBell(); });
  } else { seedNotes(); mountBell(); }

})(window);

/* ==========================================================================
   Выпадающие меню в шапке на тач-устройствах (добавлено 16.09.2026)
   На компьютере меню «More» и выбор языка открываются по наведению мыши
   (group-hover в Tailwind). На телефоне и планшете наведения нет, поэтому
   меню не открывалось. Теперь оно открывается по тапу и закрывается
   повторным тапом, тапом вне меню, клавишей Esc или при уходе со страницы.
   Логика десктопа не затронута: hover продолжает работать как раньше.
   ========================================================================== */
(function () {
  'use strict';

  function init() {
    var header = document.querySelector('header');
    if (!header) return;

    var groups = header.querySelectorAll('.relative.group');
    if (!groups.length) return;

    function closeAll() {
      var open = header.querySelectorAll('.os-dd-open');
      Array.prototype.forEach.call(open, function (g) {
        g.classList.remove('os-dd-open');
        var b = g.querySelector('button');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
    }

    Array.prototype.forEach.call(groups, function (g) {
      var btn = g.querySelector('button');
      var panel = g.querySelector('.absolute');
      if (!btn || !panel) return;

      panel.classList.add('os-dd-panel');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-haspopup', 'true');

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var wasOpen = g.classList.contains('os-dd-open');
        closeAll();
        if (!wasOpen) {
          g.classList.add('os-dd-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });

      /* тап внутри самого меню не должен его закрывать раньше перехода по ссылке */
      panel.addEventListener('click', function (e) { e.stopPropagation(); });
    });

    document.addEventListener('click', closeAll);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) closeAll();
    });
    window.addEventListener('pagehide', closeAll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();

/* ==========================================================================
   Кнопка-бургер на телефоне (добавлено 16.09.2026)
   На страницах «Калькулятор», «Акции», «Подбор», «Ход стройки» и «Кабинет»
   в шапке была кнопка ☰ и разметка меню, но не было обработчика клика —
   меню не открывалось. Здесь подключаем обработчик, но только если на
   странице нет собственного (проверяем встроенный скрипт), чтобы на
   остальных страницах меню не открывалось и сразу не закрывалось.
   ========================================================================== */
(function () {
  'use strict';

  function hasOwnHandler() {
    return Array.prototype.some.call(document.scripts, function (s) {
      return !s.src && s.textContent.indexOf("getElementById('menuBtn')") >= 0;
    });
  }

  function init() {
    var btn = document.getElementById('menuBtn');
    var menu = document.getElementById('mobileMenu');
    if (!btn || !menu || btn.dataset.osMenu === '1' || hasOwnHandler()) return;

    btn.dataset.osMenu = '1';
    btn.setAttribute('aria-controls', 'mobileMenu');
    btn.setAttribute('aria-expanded', 'false');

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var open = menu.classList.toggle('hidden') === false;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
