let openMenu=null;

function closeMenu(){
 if(!openMenu)return;
 const {list,trigger}=openMenu;list.remove();trigger.setAttribute('aria-expanded','false');trigger.focus({preventScroll:true});openMenu=null;
}

export function enhanceSelectMenus(root=document){
 for(const select of root.querySelectorAll('select:not([data-select-enhanced])')){
  select.dataset.selectEnhanced='true';
  const wrapper=document.createElement('div');wrapper.className='select-menu';select.before(wrapper);wrapper.append(select);
  const label=select.getAttribute('aria-label')||(select.id?document.querySelector(`label[for="${CSS.escape(select.id)}"]`)?.textContent?.trim():'')||'';
  const trigger=document.createElement('button');trigger.type='button';trigger.className='select-menu-trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-label',label);trigger.setAttribute('aria-expanded','false');
  const list=document.createElement('div');list.className='select-menu-list';list.setAttribute('role','listbox');list.setAttribute('aria-label',label);list.hidden=true;const portal=select.closest('dialog')||document.body;portal.append(list);
  const sync=()=>{const option=select.selectedOptions[0];trigger.textContent=option?.textContent||'';trigger.disabled=select.disabled;for(const item of list.querySelectorAll('[role=option]'))item.setAttribute('aria-selected',String(item.dataset.value===select.value));};
  const refresh=()=>{list.replaceChildren(...[...select.options].filter(option=>!option.hidden).map(option=>{const item=document.createElement('button');item.type='button';item.className='select-menu-option';item.setAttribute('role','option');item.dataset.value=option.value;item.textContent=option.textContent;item.disabled=option.disabled;return item;}));sync();};
  const position=()=>{const rect=trigger.getBoundingClientRect();list.style.left=`${Math.max(8,Math.min(rect.left,innerWidth-rect.width-8))}px`;list.style.top=`${rect.bottom+4}px`;list.style.width=`${rect.width}px`;list.style.maxHeight=`${Math.max(40,innerHeight-rect.bottom-8)}px`;};
  trigger.onclick=()=>{if(openMenu?.trigger===trigger){closeMenu();return;}if(openMenu)closeMenu();refresh();position();portal.append(list);list.hidden=false;trigger.setAttribute('aria-expanded','true');openMenu={trigger,list};const selected=list.querySelector('[aria-selected=true]');if(selected)list.scrollTop=Math.max(0,selected.offsetTop-list.offsetTop);};
  trigger.onkeydown=event=>{if(['ArrowDown','ArrowUp','Enter',' '].includes(event.key)){event.preventDefault();trigger.click();list.querySelector('[aria-selected=true]')?.focus();}};
  list.onclick=event=>{const item=event.target.closest('[role=option]');if(!item)return;select.value=item.dataset.value;closeMenu();select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));};
  list.onkeydown=event=>{const options=[...list.querySelectorAll('[role=option]:not(:disabled)')],index=options.indexOf(document.activeElement);if(event.key==='Escape'){event.preventDefault();closeMenu();return;}if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();options[(index+(event.key==='ArrowDown'?1:-1)+options.length)%options.length]?.focus();}if(event.key==='Enter'||event.key===' '){event.preventDefault();document.activeElement?.click();}};
  select.addEventListener('change',sync);wrapper.append(trigger);sync();
 }
}

document.addEventListener('click',event=>{if(openMenu&&!openMenu.list.contains(event.target)&&!openMenu.trigger.contains(event.target))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&openMenu)closeMenu();});
window.addEventListener('resize',()=>{if(openMenu)closeMenu();});
window.addEventListener('scroll',event=>{if(openMenu&&!openMenu.list.contains(event.target)&&!openMenu.trigger.contains(event.target))closeMenu();},true);
