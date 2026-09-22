const DB='lumiq-upload-queue',STORE='photos';
const open=()=>new Promise((resolve,reject)=>{const request=indexedDB.open(DB,1);request.onupgradeneeded=()=>request.result.createObjectStore(STORE,{keyPath:'key'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
const run=async(mode,work)=>{if(!('indexedDB'in window))return null;const db=await open(),tx=db.transaction(STORE,mode),store=tx.objectStore(STORE),result=await work(store);await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});db.close();return result;};
const request=result=>new Promise((resolve,reject)=>{result.onsuccess=()=>resolve(result.result);result.onerror=()=>reject(result.error);});
export const uploadStore={
 async list(scope){try{return(await run('readonly',store=>request(store.getAll()))||[]).filter(item=>item.scope===scope).sort((a,b)=>a.added-b.added);}catch{return[];}},
 async save(scope,item){try{await run('readwrite',store=>request(store.put({key:`${scope}:${item.id}`,scope,id:item.id,name:item.name,file:item.file,added:item.added||Date.now()})));return true;}catch{return false;}},
 async remove(scope,id){try{await run('readwrite',store=>request(store.delete(`${scope}:${id}`)));}catch{}},
};
