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
// Numeric fields restore the last valid value rather than resetting to DEFAULT.
document.querySelector('.tab[data-tab="car"]').click();
const fuel=document.getElementById('carFuel-num');
fuel.value='3600';fuel.dispatchEvent(new Event('input',{bubbles:true}));
fuel.value='';fuel.dispatchEvent(new Event('change',{bubbles:true}));
assert.equal(fuel.value,'3600','Empty car fuel input restores last entered value');
const loanYears=document.getElementById('carLoanYears-num');
loanYears.value='5';loanYears.dispatchEvent(new Event('input',{bubbles:true}));
assert.match(document.getElementById('carBarInterestText').textContent,/21,181/,'Five-year loan allocates higher early interest');
loanYears.value='1';loanYears.dispatchEvent(new Event('input',{bubbles:true}));
assert.match(document.getElementById('carBarInterestText').textContent,/12,500/,'One-year loan allocates full interest over 12 months');
// Withdrawal is now defined in today's purchasing power.
document.querySelector('.tab[data-tab="investment"]').click();
assert.match(document.getElementById('invWithdrawalNominal').textContent,/44,578/,'Retirement nominal amount appears near input');
assert.match(document.getElementById('invWithdraw').textContent,/44,578/,'Result shows inflation-adjusted withdrawal');
// Tax annual income overrides the salary and bonus fields visibly.
document.querySelector('.tab[data-tab="tax"]').click();
const annualActual=document.getElementById('taxAnnualActual-num');
annualActual.value='500000';annualActual.dispatchEvent(new Event('input',{bubbles:true}));
assert.equal(document.getElementById('taxOverrideNotice').hidden,false,'Annual-income override note visible');
assert.equal(document.getElementById('taxSalary-num').disabled,true,'Overridden salary input disabled');
assert.equal(document.getElementById('taxBonus-num').disabled,true,'Overridden bonus input disabled');
annualActual.value='0';annualActual.dispatchEvent(new Event('input',{bubbles:true}));
assert.equal(document.getElementById('taxSalary-num').disabled,false,'Salary restored when annual override removed');
// The smaller duration label should omit a redundant zero-month suffix.
assert.equal(document.getElementById('carEarlier-num').value,'12');
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
