// Lightweight regression checks for the salaried-income Tax planner.
// Run locally: node tests/tax-regression.cjs
// No external dependencies; tests use the current inline calculator source.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('const taxBands=');
const end = html.indexOf('// Print the visible UI itself', start);
assert.ok(start >= 0 && end > start, 'Tax calculation source was not found');
const source = html.slice(start, end);

const defaults = {
  taxSalary: 40000, taxBonus: 0, taxAnnualActual: 0, taxSso: 10500,
  taxLife: 0, taxHealth: 0, taxParents: 0, taxPvd: 0, taxRmf: 0, taxExtra: 0
};

function calculate(overrides = {}, withheld = '') {
  const values = {};
  const elements = { taxWithheldInput: { value: String(withheld) }, taxSettlementBox: { hidden: true } };
  const context = {
    state: { ...defaults, ...overrides },
    $: id => elements[id],
    set: (id, value) => { values[id] = value; },
    baht: value => Math.round(value) + ' ฿',
    percent: value => value + '%'
  };
  vm.runInNewContext(source + '\ntax();', context, { timeout: 1000 });
  return { values, elements };
}

const tests = [
  ['basic salary', {}, '', { taxAnnual: '8450 ฿', taxTaxable: '309500 ฿' }],
  ['salary raise example', { taxSalary: 38000 }, '', { taxAnnual: '6775 ฿' }],
  ['50-tawi annual income override', { taxAnnualActual: 500000 }, '', { taxAnnual: '10450 ฿', taxGross: '500000 ฿' }],
  ['withheld tax refund', {}, '10000', { taxSettlementValue: '1550 ฿', taxSettlementLabel: 'คาดว่าขอคืน' }],
  ['zero withheld still counts as entered', {}, '0', { taxSettlementValue: '8450 ฿', taxSettlementLabel: 'คาดว่าต้องจ่ายเพิ่ม' }],
  ['life + health combined limit', { taxLife: 90000, taxHealth: 25000 }, '', { taxAdditionalUsed: '100000 ฿', taxAnnual: '2975 ฿' }],
  ['one eligible parent', { taxParents: 1 }, '', { taxAdditionalUsed: '30000 ฿', taxAnnual: '6475 ฿' }],
  ['PVD / RMF combined limit', { taxAnnualActual: 1000000, taxPvd: 500000, taxRmf: 500000 }, '', { taxAdditionalUsed: '450000 ฿', taxAnnual: '15450 ฿' }],
  ['low income zero tax', { taxSalary: 15000 }, '', { taxAnnual: '0 ฿' }],
  ['top bracket', { taxAnnualActual: 6000000 }, '', { taxBracket: '35%' }]
];

for (const [name, overrides, withheld, expected] of tests) {
  const { values, elements } = calculate(overrides, withheld);
  for (const [key, target] of Object.entries(expected)) {
    assert.equal(values[key], target, name + ' / ' + key);
  }
  assert.equal(elements.taxSettlementBox.hidden, withheld === '', name + ' / withholding visibility');
  console.log('PASS ' + name);
}
console.log('Passed ' + tests.length + ' salaried-income tax regression cases.');
