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
 const inputFont=await page.locator('#invWithdrawal-num').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
 const selectFont=await page.locator('#taxParents-select').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
 assert.ok(inputFont>=16,name+': mobile numeric inputs prevent focus zoom');
 assert.ok(selectFont>=16,name+': mobile selects prevent focus zoom');
 const heroHeight=await page.locator('.intro').evaluate(el=>el.getBoundingClientRect().height);
 assert.ok(heroHeight<185,name+': mobile hero remains compact');
 for(const mode of ['car','savings','tax','investment']){
   console.log('Clicking '+name+' '+mode);
   await page.locator('.bottom-tabs .tab[data-tab="'+mode+'"]').click({timeout:10000});
   assert.equal(await page.locator('#'+mode).evaluate(el=>!el.hidden),true,name+': tab '+mode);
   assert.equal(await page.locator('main .panel:not([hidden])').count(),1,name+': exactly one mode');
   const before=await page.evaluate(()=>window.__printCalls||0);
   await page.locator('#'+mode+' .export-btn').click({timeout:10000});
   const after=await page.evaluate(()=>window.__printCalls||0);
   assert.equal(after,before+1,name+': Export PDF '+mode);
   assert.match(await page.title(),/_[0-9]{8}_[0-9]{6}$/,name+': distinct print title '+mode);
   assert.match(await page.locator('#'+mode+' .print-meta').textContent(),/Scenario Snapshot/,name+': report date '+mode);
   await page.emulateMedia({media:'print'});
   const printedUI=await page.locator('#'+mode+' .results-card').evaluate(el=>({
     visible:getComputedStyle(el).display!=='none',
     cards:el.querySelectorAll('.mini').length,
     background:getComputedStyle(el.querySelector('.mini')||el).backgroundColor
   }));
   assert.equal(printedUI.visible,true,name+': print preserves actual results card '+mode);
   assert.ok(printedUI.cards>0,name+': retains native result mini-cards '+mode);
   assert.equal(await page.locator('.bottom-tabs').evaluate(el=>getComputedStyle(el).display),'none',name+': hides interactive mobile navigation in PDF');
   if(name==='Chromium mobile'){
     const pdf=await page.pdf({printBackground:true,preferCSSPageSize:true});
     assert.ok(pdf.length>3000,name+': PDF has real content '+mode);
   }
   await page.emulateMedia({media:'screen'});
 }
 await page.locator('.bottom-tabs .tab[data-tab="savings"]').click();
 await page.locator('#carInvestAddon summary').click();
 await page.locator('#tradeStartMonth').evaluate(el=>{el.value='2026-11';el.dispatchEvent(new Event('change',{bubbles:true}));});
 assert.equal(await page.locator('#tradeMonthA').textContent(),'คาดว่าจะซื้อได้: ต.ค. 2027',name+': A purchase month');
 assert.equal(await page.locator('#tradeMonthB').textContent(),'คาดว่าจะซื้อได้: ธ.ค. 2027',name+': B purchase month');
 assert.equal(await page.locator('#tradeB').textContent(),'1 ปี 2 เดือน',name+': original duration unchanged');
 await page.locator('#tradeStartMonth').evaluate(el=>{el.value='2027-03';el.dispatchEvent(new Event('change',{bubbles:true}));});
 assert.equal(await page.locator('#tradeMonthB').textContent(),'คาดว่าจะซื้อได้: เม.ย. 2028',name+': date reacts to month change');
 assert.ok(await page.locator('#tradeStartMonth').isVisible(),name+': tradeoff month picker visible');
 await page.locator('[data-reset="tradeoff"]').click();
 assert.match(await page.locator('#tradeStartMonth').inputValue(),/^\d{4}-\d{2}$/,name+': tradeoff reset month');
 await page.locator('.bottom-tabs .tab[data-tab="tax"]').click();
 await page.locator('.tax-more summary').click();
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
