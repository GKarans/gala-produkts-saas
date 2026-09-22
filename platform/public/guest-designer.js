import {COVERS} from '/shared/covers.js';
import {DESIGN_FONTS} from '/shared/fonts.js';
import {esc,icon,icons,field,date,toast,wireForm} from './ui.js';
import {normalizeCover,moveCover} from '/shared/cover.js';
import {bindCover,coverMarkup} from './cover-view.js';
import {optimize} from './upload.js';

 const tool=(id,name,symbol)=>`<button type="button" class="icon" id="${id}" aria-label="${name}" title="${name}">${icon(symbol)}</button>`;
export function designerLayout(e){
 return `<section class="guest-designer"><div class="designer-heading"><h2>Guest page</h2><button form="design-form" class="primary" type="submit" id="save-design">${icon('check')}Save guest page</button></div><div class="designer-layout"><form id="design-form" class="designer-properties"><div class="designer-section"><h3>Cover</h3><div class="field"><label for="cover-preset">Cover collection</label><select id="cover-preset"><option value="">Current photo</option>${COVERS.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div><input id="cover-file" type="file" accept="image/jpeg,image/png,image/webp" hidden><button id="replace-cover" type="button">${icon('image-plus')}Replace photo</button><div class="cover-tools">${tool('zoom-out','Zoom out','minus')}<output id="cover-zoom">100%</output>${tool('zoom-in','Zoom in','plus')}${tool('reset-cover','Reset photo position','maximize')}${tool('undo-cover','Undo framing change','undo-2')}</div></div><div class="designer-section"><h3>Text</h3>${field('Title','title',e.appearance.title||e.name,'text','required maxlength="80"')}${field('Subtitle','subtitle',e.appearance.subtitle||'','text','maxlength="180"')}${field('Camera button','button',e.appearance.button||'Take a photo','text','required maxlength="28"')}${field('Photo selection button','chooseButton',e.appearance.chooseButton||'Choose photos','text','required maxlength="28"')}<div class="style-controls"><div class="segmented" role="group" aria-label="Text alignment">${['left','center','right'].map(a=>`<button type="button" class="icon" data-align="${a}" title="Align ${a}" aria-label="Align ${a}" aria-pressed="false">${icon('align-'+a)}</button>`).join('')}</div><select id="guest-font" aria-label="Title typeface">${DESIGN_FONTS.map(font=>`<option value="${font.id}">${font.label}</option>`).join('')}</select></div><label class="small">Button color</label><div class="swatches" role="group" aria-label="Button color">${['white','forest','rose'].map(c=>`<button type="button" class="swatch swatch-${c}" data-color="${c}" title="${c} button" aria-label="${c} button" aria-pressed="false"></button>`).join('')}<label class="swatch custom-swatch" title="Custom button color"><input id="custom-button-color" type="color" aria-label="Custom button color" value="${normalizeCover(e.appearance).buttonColor}"></label></div></div><p class="error" role="alert"></p></form><div class="designer-preview"><div class="designer-preview-bar"><div class="segmented" role="tablist" aria-label="Guest screen"><button type="button" role="tab" aria-selected="true" data-screen="welcome">${icon('user-round')}Welcome</button><button type="button" role="tab" aria-selected="false" data-screen="camera">${icon('camera')}Camera</button></div><span class="small muted">390 × 760</span></div><div class="designer-stage" id="designer-stage" role="group" aria-label="Guest page preview"><div class="guest-cover editor-surface" tabindex="0" aria-label="Move cover photo" title="Move cover photo with pointer or arrow keys">${coverMarkup(e.appearance.cover)}<div class="guest-top"><span>${icon('aperture')} Lumiq</span><button type="button" class="small hidden" id="editor-photographer">Alex ${icon('pencil')}</button></div><div class="guest-title"><h1 data-edit="title"></h1><p data-edit="subtitle"></p><p>${date(e.starts_at)} – ${date(e.ends_at)}</p></div><div class="guest-form" id="editor-welcome"><div class="field"><label>Your name</label><input aria-label="Sample guest name" value="Alex" readonly tabindex="-1"></div><p>Your name appears alongside your photos. Privacy notice</p><button type="button" tabindex="-1">Join the gathering ${icon('arrow-right')}</button></div><div class="guest-controls hidden" id="editor-camera"><button class="secondary" type="button" data-edit="button">${icon('camera')}<span></span></button><button type="button" data-edit="chooseButton">${icon('images')}<span></span></button><p class="small">Alex · Photos stay private until the organizer shares the gallery.</p></div></div></div></div></div></section>`;
}

