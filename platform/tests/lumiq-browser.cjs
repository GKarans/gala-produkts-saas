const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const sharp=require('sharp');
const base=process.env.PLATFORM_TEST_ORIGIN||'http://127.0.0.1:5700';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('Local only');
(async()=>{const browser=await chromium.launch();try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('gf-language','lv'));
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});await page.goto(base+'/lumiq.html');
  await page.locator('#stage[data-ready="true"]').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const canvas=page.locator('canvas'),before=await canvas.screenshot();
  const stats=await sharp(before).stats();assert(stats.channels.some(c=>c.stdev>20),'Canvas must contain rendered detail');
  await page.getByRole('button',{name:'Nākamais skats',exact:true}).click();assert.equal(await page.locator('#counter').innerText(),'02 / 05');
  await page.waitForTimeout(100);assert.notDeepEqual(before,await canvas.screenshot());
  const r=await canvas.boundingBox();await page.mouse.move(r.x+r.width*.5,r.y+r.height*.6);await page.mouse.down();await page.mouse.move(r.x+r.width*.5+90,r.y+r.height*.6,{steps:10});await page.mouse.up();assert.equal(await page.locator('#counter').innerText(),'03 / 05');
  await page.getByRole('button',{name:'Uzņemt demonstrācijas foto',exact:true}).click();await page.getByText('Demonstrācijas kadrs 1: Ballīte',{exact:true}).waitFor();
  await page.screenshot({path:`platform/test-results/lumiq-${width}.png`,fullPage:true});
 }
 await page.locator('#language').click();assert.equal(await page.locator('html').getAttribute('lang'),'en');await page.getByRole('heading',{name:'Small gatherings. Big memories.',exact:true}).waitFor();
 assert.deepEqual(errors,[]);console.log('Lumiq passed: 4 viewports, textured WebGL pixels, drag/scene changes, capture and language.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
