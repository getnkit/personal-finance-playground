// Regression tests for retirement real-money semantics and loan window interest.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function extract(from,to){
  const start=html.indexOf(from),end=html.indexOf(to,start);
  assert.ok(start>=0&&end>start,'Missing calculator source: '+from);
  return html.slice(start,end);
}
const financeSource=extract('  function withdrawalRunway(','  function investment(){')+'\n'+
  extract('  function interestDuringEarlyWindow(','  function car(){');
const context={};
vm.runInNewContext(financeSource+'\nthis.functions={withdrawalRunway,interestDuringEarlyWindow};',context,{timeout:1000});
const {withdrawalRunway,interestDuringEarlyWindow}=context.functions;
const approx=(actual,expected,tolerance=1)=>assert.ok(Math.abs(actual-expected)<=tolerance,
  'Expected '+expected+'±'+tolerance+', got '+actual);

const loan=250000,flat=5,years=5,n=years*12;
const totalInterest=loan*(flat/100)*years,payment=(loan+totalInterest)/n;
approx(interestDuringEarlyWindow(loan,payment,n,12),21180.7,1);
approx(interestDuringEarlyWindow(loan,payment,n,n),totalInterest,1e-6);
approx(interestDuringEarlyWindow(loan,payment,n,100),totalInterest,1e-6);
approx(interestDuringEarlyWindow(loan,payment,n,0),0,1e-9);
approx(interestDuringEarlyWindow(loan,loan/n,n,12),0,1e-6);
approx(interestDuringEarlyWindow(0,0,n,12),0,1e-9);
const shortMonths=12,shortPayment=(loan+loan*flat/100)/shortMonths;
approx(interestDuringEarlyWindow(loan,shortPayment,shortMonths,12),loan*flat/100,1e-6);

const currentSpending=30000,inflation=2,yearsToRetire=20;
const nominal=currentSpending*Math.pow(1+inflation/100,yearsToRetire);
approx(nominal,44578.42,1);
const portfolio=5000000;
const todayRunway=withdrawalRunway(portfolio,nominal,3,2);
const oldRunway=withdrawalRunway(portfolio,currentSpending,3,2);
assert.ok(todayRunway.months<oldRunway.months,'Inflation-adjusted spending shortens runway');
const altPortfolio=3500000,adjustedToday=Math.floor(currentSpending*altPortfolio/portfolio);
const adjustedNominal=adjustedToday*Math.pow(1+inflation/100,yearsToRetire);
const altRunway=withdrawalRunway(altPortfolio,adjustedNominal,3,2);
assert.ok(Math.abs(altRunway.months-todayRunway.months)<=1,'Proportional downside withdrawal preserves runway');
assert.match(html,/ต้องการใช้ต่อเดือน \(กำลังซื้อวันนี้\)/);
assert.match(html,/withdrawalRunway\(total,withdrawStart,retRate,infl\)/);
assert.match(html,/withdrawalRunway\(alt,withdrawStart,retRate,infl\)/);
console.log('PASS: real-value retirement inputs, EIR window interest, full-term and zero-interest limits');
