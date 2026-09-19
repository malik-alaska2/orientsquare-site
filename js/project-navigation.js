(() => {
  const galleryIcon='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
  const header=document.querySelector('body > header');
  if(header){
    const navigation=header.querySelector('nav');
    if(navigation&&!navigation.querySelector('[href="gallery.html"]')){const a=document.createElement('a');a.href='gallery.html';a.className='flex items-center space-x-1 text-gray-700 hover:text-primary-500 transition-colors';a.innerHTML=galleryIcon+'<span>Галерея</span>';navigation.append(a)}
    const mobile=header.querySelector('#mobileMenu')||document.querySelector('#mobileMenu');
    if(mobile&&!mobile.querySelector('[href="gallery.html"]')){const a=document.createElement('a');a.href='gallery.html';a.className='block px-2 py-2 text-gray-700 hover:text-primary-500';a.textContent='Галерея';mobile.prepend(a)}
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
