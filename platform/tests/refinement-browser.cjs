const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const sharp=require('sharp');
const base=process.env.PLATFORM_TEST_ORIGIN||'http://127.0.0.1:5700';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('Local only');
(async()=>{const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,1100,768,390]){
  await page.setViewportSize({width,height:1000});await page.goto(base+'/pricing');await page.locator('.plan').first().waitFor();
  const rects=await page.locator('.plan').evaluateAll(cards=>cards.map(c=>{const r=c.getBoundingClientRect(),b=c.querySelector('.button,button').getBoundingClientRect();return {top:r.top,button:b.top,height:b.height};}));
  for(const r of rects)for(const q of rects)if(Math.abs(r.top-q.top)<1){assert(Math.abs(r.button-q.button)<2,'Pricing buttons misaligned');assert(Math.abs(r.height-q.height)<2,'Pricing button heights differ');}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert(await page.locator('.site-nav').evaluate(n=>{const r=n.getBoundingClientRect(),c=n.querySelector('[data-language]').getBoundingClientRect();return c.top>=r.top&&c.bottom<=r.bottom;}),'Language control must stay inside navigation');
  await page.screenshot({path:`platform/test-results/refinement-pricing-${width}.png`,fullPage:true});
 }
 await page.setViewportSize({width:1440,height:1000});
 const a=await sharp({create:{width:300,height:900,channels:3,background:'#376559'}}).webp().toBuffer(),b=await sharp({create:{width:1000,height:300,channels:3,background:'#cc5966'}}).webp().toBuffer();
 await page.route('**/api/photos/*/photo',route=>route.fulfill({contentType:'image/webp',body:route.request().url().includes('/first/')?a:b}));
 await page.evaluate(async()=>{const {photoViewer}=await import('/photo-viewer.js');photoViewer([{id:'first',guest:'Portrait',created_at:new Date().toISOString()},{id:'second',guest:'Landscape',created_at:new Date().toISOString()}]);});
 await page.locator('.preview-image:visible').waitFor();const frame=await page.locator('.photo-stage').boundingBox(),arrow=await page.locator('.photo-next').boundingBox();
 await page.getByRole('button',{name:'Next photo',exact:true}).click();await page.locator('.preview-image[alt="Photo by Landscape"]:visible').waitFor();
 assert.deepEqual(await page.locator('.photo-stage').boundingBox(),frame);assert.deepEqual(await page.locator('.photo-next').boundingBox(),arrow);
 await page.screenshot({path:'platform/test-results/refinement-viewer-desktop.png'});
 await page.mouse.click(2,2);assert.equal(await page.locator('dialog').evaluate(d=>d.open),false);
 await page.setViewportSize({width:390,height:844});await page.evaluate(async()=>{const {photoViewer}=await import('/photo-viewer.js');photoViewer([{id:'first',guest:'Portrait',created_at:new Date().toISOString()},{id:'second',guest:'Landscape',created_at:new Date().toISOString()}]);});
 await page.locator('.photo-stage').evaluate(el=>{const a=new Touch({identifier:1,target:el,clientX:300,clientY:200}),b=new Touch({identifier:1,target:el,clientX:100,clientY:205});el.dispatchEvent(new TouchEvent('touchstart',{touches:[a]}));el.dispatchEvent(new TouchEvent('touchend',{changedTouches:[b]}));});
 await page.locator('.preview-image[alt="Photo by Landscape"]:visible').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'platform/test-results/refinement-viewer-mobile.png'});await page.keyboard.press('Escape');
 await page.goto(base+'/pricing');await page.getByRole('button',{name:'Language',exact:true}).click();await page.getByRole('listbox',{name:'Language'}).getByRole('option',{name:'LV',exact:true}).click();await page.waitForFunction(()=>document.documentElement.lang==='lv');await page.getByRole('link',{name:'Izvēlēties Gathering',exact:true}).waitFor();await page.reload();await page.getByRole('link',{name:'Izvēlēties Gathering',exact:true}).waitFor();await page.screenshot({path:'platform/test-results/refinement-pricing-lv.png',fullPage:true});await page.getByRole('button',{name:'Valoda',exact:true}).click();await page.getByRole('listbox',{name:'Valoda'}).getByRole('option',{name:'EN',exact:true}).click();await page.waitForFunction(()=>document.documentElement.lang==='en');
 await page.goto(base+'/');await page.getByRole('heading',{name:'Lumiq',exact:true}).waitFor();for(const width of [1440,390]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`platform/test-results/gathering-home-${width}.png`,fullPage:true});}
 await page.getByRole('button',{name:'Language',exact:true}).click();await page.getByRole('listbox',{name:'Language'}).getByRole('option',{name:'LV',exact:true}).click();await page.getByRole('link',{name:'Izveidot pirmo pasākumu',exact:true}).waitFor();
 assert(!(await page.locator('.hero').innerText()).includes('Your people.'));
 await page.screenshot({path:'platform/test-results/home-lv.png',fullPage:true});
 await page.goto(base+'/help');await page.getByText('Vai viesiem vajag lietotni vai kontu?',{exact:true}).waitFor();
 await page.goto(base+'/features');
 await page.getByText('Saglabā kontroli',{exact:true}).waitFor();
 await page.goto(base+'/privacy');await page.getByRole('heading',{name:'Privātuma politika',exact:true}).waitFor();await page.getByRole('heading',{name:'Kas nosaka pasākuma foto izmantošanu',exact:true}).waitFor();const privacy=await page.locator('main').innerText();for(const phrase of ['The event organizer chooses','People may have rights','The account service is intended','In this local preview','PRE-LAUNCH TEMPLATE'])assert(!privacy.includes(phrase));
 for(const [path,phrases] of [['/terms',['Working product name:','The local checkout is a simulation','Where consumer distance-contract rules apply','PRE-LAUNCH TEMPLATE']],['/refunds',['No real payment or refund','Cancellation should stop the next renewal','PRE-LAUNCH TEMPLATE']]]){await page.goto(base+path);const text=await page.locator('main').innerText();for(const phrase of phrases)assert(!text.includes(phrase),`${path} still contains: ${phrase}`);}
 await page.goto(base+'/security');await page.getByRole('heading',{name:'Radīts privātiem pasākumiem.',exact:true}).waitFor();assert(!(await page.locator('main').innerText()).includes('Organizers can access'));
 await page.goto(base+'/login');await page.getByRole('button',{name:'G Ienākt ar Google',exact:true}).waitFor();
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/sample-workspace');await page.locator('.desktop-workspace-nav').getByText('Mani pasākumi',{exact:true}).waitFor();const workspace=await page.locator('.workspace').innerText();for(const phrase of ['Organizer workspace','Every gathering, in one place.','Ready in four small steps.'])assert(!workspace.includes(phrase));await page.screenshot({path:'platform/test-results/workspace-lv.png',fullPage:true});
 await page.locator('.event-row').filter({hasText:'Studio evening'}).click();
 const eventPath=new URL(page.url()).pathname;
 await page.setViewportSize({width:390,height:844});const backToEvents=page.getByRole('link',{name:'Mani pasākumi',exact:true});const backBox=await backToEvents.boundingBox();assert(backBox&&backBox.height>=44,'Event list return link needs a mobile-sized touch target');await page.setViewportSize({width:1440,height:1000});
 await page.getByRole('button',{name:'Drukāt vai lejupielādēt QR kodu'}).click();
 await page.getByText('Dārza svinības',{exact:true}).waitFor();
 await page.getByText('Vintage ielūgums',{exact:true}).click();
 const fontSelect=page.locator('#qr-font');
 assert.equal(await fontSelect.locator('option').count(),10);
 await page.getByRole('button',{name:'Fonts',exact:true}).click();
 await page.getByRole('listbox',{name:'Fonts'}).getByRole('option',{name:'Roboto',exact:true}).click();
 await page.getByRole('button',{name:'Fonts',exact:true}).click();
 await page.getByRole('listbox',{name:'Fonts'}).getByRole('option',{name:'Playfair Display',exact:true}).click();
 await page.getByLabel('Virsraksta izmērs').fill('88');
 await page.getByRole('button',{name:'Liels',exact:true}).click();
 await page.waitForFunction(()=>{const href=document.querySelector('#download-design')?.getAttribute('href')||'';return href.includes('format=table')&&href.includes('download=1')&&href.includes('template=vintage')&&href.includes('font=playfair-display')&&href.includes('titleSize=88');});
 assert.equal(await page.getByRole('link',{name:'Lejupielādēt QR SVG'}).getAttribute('href').then(href=>href.includes('format=qr')&&href.includes('download=1')),true);
 assert.equal(await page.getByText('Pārbaudīt priekšskatījumu',{exact:true}).count(),0);
 assert.equal(await page.getByText('A5',{exact:true}).count(),0);
 const handle=page.getByRole('button',{name:'Pārvietot QR kodu'}),before=await handle.boundingBox(),stage=await page.locator('#qr-stage').boundingBox();
 await handle.dragTo(page.locator('#qr-stage'),{targetPosition:{x:stage.width*.68,y:stage.height*.68}});
 const after=await handle.boundingBox();
 assert(after.x>before.x);
 await page.getByRole('button',{name:'Saglabāt dizainu'}).click();
 await page.getByText('QR dizains saglabāts.').waitFor();
 await page.getByRole('button',{name:'Drukāt dizainu'}).waitFor();
 await page.getByRole('link',{name:'Atvērt Canva'}).waitFor();
 await page.getByText('Pabeidz dizainu Canva',{exact:true}).waitFor();
 await page.screenshot({path:'platform/test-results/qr-builder-lv.png'});
 await page.getByRole('button',{name:'Aizvērt logu'}).click();
 await page.goto(base+'/app');
 await page.locator('.event-row').filter({hasText:'Studio evening'}).click();
  await page.getByRole('button',{name:'Drukāt vai lejupielādēt QR kodu'}).click();
  await page.locator('[data-qr-template="vintage"][aria-pressed="true"]').waitFor();
  await page.getByRole('button',{name:'Aizvērt logu'}).click();
  await page.getByRole('button',{name:'Drukāt vai lejupielādēt QR kodu'}).click();
  const customUpload=page.waitForResponse(r=>r.url().includes('/qr-background')&&r.request().method()==='POST');
  await page.locator('#qr-background').setInputFiles({name:'custom-poster.png',mimeType:'image/png',buffer:await sharp({create:{width:320,height:220,channels:3,background:'#d4a16f'}}).png().toBuffer()});
  assert.equal((await customUpload).status(),200);
  await page.locator('[data-qr-template="custom"][aria-pressed="true"]').waitFor();
  await page.waitForFunction(()=>{const image=document.querySelector('#qr-poster-preview');if(!image?.complete||!image.naturalWidth)return false;const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const context=canvas.getContext('2d');context.drawImage(image,0,0,1,1);const [red,,blue]=context.getImageData(0,0,1,1).data;return red>blue+50;});
  const firstPosterUrl=await page.locator('#qr-poster-preview').getAttribute('src');
  const replacementUpload=page.waitForResponse(r=>r.url().includes('/qr-background')&&r.request().method()==='POST');
  await page.locator('#qr-background').setInputFiles({name:'replacement-poster.png',mimeType:'image/png',buffer:await sharp({create:{width:320,height:220,channels:3,background:'#1e8caa'}}).png().toBuffer()});
  assert.equal((await replacementUpload).status(),200);
  await page.waitForFunction(()=>{const image=document.querySelector('#qr-poster-preview');if(!image?.complete||!image.naturalWidth)return false;const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const context=canvas.getContext('2d');context.drawImage(image,0,0,1,1);const [red,,blue]=context.getImageData(0,0,1,1).data;return blue>red+80;});
  assert.notEqual(await page.locator('#qr-poster-preview').getAttribute('src'),firstPosterUrl);
  await page.getByRole('button',{name:'Aizvērt logu'}).click();
  await page.goto(base+eventPath+'?tab=design');await page.locator('#design-form').waitFor();
  await page.locator('#design-form [name=title]').fill('Vasaras vakars');
  const guestSave=page.waitForResponse(r=>r.url().includes('/api/events/')&&r.request().method()==='PATCH');
  await page.getByRole('button',{name:'Saglabāt viesa lapu',exact:true}).click();assert.equal((await guestSave).status(),200);
  const persisted=await(await page.request.get(base+'/api/events/'+eventPath.match(/[0-9a-f-]{36}$/i)[0])).json();
  assert.equal(persisted.appearance.title,'Vasaras vakars');assert(persisted.appearance.qr_background_key);assert.equal(persisted.appearance.qr_layout.template,'custom');
  await page.goto(base+eventPath+'?tab=gallery');
 const untranslated={
  design:['Guest page','Save guest page','Cover collection','Current photo','Replace photo','Button color','Welcome','Camera'],
  sharing:['Guests use the same event link','Photo and gallery requests','Up to 60 days'],
  settings:['Photos remain available until','Archiving does not extend','Move it out of your main event list','Access is removed immediately'],
  billing:['Current period ends','Published events keep','A draft is free to prepare'],
  account:['Request a review of your account'],
  admin:['Local service health','Accounts','Failed jobs','Open cases','Audit entries','Support cases','Background jobs','Recent service emails','Usage measurements','Audit trail','Attempt 0']
 };
 for(const tab of ['design','sharing','settings']){
  await page.goto(base+eventPath+`?tab=${tab}`);await page.locator('main').waitFor();const content=await page.locator('main').innerText();for(const phrase of untranslated[tab])assert(!content.includes(phrase),`${tab} still contains: ${phrase}`);
 }
 for(const section of ['billing','account','admin']){
  await page.goto(base+`/app/${section}`);await page.locator('main').waitFor();const content=await page.locator('main').innerText();for(const phrase of untranslated[section])assert(!content.includes(phrase),`${section} still contains: ${phrase}`);
 }
 const covers=['garden-gathering','wedding-toast','party','coastal-celebration','city-rooftop'];for(const c of covers){const r=await page.request.get(base+'/assets/'+c+'.webp');assert(r.ok());assert((await sharp(await r.body()).metadata()).width>300);}
 assert.deepEqual(errors,[]);console.log('Refinement browser passed: aligned pricing, fixed viewer, backdrop, swipe and five bundled covers.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
