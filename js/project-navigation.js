(() => {
  const header=document.querySelector('body > header');
  if(header){
    const navigation=header.querySelector('nav');
    if(navigation&&!navigation.querySelector('[href="gallery.html"]')){const a=document.createElement('a');a.href='gallery.html';a.className='project-nav-link flex items-center space-x-1 px-2 py-2 text-sm';a.textContent='Фото / 360°';navigation.append(a)}
    const mobile=header.querySelector('#mobileMenu')||document.querySelector('#mobileMenu');
    if(mobile&&!mobile.querySelector('[href="gallery.html"]')){const a=document.createElement('a');a.href='gallery.html';a.className='block px-2 py-2 project-nav-link';a.textContent='Фото / 360°';mobile.prepend(a)}
  }
  if(location.pathname.endsWith('gallery.html')){
    // The reference's mobile-menu handler is inline on its own pages.
    const mobile=document.getElementById('mobileMenu');
    const toggle=document.getElementById('menuBtn');
    if(toggle)toggle.setAttribute('aria-label','Открыть меню');
    const home=header?.querySelector('nav a[href="index.html"]');if(home){home.classList.remove('text-primary-500');home.classList.add('text-gray-700')}
  }
  const foot=document.querySelector('body > footer');
  if(foot){const list=foot.querySelector('ul');if(list){const li=document.createElement('li');const a=document.createElement('a');a.href='gallery.html';a.className='text-gray-300 hover:text-primary-500';a.textContent='Фото, интерьеры и 360°';li.append(a);list.append(li)}}
})();
