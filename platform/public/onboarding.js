import {esc,icon} from './ui.js';
export function onboarding(events){
 const event=events.find(item=>item.state!=='archived'),created=Boolean(event),published=event&&event.state!=='draft',tested=event&&event.photo_count>0;
 if(created&&published&&tested)return'';
 const steps=[['Create your event',created],['Personalize the guest page',created&&Boolean(event.appearance?.title)],['Publish and test the QR',published],['Collect a test photo',tested]];
 return `<section class="onboarding" aria-labelledby="onboarding-title"><div><span class="eyebrow">First event</span><h2 id="onboarding-title">Ready in four small steps.</h2><p>Complete one real guest journey before sharing your QR.</p></div><ol>${steps.map(([label,done],index)=>`<li class="${done?'done':''}">${done?icon('check-circle-2'):`<span>${index+1}</span>`}${esc(label)}</li>`).join('')}</ol>${event?`<a class="button primary" href="/app/events/${event.id}">${published?'Test event':'Continue setup'} ${icon('arrow-right')}</a>`:'<button class="primary" id="onboarding-create">Create first event</button>'}</section>`;
}
