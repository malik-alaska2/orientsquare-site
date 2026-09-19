(() => {
  'use strict';
  const media = window.PROJECT_MEDIA;
  const grid = document.querySelector('#media-grid');
  const tabs = [...document.querySelectorAll('[data-category]')];
  const search = document.querySelector('#media-search');
  const dialog = document.querySelector('#media-lightbox');
  const stage = document.querySelector('#ge-stage');
  let category = ['photos','rooms','blocks'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'photos';
  let activeItems = [], current = 0, zoomed = false;
  const names = {photos:'Архитектура и территория', rooms:'Интерьеры', blocks:'Планы блоков'};
  const hints = {photos:'Архитектура, дворы и общественные пространства проекта. Нажмите на изображение, чтобы открыть его в полноэкранном режиме — дальше можно листать свайпом или стрелками.',rooms:'19 изображений интерьеров из папки Rooms pick. Это материалы проекта, без привязки к конкретному номеру квартиры.',blocks:'Оригинальные чертежи шести блоков. В каждом PDF — пять страниц. Откройте превью, скачайте файл или перейдите к интерактивному выбору квартиры.'};

  function imageItem(item,index){
    const figure=document.createElement('figure'); figure.className='media-card';
    const button=document.createElement('button'); button.className='media-image';button.type='button';button.setAttribute('aria-label','Открыть: '+item.label);
    const img=new Image();img.src=item.thumb;img.alt=item.label;img.loading=index<6?'eager':'lazy';img.decoding='async';img.width=item.width||640;img.height=item.height||480;
    button.append(img);button.addEventListener('click',()=>open(index));
    const cap=document.createElement('figcaption');const title=document.createElement('h2');title.textContent=item.label;const sub=document.createElement('small');sub.textContent=names[category];cap.append(title,sub);
    figure.append(button,cap);return figure;
  }
  function render(){
    tabs.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));
    document.querySelector('#media-description').textContent=hints[category];
    document.querySelector('#media-tour-link').href='tour-gallery.html?category='+category;
    const q=search.value.trim().toLocaleLowerCase('ru');grid.replaceChildren();
    let matchCount=0;
    if(category==='blocks'){
      activeItems=media.blocks.flatMap(b=>b.pages.map(p=>({...p,label:`Блок ${b.number} · Лист ${p.page}`,pdf:b.pdf})));
      const matched=media.blocks.filter(b=>!q||('блок '+b.number).includes(q));
      matchCount=matched.length;
      matched.forEach(b=>{
        const index=activeItems.findIndex(i=>i.pdf===b.pdf);const item=activeItems[index];const figure=imageItem(item,index);figure.classList.add('plan');
        figure.querySelector('h2').textContent='Блок '+b.number;figure.querySelector('small').textContent=b.pages.length+' листов · PDF';
        const links=document.createElement('div');links.className='media-card-links';
        const pdf=document.createElement('a');pdf.href=b.pdf;pdf.download='OrientSquare-Block-'+b.number+'.pdf';pdf.textContent='Скачать PDF';
        const plan=document.createElement('a');plan.href='block-'+b.number+'.html';plan.textContent='Выбрать квартиру';
        links.append(pdf,plan);figure.append(links);grid.append(figure);
      });
    }else{
      activeItems=media[category].filter(i=>!q||(i.label+' '+i.source.split('/').pop()).toLocaleLowerCase('ru').includes(q));
      matchCount=activeItems.length;
      const featured=!q&&activeItems.length>3;
      const shown=featured?activeItems.slice(0,3):activeItems;
      shown.forEach((item,i)=>grid.append(imageItem(item,i)));
      if(featured){
        const row=document.createElement('div');row.className='media-viewall-row';row.style.gridColumn='1/-1';
        const btn=document.createElement('button');btn.type='button';btn.className='media-viewall';
        btn.textContent='Смотреть все '+activeItems.length+' →';
        btn.addEventListener('click',()=>open(0));
        row.append(btn);grid.append(row);
      }
    }
    document.querySelector('#media-count').textContent=matchCount+' '+(category==='blocks'?'блоков':'изображений');
    if(!matchCount){const empty=document.createElement('p');empty.className='media-empty';empty.textContent='Ничего не найдено. Попробуйте другой номер или очистите поиск.';grid.append(empty)}
  }

  /* ---------------- Glass Explorer stage: fan carousel, swipe, zoom ---------------- */
  const OFFSETS=[-2,-1,0,1,2];
  const isPlan = item => !!item.pdf;
  function scaleFor(o){return o===0?1:Math.abs(o)===1?.82:.68}
  function blurFor(o){return o===0?0:Math.abs(o)===1?3:7}
  function opacityFor(o){return o===0?1:Math.abs(o)===1?.55:.16}
  function brightFor(o){return o===0?1:Math.abs(o)===1?.6:.4}
  function stepPx(){return Math.min(stage.clientWidth*0.52, 420)}

  function buildStage(){
    stage.replaceChildren();
    const total=activeItems.length; if(!total) return;
    const step=stepPx();
    OFFSETS.forEach(off=>{
      const idx=((current+off)%total+total)%total;
      const item=activeItems[idx];
      const wrap=document.createElement('div');
      wrap.className='ge-slide'+(off===0?' is-current':'')+(isPlan(item)?' plan':'');
      wrap.dataset.offset=String(off);
      wrap.style.setProperty('--ge-x',(off*step)+'px');
      wrap.style.setProperty('--ge-s',String(scaleFor(off)));
      wrap.style.setProperty('--ge-blur-amt',blurFor(off)+'px');
      wrap.style.setProperty('--ge-o',String(opacityFor(off)));
      wrap.style.setProperty('--ge-bright',String(brightFor(off)));
      wrap.style.zIndex=String(5-Math.abs(off));
      const frame=document.createElement('div');frame.className='ge-slide-frame';
      const img=new Image();img.src=item.src;img.alt=item.label||'';img.loading=off===0?'eager':'lazy';img.decoding='async';
      frame.append(img);
      if(off===0){
        const scrim=document.createElement('div');scrim.className='ge-slide-scrim';
        const left=document.createElement('div');
        const h=document.createElement('p');h.className='ge-slide-label';h.textContent=item.label||'';
        const sub=document.createElement('span');sub.className='ge-slide-sub';sub.textContent=names[category]||'';
        left.append(h,sub);
        const count=document.createElement('span');count.className='ge-slide-count';count.textContent=(current+1)+' / '+total;
        scrim.append(left,count);frame.append(scrim);
      }
      wrap.append(frame);
      stage.append(wrap);
    });
    document.querySelector('#media-lightbox-cat').textContent=names[category]||'';
    document.querySelector('#media-lightbox-title').textContent=activeItems[current].label;
    document.querySelector('#media-position').textContent=(current+1)+' / '+total;
    const item=activeItems[current];
    const dl=document.querySelector('#media-download');dl.href=item.pdf||item.src;dl.download=(item.label||'OrientSquare')+(item.pdf?'.pdf':'.webp');
    document.querySelector('#media-zoom').setAttribute('aria-pressed','false');
  }
  function setZoom(on){
    zoomed=on;
    const frame=stage.querySelector('.ge-slide.is-current .ge-slide-frame');
    if(frame){frame.classList.toggle('zoomed',on);const img=frame.querySelector('img');if(img)img.classList.toggle('zoomed',on)}
    document.querySelector('#media-zoom').setAttribute('aria-pressed',String(on));
  }
  function open(index){current=index;zoomed=false;buildStage();dialog.showModal();document.body.style.overflow='hidden'}
  function step(delta){
    zoomed=false;
    const total=activeItems.length;
    current=(current+delta+total)%total;
    buildStage();
  }

  let dragStartX=null,isDragging=false,moved=false,justDragged=false;
  stage.addEventListener('pointerdown',e=>{
    if(zoomed||!activeItems.length) return;
    isDragging=true;moved=false;dragStartX=e.clientX;
    try{stage.setPointerCapture(e.pointerId)}catch(err){}
    stage.classList.add('dragging');
  });
  stage.addEventListener('pointermove',e=>{
    if(!isDragging) return;
    const dx=e.clientX-dragStartX;
    if(Math.abs(dx)>4) moved=true;
    stage.style.setProperty('--ge-drag',dx+'px');
  });
  function endDrag(e){
    if(!isDragging) return;
    isDragging=false;stage.classList.remove('dragging');
    const dx=(e&&e.clientX!=null)?e.clientX-dragStartX:0;
    stage.style.setProperty('--ge-drag','0px');
    const threshold=Math.max(60,stage.clientWidth*0.12);
    if(dx<=-threshold) step(1);
    else if(dx>=threshold) step(-1);
    if(moved){justDragged=true;setTimeout(()=>{justDragged=false},60)}
  }
  stage.addEventListener('pointerup',endDrag);
  stage.addEventListener('pointercancel',endDrag);
  stage.addEventListener('pointerleave',e=>{if(isDragging) endDrag(e)});
  stage.addEventListener('click',e=>{
    if(justDragged) return;
    const slideEl=e.target.closest('.ge-slide');if(!slideEl) return;
    const off=Number(slideEl.dataset.offset);
    if(off===0) setZoom(!zoomed);
    else step(off>0?1:-1);
  });
  window.addEventListener('resize',()=>{if(dialog.open) buildStage()});

  tabs.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.category;history.replaceState(null,'','#'+category);search.value='';render()}));
  search.addEventListener('input',render);
  window.addEventListener('hashchange',()=>{if(names[location.hash.slice(1)]){category=location.hash.slice(1);render()}});
  document.querySelector('#media-prev').addEventListener('click',()=>step(-1));
  document.querySelector('#media-next').addEventListener('click',()=>step(1));
  document.querySelector('#media-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>document.body.style.overflow='');
  document.querySelector('#media-zoom').addEventListener('click',()=>setZoom(!zoomed));
  dialog.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}
    if(e.key==='ArrowRight'){e.preventDefault();step(1)}
  });
  render();
})();
