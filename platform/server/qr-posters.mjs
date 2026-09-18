import sharp from 'sharp';
import QRCode from 'qrcode';
import {uuid,requireThat,Fault} from './security.mjs';

export const QR_TEMPLATES=['garden','vintage','celebration','modern','custom'];

const xml=value=>String(value).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
const sizes={square:[1600,1600],a5:[1748,2480],table:[2480,1748]};

function decoration(template,width,height){
 const flower=(x,y,s,color)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="${color}" opacity=".92"><ellipse cx="0" cy="-32" rx="20" ry="38"/><ellipse cx="30" cy="-8" rx="20" ry="38" transform="rotate(65 30 -8)"/><ellipse cx="18" cy="27" rx="20" ry="38" transform="rotate(140 18 27)"/><ellipse cx="-18" cy="27" rx="20" ry="38" transform="rotate(220 -18 27)"/><ellipse cx="-30" cy="-8" rx="20" ry="38" transform="rotate(295 -30 -8)"/><circle r="13" fill="#f3c96b"/></g>`;
 if(template==='garden')return `<rect width="100%" height="100%" fill="#eef2e6"/><path d="M0 360 Q210 80 500 0M${width} 360 Q${width-210} 80 ${width-500} 0M0 ${height-360} Q210 ${height-80} 500 ${height}M${width} ${height-360} Q${width-210} ${height-80} ${width-500} ${height}" fill="none" stroke="#6f8d69" stroke-width="26" opacity=".7"/>${flower(145,155,1.5,'#d88868')}${flower(width-145,155,1.5,'#d88868')}${flower(145,height-155,1.5,'#9ab48b')}${flower(width-145,height-155,1.5,'#9ab48b')}`;
 if(template==='vintage')return `<rect width="100%" height="100%" fill="#f7f0df"/><rect x="58" y="58" width="${width-116}" height="${height-116}" rx="10" fill="none" stroke="#a96d3f" stroke-width="8"/><rect x="78" y="78" width="${width-156}" height="${height-156}" rx="8" fill="none" stroke="#c59c62" stroke-width="3"/><path d="M90 220 C220 80 350 260 460 90M${width-90} 220 C${width-220} 80 ${width-350} 260 ${width-460} 90M90 ${height-220} C220 ${height-80} 350 ${height-260} 460 ${height-90}M${width-90} ${height-220} C${width-220} ${height-80} ${width-350} ${height-260} ${width-460} ${height-90}" fill="none" stroke="#776b3b" stroke-width="17" stroke-linecap="round"/>`;
 if(template==='celebration')return `<rect width="100%" height="100%" fill="#173e31"/><circle cx="150" cy="180" r="38" fill="#eebf73"/><circle cx="${width-180}" cy="250" r="28" fill="#e99586"/><circle cx="240" cy="${height-220}" r="24" fill="#8dc5b0"/><circle cx="${width-160}" cy="${height-150}" r="42" fill="#eebf73"/><path d="M0 500 Q${width/2} 50 ${width} 500M0 ${height-500} Q${width/2} ${height-50} ${width} ${height-500}" fill="none" stroke="#f6efe4" stroke-width="5" opacity=".35"/><path d="M120 350l45 25m80-170l20 50m${width-430} 40l-30 55m100 80l55-20M180 ${height-410}l50-25m${width-330} ${height-330}l35 48" stroke="#f6efe4" stroke-width="12" stroke-linecap="round"/>`;
 return `<rect width="100%" height="100%" fill="#e6edf5"/><circle cx="${width*.12}" cy="${height*.15}" r="${Math.min(width,height)*.12}" fill="#d9a67f"/><circle cx="${width*.9}" cy="${height*.82}" r="${Math.min(width,height)*.18}" fill="#74a899"/><path d="M${width*.08} ${height*.9} Q${width*.35} ${height*.65} ${width*.58} ${height*.92}" fill="none" stroke="#173e31" stroke-width="18"/><rect x="80" y="80" width="${width-160}" height="${height-160}" rx="48" fill="none" stroke="#173e31" stroke-width="5"/>`;
}

export async function renderQrPoster({event,target,format='qr',template='garden',customBackground,lang='en'}){
 requireThat(['qr',...Object.keys(sizes)].includes(format),400,'Choose a supported QR print format.');
 requireThat(QR_TEMPLATES.includes(template),400,'Choose a supported QR design.');
 const qr=await QRCode.toBuffer(target,{width:1200,margin:4,errorCorrectionLevel:'H'});
 if(format==='qr')return qr;
 const [width,height]=sizes[format],portrait=height>width;
 const qrSize=Math.min(portrait?980:720,width-320,height-(portrait?950:650));
 const qrLeft=Math.round((width-qrSize)/2),qrTop=portrait?Math.round(height*.38):Math.round(height*.31);
 const panelX=qrLeft-74,panelY=qrTop-74,panelW=qrSize+148,panelH=qrSize+148;
 let base;
 if(template==='custom'){
  requireThat(customBackground,409,'Upload a custom QR background first.');
  base=await sharp(customBackground).resize(width,height,{fit:'cover'}).png().toBuffer();
 }else base=await sharp(Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${decoration(template,width,height)}</svg>`)).png().toBuffer();
 const dark=template==='celebration',ink=dark?'#fffaf0':'#173e31',panel='#fffefb';
 const eventDate=new Intl.DateTimeFormat(lang==='lv'?'lv-LV':'en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:event.time_zone||'UTC'}).format(new Date(event.starts_at));
 const titleY=portrait?270:210,copyY=portrait?385:300;
 const copy=lang==='lv'?'Noskenē un pievieno savus foto':'Scan to share your photos',foot=lang==='lv'?'Bez lietotnes un viesa konta. Viena kopīga galerija.':'No app. No guest account. One shared gallery.';
 const overlay=Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><style>.brand{font:700 52px Arial,sans-serif;fill:${ink}}.title{font:700 ${portrait?76:70}px Georgia,serif;fill:${ink}}.date{font:34px Arial,sans-serif;fill:${ink};opacity:.82}.copy{font:34px Arial,sans-serif;fill:${ink}}.foot{font:24px Arial,sans-serif;fill:${ink};opacity:.75}</style><text x="${width/2}" y="110" text-anchor="middle" class="brand">LUMIQ</text><text x="${width/2}" y="${titleY}" text-anchor="middle" class="title">${xml(event.name.slice(0,52))}</text><text x="${width/2}" y="${copyY}" text-anchor="middle" class="date">${xml(eventDate)}</text><rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="42" fill="${panel}" opacity=".97"/><text x="${width/2}" y="${qrTop+qrSize+150}" text-anchor="middle" class="copy">${copy}</text><text x="${width/2}" y="${height-105}" text-anchor="middle" class="foot">${foot}</text></svg>`);
 return sharp(base).composite([{input:overlay,left:0,top:0},{input:await sharp(qr).resize(qrSize,qrSize).png().toBuffer(),left:qrLeft,top:qrTop}]).png().toBuffer();
}

export async function replaceQrBackground(db,files,events,user,eventId,data){
 requireThat(typeof data==='string'&&data.length<12*1024**2,413,'Choose a smaller QR background.');
 const initial=await events.own(user,eventId);
 let image;
 try{image=await sharp(Buffer.from(data,'base64'),{limitInputPixels:40e6,failOn:'warning'}).rotate().resize({width:1748,height:2480,fit:'cover'}).webp({quality:86}).toBuffer();}
 catch{throw new Fault(415,'This QR background could not be opened. Use JPEG, PNG or WebP.');}
 const key=`${initial.storage_prefix}/qr/${uuid()}.webp`,cleanupId=uuid();
 await db.query("insert into jobs(id,owner_id,event_id,type,payload,available_at) values($1,$2,$3,'object-cleanup',$4,now()+interval '10 minutes')",[cleanupId,user.id,eventId,JSON.stringify({keys:[key]})]);
 await files.put(key,image);
 await db.transaction(async tx=>{
  const event=await events.own(user,eventId,tx);
  requireThat(['draft','published'].includes(event.status)&&Date.parse(event.ends_at)>Date.now(),409,'A completed or archived event cannot be redesigned.');
  await tx.query('update events set appearance=appearance||$1::jsonb where id=$2',[JSON.stringify({qr_background_key:key}),event.id]);
  await tx.query('delete from jobs where id=$1',[cleanupId]);
  if(event.appearance.qr_background_key)await tx.query("insert into jobs(id,owner_id,event_id,type,payload) values($1,$2,$3,'object-cleanup',$4)",[uuid(),user.id,eventId,JSON.stringify({keys:[event.appearance.qr_background_key]})]);
 });
 return {ok:true};
}
