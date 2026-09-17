const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.PLATFORM_TEST_ORIGIN||'http://127.0.0.1:5700';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw new Error('Local tests only');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/sample-workspace');await page.getByRole('heading',{name:'My events',exact:true}).waitFor();
  const before=await(await context.request.get(base+'/api/billing')).json();
  await page.goto(base+'/app/billing');await page.getByRole('heading',{name:'Plan & billing',exact:true}).waitFor();
  assert.equal(await page.locator('.plan').count(),4);await page.locator('[data-plan=single]').click();
  await page.getByText('€15 one-time payment for one event',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Simulate successful payment'}).click();await page.getByRole('heading',{name:'Plan & billing',exact:true}).waitFor();
  const after=await(await context.request.get(base+'/api/billing')).json();assert.equal(after.subscription.plan,before.subscription.plan);assert.equal(after.allowance.passes,before.allowance.passes+1);
  await page.screenshot({path:'platform/test-results/billing-single-desktop.png',fullPage:true});
  const response=await context.request.post(base+'/api/events',{headers:{Origin:base},data:{name:'One-time purchase test',time_zone:'UTC',start:new Date(Date.now()+86400000).toISOString().slice(0,16),end:new Date(Date.now()+2*86400000).toISOString().slice(0,16)}});const e=await response.json();assert(e.id);
  await page.goto(`${base}/app/events/${e.id}`);await page.getByRole('button',{name:'Publish event',exact:true}).click();await page.getByLabel('Use allowance').selectOption('pass');await page.getByRole('button',{name:'Confirm',exact:true}).click();await page.getByRole('button',{name:'Pause uploads',exact:true}).waitFor();
  const used=await(await context.request.get(base+'/api/billing')).json();assert.equal(used.allowance.used,before.allowance.used);assert.equal(used.allowance.passes,before.allowance.passes);
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/pricing');await page.getByRole('heading',{name:'Plans for your people.'}).waitFor();assert.equal(await page.locator('.plan').count(),4);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'platform/test-results/pricing-four-mobile.png',fullPage:true});
  await context.request.post(`${base}/api/events/${e.id}/action`,{headers:{Origin:base},data:{action:'delete',confirm:e.name}});assert.deepEqual(errors,[]);
  console.log('Billing browser passed: four plans including free trial, Single Event one-time checkout, preserved subscription, explicit pass publication and responsive pricing.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
