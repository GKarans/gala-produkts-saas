import {t,locale} from './i18n.js';
import {state,esc,field} from './ui.js';
export function suggestedCountry(){
 const zone=Intl.DateTimeFormat().resolvedOptions().timeZone;
 const known={'Europe/Riga':'LV','Europe/Vilnius':'LT','Europe/Tallinn':'EE','Europe/London':'GB','Europe/Berlin':'DE','Europe/Paris':'FR','Europe/Warsaw':'PL','Europe/Helsinki':'FI'};
 if(known[zone])return known[zone];
 try{return new Intl.Locale(navigator.language).region||'';}catch{return '';}
}
export function profileFields(user={}){
 const p=user.profile||{},country=p.phone_country||suggestedCountry(),names=new Intl.DisplayNames([locale()],{type:'region'});
 return `<div class="form-grid">${field('First name','first_name',p.first_name||user.name||'','text','required maxlength="50" autocomplete="given-name"')}${field('Last name','last_name',p.last_name||'','text','required maxlength="50" autocomplete="family-name"')}</div><div class="form-grid"><div class="field"><label for="phone-country">${t('Country calling code')}</label><select id="phone-country" name="phone_country" autocomplete="country"><option value="">${t('Choose country')}</option>${(state.config.phoneCountries||[]).map(c=>({...c,label:names.of(c.code)})).sort((a,b)=>a.label.localeCompare(b.label)).map(c=>`<option value="${c.code}" ${c.code===country?'selected':''}>${esc(c.label)} (+${c.callingCode})</option>`).join('')}</select></div>${field('Phone number (optional)','phone',p.phone||'','tel','maxlength="40" autocomplete="tel"')}</div><div class="field"><label for="account-type">${t('Account type')}</label><select id="account-type" name="account_type"><option value="personal" ${p.account_type!=='business'?'selected':''}>${t('Personal')}</option><option value="business" ${p.account_type==='business'?'selected':''}>${t('Business')}</option></select></div><div id="company-fields" ${p.account_type!=='business'?'hidden':''}>${field('Company name','company_name',p.company_name||'','text','maxlength="120" autocomplete="organization"')}</div>`;
}
export function wireProfileFields(form){const type=form.elements.account_type,company=form.querySelector('#company-fields');const update=()=>{company.hidden=type.value!=='business';form.elements.company_name.required=!company.hidden;};type.onchange=update;update();}
