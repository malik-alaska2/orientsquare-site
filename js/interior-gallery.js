/* ==========================================================================
   OrientSquare — "Sample finish" interior slideshow.
   Enhances the static #dInterior preview (shown in the apartment drawer on
   every block-N.html page) into a small rotating gallery of real interior
   design renders, with prev/next arrows, a slide counter and auto-advance.
   Purely additive: does nothing if #dInterior is not on the page.
   ========================================================================== */
(function (d, w) {
  'use strict';

  var IMAGES = [
    'assets/renders/apartment-interiors/interior-01.jpg',
    'assets/renders/apartment-interiors/interior-02.jpg',
    'assets/renders/apartment-interiors/interior-03.jpg',
    'assets/renders/apartment-interiors/interior-04.jpg',
    'assets/renders/apartment-interiors/interior-05.jpg',
    'assets/renders/apartment-interiors/interior-06.jpg',
    'assets/renders/apartment-interiors/interior-07.jpg',
    'assets/renders/apartment-interiors/interior-08.jpg',
    'assets/renders/apartment-interiors/interior-09.jpg',
    'assets/renders/apartment-interiors/interior-10.jpg',
    'assets/renders/apartment-interiors/interior-11.jpg',
    'assets/renders/apartment-interiors/interior-12.jpg',
    'assets/renders/apartment-interiors/interior-13.jpg',
    'assets/renders/apartment-interiors/interior-14.jpg',
    'assets/renders/apartment-interiors/interior-15.jpg',
    'assets/renders/apartment-interiors/interior-16.jpg'
  ];

  var AUTO_MS = 5000;

  function svg(pts) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<polyline points="' + pts + '"/></svg>';
  }

  function init() {
    var box = d.getElementById('dInterior');
    if (!box) return;
    var img = box.querySelector('img');
    if (!img || !IMAGES.length) return;

    box.classList.add('igal');
    img.style.transition = 'opacity .18s ease';

    var prevBtn = d.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'igal-arrow igal-prev';
    prevBtn.setAttribute('aria-label', 'Previous photo');
    prevBtn.innerHTML = svg('15 18 9 12 15 6');

    var nextBtn = d.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'igal-arrow igal-next';
    nextBtn.setAttribute('aria-label', 'Next photo');
    nextBtn.innerHTML = svg('9 18 15 12 9 6');

    /* A <div>, not a <span>: the page's existing ".interior span{left:0;right:0;
       bottom:0}" caption rule would otherwise also match a span here and stretch
       this badge over the whole image, blocking clicks on the arrows. */
    var counter = d.createElement('div');
    counter.className = 'igal-count';

    box.appendChild(prevBtn);
    box.appendChild(nextBtn);
    box.appendChild(counter);

    var idx = 0;
    var timer = null;

    function show(i) {
      idx = (i + IMAGES.length) % IMAGES.length;
      img.style.opacity = '0';
      w.setTimeout(function () {
        img.src = IMAGES[idx];
        img.style.opacity = '1';
      }, 140);
      counter.textContent = (idx + 1) + ' / ' + IMAGES.length;
    }

    function restart() {
      if (timer) w.clearInterval(timer);
      timer = w.setInterval(function () { show(idx + 1); }, AUTO_MS);
    }

    prevBtn.addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); restart(); });
    nextBtn.addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); restart(); });
    box.addEventListener('mouseenter', function () { if (timer) w.clearInterval(timer); });
    box.addEventListener('mouseleave', restart);

    show(0);
    restart();
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(document, window);
