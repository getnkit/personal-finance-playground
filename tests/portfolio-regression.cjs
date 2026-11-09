// Run: node tests/portfolio-regression.cjs
const assert=require('node:assert/strict');
const {validWeights,scenario,wholeBaht,dcaPlan}=require('../portfolio.js');

const A=[5,10,50,30,5,0,0];
const B=[5,10,65,15,5,0,0];
const shocks=[0,-35,-35,-5,0,-50,-20];
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,actual+' != '+expected);

assert.equal(validWeights(A),true);
assert.equal(validWeights(B),true);
assert.equal(validWeights([5,10,50,20,5,0,0]),false);
assert.equal(validWeights([5,10,50,40,5,0,0]),false);
assert.equal(validWeights([5,10,50,30,5,0,NaN]),false);

const shockA=scenario(1000000,A,shocks);
close(shockA.rate,-0.225);
close(shockA.change,-225000);
close(shockA.after,775000);
close(scenario(1000000,B,shocks).rate,-0.27);
close(scenario(1000000,A,[0,0,0,0,0,0,0]).after,1000000);
assert.equal(scenario(1000000,A,[0,0,0,0,0,0,-110]),null);

const standard=dcaPlan(1000000,30000,A,null);
assert.deepEqual(standard.buys,[1500,3000,15000,9000,1500,0,0]);
assert.equal(standard.buys.reduce((a,b)=>a+b),30000);

const rebalance=dcaPlan(1000000,30000,B,A);
assert.equal(rebalance.buys.reduce((a,b)=>a+b),30000);
assert.equal(rebalance.buys[3],0); // Bond is overweight relative to B.
assert.ok(rebalance.buys[2]>28000);
assert.ok(rebalance.gap>0); // Buying alone cannot fully correct the gap.

const aligned=dcaPlan(1000000,30000,A,A);
close(aligned.gap,0);
assert.equal(dcaPlan(1000000,0,A,A).buys.reduce((a,b)=>a+b),0);
assert.equal(dcaPlan(1000000,30000,A,[5,10,50,20,5,0,0]),null);
assert.equal(wholeBaht(12345,A).reduce((a,b)=>a+b),12345);
assert.equal(wholeBaht(0,A).reduce((a,b)=>a+b),0);

console.log('Portfolio regression checks passed');
