const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.PLATFORM_TEST_ORIGIN||'http://127.0.0.1:5700';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw new Error('Local tests only');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'Europe/Riga'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.request.post(base+'/api/local/demo-session',{headers:{Origin:base}});
  const r=await context.request.post(base+'/api/events',{headers:{Origin:base},data:{name:'Our summer gathering',start:new Date(Date.now()-3600000).toISOString().slice(0,16),end:new Date(Date.now()+3600000).toISOString().slice(0,16),time_zone:'UTC',cover:'/assets/garden-gathering.webp'}});
  const e=await r.json();assert(e.id);
  await page.goto(`${base}/app/events/${e.id}?tab=design`);await page.locator('#designer-stage').waitFor();
  await page.waitForFunction(()=>document.querySelector('.guest-image-frame img')?.naturalWidth>0);
  assert.equal(await page.locator('input[type=range]').count(),0);
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  const box=await page.locator('.editor-surface').boundingBox();
  const before=await page.locator('.guest-image-frame img').evaluate(el=>el.style.left);
  await page.mouse.move(box.x+box.width/2,box.y+box.height*.55);await page.mouse.down();await page.mouse.move(box.x+box.width/2+65,box.y+box.height*.55-25,{steps:10});await page.mouse.up();
  assert.notEqual(await page.locator('.guest-image-frame img').evaluate(el=>el.style.left),before);
  await page.getByRole('button',{name:'Align left',exact:true}).click();await page.locator('#guest-font').selectOption('montserrat');await page.getByRole('button',{name:'rose button',exact:true}).click();
  await page.locator('[data-edit=title]').click();assert.equal(await page.getByLabel('Title',{exact:true}).evaluate(el=>el===document.activeElement),true);
  await page.getByLabel('Title',{exact:true}).fill('Every little moment');await page.getByLabel('Subtitle',{exact:true}).fill('A summer evening with our favorite people.');
  await page.locator('#cover-preset').selectOption('party');await page.waitForFunction(()=>document.querySelector('.guest-image-frame img')?.src.endsWith('/party.webp'));await page.getByLabel('Photo selection button',{exact:true}).fill('Select your moments');await page.getByLabel('Custom button color').fill('#e6d240');await page.getByRole('tab',{name:'Camera',exact:true}).click();await page.screenshot({path:'platform/test-results/designer-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Save guest page',exact:true}).click();await page.locator('.toast').filter({hasText:'Guest page saved.'}).waitFor();
  const saved=await(await context.request.get(`${base}/api/events/${e.id}`)).json();assert.equal(saved.appearance.zoom,1);assert.equal(saved.appearance.cover,'/assets/party.webp');assert.equal(saved.appearance.align,'left');assert.equal(saved.appearance.font,'montserrat');assert.equal(saved.appearance.buttonTheme,'custom');assert.equal(saved.appearance.buttonColor,'#e6d240');assert.equal(saved.appearance.chooseButton,'Select your moments');
  await page.setViewportSize({width:390,height:844});await page.getByRole('tab',{name:'Welcome',exact:true}).click();await page.screenshot({path:'platform/test-results/designer-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await context.request.post(`${base}/api/events/${e.id}/action`,{headers:{Origin:base},data:{action:'publish'}});
  await page.goto(`${base}/event/${e.slug}`);await page.getByRole('heading',{name:'Every little moment'}).waitFor();await page.locator('.guest-form .notice').waitFor();assert((await page.locator('.guest-form .notice').innerText()).includes('Photos will be deleted by'));assert.equal(await page.locator('.guest-retention-note').count(),0);assert.equal(await page.locator('.guest-top>.brand img').getAttribute('src'),'/assets/brand-mark.png');
  let languageDialogs=0;page.on('dialog',async dialog=>{languageDialogs++;await dialog.accept();});await page.locator('.guest-top .select-menu-trigger').click();await page.getByRole('listbox',{name:'Language'}).getByRole('option',{name:'LV',exact:true}).click();assert.equal(languageDialogs,0,'Changing language must not show a browser alert or confirmation.');await page.waitForFunction(()=>document.documentElement.lang==='lv'&&document.querySelector('.guest-form .notice')?.textContent.includes('Foto tiks dzēsti līdz'));const lvNotice=await page.locator('.guest-form .notice').innerText();assert(!lvNotice.includes('If the organizer'));
  await page.locator('#guest-name input[name=name]').fill('Guest Test');await page.getByRole('button',{name:'Pievienoties pasākumam'}).click();await page.getByRole('button',{name:'Uzņemt foto'}).waitFor();assert.equal(await page.locator('.guest-retention-note').count(),0);const cameraCopy=await page.locator('.guest-controls p.small').innerText();assert(cameraCopy.includes('Fotogrāfijas tiek nosūtītas'));assert(!cameraCopy.includes('Photos are sent'));const brandBox=await page.locator('.guest-top>.brand').boundingBox();assert(Math.abs(brandBox.x+brandBox.width/2-195)<10,'Guest logo should be centered over the live guest view.');await page.screenshot({path:'platform/test-results/designer-real-guest.png',fullPage:true});assert.deepEqual(errors,[]);
  assert.equal(await page.locator('.guest-cover').getAttribute('data-align'),'left');assert.equal(await page.locator('.guest-cover').getAttribute('data-button-theme'),'custom');
  await page.screenshot({path:'platform/test-results/designer-real-guest.png',fullPage:true});assert.deepEqual(errors,[]);
  await context.request.post(`${base}/api/events/${e.id}/action`,{headers:{Origin:base},data:{action:'delete',confirm:e.name}});
  console.log('Guest designer passed: no sliders, direct drag/zoom, text selection, style controls, save/reload, mobile layout, actual guest appearance.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
