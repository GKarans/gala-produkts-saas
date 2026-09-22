import sharp from 'sharp';
import QRCode from 'qrcode';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {uuid,requireThat,Fault} from './security.mjs';
import {ROOT} from './db.mjs';
import {FONT_IDS,normalizeFont} from '../shared/fonts.js';

export const QR_TEMPLATES=['garden','vintage','celebration','modern','custom'];
export const QR_FONTS=FONT_IDS;
export const DEFAULT_QR_LAYOUT={template:'garden',font:'playfair-display',titleSize:76,textX:.5,textY:.15,qrX:.5,qrY:.57,qrScale:1};

const xml=value=>String(value).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
const sizes={table:[2480,1748]},fontCache=new Map();
const number=(value,min,max,fallback)=>{const parsed=Number(value);return Number.isFinite(parsed)?Math.min(max,Math.max(min,parsed)):fallback;};
async function embeddedFont(id){if(!fontCache.has(id))fontCache.set(id,readFile(path.join(ROOT,'public','assets','fonts',`${id}.ttf`)).then(bytes=>bytes.toString('base64')));return fontCache.get(id);}

export function normalizeQrLayout(input={}){
 return {
  template:QR_TEMPLATES.includes(input.template)?input.template:DEFAULT_QR_LAYOUT.template,
  font:normalizeFont(input.font),
  titleSize:Math.round(number(input.titleSize,48,104,DEFAULT_QR_LAYOUT.titleSize)),
  textX:number(input.textX,.18,.82,DEFAULT_QR_LAYOUT.textX),
  textY:number(input.textY,.10,.38,DEFAULT_QR_LAYOUT.textY),
  qrX:number(input.qrX,.18,.82,DEFAULT_QR_LAYOUT.qrX),
  qrY:number(input.qrY,.34,.76,DEFAULT_QR_LAYOUT.qrY),
  qrScale:number(input.qrScale,.72,1.18,DEFAULT_QR_LAYOUT.qrScale)
 };
}

