import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {ROOT} from './db.mjs';
import {uuid,hash,passwordHash} from './security.mjs';
import {PLANS,folder} from '../shared/plans.js';
export const DEMO_EMAIL='demo@gatherframe.local';
export const DEMO_PASSWORD='Local-demo-only-2026';
export async function seedLocal(app){
 for(const name of ['garden-gathering','wedding-toast']){
  const file=path.join(ROOT,'public/assets',`${name}.png`);const output=path.join(ROOT,'public/assets',`${name}.webp`);
  await sharp(await readFile(file)).resize({width:1536,withoutEnlargement:true}).webp({quality:85}).toFile(output);
 }
 if((await app.db.query('select id from accounts where email=$1',[DEMO_EMAIL])).rows.length)return;
 const owner=uuid();await app.db.query('insert into accounts(id,email,name,password_hash,verified,role) values($1,$2,$3,$4,true,\'admin\')',[owner,DEMO_EMAIL,'Alex Morgan',await passwordHash(DEMO_PASSWORD)]);await app.db.query("insert into subscriptions(account_id,plan,status,period_end) values($1,'studio','active',now()+interval '30 days')",[owner]);
 for(const [name,slug,days,asset,count]of [['The summer gathering','sample-gathering',0,'garden-gathering',6],['Sophie & Oliver','sample-wedding',-2,'wedding-toast',12],['Studio evening','sample-studio',5,'garden-gathering',0]]){
  const id=uuid(),prefix=`events/${folder(name,id)}`;const start=new Date(Date.now()+days*86400000-(days===0?3600000:0)).toISOString(),end=new Date(Date.parse(start)+8*3600000).toISOString();await app.db.query('insert into events(id,owner_id,slug,name,description,starts_at,ends_at,time_zone,status,appearance,storage_prefix,entitlement,retention_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',[id,owner,slug,name,'A sample event with generated photos. You can explore the complete local workflow.',start,end,'Europe/Riga',days>0?'draft':'published',JSON.stringify({title:name,subtitle:'A little moment, from your point of view.',button:'Take a photo',cover:`/assets/${asset}.webp`,position:50}),prefix,JSON.stringify(PLANS.studio),new Date(Date.parse(end)+180*86400000).toISOString()]);
  if(days<=0)await app.db.query("insert into event_publications(event_id,owner_id,source,entitlement) values($1,$2,'subscription',$3) on conflict do nothing",[id,owner,JSON.stringify(PLANS.studio)]);
  const guests=[];for(const name of ['Alex','Sophie','Jamie']){const g=uuid();const storagePrefix=`${prefix}/guests/${folder(name,g)}`;await app.db.query('insert into guests(id,event_id,name,token_hash,storage_prefix) values($1,$2,$3,$4,$5)',[g,id,name,hash(uuid()),storagePrefix]);guests.push({id:g,prefix:storagePrefix});}
  for(let i=0;i<count;i++){const g=guests[i%3],mid=uuid();const source=await readFile(path.join(ROOT,`public/assets/${i%2?'wedding-toast':'garden-gathering'}.webp`));const photo=await sharp(source).resize({width:1200}).webp({quality:82}).toBuffer(),thumb=await sharp(source).resize({width:360}).webp({quality:72}).toBuffer();const key=`${g.prefix}/photo-${mid}.webp`,thumbnail=`${g.prefix}/thumb-${mid}.webp`;await app.files.put(key,photo);await app.files.put(thumbnail,thumb);await app.db.query("insert into media(id,event_id,guest_id,object_key,thumbnail_key,name,bytes,thumbnail_bytes,checksum,thumbnail_checksum,status,created_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'uploaded',$11)",[mid,id,g.id,key,thumbnail,`sample-${i+1}.webp`,photo.length,thumb.length,hash(photo),hash(thumb),new Date(Date.parse(start)+i*60000).toISOString()]);}
 }
}
