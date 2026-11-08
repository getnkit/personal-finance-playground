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
// The tradeoff uses its own selected start month and does not alter the upper savings planner.
const savingsMonth=document.getElementById('savStartMonth');
savingsMonth.value='2027-03';
savingsMonth.dispatchEvent(new Event('change',{bubbles:true}));
const tradeMonth=document.getElementById('tradeStartMonth');
tradeMonth.value='2026-11';
tradeMonth.dispatchEvent(new Event('change',{bubbles:true}));
assert.equal(tradeMonth.value,'2026-11','Independent tradeoff start month');
assert.equal(savingsMonth.value,'2027-03','Savings start month is independent');
assert.equal(document.getElementById('tradeA').textContent,'1 ปี','Plan A needs 12 monthly deposits');
assert.equal(document.getElementById('tradeB').textContent,'1 ปี 2 เดือน','Plan B needs 14 monthly deposits');
assert.equal(document.getElementById('tradeMonthA').textContent,'คาดว่าจะซื้อได้: ต.ค. 2027','Plan A date is month 12 inclusive');
assert.equal(document.getElementById('tradeMonthB').textContent,'คาดว่าจะซื้อได้: ธ.ค. 2027','Plan B date is month 14 inclusive');
tradeMonth.value='2027-03';tradeMonth.dispatchEvent(new Event('change',{bubbles:true}));
assert.equal(document.getElementById('tradeMonthA').textContent,'คาดว่าจะซื้อได้: ก.พ. 2028','Calendar changes without altering durations');
assert.equal(document.getElementById('tradeMonthB').textContent,'คาดว่าจะซื้อได้: เม.ย. 2028','Plan B calendar shifts with start date');
const carFund=document.getElementById('tradeCarNow-num');
carFund.value='400000';carFund.dispatchEvent(new Event('input',{bubbles:true}));
assert.equal(document.getElementById('tradeMonthA').textContent,'มีเงินซื้อได้แล้ว','Already funded plan A');
assert.equal(document.getElementById('tradeMonthB').textContent,'มีเงินซื้อได้แล้ว','Already funded plan B');
carFund.value='0';carFund.dispatchEvent(new Event('input',{bubbles:true}));
const invest=document.getElementById('tradeInvest-num');
invest.value='35000';invest.dispatchEvent(new Event('input',{bubbles:true}));
assert.equal(document.getElementById('tradeMonthB').textContent,'ยังระบุเดือนไม่ได้','No B savings means no purchase date');
invest.value='40000';invest.dispatchEvent(new Event('input',{bubbles:true}));
assert.equal(document.getElementById('tradeMonthA').textContent,'—','Invalid budget clears A date');
assert.equal(document.getElementById('tradeMonthB').textContent,'—','Invalid budget clears B date');
// Planned expenses in the tradeoff are independent from the upper savings calculator.
document.getElementById('tradeAddExpense').click();
assert.equal(document.querySelectorAll('#tradeExpenseRows .sav-expense-row').length,1);
const tradeRow=document.querySelector('#tradeExpenseRows .sav-expense-row');
const tradeSelect=tradeRow.querySelector('select');
const tradeAmount=tradeRow.querySelector('input[type="number"]');
tradeSelect.value='2026-11';tradeSelect.dispatchEvent(new Event('change',{bubbles:true}));
tradeAmount.value='35000';tradeAmount.dispatchEvent(new Event('input',{bubbles:true}));
assert.equal(document.getElementById('tradeA').textContent,'1 ปี 1 เดือน','One skipped contribution delays plan A');
assert.equal(document.getElementById('tradeB').textContent,'1 ปี 3 เดือน','One skipped contribution delays plan B');
assert.equal(document.getElementById('tradeMonthA').textContent,'คาดว่าจะซื้อได้: พ.ย. 2027');
assert.equal(document.getElementById('tradeMonthB').textContent,'คาดว่าจะซื้อได้: ม.ค. 2028');
assert.equal(document.getElementById('savStartMonth').value,'2027-03','Upper savings month unaffected');
assert.equal(document.querySelectorAll('#savExpenseRows .sav-expense-row').length,1,'Upper savings expenses unaffected');
const tradeGain=document.getElementById('tradePortABreakdown').textContent;
assert.match(tradeGain,/เงินต้น/);
tradeAmount.value='100000';tradeAmount.dispatchEvent(new Event('input',{bubbles:true}));
assert.equal(document.getElementById('tradeMonthB').textContent,'คาดว่าจะซื้อได้: ม.ค. 2028','Expense above budget capped at current month');
document.querySelector('#tradeExpenseRows .sav-remove').click();
assert.equal(document.getElementById('tradeB').textContent,'1 ปี 2 เดือน','Removing expense restores baseline');
assert.equal(document.querySelector('#tradeExpenseRows').children.length,0);
document.querySelector('[data-reset="tradeoff"]').click();
assert.match(tradeMonth.value,/^\d{4}-\d{2}$/,'Reset restores current start month');
assert.equal(document.getElementById('tradeB').textContent,'1 ปี 2 เดือน','Reset restores default tradeoff durations');
clean();
console.log('PASS: initial renders, four mode switches, four PDF actions, Tax updates, planned expense');
dom.window.close();