function decoration(template,width,height){
 const flower=(x,y,s,color)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="${color}" opacity=".82"><ellipse cx="0" cy="-32" rx="20" ry="38"/><ellipse cx="30" cy="-8" rx="20" ry="38" transform="rotate(65 30 -8)"/><ellipse cx="18" cy="27" rx="20" ry="38" transform="rotate(140 18 27)"/><ellipse cx="-18" cy="27" rx="20" ry="38" transform="rotate(220 -18 27)"/><ellipse cx="-30" cy="-8" rx="20" ry="38" transform="rotate(295 -30 -8)"/><circle r="13" fill="#f3c96b"/></g>`;
 if(template==='garden')return `<rect width="100%" height="100%" fill="#eef2e6"/><path d="M0 360 Q210 80 500 0M${width} 360 Q${width-210} 80 ${width-500} 0M0 ${height-360} Q210 ${height-80} 500 ${height}M${width} ${height-360} Q${width-210} ${height-80} ${width-500} ${height}" fill="none" stroke="#6f8d69" stroke-width="24" opacity=".55"/>${flower(145,155,1.5,'#d88868')}${flower(width-145,155,1.5,'#d88868')}${flower(145,height-155,1.5,'#9ab48b')}${flower(width-145,height-155,1.5,'#9ab48b')}`;
 if(template==='vintage')return `<rect width="100%" height="100%" fill="#f7f0df"/><rect x="58" y="58" width="${width-116}" height="${height-116}" rx="10" fill="none" stroke="#a96d3f" stroke-width="8"/><rect x="78" y="78" width="${width-156}" height="${height-156}" rx="8" fill="none" stroke="#c59c62" stroke-width="3"/><path d="M90 220 C220 80 350 260 460 90M${width-90} 220 C${width-220} 80 ${width-350} 260 ${width-460} 90M90 ${height-220} C220 ${height-80} 350 ${height-260} 460 ${height-90}M${width-90} ${height-220} C${width-220} ${height-80} ${width-350} ${height-260} ${width-460} ${height-90}" fill="none" stroke="#776b3b" stroke-width="17" stroke-linecap="round" opacity=".72"/>`;
 if(template==='celebration')return `<rect width="100%" height="100%" fill="#173e31"/><circle cx="150" cy="180" r="38" fill="#eebf73"/><circle cx="${width-180}" cy="250" r="28" fill="#e99586"/><circle cx="240" cy="${height-220}" r="24" fill="#8dc5b0"/><circle cx="${width-160}" cy="${height-150}" r="42" fill="#eebf73"/><path d="M0 500 Q${width/2} 50 ${width} 500M0 ${height-500} Q${width/2} ${height-50} ${width} ${height-500}" fill="none" stroke="#f6efe4" stroke-width="5" opacity=".28"/><path d="M120 350l45 25m80-170l20 50m${width-430} 40l-30 55m100 80l55-20M180 ${height-410}l50-25m${width-330} ${height-330}l35 48" stroke="#f6efe4" stroke-width="12" stroke-linecap="round"/>`;
 return `<rect width="100%" height="100%" fill="#e6edf5"/><circle cx="${width*.12}" cy="${height*.15}" r="${Math.min(width,height)*.12}" fill="#d9a67f" opacity=".82"/><circle cx="${width*.9}" cy="${height*.82}" r="${Math.min(width,height)*.18}" fill="#74a899" opacity=".82"/><path d="M${width*.08} ${height*.9} Q${width*.35} ${height*.65} ${width*.58} ${height*.92}" fill="none" stroke="#173e31" stroke-width="18" opacity=".75"/><rect x="80" y="80" width="${width-160}" height="${height-160}" rx="48" fill="none" stroke="#173e31" stroke-width="5"/>`;
}

export async function renderQrPoster({event,target,format='qr',layout:input={},customBackground,lang='en'}){
 requireThat(['qr',...Object.keys(sizes)].includes(format),400,'Choose a supported QR print format.');
 const layout=normalizeQrLayout(input);
 requireThat(layout.template!=='custom'||customBackground,409,'Upload a custom QR background first.');
 const qr=await QRCode.toBuffer(target,{width:1200,margin:4,errorCorrectionLevel:'H'});
 if(format==='qr')return qr;
 if(layout.template==='custom')return sharp(customBackground).png().toBuffer();
 const [width,height]=sizes[format],minSide=Math.min(width,height);
 const qrSize=Math.round(minSide*.43*layout.qrScale),qrPanelW=qrSize+132,qrPanelH=qrSize+220;
 const qrCenterX=Math.round(number(layout.qrX,qrPanelW/(2*width),(width-qrPanelW/2)/width,.5)*width);
 const qrCenterY=Math.round(number(layout.qrY,qrPanelH/(2*height),(height-qrPanelH/2)/height,.57)*height);
 const qrLeft=Math.round(qrCenterX-qrSize/2),qrTop=Math.round(qrCenterY-qrPanelH/2+62);
 const base=await sharp(Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${decoration(layout.template,width,height)}</svg>`)).png().toBuffer();
 const eventDate=new Intl.DateTimeFormat(lang==='lv'?'lv-LV':'en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:event.time_zone||'UTC'}).format(new Date(event.starts_at));
 const requested=layout.titleSize*(minSide/1600),fitted=Math.floor(width*.64/Math.max(8,event.name.length)*1.7),titleSize=Math.max(34,Math.min(requested,fitted));
 const fontData=await embeddedFont(layout.font),light=layout.template==='celebration',titleInk=light?'#fffaf0':'#142f27',secondaryInk=light?'#f3eee5':'#334c43';
 const textPanelW=Math.round(width*.72),textPanelH=Math.round(Math.max(210,titleSize+145)),textX=Math.round(layout.textX*width),textY=Math.round(layout.textY*height);
 const textLeft=Math.round(Math.min(width-textPanelW-55,Math.max(55,textX-textPanelW/2))),textTop=Math.round(Math.min(height-textPanelH-55,Math.max(55,textY-textPanelH/2)));
 const copy=lang==='lv'?'Noskenē un pievieno savus foto':'Scan to share your photos',foot=lang==='lv'?'Bez lietotnes un viesa konta. Viena kopīga galerija.':'No app. No guest account. One shared gallery.';
 const overlay=Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><style>@font-face{font-family:PosterFont;src:url(data:font/ttf;base64,${fontData})}.brand{font:700 ${Math.round(44*minSide/1600)}px PosterFont,sans-serif;fill:${titleInk};letter-spacing:4px}.title{font:700 ${titleSize}px PosterFont,sans-serif;fill:${titleInk}}.date{font:${Math.round(31*minSide/1600)}px PosterFont,sans-serif;fill:${secondaryInk}}.copy{font:${Math.round(32*minSide/1600)}px PosterFont,sans-serif;fill:#173e31}.foot{font:${Math.round(22*minSide/1600)}px PosterFont,sans-serif;fill:${secondaryInk}}</style><text x="${textLeft+textPanelW/2}" y="${textTop+58}" text-anchor="middle" class="brand">LUMIQ</text><text x="${textLeft+textPanelW/2}" y="${textTop+125+titleSize*.15}" text-anchor="middle" class="title">${xml(event.name.slice(0,52))}</text><text x="${textLeft+textPanelW/2}" y="${textTop+textPanelH-34}" text-anchor="middle" class="date">${xml(eventDate)}</text><rect x="${qrCenterX-qrPanelW/2}" y="${qrCenterY-qrPanelH/2}" width="${qrPanelW}" height="${qrPanelH}" rx="42" fill="#fffefb" opacity=".97"/><text x="${qrCenterX}" y="${qrTop+qrSize+78}" text-anchor="middle" class="copy">${copy}</text><text x="${width/2}" y="${height-67}" text-anchor="middle" class="foot">${foot}</text></svg>`);
 return sharp(base).composite([{input:overlay,left:0,top:0},{input:await sharp(qr).resize(qrSize,qrSize).png().toBuffer(),left:qrLeft,top:qrTop}]).png().toBuffer();
}

export async function saveQrLayout(db,events,user,eventId,input){
 const event=await events.own(user,eventId),layout=normalizeQrLayout(input);
 requireThat(layout.template!=='custom'||event.appearance.qr_background_key,409,'Upload a custom QR background first.');
 requireThat(['draft','published'].includes(event.status)&&Date.parse(event.ends_at)>Date.now(),409,'A completed or archived event cannot be redesigned.');
 await db.query('update events set appearance=appearance||$1::jsonb where id=$2',[JSON.stringify({qr_layout:layout}),event.id]);
 return layout;
}

export async function replaceQrBackground(db,files,events,user,eventId,data){
 requireThat(typeof data==='string'&&data.length<12*1024**2,413,'Choose a smaller QR background.');
 const initial=await events.own(user,eventId);
 let image;
 try{image=await sharp(Buffer.from(data,'base64'),{limitInputPixels:40e6,failOn:'warning'}).rotate().resize({width:3200,height:3200,fit:'inside',withoutEnlargement:true}).webp({quality:90}).toBuffer();}
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
