import {t} from './i18n.js';
import {modal,esc,icon,date} from './ui.js';

export function photoViewer(photos,index=0){
 if(!photos.length)return;
 let current=Math.max(0,Math.min(index,photos.length-1)),start;
 const d=modal('Photo',`<div class="photo-stage"><img class="preview-image" alt=""><p class="photo-load" role="status"></p><button class="icon photo-prev" aria-label="${t('Previous photo')}">${icon('chevron-left')}</button><button class="icon photo-next" aria-label="${t('Next photo')}">${icon('chevron-right')}</button></div><div class="photo-footer"><p class="preview-caption"></p><a class="button photo-download" download>${icon('download')}${t('Download photo')}</a></div>`);
 d.classList.add('photo-dialog');
 const image=d.querySelector('img'),status=d.querySelector('.photo-load'),prev=d.querySelector('.photo-prev'),next=d.querySelector('.photo-next');
 const render=()=>{
  const p=photos[current];image.hidden=true;status.textContent=t('Loading photo…');
  image.alt=`Photo by ${p.guest}`;image.src=`/api/photos/${encodeURIComponent(p.id)}/photo`;
  d.querySelector('.preview-caption').textContent=`${current+1} / ${photos.length} · ${p.guest} · ${date(p.created_at)}`;
  d.querySelector('.photo-download').href=image.src+'?download';prev.disabled=current===0;next.disabled=current===photos.length-1;
 };
 image.onload=()=>{image.hidden=false;status.textContent='';};
 image.onerror=()=>{image.hidden=true;status.textContent=t('Photo unavailable. Close and try again.');};
 const move=delta=>{const target=current+delta;if(target>=0&&target<photos.length){current=target;render();}};
 prev.onclick=()=>move(-1);next.onclick=()=>move(1);
 d.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowLeft'?-1:1);}};
 const stage=d.querySelector('.photo-stage');
 stage.addEventListener('touchstart',e=>{start=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
 stage.addEventListener('touchend',e=>{if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;start=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx>0?-1:1);},{passive:true});
 stage.addEventListener('touchcancel',()=>{start=null;});
 render();return d;
}
