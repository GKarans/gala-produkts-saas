export const PLANS = Object.freeze({
 trial: {id:'trial',name:'Explore',price:0,billing:'trial',events:1,photos:50,bytes:300*1024**2,retentionDays:7,shareDays:4,durationDays:1,description:'A small gathering, a proper test.'},
 single: {id:'single',name:'Single Event',price:1500,billing:'one_time',events:1,photos:500,bytes:2000*1024**2,retentionDays:14,shareDays:7,durationDays:3,description:'One occasion. One payment. No subscription.'},
 gathering: {id:'gathering',name:'Gathering',price:3000,billing:'monthly',events:4,photos:500,bytes:2000*1024**2,retentionDays:14,shareDays:7,durationDays:3,description:'Four gatherings in every paid billing period.'},
 studio: {id:'studio',name:'Studio',price:7000,billing:'monthly',events:12,photos:1000,bytes:4000*1024**2,retentionDays:30,shareDays:14,durationDays:3,description:'For people who bring people together.'}
});
export const VERSION='platform-local-0.1';
export function eventState(e,now=Date.now()) {
 if(e.status==='draft'||e.status==='archived'||e.status==='deleted')return e.status;
 if(e.retention_at&&Date.parse(e.retention_at)<=now)return 'archived';
 if(now>=Date.parse(e.ends_at))return 'completed';
 if(now<Date.parse(e.starts_at))return 'scheduled';
 return e.paused?'paused':'live';
}
export function safeName(value){return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'untitled';}
export function folder(name,id){if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error('Invalid identifier');return `${safeName(name)}--${id}`;}
