'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium,webkit,devices}=require('playwright');
const uri='file://'+path.resolve(__dirname,'..','index.html');

async function check(engine,name,options){
 const browser=await engine.launch({headless:true});
 try {
 const context=await browser.newContext(options);
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.addInitScript(()=>{window.print=()=>{window.__printCalls=(window.__printCalls||0)+1;};});
 await page.goto(uri,{waitUntil:'load'});
 console.log('Loaded '+name);
 await page.waitForTimeout(150);
 assert.equal(await page.locator('#invTotal').textContent()!=='—',true,name+': initial metrics');
 for(const mode of ['car','savings','tax','investment']){
   console.log('Clicking '+name+' '+mode);
   await page.locator('.bottom-tabs .tab[data-tab="'+mode+'"]').click({timeout:10000});
   assert.equal(await page.locator('#'+mode).evaluate(el=>!el.hidden),true,name+': tab '+mode);
   assert.equal(await page.locator('main .panel:not([hidden])').count(),1,name+': exactly one mode');
   const before=await page.evaluate(()=>window.__printCalls||0);
   await page.locator('#'+mode+' .export-btn').click({timeout:10000});
   const after=await page.evaluate(()=>window.__printCalls||0);
   assert.equal(after,before+1,name+': Export PDF '+mode);
   assert.match(await page.locator('#printSnapshot').innerHTML(),/Scenario Snapshot/,name+': PDF snapshot '+mode);
 }
 await page.locator('.bottom-tabs .tab[data-tab="tax"]').click();
 await page.locator('#taxParents-select').selectOption('1');
 await page.locator('#taxWithheldInput').fill('10000');
 assert.equal(await page.locator('#taxSettlementBox').evaluate(el=>!el.hidden),true,name+': settlement visible');
 assert.notEqual(await page.locator('#taxSettlementValue').textContent(),'—',name+': settlement calculated');
 assert.deepEqual(errors,[],name+': uncaught browser errors');
 console.log('PASS '+name+' — all tabs, exports, and Tax inputs');
 } finally {await browser.close();}
}
(async()=>{
 await check(chromium,'Chromium mobile',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 await check(webkit,'WebKit iPhone',devices['iPhone 13']);
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
