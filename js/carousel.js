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
      try { track.setPointerCapture(e.pointerId); } catch (err) {}
    });
    track.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) movedFar = true;
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

    w.addEventListener('resize', update);
    update();
  }

  function boot() {
    var cars = d.querySelectorAll('[data-os-car]');
    for (var i = 0; i < cars.length; i++) initCarousel(cars[i]);
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();
})(document, window);
