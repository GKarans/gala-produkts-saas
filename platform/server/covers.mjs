import {loadSharp} from './image-runtime.mjs';
import {uuid,requireThat,Fault} from './security.mjs';

export async function replaceCover(db,files,events,user,eventId,data,validateImage){
 requireThat(typeof data==='string'&&data.length<9*1024**2,413,'Choose a smaller cover.');
 const initial=await events.own(user,eventId);
 let photo;
 try{const source=Buffer.from(data,'base64');if(validateImage){await validateImage(source);photo=source;}else{const sharp=await loadSharp();photo=await sharp(source,{limitInputPixels:40e6}).rotate().resize({width:1600,withoutEnlargement:true}).webp({quality:82}).toBuffer();}}
 catch{throw new Fault(415,'This cover could not be opened.');}
 const key=`${initial.storage_prefix}/covers/${uuid()}.webp`,cleanupId=uuid();
 // Reserve cleanup before writing. A crash or failed attachment leaves a recoverable job.
 await db.query("insert into jobs(id,owner_id,event_id,type,payload,available_at) values($1,$2,$3,'object-cleanup',$4,now()+interval '10 minutes')",[cleanupId,user.id,eventId,{keys:[key]}]);
 await files.put(key,photo);
 await db.transaction(async tx=>{
  const e=await events.own(user,eventId,tx);
  requireThat(['draft','published'].includes(e.status)&&Date.parse(e.retention_at)>Date.now(),409,'This event can no longer be redesigned.');
  const reservation=(await tx.query('select status from jobs where id=$1 for update',[cleanupId])).rows[0];
  requireThat(reservation?.status==='queued',409,'The cover upload took too long. Choose the photo again.');
  await tx.query('update events set appearance=$1::jsonb where id=$2',[{...e.appearance,cover:`/api/covers/${e.id}`,cover_key:key},e.id]);
  await tx.query('delete from jobs where id=$1',[cleanupId]);
  if(e.appearance.cover_key)await tx.query("insert into jobs(id,owner_id,event_id,type,payload) values($1,$2,$3,'object-cleanup',$4)",[uuid(),user.id,eventId,{keys:[e.appearance.cover_key]}]);
 });
 return {ok:true};
}
