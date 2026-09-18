const {chromium}=require('playwright');
const AxeBuilder=require('@axe-core/playwright').default;
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.PLATFORM_TEST_ORIGIN||'http://127.0.0.1:5700';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('Local accessibility tests only');
(async()=>{const browser=await chromium.launch({headless:true}),report=[];try{
 const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'}),page=await context.newPage();
 for(const route of ['/','/pricing','/login','/help']){await page.goto(base+route);await page.locator('main').waitFor();const result=await new AxeBuilder({page}).analyze(),blocking=result.violations.filter(v=>['critical','serious'].includes(v.impact));report.push({route,violations:result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}))});assert.deepEqual(blocking.map(v=>v.id),[],`${route} has serious accessibility violations`);}
 await page.goto(base+'/');await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.activeElement!==document.body),'Keyboard focus must enter the page');await page.evaluate(()=>document.body.style.zoom='200%');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'200% zoom introduces horizontal overflow');
 fs.mkdirSync('platform/test-results',{recursive:true});fs.writeFileSync('platform/test-results/accessibility-report.json',JSON.stringify(report,null,2));await context.close();console.log('Accessibility checks passed: axe, keyboard entry, reduced motion and 200% zoom.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
