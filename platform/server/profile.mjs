import {getCountries,getCountryCallingCode,parsePhoneNumberFromString} from 'libphonenumber-js';
import {text,requireThat} from './security.mjs';
export const phoneCountries=getCountries().map(code=>({code,callingCode:getCountryCallingCode(code)}));
export function profileDetails(input,current={}){
 const first=input.first_name===undefined?(current.first_name||text(input.name,80)):text(input.first_name,50);
 const last=input.last_name===undefined?(current.last_name||''):text(input.last_name,50);
 const country=String(input.phone_country??current.phone_country??'');
 const raw=String(input.phone??current.phone??'').trim();let phone='';
 if(raw){requireThat(raw.length<=40&&getCountries().includes(country),400,'Choose a valid phone country.');const parsed=parsePhoneNumberFromString(raw,{defaultCountry:country,extract:false});requireThat(parsed?.isPossible(),400,'Enter a valid phone number including its country code.');phone=parsed.number;}
 const kind=input.account_type??current.account_type??'personal';requireThat(['personal','business'].includes(kind),400,'Choose personal or business account.');
 const company=kind==='business'?text(input.company_name??current.company_name,120):'';
 return {name:[first,last].filter(Boolean).join(' '),profile:{first_name:first,last_name:last,phone_country:country,phone,account_type:kind,company_name:company}};
}
