/* ==========================================================================
   OrientSquare — INTRO / загрузочный экран (splash)
   --------------------------------------------------------------------------
   Что делает: при первом заходе на сайт показывает фирменную заставку —
   знак-домик раскручивается в 3D, из «разлёта» собираются буквы
   ORIENT SQUARE REAL ESTATE, по логотипу проходит блик, снизу идёт полоса
   загрузки. Потом заставка плавно уходит и открывается страница.

   Особенности:
   • показывается ОДИН раз за сессию браузера (sessionStorage);
   • клик / Esc — пропустить;
   • prefers-reduced-motion — короткий статичный вариант;
   • ничего не ломает: есть аварийный таймер, который снимает блокировку
     страницы, даже если что-то пойдёт не так.

   Настройки — в объекте CFG ниже.
   ========================================================================== */
(function () {
  'use strict';

  if (window.__osIntroLoaded) return;
  window.__osIntroLoaded = true;

  var CFG = {
    once: 'session',      // 'session' — 1 раз за сессию | 'always' | 'once-ever'
    minShow: 2600,        // мин. время показа, мс (длительность анимации)
    maxShow: 5000,        // жёсткий предел, мс
    fadeOut: 550,         // длительность ухода, мс
    base: 'assets/brand/' // папка с логотипами
  };

  var KEY = 'os_intro_seen_v1';
  var store = (CFG.once === 'once-ever') ? 'localStorage' : 'sessionStorage';

  function seen() {
    if (CFG.once === 'always') return false;
    try { return window[store].getItem(KEY) === '1'; } catch (e) { return false; }
  }
  function markSeen() {
    try { window[store].setItem(KEY, '1'); } catch (e) {}
  }

  if (seen()) return;

  var doc = document;
  var html = doc.documentElement;
  var reduced = false;
  try {
    reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  /* ---- 1. Мгновенная блокировка страницы (чтобы не было мигания контента) ---- */
  html.classList.add('os-intro-on');

  // Аварийный предохранитель ставим САМЫМ ПЕРВЫМ:
  var failsafe = setTimeout(unlock, CFG.maxShow + CFG.fadeOut + 1500);

  /* ---- 2. Геометрия логотипа (координаты сняты с assets/brand/logo-full.png, 720×230) ---- */
  var LOGO_W = 720, LOGO_H = 230;
  var MARK = { x: 2, y: 2, w: 223, h: 227 };

  // Буквы: [x, y, ширина, высота, задержка(мс), dx, dy, поворот(deg), стартовый масштаб]
  var L1_Y = 21, L1_H = 104;   // строка ORIENT
  var L2_Y = 147, L2_H = 59;   // строка SQUARE + REAL ESTATE

  var LETTERS = [
    // ORIENT — влетают сверху, с разлётом в стороны
    [262, L1_Y, 83, L1_H,  750, -46, -70, -22, 0.45],
    [358, L1_Y, 70, L1_H,  815,  34, -88,  26, 0.45],
    [439, L1_Y, 22, L1_H,  880, -20, -96, -30, 0.45],
    [478, L1_Y, 52, L1_H,  945,  40, -72,  20, 0.45],
    [543, L1_Y, 71, L1_H, 1010, -30, -92, -18, 0.45],
    [624, L1_Y, 60, L1_H, 1075,  44, -66,  28, 0.45],
    // SQUARE — снизу
    [268, L2_Y, 43, L2_H, 1090, -34,  66,  24, 0.5],
    [315, L2_Y, 55, L2_H, 1145,  28,  78, -20, 0.5],
    [376, L2_Y, 44, L2_H, 1200, -24,  62,  22, 0.5],
    [423, L2_Y, 54, L2_H, 1255,  30,  84, -26, 0.5],
    [481, L2_Y, 44, L2_H, 1310, -28,  58,  18, 0.5],
    [532, L2_Y, 33, L2_H, 1365,  36,  74, -22, 0.5],
    // REAL ESTATE — мелкий блок, спокойный выезд
    [578, L2_Y, 117, L2_H, 1450, 26, 14, 0, 0.9],
    // ®
    [697, L1_Y, 23, L1_H, 1560, 0, 0, 0, 0.2]
  ];

  /* ---- 3. Стили ---- */
  var css = [
    'html.os-intro-on,html.os-intro-on body{overflow:hidden!important}',
    'html.os-intro-on{background:#FFF8B9}',
    'html.os-intro-on body{visibility:hidden}',
    '#osIntro{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;',
    'background:#FFF8B9;background:radial-gradient(120% 90% at 50% 42%,#FFFDF0 0%,#FFF8B9 58%,#FBEFA4 100%);',
    'overflow:hidden;cursor:pointer;-webkit-user-select:none;user-select:none;',
    'transition:opacity ' + CFG.fadeOut + 'ms ease,transform ' + CFG.fadeOut + 'ms ease}',
    '#osIntro.os-out{opacity:0;transform:scale(1.045);pointer-events:none}',

    /* мягкое оранжевое свечение за знаком */
    '#osIntro .osi-glow{position:absolute;left:50%;top:50%;width:900px;height:900px;margin:-450px 0 0 -450px;',
    'background:radial-gradient(circle,rgba(240,126,1,.20) 0%,rgba(240,126,1,.07) 38%,rgba(240,126,1,0) 68%);',
    'opacity:0;animation:osi-glow 1.6s ease-out forwards;pointer-events:none}',

    '#osIntro .osi-stage{position:relative;flex:0 0 auto;width:' + LOGO_W + 'px;min-width:' + LOGO_W + 'px;height:' + LOGO_H + 'px;',
    'transform:scale(var(--osi-k,1));transform-origin:50% 50%}',

    /* знак-домик */
    '#osIntro .osi-mark{position:absolute;left:' + MARK.x + 'px;top:' + MARK.y + 'px;width:' + MARK.w + 'px;height:' + MARK.h + 'px;',
    'background:url("' + CFG.base + 'logo-mark.png") no-repeat center/contain;opacity:0;',
    'transform-style:preserve-3d;backface-visibility:hidden;will-change:transform,opacity;',
    'animation:osi-mark 1.2s cubic-bezier(.16,.84,.26,1.02) .05s forwards}',

    /* кольцо-обводка, которая обегает знак */
    '#osIntro .osi-ring{position:absolute;left:' + (MARK.x - 26) + 'px;top:' + (MARK.y - 26) + 'px;',
    'width:' + (MARK.w + 52) + 'px;height:' + (MARK.h + 52) + 'px;opacity:0;',
    'animation:osi-ring 1.5s ease-out .1s forwards;pointer-events:none}',
    '#osIntro .osi-ring circle{fill:none;stroke:#F07E01;stroke-width:3;stroke-linecap:round;',
    'stroke-dasharray:0 900;animation:osi-dash 1.25s cubic-bezier(.32,.78,.3,1) .05s forwards}',

    /* буквы */
    '#osIntro .osi-l{position:absolute;background-image:url("' + CFG.base + 'logo-full.png");background-repeat:no-repeat;',
    'background-size:' + LOGO_W + 'px ' + LOGO_H + 'px;opacity:0;will-change:transform,opacity,filter;',
    'animation:osi-letter .78s cubic-bezier(.18,.92,.26,1.06) forwards}',

    /* блик по логотипу */
    '#osIntro .osi-shine{position:absolute;inset:0;pointer-events:none;opacity:0;',
    '-webkit-mask:url("' + CFG.base + 'logo-full.png") no-repeat 0 0/' + LOGO_W + 'px ' + LOGO_H + 'px;',
    'mask:url("' + CFG.base + 'logo-full.png") no-repeat 0 0/' + LOGO_W + 'px ' + LOGO_H + 'px;',
    'background:linear-gradient(105deg,rgba(255,255,255,0) 38%,rgba(255,255,255,.9) 50%,rgba(255,255,255,0) 62%);',
    'background-size:260% 100%;animation:osi-shine 1.05s ease-out 1.85s forwards}',

    /* полоса загрузки */
    '#osIntro .osi-bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(112,33,122,.12)}',
    '#osIntro .osi-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#F07E01,#70217A);',
    'animation:osi-bar ' + CFG.minShow + 'ms cubic-bezier(.3,.7,.3,1) forwards}',

    /* подсказка «пропустить» */
    '#osIntro .osi-skip{position:absolute;left:0;right:0;bottom:22px;text-align:center;font:600 11px/1 ui-sans-serif,system-ui,sans-serif;',
    'letter-spacing:.14em;text-transform:uppercase;color:rgba(112,33,122,.45);opacity:0;animation:osi-fade .5s ease 2.2s forwards}',

    '@keyframes osi-glow{0%{opacity:0;transform:scale(.5)}45%{opacity:1}100%{opacity:.85;transform:scale(1)}}',
    '@keyframes osi-mark{0%{opacity:0;transform:perspective(1000px) rotateY(-450deg) scale(.32)}',
    '18%{opacity:1}72%{transform:perspective(1000px) rotateY(16deg) scale(1.09)}',
    '100%{opacity:1;transform:perspective(1000px) rotateY(0) scale(1)}}',
    '@keyframes osi-ring{0%{opacity:0}25%{opacity:1}75%{opacity:1}100%{opacity:0;transform:scale(1.12)}}',
    '@keyframes osi-dash{0%{stroke-dasharray:0 900;stroke-dashoffset:210}',
    '70%{stroke-dasharray:640 900}100%{stroke-dasharray:840 900;stroke-dashoffset:-630}}',
    '@keyframes osi-letter{0%{opacity:0;filter:blur(7px);',
    'transform:translate3d(var(--dx),var(--dy),0) rotate(var(--rot)) scale(var(--sc))}',
    '55%{opacity:1;filter:blur(0)}',
    '100%{opacity:1;filter:blur(0);transform:translate3d(0,0,0) rotate(0deg) scale(1)}}',
    '@keyframes osi-shine{0%{opacity:0;background-position:170% 0}12%{opacity:1}100%{opacity:0;background-position:-70% 0}}',
    '@keyframes osi-bar{0%{width:0}55%{width:72%}100%{width:100%}}',
    '@keyframes osi-fade{to{opacity:1}}',

    /* короткий вариант для «уменьшить движение» */
    'html.osi-reduced #osIntro .osi-glow,html.osi-reduced #osIntro .osi-ring,',
    'html.osi-reduced #osIntro .osi-shine{display:none}',
    'html.osi-reduced #osIntro .osi-mark,html.osi-reduced #osIntro .osi-l{animation:osi-fade .45s ease forwards;',
    'transform:none!important;filter:none!important}',
    'html.osi-reduced #osIntro .osi-bar i{animation-duration:700ms}'
  ].join('');

  var styleEl = doc.createElement('style');
  styleEl.id = 'osIntroStyle';
  styleEl.appendChild(doc.createTextNode(css));
  (doc.head || html).appendChild(styleEl);

  // предзагрузка картинок логотипа
  ['logo-mark.png', 'logo-full.png'].forEach(function (f) {
    var l = doc.createElement('link');
    l.rel = 'preload'; l.as = 'image'; l.href = CFG.base + f;
    (doc.head || html).appendChild(l);
  });

  if (reduced) html.classList.add('osi-reduced');

  /* ---- 4. Разметка ---- */
  var overlay, started = 0, closed = false;

  function build() {
    if (overlay || closed) return;
    overlay = doc.createElement('div');
    overlay.id = 'osIntro';
    overlay.setAttribute('role', 'presentation');
    overlay.setAttribute('aria-hidden', 'true');

    var parts = [];
    parts.push('<div class="osi-glow"></div>');
    parts.push('<div class="osi-stage">');
    parts.push('<svg class="osi-ring" viewBox="0 0 ' + (MARK.w + 52) + ' ' + (MARK.h + 52) + '">');
    parts.push('<circle cx="' + ((MARK.w + 52) / 2) + '" cy="' + ((MARK.h + 52) / 2) + '" r="' + ((MARK.w + 44) / 2) + '"/></svg>');
    parts.push('<div class="osi-mark"></div>');

    for (var i = 0; i < LETTERS.length; i++) {
      var d = LETTERS[i];
      parts.push('<div class="osi-l" style="left:' + d[0] + 'px;top:' + d[1] + 'px;width:' + d[2] + 'px;height:' + d[3] +
        'px;background-position:' + (-d[0]) + 'px ' + (-d[1]) + 'px;animation-delay:' + d[4] + 'ms;' +
        '--dx:' + d[5] + 'px;--dy:' + d[6] + 'px;--rot:' + d[7] + 'deg;--sc:' + d[8] + '"></div>');
    }

    parts.push('<div class="osi-shine"></div>');
    parts.push('</div>');
    parts.push('<div class="osi-bar"><i></i></div>');
    parts.push('<div class="osi-skip">Orient Square Real Estate</div>');

    overlay.innerHTML = parts.join('');
    doc.body.appendChild(overlay);

    fit();
    window.addEventListener('resize', fit);

    started = Date.now();
    html.classList.remove('os-intro-on');   // контент виден, но закрыт оверлеем
    html.classList.add('os-intro-lock');

    overlay.addEventListener('click', close);
    doc.addEventListener('keydown', onKey, true);

    var wait = reduced ? 900 : CFG.minShow;
    setTimeout(function () {
      if (doc.readyState === 'complete') close();
      else window.addEventListener('load', close);
      setTimeout(close, CFG.maxShow - wait);
    }, wait);
  }

  function fit() {
    if (!overlay) return;
    var stage = overlay.querySelector('.osi-stage');
    if (!stage) return;
    var k = Math.min(1, (window.innerWidth - 40) / LOGO_W, (window.innerHeight - 120) / LOGO_H);
    stage.style.setProperty('--osi-k', Math.max(0.3, k));
  }

  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') close();
  }

  function close() {
    if (closed) return;
    closed = true;
    markSeen();
    doc.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', fit);
    if (overlay) {
      overlay.classList.add('os-out');
      setTimeout(function () {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, CFG.fadeOut + 60);
    }
    unlock();
  }

  function unlock() {
    clearTimeout(failsafe);
    html.classList.remove('os-intro-on');
    html.classList.remove('os-intro-lock');
    var st = doc.getElementById('osIntroStyle');
    if (st && closed) {
      setTimeout(function () { if (st.parentNode) st.parentNode.removeChild(st); }, CFG.fadeOut + 400);
    }
  }

  /* html.os-intro-lock держит скролл закрытым, пока оверлей на экране */
  var lockCss = doc.createElement('style');
  lockCss.appendChild(doc.createTextNode('html.os-intro-lock,html.os-intro-lock body{overflow:hidden!important}'));
  (doc.head || html).appendChild(lockCss);

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
