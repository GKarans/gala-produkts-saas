import {safeName} from './plans.js';

const compactId=id=>String(id).replaceAll('-','').toLowerCase();

export function shortStorageId(id,offset=26){
 const value=compactId(id);
 if(!/^[0-9a-f]{32}$/.test(value)||!Number.isInteger(offset)||offset<0||offset>26)throw new Error('Invalid storage identifier');
 return value.slice(offset,offset+6);
}

export function organizerLabel(name,profile={}){
 const data=typeof profile==='string'?JSON.parse(profile||'{}'):profile||{};
 return data.account_type==='business'&&data.company_name?data.company_name:name;
}

export function organizerFolder(label,id){
 const suffix=/^[0-9a-f]{6}$/i.test(String(id))?String(id).toLowerCase():shortStorageId(id);
 return `${safeName(label)}-${suffix}`;
}
const suffix=id=>/^[0-9a-f]{6}$/i.test(String(id))?String(id).toLowerCase():shortStorageId(id);
export function eventFolder(name,id){return `${safeName(name)}-${suffix(id)}`;}

export function photographerFolder(name,id){return `${safeName(name)}-${suffix(id)}`;}

export function photoObjectName(photographer,capturedAt,id){
 const date=new Date(capturedAt);
 if(Number.isNaN(date.valueOf()))throw new Error('Invalid photo capture time');
 const stamp=date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 return `${safeName(photographer)}-${stamp}-${suffix(id)}.webp`;
}
