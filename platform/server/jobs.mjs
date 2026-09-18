import {PassThrough} from 'node:stream';
import {Zip,ZipPassThrough,strToU8} from 'fflate';
import {uuid,requireThat,hash} from './security.mjs';
import sharp from 'sharp';
import {collectNotices} from './notifications.mjs';
import {localized} from './locale.mjs';
import {sendAlert} from './alerts.mjs';
export function jobService(db,files,mail){
 let running=false;
 const queue=async(owner,event,type,payload={})=>{const id=uuid();await db.query('insert into jobs(id,owner_id,event_id,type,payload) values($1,$2,$3,$4,$5)',[id,owner,event,type,JSON.stringify(payload)]);return{id};};
 const exportJob=async job=>{
  const items=(await db.query("select m.*,g.name as guest from media m join guests g on g.id=m.guest_id where m.event_id=$1 and m.id=any($2::uuid[]) and m.status='uploaded' order by m.created_at,m.id",[job.event_id,job.payload.ids])).rows;
  requireThat(items.length===job.payload.ids.length,409,'Photos changed after this export was requested. Create a new export.');
  const parts=[];let batch=[],bytes=0,index=0;
  const flush=async()=>{
   if(!batch.length)return;
   const key=`exports/${job.event_id}/${job.id}/part-${++index}.zip`,output=new PassThrough({highWaterMark:1024*1024});
   let archiveBytes=0;
   const finished=new Promise((resolve,reject)=>{
    const zip=new Zip((error,chunk,final)=>{
     if(error){output.destroy(error);reject(error);return;}
     archiveBytes+=chunk.length;output.write(Buffer.from(chunk));
     if(final){output.end();resolve();}
    });
    (async()=>{
     try{
      for(const item of batch){const entry=new ZipPassThrough(item.name);zip.add(entry);entry.push(await files.get(item.object_key),true);}
      const manifest=new ZipPassThrough('manifest.json');zip.add(manifest);manifest.push(strToU8(JSON.stringify(batch.map(({id,photographer,captured})=>({id,photographer,captured,format:'optimized WebP'})),null,2)),true);zip.end();
     }catch(error){zip.terminate();output.destroy(error);reject(error);}
    })();
   });
   await Promise.all([files.putStream(key,output,'application/zip'),finished]);
   parts.push({key,name:`event-photos-${index}.zip`,bytes:archiveBytes,count:batch.length});
   await db.query('update jobs set result=$1 where id=$2',[JSON.stringify({parts,partial:true}),job.id]);
   batch=[];bytes=0;
  };
  for(const m of items){await db.query("update jobs set lease_until=now()+interval '10 minutes' where id=$1",[job.id]);if(batch.length&&bytes+Number(m.bytes)>64*1024**2)await flush();batch.push({id:m.id,photographer:m.guest,captured:m.created_at,object_key:m.object_key,name:`${m.guest.replace(/[^\p{L}\p{N}_-]/gu,'_').slice(0,60)}-${m.id}.webp`});bytes+=Number(m.bytes);}
  await flush();return{parts,count:items.length,expires_at:new Date(Date.now()+7*86400000).toISOString()};
 };
 const cleanup=async job=>{
  if(job.type==='object-cleanup'){for(const key of job.payload.keys||[])await files.remove(key);return{removed:job.payload.keys?.length||0};}
  if(job.type==='thumbnail-repair'){
   const m=(await db.query("select * from media where id=$1 and event_id=$2 and status='uploaded'",[job.payload.id,job.event_id])).rows[0];
   requireThat(m,404,'Photo no longer available.');
   const thumb=await sharp(await files.get(m.object_key),{limitInputPixels:40e6}).rotate().resize({width:360,height:360,fit:'inside',withoutEnlargement:true}).webp({quality:74}).toBuffer();
   await files.put(m.thumbnail_key,thumb);
   await db.query("update media set thumbnail_bytes=$1,thumbnail_checksum=$2 where id=$3 and status='uploaded'",[thumb.length,hash(thumb),m.id]);
   return{repaired:m.id};
  }
  requireThat(['cleanup','media-cleanup'].includes(job.type),400,'Unknown maintenance job.');
  const isEvent=job.type==='cleanup';const rows=(await db.query(isEvent?'select * from media where event_id=$1':"select * from media where event_id=$1 and id=any($2::uuid[]) and status='deleted'",isEvent?[job.event_id]:[job.event_id,job.payload.ids])).rows;for(const m of rows){await files.remove(m.object_key);await files.remove(m.thumbnail_key);}if(isEvent){const event=(await db.query('select appearance from events where id=$1',[job.event_id])).rows[0];if(event?.appearance.cover_key)await files.remove(event.appearance.cover_key);const exports=(await db.query("select result from jobs where event_id=$1 and type='export'",[job.event_id])).rows;for(const e of exports)for(const part of e.result.parts||[])await files.remove(part.key);await db.query("update media set status='deleted',deleted_at=now() where event_id=$1",[job.event_id]);await db.query("update events set status='deleted',share_enabled=false where id=$1",[job.event_id]);}return{removed:rows.length};};
 return{
  queue,
  async inspect(eventId){const rows=(await db.query("select * from media where event_id=$1 and status<>'deleted' order by created_at limit 5000",[eventId])).rows,issues=[];for(const m of rows){for(const [variant,key]of [['photo',m.object_key],['thumbnail',m.thumbnail_key]])try{await files.size(key);}catch{issues.push({id:m.id,status:m.status,variant,key});}}return{checked:rows.length,issues};},
  async requestExport(user,event,input){requireThat(Date.now()>=Date.parse(event.ends_at),409,'Exports become available after the event.');const ids=input.ids;if(ids)requireThat(Array.isArray(ids)&&ids.length>0&&ids.length<=5000,400,'Choose photos to export.');const rows=(await db.query("select id from media where event_id=$1 and status='uploaded'"+(ids?' and id=any($2::uuid[])':''),ids?[event.id,ids]:[event.id])).rows;requireThat(rows.length&&(!ids||rows.length===new Set(ids).size),400,'No photos or some selected photos are unavailable.');const snapshot=rows.map(x=>x.id).sort();const previous=(await db.query("select id from jobs where owner_id=$1 and event_id=$2 and type='export' and status in ('queued','processing','ready') and payload=$3 and created_at>now()-interval '6 days' order by created_at desc limit 1",[user.id,event.id,JSON.stringify({ids:snapshot})])).rows[0];return previous||queue(user.id,event.id,'export',{ids:snapshot});},
  async retry(user,id,admin=false){const result=await db.query("update jobs set status='queued',available_at=now(),error=null,attempts=0 where id=$1 and status='failed' and ($3 or owner_id=$2) returning id",[id,user.id,admin]);requireThat(result.rows.length,404,'Job not available for retry.');return{ok:true};},
  async tick(){if(running)return;running=true;try{
   await db.query("update jobs set status='queued' where status='processing' and lease_until<now()");
   const job=await db.transaction(async tx=>{const j=(await tx.query("select * from jobs where status='queued' and available_at<=now() order by created_at for update skip locked limit 1")).rows[0];if(j)await tx.query("update jobs set status='processing',attempts=attempts+1,lease_until=now()+interval '10 minutes' where id=$1",[j.id]);return j;});if(!job)return;
   try{const result=job.type==='export'?await exportJob(job):await cleanup(job);await db.query("update jobs set status='ready',result=$1,updated_at=now(),error=null where id=$2",[JSON.stringify(result),job.id]);const account=(await db.query('select * from accounts where id=$1',[job.owner_id])).rows[0];if(account&&job.type==='export')await mail(account,localized(account,'Your photo export is ready','Tavs foto eksports ir gatavs'),localized(account,'Your optimized photo archive is ready in your event workspace.','Optimizēto foto arhīvs ir gatavs pasākuma darba vietā.'),`export:${job.id}`);}
   catch(error){const retry=job.attempts<2;await db.query('update jobs set status=$1,error=$2,available_at=now()+interval \'30 seconds\',updated_at=now() where id=$3',[retry?'queued':'failed','This job could not finish. Your photos remain available. Retry or contact support.',job.id]);console.error(JSON.stringify({level:'error',component:'jobs',job:job.id,type:job.type,error:error.status||'processing-failed'}));if(!retry)await sendAlert('background-job-failed',{job:job.id,type:job.type}).catch(alertError=>console.error(JSON.stringify({level:'error',component:'alerts',error:alertError.message})));}
  }finally{running=false;}},
  async retention(){await collectNotices(db);await db.query('delete from request_limits where expires_at<now()');
   const pending=(await db.query("select m.id,m.event_id,e.owner_id from media m join events e on e.id=m.event_id where m.status='pending' and m.created_at<now()-interval '24 hours'")).rows;
   for(const m of pending)await db.transaction(async tx=>{const r=await tx.query("update media set status='deleted',deleted_at=now() where id=$1 and status='pending' returning id",[m.id]);if(r.rows.length)await tx.query("insert into jobs(id,owner_id,event_id,type,payload) values($1,$2,$3,'media-cleanup',$4)",[uuid(),m.owner_id,m.event_id,JSON.stringify({ids:[m.id]})]);});
   const expired=(await db.query("select * from jobs where type='export' and status='ready' and result->>'expires_at' is not null and (result->>'expires_at')::timestamptz<=now() and not (result ? 'cleaned')")).rows;
   for(const j of expired)await db.transaction(async tx=>{await tx.query("insert into jobs(id,owner_id,event_id,type,payload) values($1,$2,$3,'object-cleanup',$4)",[uuid(),j.owner_id,j.event_id,JSON.stringify({keys:(j.result.parts||[]).map(p=>p.key)})]);await tx.query("update jobs set result=result||'{\"cleaned\":true}'::jsonb where id=$1",[j.id]);});
   await db.query("update subscriptions set status='ended' where period_end<=now() and (cancel_at_end=true or plan='trial')");
   const rows=(await db.query("select e.* from events e where e.retention_at<=now() and e.status<>'deleted' and not exists(select 1 from jobs j where j.event_id=e.id and j.type='cleanup' and j.status in ('queued','processing'))")).rows;for(const e of rows)await queue(e.owner_id,e.id,'cleanup');const remind=(await db.query("select e.*,a.email,a.name as account_name,a.preferences from events e join accounts a on a.id=e.owner_id where e.retention_at between now() and now()+interval '7 days' and e.status<>'deleted'")).rows;for(const e of remind){const account={id:e.owner_id,email:e.email,preferences:e.preferences};await mail(account,localized(account,'Your photo retention period is ending','Foto glabāšanas periods drīz beigsies'),localized(account,`${e.name}: download your photos before ${new Date(e.retention_at).toISOString().slice(0,10)}.`,`${e.name}: lejupielādē foto līdz ${new Date(e.retention_at).toISOString().slice(0,10)}.`),`retention:${e.id}:${e.retention_at}`);}await db.query("delete from sessions where expires_at<now();").catch(()=>{});}
 };
}
