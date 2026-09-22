import {api,toast} from './ui.js';
export const curationControls=()=>`<button data-curate="favorite">Favorite</button><button data-curate="unfavorite">Unfavorite</button><button data-curate="hide">Hide</button><button data-curate="restore">Restore</button><button data-curate="cover">Set cover</button>`;
export function wireCuration(eventId,selected,reload){
 document.querySelectorAll('[data-curate]').forEach(button=>button.onclick=async()=>{
  const ids=[...selected],action=button.dataset.curate;if(action==='cover'&&ids.length!==1){toast('Choose exactly one photo for the gallery cover.',true);return;}
  button.disabled=true;try{await api(`/events/${eventId}/curate`,{method:'POST',body:{action,ids}});selected.clear();document.getElementById('selection')?.classList.add('hidden');await reload();toast(action==='cover'?'Gallery cover selected.':'Gallery updated.');}catch(error){toast(error.message,true);}finally{button.disabled=false;}
 });
}
