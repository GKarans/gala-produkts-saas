import sharp from 'sharp';
import {uuid,requireThat,Fault} from './security.mjs';

export async function replaceCover(db,files,events,user,eventId,data){
 requireThat(typeof data==='string'&&data.length<9*1024**2,413,'Choose a smaller cover.');
 const initial=await events.own(user,eventId);
 let photo;
 try{photo=await sharp(Buffer.from(data,'base64'),{limitInputPixels:40e6}).rotate().resize({width:1600,withoutEnlargement:true}).webp({quality:82}).toBuffer();}
 catch{throw new Fault(415,'This cover could not be opened.');}
 const key=`${initial.storage_prefix}/covers/${uuid()}.webp`,cleanupId=uuid();
 // Reserve cleanup before writing. A crash or failed attachment leaves a recoverable job.
 await db.query("insert into jobs(id,owner_id,event_id,type,payload,available_at) values($1,$2,$3,'object-cleanup',$4,now()+interval '10 minutes')",[cleanupId,user.id,eventId,JSON.stringify({keys:[key]})]);
 await files.put(key,photo);
 await db.transaction(async tx=>{
  const e=await events.own(user,eventId,tx);
  requireThat(['draft','published'].includes(e.status)&&Date.parse(e.ends_at)>Date.now(),409,'A completed or archived event cannot be redesigned.');
  const reservation=(await tx.query('select status from jobs where id=$1 for update',[cleanupId])).rows[0];
  requireThat(reservation?.status==='queued',409,'The cover upload took too long. Choose the photo again.');
  await tx.query('update events set appearance=appearance||$1::jsonb where id=$2',[JSON.stringify({cover:`/api/covers/${e.id}`,cover_key:key}),e.id]);
  await tx.query('delete from jobs where id=$1',[cleanupId]);
  if(e.appearance.cover_key)await tx.query("insert into jobs(id,owner_id,event_id,type,payload) values($1,$2,$3,'object-cleanup',$4)",[uuid(),user.id,eventId,JSON.stringify({keys:[e.appearance.cover_key]})]);
 });
 return {ok:true};
}
