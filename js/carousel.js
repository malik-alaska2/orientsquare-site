/* ==========================================================================
   OrientSquare — горизонтальная карусель "пролистываемых" карточек.
   Работает с любым блоком [data-os-car]: стрелки, точки-индикаторы,
   свайп на тачскрине (нативный scroll-snap) и перетаскивание мышью.
   ========================================================================== */
(function (d, w) {
  'use strict';

  function initCarousel(car) {
    var track = car.querySelector('[data-car-track]');
    if (!track) return;
    var items = Array.prototype.slice.call(track.children);
    if (!items.length) return;

    var prevBtn = car.querySelector('[data-car-prev]');
    var nextBtn = car.querySelector('[data-car-next]');
    var dotsWrap = car.querySelector('[data-car-dots]');
    var dots = [];

    if (dotsWrap) {
      items.forEach(function (_, i) {
        var b = d.createElement('button');
        b.type = 'button';
        b.className = 'os-car-dot';
        b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        b.addEventListener('click', function () { scrollToIndex(i); });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }

    function step() {
      var style = w.getComputedStyle(track);
      var gap = parseFloat(style.columnGap || style.gap || '0') || 0;
      return items[0].getBoundingClientRect().width + gap;
    }

    function scrollToIndex(i) {
      i = Math.max(0, Math.min(items.length - 1, i));
      track.scrollTo({ left: items[i].offsetLeft - track.offsetLeft, behavior: 'smooth' });
    }

    function activeIndex() {
      var pos = track.scrollLeft;
      var best = 0, bestDist = Infinity;
      items.forEach(function (it, i) {
        var dist = Math.abs((it.offsetLeft - track.offsetLeft) - pos);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      return best;
    }

    function update() {
      var idx = activeIndex();
      dots.forEach(function (dot, i) { dot.classList.toggle('active', i === idx); });
      if (prevBtn) prevBtn.disabled = track.scrollLeft <= 4;
      if (nextBtn) nextBtn.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (nextBtn) nextBtn.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });

    var raf = null;
    track.addEventListener('scroll', function () {
      if (raf) w.cancelAnimationFrame(raf);
      raf = w.requestAnimationFrame(update);
    }, { passive: true });

    /* Перетаскивание мышью на десктопе (тач уже работает нативно через scroll-snap) */
    var dragging = false, movedFar = false, startX = 0, startScroll = 0;

    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      dragging = true; movedFar = false;
      startX = e.clientX; startScroll = track.scrollLeft;
      track.classList.add('os-car-dragging');
      /* Захват указателя откладываем до реального движения: если поставить
         его уже на pointerdown, браузер перенаправляет и синтетический
         click на track, из-за чего клики по карточкам внутри перестают
         срабатывать (карусель "съедала" открытие фото). */
    });
    track.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) {
        if (!movedFar) { try { track.setPointerCapture(e.pointerId); } catch (err) {} }
        movedFar = true;
      }
      track.scrollLeft = startScroll - dx;
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('os-car-dragging');
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', function () { if (dragging) endDrag(); });
    /* не даём клику по ссылке/кнопке сработать, если это было перетаскивание */
    track.addEventListener('click', function (e) {
      if (movedFar) { e.preventDefault(); e.stopPropagation(); movedFar = false; }
    }, true);

    /* Колесо мыши крутит список по горизонтали (как трекпад/свайп).
       Трекпадовый горизонтальный жест (deltaX уже больше deltaY) не трогаем —
       он и так работает нативно. На границах списка отдаём прокрутку странице. */
    var wheelSnapTimer = null;
    track.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      var atStart = track.scrollLeft <= 0;
      var atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
      if ((atStart && e.deltaY < 0) || (atEnd && e.deltaY > 0)) return;
      track.classList.add('os-car-dragging');
      track.scrollLeft += e.deltaY;
      e.preventDefault();
      if (wheelSnapTimer) w.clearTimeout(wheelSnapTimer);
      wheelSnapTimer = w.setTimeout(function () {
        track.classList.remove('os-car-dragging');
        scrollToIndex(activeIndex());
      }, 120);
    }, { passive: false });

    w.addEventListener('resize', update);
    update();
  }

  function boot() {
    var cars = d.querySelectorAll('[data-os-car]');
    for (var i = 0; i < cars.length; i++) initCarousel(cars[i]);
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* Позволяет инициализировать карусель, добавленную в DOM позже
     (например, галерея строит свою карусель динамически из JS). */
  w.OSCarousel = { init: initCarousel };
})(document, window);
