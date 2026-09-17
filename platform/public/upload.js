import {api,esc,icon,icons,toast} from './ui.js';
async function canvasBlob(canvas,quality){const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));if(!blob||blob.type!=='image/webp')throw new Error('Your browser cannot prepare this photo format. Update the browser or use a recent Chrome or Safari.');return blob;}
export async function optimize(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose JPEG, PNG or WebP photos. Export HEIC/HEIF photos as JPEG first.');
 if(file.size>30*1024**2)throw new Error('This source photo is over 30 MB. Choose a smaller copy.');
 let bitmap;try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});}catch{throw new Error('This photo could not be opened. Try a different JPEG or PNG.');}
 try{if(bitmap.width*bitmap.height>60e6)throw new Error('This photo has too many pixels. Choose a smaller copy.');const scale=Math.min(1,2400/Math.max(bitmap.width,bitmap.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(bitmap.width*scale));c.height=Math.max(1,Math.round(bitmap.height*scale));c.getContext('2d').drawImage(bitmap,0,0,c.width,c.height);let photo=await canvasBlob(c,.84);if(photo.size>6291456)photo=await canvasBlob(c,.65);if(photo.size>6291456)throw new Error('The optimized photo is still over 6 MB. Choose a smaller copy.');const t=document.createElement('canvas'),ratio=Math.min(1,360/Math.max(c.width,c.height));t.width=Math.max(1,Math.round(c.width*ratio));t.height=Math.max(1,Math.round(c.height*ratio));t.getContext('2d').drawImage(c,0,0,t.width,t.height);return{photo,thumb:await canvasBlob(t,.74)};}finally{bitmap.close();}
}
const digest=async blob=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');
function put(url,blob,token,onprogress,signal,remoteHeaders){return new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('PUT',url);xhr.timeout=120000;for(const [k,v]of Object.entries(remoteHeaders||{'X-Guest-Token':token,'Content-Type':'image/webp'}))xhr.setRequestHeader(k,v);xhr.upload.onprogress=e=>onprogress(e.lengthComputable?e.loaded/e.total:0);xhr.onload=()=>{if(xhr.status>=200&&xhr.status<300)resolve();else{let message;try{message=JSON.parse(xhr.responseText).error;}catch{}const error=new Error(message||'Upload failed. Try again.');error.status=xhr.status;reject(error);}};xhr.onerror=()=>reject(new Error('Connection lost. Retry when you are online.'));xhr.ontimeout=()=>reject(new Error('Upload timed out. Please retry.'));xhr.onabort=()=>reject(new Error('Upload canceled.'));signal.addEventListener('abort',()=>xhr.abort(),{once:true});if(signal.aborted){reject(new Error('Upload canceled.'));return;}xhr.send(blob);});}
export function photoQueue(slug,guest,host){let queue=[],running=0,disposed=false;
 const headers={'X-Guest-Token':guest.token};
 const render=()=>{if(disposed)return;host.innerHTML=queue.length?`<div class="queue"><strong class="small">${queue.filter(q=>q.status==='uploaded').length} uploaded · ${queue.filter(q=>q.status==='failed').length} need attention</strong>${queue.map(q=>`<article class="queue-item"><img src="${q.preview}" alt="Selected photo"><div><p>${esc(q.name)}</p><small>${esc(q.message||q.status)}</small><progress max="100" value="${q.progress}" aria-label="Upload progress"></progress></div>${q.status==='failed'?`<button class="icon" data-retry="${q.id}" aria-label="Retry photo" title="Retry photo">${icon('rotate-cw')}</button>`:q.status!=='uploaded'?`<button class="icon" data-remove="${q.id}" aria-label="Remove photo" title="Remove photo">${icon('x')}</button>`:icon('circle-check')}</article>`).join('')}</div>`:'';host.querySelectorAll('[data-retry]').forEach(b=>b.onclick=()=>{const q=queue.find(x=>x.id===b.dataset.retry);q.status='queued';q.message='';pump();});host.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{const q=queue.find(x=>x.id===b.dataset.remove);q.controller?.abort();q.removed=true;URL.revokeObjectURL(q.preview);queue=queue.filter(x=>x!==q);render();});icons();};
 const process=async q=>{
  q.controller=new AbortController();q.status='preparing';render();
  try{
   if(!q.photo){Object.assign(q,await optimize(q.file));q.checksum=await digest(q.photo);q.thumbnail_checksum=await digest(q.thumb);q.file=null;}
   if(q.removed)return;q.status='uploading';q.progress=10;render();
   const reserved=await api(`/guest/${slug}/reserve`,{method:'POST',headers,body:{id:q.id,name:q.name,bytes:q.photo.size,thumbnail_bytes:q.thumb.size,checksum:q.checksum,thumbnail_checksum:q.thumbnail_checksum}});
   q.reserved=true;
   if(q.removed)return;
   if(reserved.status!=='uploaded'){
    for(const [kind,blob,flag,start,range]of [['photo',q.photo,'sentPhoto',10,65],['thumb',q.thumb,'sentThumb',75,20]]){
     if(!q[flag]){const target=reserved.targets?.[kind];await put(target?.url||`/api/guest/${slug}/content/${q.id}/${kind}`,blob,guest.token,p=>{q.progress=start+p*range;render();},q.controller.signal,target?.headers);q[flag]=true;}
     if(q.removed)return;
    }
    await api(`/guest/${slug}/finalize`,{method:'POST',headers,body:{id:q.id}});
   }
   q.status='uploaded';q.message='Photo uploaded!';q.progress=100;q.photo=null;q.thumb=null;toast('Photo uploaded!');
  }catch(e){if(!q.removed){const transient=(!e.status||e.status>=500||e.status===429)&&q.photo&&!disposed;
    if(transient&&(q.retries||0)<2){q.retries=(q.retries||0)+1;q.status='waiting';q.message='Connection interrupted. Retrying...';setTimeout(()=>{if(!q.removed&&!disposed){q.status='queued';pump();}},q.retries*2000);}
    else{q.status='failed';q.message=e.message;}
  }}finally{
   if(q.removed&&q.reserved)api(`/guest/${slug}/discard`,{method:'POST',headers,body:{id:q.id}}).catch(()=>{});
   running--;render();pump();
  }
 };
 const pump=()=>{render();if(disposed)return;while(running<2){const q=queue.find(q=>q.status==='queued');if(!q)break;running++;process(q);}};
 const beforeUnload=e=>{if(queue.some(q=>!['uploaded','failed'].includes(q.status))){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',beforeUnload);
 return{async add(files){const list=[...files];if(list.length>20||queue.filter(q=>q.status!=='uploaded').length+list.length>20){toast('Choose up to 20 photos at a time.',true);return;}if(list.reduce((s,f)=>s+f.size,0)>150*1024**2){toast('This selection exceeds 150 MB. Add fewer photos at a time.',true);return;}for(const f of list)queue.push({id:crypto.randomUUID(),name:f.name,file:f,preview:URL.createObjectURL(f),status:'queued',progress:0});pump();},pending:()=>queue.some(q=>q.status!=='uploaded'),dispose(){disposed=true;window.removeEventListener('beforeunload',beforeUnload);for(const q of queue){q.controller?.abort();URL.revokeObjectURL(q.preview);}}};
}
