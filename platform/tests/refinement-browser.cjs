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
 await page.goto(base+'/pricing');await page.getByLabel('Language').selectOption('lv');await page.waitForFunction(()=>document.documentElement.lang==='lv');await page.getByRole('link',{name:'Izvēlēties Gathering',exact:true}).waitFor();await page.reload();await page.getByRole('link',{name:'Izvēlēties Gathering',exact:true}).waitFor();await page.screenshot({path:'platform/test-results/refinement-pricing-lv.png',fullPage:true});await page.getByLabel('Valoda').selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en');
 await page.goto(base+'/?design=editorial');await page.getByRole('heading',{name:'Gatherframe',exact:true}).waitFor();for(const width of [1440,390]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`platform/test-results/editorial-${width}.png`,fullPage:true});}await page.goto(base+'/');assert.equal(await page.locator('body').evaluate(b=>b.classList.contains('design-editorial')),false);
 await page.getByLabel('Language').selectOption('lv');await page.getByRole('link',{name:'Izveidot pirmo pasākumu',exact:true}).waitFor();
 assert(!(await page.locator('.hero').innerText()).includes('Your people.'));
 await page.screenshot({path:'platform/test-results/home-lv.png',fullPage:true});
 await page.goto(base+'/help');await page.getByText('Vai viesiem vajag lietotni vai kontu?',{exact:true}).waitFor();
 await page.goto(base+'/features');
 await page.getByText('Saglabā kontroli',{exact:true}).waitFor();
 const covers=['garden-gathering','wedding-toast','party','coastal-celebration','city-rooftop'];for(const c of covers){const r=await page.request.get(base+'/assets/'+c+'.webp');assert(r.ok());assert((await sharp(await r.body()).metadata()).width>300);}
 assert.deepEqual(errors,[]);console.log('Refinement browser passed: aligned pricing, fixed viewer, backdrop, swipe and five bundled covers.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
