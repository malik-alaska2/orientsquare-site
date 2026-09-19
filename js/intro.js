/* ==========================================================================
   OrientSquare — INTRO / загрузочный экран (splash)
   --------------------------------------------------------------------------
   Что делает: при первом заходе на сайт показывает фирменную заставку —
   ролик (assets/intro/intro.mp4); если он не готов вовремя, логотип целиком
   плавно проявляется и увеличивается (без нарезки на буквы — так нечему
   выглядеть «сломанным»), кольцо обегает знак, по логотипу проходит блик,
   снизу идёт полоса загрузки. Потом заставка плавно уходит и открывается
   страница. Клик по логотипу в шапке проигрывает её заново.

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
    minShow: 3000,        // мин. время показа, мс (= длина ролика)
    maxShow: 5000,        // жёсткий предел, мс
    fadeOut: 550,         // длительность ухода, мс
    autoClose: true,      // false — заставка не закрывается сама (для записи ролика)
    base: 'assets/brand/',// папка с логотипами
    video: 'assets/intro/',// папка с роликом заставки ('' — выключить видео)
    videoWait: 2200        // сколько ждём готовности видео, мс, потом — CSS-анимация
  };

  // Переопределение настроек со страницы: window.OS_INTRO_CFG = { minShow: 3200, ... }
  try {
    if (window.OS_INTRO_CFG) {
      for (var ck in window.OS_INTRO_CFG) {
        if (Object.prototype.hasOwnProperty.call(window.OS_INTRO_CFG, ck)) CFG[ck] = window.OS_INTRO_CFG[ck];
      }
    }
  } catch (e) {}

  var KEY = 'os_intro_seen_v1';
  var store = (CFG.once === 'once-ever') ? 'localStorage' : 'sessionStorage';

  function seen() {
    if (CFG.once === 'always') return false;
    try { return window[store].getItem(KEY) === '1'; } catch (e) { return false; }
  }
  function markSeen() {
    try { window[store].setItem(KEY, '1'); } catch (e) {}
  }

  var doc = document;
  var html = doc.documentElement;
  var reduced = false;
  try {
    reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  var failsafe;
  if (!seen()) {
    /* ---- 1. Мгновенная блокировка страницы (чтобы не было мигания контента) ---- */
    html.classList.add('os-intro-on');
    // Аварийный предохранитель ставим САМЫМ ПЕРВЫМ:
    failsafe = setTimeout(unlock, CFG.maxShow + CFG.fadeOut + 1500);
  }

  /* ---- 2. Геометрия логотипа (координаты сняты с assets/brand/logo-full.png, 720×230) ---- */
  var LOGO_W = 720, LOGO_H = 230;
  var VID_W = 800, VID_H = 400;   // кадр ролика заставки (assets/intro/intro.mp4)
  var MARK = { x: 2, y: 2, w: 223, h: 227 };

  /* ---- 3. Стили ---- */
  var css = [
    'html.os-intro-on,html.os-intro-on body{overflow:hidden!important}',
    'html.os-intro-on{background:#FFF8B9}',
    'html.os-intro-on body{visibility:hidden}',
    /* Фон заставки — тот же кремовый, что запечён в самом видеоролике
       (assets/intro/intro.mp4 / .webm): если тут поставить другой цвет,
       по краю кадра видна граница/шов между роликом и подложкой. */
    '#osIntro{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;',
    'background:#FFF8B9;background:radial-gradient(120% 90% at 50% 42%,#FFFDF0 0%,#FFF8B9 58%,#FBEFA4 100%);',
    'overflow:hidden;cursor:pointer;-webkit-user-select:none;user-select:none;',
    'transition:opacity ' + CFG.fadeOut + 'ms ease,transform ' + CFG.fadeOut + 'ms ease}',
    '#osIntro.os-out{opacity:0;transform:scale(1.045);pointer-events:none}',

    /* мягкое оранжевое свечение за знаком */
    '#osIntro .osi-glow{position:absolute;left:50%;top:50%;width:900px;height:900px;margin:-450px 0 0 -450px;',
    'background:radial-gradient(circle,rgba(168,83,10,.16) 0%,rgba(168,83,10,.06) 38%,rgba(168,83,10,0) 68%);',
    'opacity:0;animation:osi-glow 1.6s ease-out forwards;pointer-events:none}',

    '#osIntro .osi-stage{position:relative;flex:0 0 auto;width:' + LOGO_W + 'px;min-width:' + LOGO_W + 'px;height:' + LOGO_H + 'px;',
    'transform:scale(var(--osi-k,1));transform-origin:50% 50%}',

    /* кольцо-обводка вокруг знака-домика — независимый декоративный элемент,
       не зависит от того, как отрисовался сам логотип */
    '#osIntro .osi-ring{position:absolute;left:' + (MARK.x - 26) + 'px;top:' + (MARK.y - 26) + 'px;',
    'width:' + (MARK.w + 52) + 'px;height:' + (MARK.h + 52) + 'px;opacity:0;',
    'animation:osi-ring 1.5s ease-out .1s forwards;pointer-events:none}',
    '#osIntro .osi-ring circle{fill:none;stroke:#a8530a;stroke-width:3;stroke-linecap:round;',
    'stroke-dasharray:0 900;animation:osi-dash 1.25s cubic-bezier(.32,.78,.3,1) .05s forwards}',

    /* Логотип целиком — одной картинкой, без нарезки на буквы: раньше буквы
       разлетались из 14 отдельных кусочков, и если анимация прерывалась
       (например, видео перехватывало показ на середине), логотип выглядел
       рассыпанным/перекошенным. Один плавный fade+scale ничего разбить не может. */
    '#osIntro .osi-logo{position:absolute;inset:0;background:url("' + CFG.base + 'logo-full.png") no-repeat center/contain;',
    'opacity:0;transform:translateY(10px) scale(.94);will-change:transform,opacity;',
    'animation:osi-logo-in .9s cubic-bezier(.16,.84,.26,1) .15s forwards}',

    /* блик по логотипу */
    '#osIntro .osi-shine{position:absolute;inset:0;pointer-events:none;opacity:0;',
    '-webkit-mask:url("' + CFG.base + 'logo-full.png") no-repeat 0 0/' + LOGO_W + 'px ' + LOGO_H + 'px;',
    'mask:url("' + CFG.base + 'logo-full.png") no-repeat 0 0/' + LOGO_W + 'px ' + LOGO_H + 'px;',
    'background:linear-gradient(105deg,rgba(255,255,255,0) 38%,rgba(255,255,255,.9) 50%,rgba(255,255,255,0) 62%);',
    'background-size:260% 100%;animation:osi-shine 1.05s ease-out 1.85s forwards}',

    /* ролик заставки (поверх CSS-анимации; если не запустится — покажется анимация) */
    '#osIntro .osi-video{position:absolute;left:50%;top:50%;flex:0 0 auto;',
    'width:' + VID_W + 'px;height:' + VID_H + 'px;margin:' + (-VID_H / 2) + 'px 0 0 ' + (-VID_W / 2) + 'px;',
    'transform:scale(var(--osi-k,1));transform-origin:50% 50%;',
    'max-width:none;max-height:none;min-width:0;object-fit:fill;',
    'opacity:0;transition:opacity .2s ease;pointer-events:none;background:#FFF8B9;display:block}',
    '#osIntro.osi-has-video{background:#FFF8B9}',
    '#osIntro.osi-has-video .osi-video{opacity:1}',
    '#osIntro.osi-has-video .osi-stage,#osIntro.osi-has-video .osi-glow{visibility:hidden}',

    /* полоса загрузки */
    '#osIntro .osi-bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(28,23,18,.08)}',
    '#osIntro .osi-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#a8530a,#7a5c8c);',
    'animation:osi-bar ' + CFG.minShow + 'ms cubic-bezier(.3,.7,.3,1) forwards}',

    /* подсказка «пропустить» */
    '#osIntro .osi-skip{position:absolute;left:0;right:0;bottom:22px;text-align:center;font:600 11px/1 ui-sans-serif,system-ui,sans-serif;',
    'letter-spacing:.14em;text-transform:uppercase;color:rgba(28,23,18,.4);opacity:0;animation:osi-fade .5s ease 2.2s forwards}',

    '@keyframes osi-glow{0%{opacity:0;transform:scale(.5)}45%{opacity:1}100%{opacity:.85;transform:scale(1)}}',
    '@keyframes osi-logo-in{0%{opacity:0;transform:translateY(10px) scale(.94)}100%{opacity:1;transform:translateY(0) scale(1)}}',
    '@keyframes osi-ring{0%{opacity:0}25%{opacity:1}75%{opacity:1}100%{opacity:0;transform:scale(1.12)}}',
    '@keyframes osi-dash{0%{stroke-dasharray:0 900;stroke-dashoffset:210}',
    '70%{stroke-dasharray:640 900}100%{stroke-dasharray:840 900;stroke-dashoffset:-630}}',
    '@keyframes osi-shine{0%{opacity:0;background-position:170% 0}12%{opacity:1}100%{opacity:0;background-position:-70% 0}}',
    '@keyframes osi-bar{0%{width:0}55%{width:72%}100%{width:100%}}',
    '@keyframes osi-fade{to{opacity:1}}',

    /* короткий вариант для «уменьшить движение» */
    'html.osi-reduced #osIntro .osi-glow,html.osi-reduced #osIntro .osi-ring,',
    'html.osi-reduced #osIntro .osi-shine{display:none}',
    'html.osi-reduced #osIntro .osi-logo{animation:osi-fade .45s ease forwards;',
    'transform:none!important}',
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
    parts.push('<div class="osi-logo"></div>');
    parts.push('<div class="osi-shine"></div>');
    parts.push('</div>');
    if (CFG.video && !reduced) {
      parts.push('<video class="osi-video" muted playsinline autoplay preload="auto" ' +
        'poster="' + CFG.video + 'intro-poster.jpg" aria-hidden="true">' +
        '<source src="' + CFG.video + 'intro.webm" type="video/webm">' +
        '<source src="' + CFG.video + 'intro.mp4" type="video/mp4"></video>');
    }
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

    setupVideo();

    if (!CFG.autoClose) return;   // режим записи ролика

    var wait = reduced ? 900 : CFG.minShow;
    setTimeout(function () {
      if (doc.readyState === 'complete') close();
      else window.addEventListener('load', close);
      setTimeout(close, CFG.maxShow - wait);
    }, wait);
  }

  /* Видео-заставка. Если ролик не загрузился / не запустился — молча
     остаёмся на CSS-анимации, она уже играет под ним. */
  function setupVideo() {
    var v = overlay && overlay.querySelector('.osi-video');
    if (!v) return;

    // Сразу рассчитываем на ролик: CSS-анимация спрятана под ним.
    overlay.classList.add('osi-has-video');

    var settled = false;

    function useVideo() {
      if (settled) return; settled = true;
    }

    // Ролик не загрузился / браузер не дал автозапуск —
    // возвращаем CSS-анимацию и перезапускаем её с нуля.
    function useCss() {
      if (settled) return; settled = true;
      overlay.classList.remove('osi-has-video');
      try { v.pause(); } catch (e) {}
      if (v.parentNode) v.parentNode.removeChild(v);
      var stage = overlay.querySelector('.osi-stage');
      if (stage && stage.parentNode) {
        var fresh = stage.cloneNode(true);       // клон перезапускает все CSS-анимации
        stage.parentNode.replaceChild(fresh, stage);
        fit();
      }
      var glow = overlay.querySelector('.osi-glow');
      if (glow && glow.parentNode) {
        glow.parentNode.replaceChild(glow.cloneNode(true), glow);
      }
    }

    v.addEventListener('error', useCss, true);
    v.addEventListener('playing', useVideo);
    v.addEventListener('ended', function () { if (CFG.autoClose) close(); });

    var pr = v.play();
    if (pr && typeof pr['catch'] === 'function') pr['catch'](function () {});

    // Второй заход: если через полсекунды всё ещё не поехало, пробуем play()
    // ещё раз — часть браузеров откладывает автозапуск до готовности буфера.
    setTimeout(function () {
      if (settled || (v.currentTime > 0 && !v.paused)) return;
      var pr2 = v.play();
      if (pr2 && typeof pr2['catch'] === 'function') pr2['catch'](function () {});
    }, 500);

    setTimeout(function () {
      if (settled) return;
      if ((v.currentTime > 0 || v.readyState >= 2) && !v.paused && !v.ended) useVideo(); else useCss();
    }, CFG.videoWait);
  }

  function fit() {
    if (!overlay) return;
    var stage = overlay.querySelector('.osi-stage');
    if (!stage) return;
    var k = Math.max(0.3, Math.min(1, (window.innerWidth - 40) / LOGO_W, (window.innerHeight - 120) / LOGO_H));
    stage.style.setProperty('--osi-k', k);
    var v = overlay.querySelector('.osi-video');
    if (v) v.style.setProperty('--osi-k', k);
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
        overlay = null;   // иначе build() решит, что заставка ещё показывается, и повтор по клику не сработает
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

  if (!seen()) {
    if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', build);
    } else {
      build();
    }
  }

  /* ---- 5. Повтор по клику на логотип в шапке ---- */
  function replay() {
    if (overlay) return;              // уже показывается
    closed = false;
    if (!doc.getElementById('osIntroStyle')) (doc.head || html).appendChild(styleEl);
    html.classList.add('os-intro-lock');
    clearTimeout(failsafe);
    failsafe = setTimeout(unlock, CFG.maxShow + CFG.fadeOut + 1500);
    build();
  }

  doc.addEventListener('click', function (e) {
    var logo = e.target.closest && e.target.closest('header .os-logo');
    if (!logo) return;
    e.preventDefault();
    replay();
  }, true);
})();
