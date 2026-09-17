import {normalizeCover,coverGeometry,buttonInk} from '/shared/cover.js';
import {esc} from './ui.js';
export const coverMarkup=source=>`<div class="guest-image-frame"><img src="${esc(source)}" alt="Event cover" draggable="false"></div>`;
export function bindCover(surface,value){
 const image=surface.querySelector('.guest-image-frame img');let pose=normalizeCover(value),geometry;
 const draw=()=>{
  surface.dataset.align=pose.align;surface.dataset.font=pose.font;surface.dataset.buttonTheme=pose.buttonTheme;surface.style.setProperty('--guest-button',pose.buttonColor);surface.style.setProperty('--guest-button-text',buttonInk(pose.buttonColor));
  if(!image.naturalWidth)return;
  geometry=coverGeometry(surface.clientWidth,surface.clientHeight,image.naturalWidth,image.naturalHeight,pose);
  for(const key of ['width','height','left','top'])image.style[key]=`${geometry[key]}px`;
 };
 const observer=new ResizeObserver(draw);observer.observe(surface);image.addEventListener('load',draw);draw();
 return{update(next){pose=normalizeCover(next);draw();},geometry:()=>geometry,dispose(){observer.disconnect();image.removeEventListener('load',draw);}};
}
