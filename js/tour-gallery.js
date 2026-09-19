(() => {
  'use strict';
  const $=id=>document.getElementById(id), data=window.PROJECT_MEDIA;
  const source={photos:data.photos,rooms:data.rooms,blocks:data.blocks.flatMap(b=>b.pages.map(p=>({...p,id:`block-${b.number}-${p.page}`,label:`Блок ${b.number} · Лист ${p.page}`})))};
  let group=new URLSearchParams(location.search).get('category')||'photos';if(!source[group])group='photos';
  let items=source[group],index=0,yaw=0,pitch=0,fov=66,auto=false,down=false,startX=0,startY=0,lastX=0,lastY=0,moved=0,page=-1,loadVersion=0;
  let renderer,scene,camera,panels=[],frames=[],raycaster,pointer,loopHandle;
  const textures=new Map(),canvas=$('tour-canvas'),fallback=$('tour-fallback');
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function getTexture(item){
    if(textures.has(item.src))return textures.get(item.src);
    const promise=new Promise((resolve,reject)=>new THREE.TextureLoader().load(item.src,t=>{t.encoding=THREE.sRGBEncoding;t.anisotropy=4;resolve(t)},undefined,reject));
    textures.set(item.src,promise);return promise;
  }
  function initScene(){
    renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputEncoding=THREE.sRGBEncoding;
    scene=new THREE.Scene();scene.background=new THREE.Color('#29232f');scene.fog=new THREE.Fog('#29232f',14,32);
    camera=new THREE.PerspectiveCamera(fov,innerWidth/innerHeight,.1,70);camera.position.set(0,1.8,0);
    scene.add(new THREE.HemisphereLight(0xfff6ee,0x584260,1.2));
    const floor=new THREE.Mesh(new THREE.CircleGeometry(20,80),new THREE.MeshStandardMaterial({color:0x79707a,roughness:.84}));floor.rotation.x=-Math.PI/2;scene.add(floor);
    const ceiling=new THREE.Mesh(new THREE.CircleGeometry(20,80),new THREE.MeshBasicMaterial({color:0x302936,side:THREE.DoubleSide}));ceiling.rotation.x=Math.PI/2;ceiling.position.y=6;scene.add(ceiling);
    const wall=new THREE.Mesh(new THREE.CylinderGeometry(11,11,6,64,1,true),new THREE.MeshStandardMaterial({color:0xe5dfdb,roughness:1,side:THREE.BackSide}));wall.position.y=3;scene.add(wall);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(10.4,.025,6,100),new THREE.MeshBasicMaterial({color:0xffba79}));ring.rotation.x=Math.PI/2;ring.position.y=5.7;scene.add(ring);
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4, holder=new THREE.Group();holder.position.set(Math.sin(angle)*9,2.65,Math.cos(angle)*9);holder.lookAt(0,2.65,0);
      const frame=new THREE.Mesh(new THREE.BoxGeometry(4.7,3.32,.12),new THREE.MeshStandardMaterial({color:0x514650,roughness:.6}));holder.add(frame);
      const panel=new THREE.Mesh(new THREE.PlaneGeometry(4.5,3.12),new THREE.MeshBasicMaterial({color:0xffffff}));panel.position.z=.075;panel.userData.slot=i;holder.add(panel);
      const spot=new THREE.PointLight(0xffe6c9,.6,6);spot.position.set(holder.position.x*.82,4.8,holder.position.z*.82);scene.add(spot);
      scene.add(holder);panels.push(panel);frames.push(holder);
    }
    raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();resize();
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();showFallback()});
    let previous=performance.now();
    function draw(now){const dt=Math.min((now-previous)/1000,.05);previous=now;if(auto&&!down&&!document.hidden&&!$('tour-photo-dialog').open)yaw+=dt*.065;camera.lookAt(Math.sin(yaw)*10,1.8+Math.tan(pitch)*10,Math.cos(yaw)*10);renderer.render(scene,camera);loopHandle=requestAnimationFrame(draw)}
    loopHandle=requestAnimationFrame(draw);
  }
  function showFallback(){if(loopHandle)cancelAnimationFrame(loopHandle);renderer=null;canvas.hidden=true;fallback.hidden=false;$('tour-loading').hidden=true;$('fallback-image').src=items[index].src;$('fallback-image').alt=items[index].label;}
  async function loadPage(){
    if(!renderer)return;
    const nextPage=Math.floor(index/8);if(page===nextPage)return;page=nextPage;const version=++loadVersion;$('tour-loading').hidden=false;
    const promises=panels.map(async(panel,i)=>{
      const item=items[page*8+i];frames[i].visible=!!item;if(!item)return;
      panel.userData.index=page*8+i;panel.material.map=null;panel.material.color.setHex(0xeae5e1);panel.material.needsUpdate=true;
      try{const texture=await getTexture(item);if(version!==loadVersion)return;const aspect=texture.image.width/texture.image.height;let w=4.5,h=w/aspect;if(h>3.12){h=3.12;w=h*aspect}panel.scale.set(w/4.5,h/3.12,1);panel.material.map=texture;panel.material.color.setHex(0xffffff);panel.material.needsUpdate=true}catch{panel.material.color.setHex(0x70217a)}
    });await Promise.allSettled(promises);if(version===loadVersion)$('tour-loading').hidden=true;
  }
  function select(i){
    index=(i+items.length)%items.length;yaw=(index%8)*Math.PI/4;pitch=.04;
    $('tour-selected-title').textContent=items[index].label;$('tour-position').textContent=`${index+1} / ${items.length}`;
    [...$('tour-thumbnails').children].forEach((b,j)=>b.setAttribute('aria-pressed',String(index===j)));
    const selected=$('tour-thumbnails').children[index];selected?.scrollIntoView({block:'nearest',inline:'nearest',behavior:reduceMotion?'instant':'smooth'});
    if(renderer)loadPage();else{$('fallback-image').src=items[index].src;$('fallback-image').alt=items[index].label}
  }
  function changeGroup(value){
    group=value;items=source[group];page=-1;
    document.querySelectorAll('[data-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.group===group)));
    history.replaceState(null,'','?category='+group);$('tour-thumbnails').replaceChildren();
    items.forEach((item,i)=>{const b=document.createElement('button');b.setAttribute('aria-label',item.label);b.setAttribute('aria-pressed','false');const im=new Image();im.src=item.thumb;im.alt='';im.loading='lazy';b.append(im);b.addEventListener('click',()=>select(i));$('tour-thumbnails').append(b)});select(0);
  }
  function openPhoto(){const item=items[index];$('tour-photo-large').src=item.src;$('tour-photo-large').alt=item.label;$('tour-photo-label').textContent=item.label;$('tour-photo-dialog').showModal()}
  function resize(){if(renderer){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}}
  function zoom(delta){fov=Math.max(35,Math.min(90,fov+delta));if(camera){camera.fov=fov;camera.updateProjectionMatrix()}}
  try{if(!window.THREE)throw Error('3D engine unavailable');initScene()}catch{showFallback()}
  canvas.addEventListener('pointerdown',e=>{down=true;startX=lastX=e.clientX;startY=lastY=e.clientY;moved=0;canvas.setPointerCapture(e.pointerId);canvas.focus()});
  canvas.addEventListener('pointermove',e=>{if(!down)return;yaw-=(e.clientX-lastX)*.004;pitch=Math.max(-.65,Math.min(.65,pitch+(e.clientY-lastY)*.003));lastX=e.clientX;lastY=e.clientY;moved=Math.hypot(e.clientX-startX,e.clientY-startY)});
  canvas.addEventListener('pointerup',e=>{down=false;if(moved<6&&renderer){pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(panels.filter(p=>p.parent.visible))[0];if(hit){select(hit.object.userData.index);openPhoto()}}});canvas.addEventListener('pointercancel',()=>down=false);
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY*.025)},{passive:false});
  window.addEventListener('resize',resize);
  document.addEventListener('keydown',e=>{if($('tour-photo-dialog').open)return;if(e.target instanceof HTMLButtonElement&&e.key==='Enter')return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')yaw+=.1;if(e.key==='ArrowRight')yaw-=.1;if(e.key==='ArrowUp')pitch=Math.min(.65,pitch+.05);if(e.key==='ArrowDown')pitch=Math.max(-.65,pitch-.05);if(e.key==='+'||e.key==='=')zoom(-4);if(e.key==='-')zoom(4);if(e.key==='Escape')$('tour-instructions').hidden=true});
  document.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>changeGroup(b.dataset.group)));
  $('tour-prev').onclick=()=>select(index-1);$('tour-next').onclick=()=>select(index+1);$('tour-open').onclick=openPhoto;
  $('tour-auto').onclick=()=>{auto=!auto;$('tour-auto').setAttribute('aria-pressed',String(auto))};
  $('tour-fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('tour-fullscreen').title='Полный экран недоступен в этом браузере'}};
  $('tour-help').onclick=()=>$('tour-instructions').hidden=!$('tour-instructions').hidden;$('tour-help-close').onclick=()=>$('tour-instructions').hidden=true;
  $('tour-photo-close').onclick=()=>$('tour-photo-dialog').close();changeGroup(group);
})();
