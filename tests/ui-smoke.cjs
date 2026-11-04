'use strict';
// Browser-like smoke test of the standalone page. Requires jsdom (CI installs it).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const errors=[];
const virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',err=>errors.push(err.stack||err.message));
const dom=new JSDOM(html,{
  url:'https://getnkit.github.io/personal-finance-playground/',
  runScripts:'dangerously',pretendToBeVisual:true,virtualConsole,
  beforeParse(window){
    window.scrollTo=()=>{};
    window.print=()=>{window.__printed=(window.__printed||0)+1;};
  }
});
const {document,Event}=dom.window;
function clean(){assert.deepEqual(errors,[],'No uncaught page errors');}
clean();
assert.notEqual(document.getElementById('invTotal').textContent.trim(),'—','Investment initializes');
for(const tab of ['car','savings','tax','investment']){
  const button=document.querySelector('.tab[data-tab="'+tab+'"]');
  assert.ok(button,'Tab exists: '+tab);
  button.click();
  clean();
  assert.equal(document.getElementById(tab).hidden,false,'Visible panel '+tab);
  assert.equal([...document.querySelectorAll('main .panel:not([hidden])')].length,1,'One panel visible');
  const printBtn=document.querySelector('#'+tab+' .export-btn');
  assert.ok(printBtn,'Export button on '+tab);
  const printed=dom.window.__printed||0;
  printBtn.click();
  clean();
  assert.equal(dom.window.__printed,printed+1,'Export invokes browser print for '+tab);
  const meta=document.querySelector('#'+tab+' .section-head .print-meta');
  assert.match(meta?.textContent||'',/Scenario Snapshot/,'Print date for '+tab);
  assert.match(document.title,/_[0-9]{8}_[0-9]{6}$/,'Timestamp-based print title for '+tab);
  assert.ok(document.querySelector('#'+tab+' .results-card'),'Live result card for '+tab);
  assert.equal(document.getElementById('printSnapshot'),null,'No duplicate square-box report');
}
document.querySelector('.tab[data-tab="tax"]').click();
const parent=document.getElementById('taxParents-select');
parent.value='1';
parent.dispatchEvent(new Event('input',{bubbles:true}));
clean();
assert.equal(parent.value,'1','Parent dropdown can change');
const withheld=document.getElementById('taxWithheldInput');
withheld.value='10000';
withheld.dispatchEvent(new Event('input',{bubbles:true}));
clean();
assert.equal(document.getElementById('taxSettlementBox').hidden,false,'Withholding result visible');
assert.notEqual(document.getElementById('taxSettlementValue').textContent.trim(),'—','Withholding result calculated');
document.querySelector('.tab[data-tab="savings"]').click();
document.getElementById('savAddExpense').click();
clean();
assert.ok(document.querySelector('#savExpenseRows .sav-expense-row'),'Planned expense can be added');
console.log('PASS: initial renders, four mode switches, four PDF actions, Tax updates, planned expense');
dom.window.close();