export function wireDesigner(e,save){
 const form=document.getElementById('design-form'),surface=document.querySelector('.editor-surface'),stage=document.getElementById('designer-stage'),image=surface.querySelector('.guest-image-frame img');
 let coverPreset='',pose=normalizeCover(e.appearance),history=[],drag,coverBlob,objectUrl,disposed=false;
 const binding=bindCover(surface,pose);
 const layout=()=>{const scale=stage.clientWidth/390;surface.style.transform=`scale(${scale})`;stage.style.height=`${760*scale}px`;};
 const sizeObserver=new ResizeObserver(layout);sizeObserver.observe(stage);layout();
 const update=()=>{
  binding.update(pose);surface.querySelector('[data-edit=title]').textContent=form.elements.title.value;
  surface.querySelector('[data-edit=subtitle]').textContent=form.elements.subtitle.value;
  surface.querySelector('[data-edit=button] span').textContent=form.elements.button.value;surface.querySelector('[data-edit=chooseButton] span').textContent=form.elements.chooseButton.value;
  document.getElementById('cover-zoom').textContent=`${Math.round(pose.zoom*100)}%`;
  document.getElementById('zoom-out').disabled=pose.zoom<=1;document.getElementById('zoom-in').disabled=pose.zoom>=3;document.getElementById('undo-cover').disabled=!history.length;
  document.querySelectorAll('[data-align]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.align===pose.align)));
  document.querySelectorAll('[data-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.color===pose.buttonTheme)));
  document.getElementById('guest-font').value=pose.font;
 };
 const snapshot=()=>{history.push({...pose});if(history.length>30)history.shift();};
 const change=next=>{snapshot();pose=normalizeCover({...pose,...next});update();};
 form.addEventListener('input',event=>{if(['title','subtitle','button','chooseButton'].includes(event.target.name))update();});
 document.getElementById('zoom-out').onclick=()=>change({zoom:pose.zoom-.1});document.getElementById('zoom-in').onclick=()=>change({zoom:pose.zoom+.1});
 document.getElementById('reset-cover').onclick=()=>change({positionX:50,position:50,zoom:1});
 document.getElementById('undo-cover').onclick=()=>{if(history.length){pose=history.pop();update();}};
 document.querySelectorAll('[data-align]').forEach(b=>b.onclick=()=>change({align:b.dataset.align}));
 document.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>change({buttonTheme:b.dataset.color}));
 document.getElementById('custom-button-color').oninput=e=>change({buttonTheme:'custom',buttonColor:e.target.value});
 document.getElementById('guest-font').onchange=b=>change({font:b.target.value});
 document.querySelectorAll('[data-screen]').forEach(b=>b.onclick=()=>{
  const camera=b.dataset.screen==='camera';document.querySelectorAll('[data-screen]').forEach(t=>t.setAttribute('aria-selected',String(t===b)));
  document.getElementById('editor-welcome').classList.toggle('hidden',camera);document.getElementById('editor-camera').classList.toggle('hidden',!camera);document.getElementById('editor-photographer').classList.toggle('hidden',!camera);
 });
 surface.querySelectorAll('[data-edit]').forEach(el=>{el.tabIndex=0;el.title=`Edit ${el.dataset.edit}`;el.onclick=()=>form.elements[el.dataset.edit].focus();el.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();form.elements[el.dataset.edit].focus();}};});
 surface.onpointerdown=event=>{
  if(event.button!==0||event.target.closest('button,input,[data-edit]'))return;
  const geometry=binding.geometry();if(!geometry)return;
  snapshot();drag={x:event.clientX,y:event.clientY,pose:{...pose},geometry,scale:stage.clientWidth/390};surface.setPointerCapture(event.pointerId);surface.classList.add('dragging');event.preventDefault();
 };
 surface.onpointermove=event=>{if(!drag)return;pose=moveCover(drag.pose,drag.geometry,(event.clientX-drag.x)/drag.scale,(event.clientY-drag.y)/drag.scale);update();};
 const end=()=>{drag=null;surface.classList.remove('dragging');};surface.onpointerup=end;surface.onpointercancel=end;
 surface.addEventListener('keydown',event=>{if(event.target!==surface||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const geometry=binding.geometry();if(geometry){snapshot();const step=event.shiftKey?30:8;pose=moveCover(pose,geometry,event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0,event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0);update();}});
 document.getElementById('cover-preset').onchange=event=>{const preset=COVERS.find(c=>c.id===event.target.value);coverPreset=preset?.id||'';coverBlob=null;image.src=preset?.url||e.appearance.cover;change({zoom:1,positionX:50,position:50});};
 document.getElementById('replace-cover').onclick=()=>document.getElementById('cover-file').click();
 document.getElementById('cover-file').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;const saveButton=document.getElementById('save-design');saveButton.disabled=true;
  try{const result=await optimize(file);if(disposed)return;coverBlob=result.photo;coverPreset='';document.getElementById('cover-preset').value='';if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(coverBlob);image.src=objectUrl;change({zoom:1,positionX:50,position:50});}
  catch(error){toast(error.message,true);}finally{if(!disposed)saveButton.disabled=false;event.target.value='';}
 };
 wireForm(form,async input=>{const button=document.getElementById('save-design');button.disabled=true;try{await save({...input,...pose,coverPreset},coverBlob);}finally{if(!disposed)button.disabled=false;}});
 update();icons();
 return()=>{disposed=true;sizeObserver.disconnect();binding.dispose();if(objectUrl)URL.revokeObjectURL(objectUrl);};
}
