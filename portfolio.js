/* Portfolio Planner: all computations are local and illustrative. */
(function(){
'use strict';
const assets=[
 ['เงินสด / ตลาดเงิน','#9BAABE'],['หุ้นไทย','#6986C7'],['หุ้นต่างประเทศ','#3976BF'],
 ['ตราสารหนี้','#3BA894'],['ทองคำ','#D5AC55'],['คริปโต','#9574B9'],['อื่น ๆ','#B38A7B']
];
const defaults={value:1000000,monthly:30000,limit:20,
 A:[5,10,50,30,5,0,0],B:[5,10,65,15,5,0,0],
 current:[5,10,50,30,5,0,0],shocks:[0,-35,-35,-5,0,-50,-20],
 selected:'A',useCurrent:false};
const sum=xs=>xs.reduce((a,b)=>a+b,0);
function validWeights(xs){return Array.isArray(xs)&&xs.length===7&&xs.every(x=>Number.isFinite(x)&&x>=0&&x<=100)&&Math.abs(sum(xs)-100)<1e-6;}
function scenario(value,weights,shocks){
 if(!validWeights(weights)||shocks.length!==7||shocks.some(x=>!Number.isFinite(x)||x< -100||x>100))return null;
 const rate=sum(weights.map((w,i)=>w*shocks[i]/10000));
 return {rate:rate,change:value*rate,after:value*(1+rate)};
}
function wholeBaht(amount,scores){
 const total=Math.max(0,Math.round(amount)),score=sum(scores);
 if(!total||score<=0)return scores.map(()=>0);
 const exact=scores.map(s=>total*s/score),parts=exact.map(x=>Math.floor(x));
 const order=exact.map((x,i)=>({i:i,f:x-parts[i]})).sort((a,b)=>b.f-a.f||a.i-b.i);
 const remainder=total-sum(parts);
 for(let k=0;k<remainder;k++)parts[order[k].i]++;
 return parts;
}
function dcaPlan(value,monthly,target,current){
 if(!validWeights(target)||(current&&!validWeights(current)))return null;
 const scores=current?target.map((w,i)=>Math.max(0,(value+monthly)*w/100-value*current[i]/100)):target.slice();
 const buys=wholeBaht(monthly,scores),afterTotal=value+Math.max(0,Math.round(monthly));
 const after=current&&afterTotal>0?current.map((w,i)=>(value*w/100+buys[i])*100/afterTotal):null;
 const gap=after?sum(after.map((w,i)=>Math.abs(w-target[i])))/2:0;
 return {buys:buys,after:after,gap:gap};
}
if(typeof module!=='undefined'&&module.exports)module.exports={validWeights:validWeights,scenario:scenario,wholeBaht:wholeBaht,dcaPlan:dcaPlan};
if(typeof document==='undefined')return;

function resetState(){return {value:defaults.value,monthly:defaults.monthly,limit:defaults.limit,
 A:defaults.A.slice(),B:defaults.B.slice(),current:defaults.current.slice(),shocks:defaults.shocks.slice(),
 selected:'A',useCurrent:false};}
let plan=resetState();
const el=id=>document.getElementById('port-'+id);
const number=new Intl.NumberFormat('th-TH',{maximumFractionDigits:0});
const money=x=>Number.isFinite(x)?number.format(Math.round(x))+' บาท':'—';
const pct=x=>Number.isFinite(x)?(x>0?'+':'')+x.toFixed(1)+'%':'—';
const percent=x=>Number.isFinite(x)?x.toLocaleString('th-TH',{maximumFractionDigits:1})+'%':'—';
function controlRow(index,type){
 const row=document.createElement('label');row.className='port-weight-row';
 const name=document.createElement('span');name.className='port-asset-label';
 const swatch=document.createElement('span');swatch.className='port-swatch';swatch.style.background=assets[index][1];
 name.append(swatch,document.createTextNode(assets[index][0]));
 const wrap=document.createElement('span');wrap.className='port-number';
 const input=document.createElement('input');input.type='number';input.inputMode='decimal';input.step='1';
 input.min=type==='shock'?'-100':'0';input.max='100';
 input.dataset.portType=type;input.dataset.portIndex=String(index);
 input.setAttribute('aria-label',assets[index][0]+' '+(type==='shock'?'สมมติฐานการเปลี่ยนแปลง':type==='current'?'สัดส่วนปัจจุบัน':'สัดส่วนเป้าหมาย'));
 function get(){return type==='shock'?plan.shocks[index]:type==='current'?plan.current[index]:plan[plan.selected][index];}
 function save(v){if(type==='shock')plan.shocks[index]=v;else if(type==='current')plan.current[index]=v;else plan[plan.selected][index]=v;}
 input.addEventListener('input',()=>{save(input.value.trim()===''?NaN:Number(input.value));render();});
 input.addEventListener('change',()=>{
  let v=input.value.trim()===''?0:Number(input.value);
  v=Number.isFinite(v)?Math.max(type==='shock'?-100:0,Math.min(100,v)):0;
  save(v);input.value=String(v);render();
 });
 input.value=String(get());wrap.append(input,document.createTextNode('%'));row.append(name,wrap);
 return row;
}
assets.forEach((_,i)=>{
 el(i<5?'main-weights':'extra-weights').appendChild(controlRow(i,'target'));
 el('current-weights').appendChild(controlRow(i,'current'));
 el('shock-weights').appendChild(controlRow(i,'shock'));
});
function refresh(){
 ['value','monthly','limit'].forEach(id=>{el(id).value=String(plan[id]);});
 el('use-current').checked=plan.useCurrent;
 document.querySelectorAll('[data-port-type]').forEach(input=>{
  const i=Number(input.dataset.portIndex),type=input.dataset.portType;
  const v=type==='shock'?plan.shocks[i]:type==='current'?plan.current[i]:plan[plan.selected][i];
  input.value=Number.isFinite(v)?String(v):'';
 });
}
function displayRows(container,items){
 container.replaceChildren();
 items.forEach(item=>{
  const row=document.createElement('div');row.className='port-breakdown-row';
  const name=document.createElement('span');name.className='port-breakdown-label';
  const dot=document.createElement('span');dot.className='port-swatch';dot.style.background=assets[item.i][1];
  name.append(dot,document.createTextNode(assets[item.i][0]));
  const amount=document.createElement('strong');amount.textContent=item.text;
  row.append(name,amount);container.appendChild(row);
 });
}
function compare(id){
 const s=scenario(plan.value,plan[id],plan.shocks);
 el('compare-'+id+'-shock').textContent=s?pct(s.rate*100):'—';
 el('compare-'+id+'-after').textContent=s?money(s.after):'—';
 el('compare-'+id+'-status').textContent=validWeights(plan[id])?'เงินต้น '+money(plan.value):'สัดส่วนไม่ครบ 100%';
 el('compare-'+id).classList.toggle('is-selected',id===plan.selected);
}
function render(){
 const weights=plan[plan.selected],total=sum(weights),ok=validWeights(weights);
 const assumptions=plan.shocks.every(s=>Number.isFinite(s)&&s>=-100&&s<=100);
 el('weight-status').textContent=!Number.isFinite(total)?'กรอกสัดส่วนให้ครบทุกหมวด':
  Math.abs(total-100)<1e-6?'ครบ 100%':'รวม '+percent(total)+' · '+(total<100?'ขาด ':'เกิน ')+percent(Math.abs(100-total));
 el('weight-status').classList.toggle('is-invalid',!ok);
 el('extra-total').textContent=Number.isFinite(sum(weights.slice(5)))?percent(sum(weights.slice(5))):'—';
 el('current-options').hidden=!plan.useCurrent;
 el('current-status').textContent=validWeights(plan.current)?'ครบ 100%':'สัดส่วนปัจจุบันต้องรวม 100%';
 el('current-status').classList.toggle('is-invalid',!validWeights(plan.current));
 ['A','B'].forEach(id=>{el('choose-'+id).setAttribute('aria-pressed',String(id===plan.selected));compare(id);});
 const error=!ok?'กรุณากำหนด Target Allocation ให้ครบ 100%':!assumptions?'สมมติฐานการเปลี่ยนแปลงต้องอยู่ระหว่าง -100% ถึง +100%':'';
 el('invalid').hidden=!error;el('invalid').textContent=error;
 el('results').hidden=!!error;
 if(error)return;
 const s=scenario(plan.value,weights,plan.shocks);
 el('active-name').textContent='Portfolio '+plan.selected;
 el('value-summary').textContent=money(plan.value);
 el('scenario-change').textContent=pct(s.rate*100);
 el('scenario-change').classList.toggle('is-negative',s.rate<0);
 el('scenario-after').textContent=money(s.after);
 el('scenario-impact').textContent=(s.change<0?'ลดลง ':'เพิ่มขึ้น ')+money(Math.abs(s.change));
 const over=Math.max(0,-s.rate*100)>plan.limit+1e-8;
 el('risk-note').textContent=s.rate>=0?'สถานการณ์นี้พอร์ตไม่ขาดทุน แต่ไม่ได้หมายความว่าพอร์ตไม่มีความเสี่ยง':
  over?'ผลขาดทุนในสถานการณ์นี้เกินกรอบ '+percent(plan.limit)+' ที่ตั้งไว้':
  'ผลขาดทุนในสถานการณ์นี้อยู่ภายในกรอบ '+percent(plan.limit)+' ที่ตั้งไว้';
 el('risk-note').classList.toggle('is-warning',over);
 const bar=el('allocation-bar');bar.replaceChildren();
 weights.forEach((weight,i)=>{
  if(weight<=0)return;
  const span=document.createElement('span');span.style.width=weight+'%';span.style.background=assets[i][1];
  span.title=assets[i][0]+' '+percent(weight);bar.appendChild(span);
 });
 displayRows(el('allocation-rows'),weights.map((w,i)=>({i:i,text:percent(w)+' · '+money(plan.value*w/100)})).filter(x=>weights[x.i]>0));
 el('assumptions').textContent='Scenario: '+assets.map((a,i)=>a[0]+' '+pct(plan.shocks[i])).join(' · ')+' · ไม่ใช่ Maximum Drawdown จริง';
 const currentOk=!plan.useCurrent||validWeights(plan.current);
 el('dca-invalid').hidden=currentOk;el('dca-output').hidden=!currentOk;
 if(!currentOk){el('dca-invalid').textContent='กรุณากำหนดสัดส่วนพอร์ตปัจจุบันให้ครบ 100%';return;}
 const dca=dcaPlan(plan.value,plan.monthly,weights,plan.useCurrent?plan.current:null);
 displayRows(el('dca-rows'),dca.buys.map((v,i)=>({i:i,text:money(v)})).filter(x=>weights[x.i]>0||dca.buys[x.i]>0));
 el('dca-total').textContent=money(sum(dca.buys));
 el('dca-mode').textContent=plan.useCurrent?'ใช้เงินใหม่ซื้อสินทรัพย์ที่ต่ำกว่าเป้าหมาย โดยไม่ขายของเดิม':'แบ่ง DCA ตาม Target Allocation';
 el('dca-gap').textContent=plan.useCurrent
  ?'ส่วนต่างสัดส่วนหลัง DCA: '+percent(dca.gap)+' จุดเปอร์เซ็นต์'+(dca.gap>.05?' · เงินใหม่ยังปรับไม่ถึงเป้าหมาย':' · ใกล้เคียงเป้าหมายแล้ว')
  :'เปิดตัวเลือกสัดส่วนปัจจุบัน เพื่อใช้ DCA ช่วย Rebalance';
}
function bind(id,max){
 el(id).addEventListener('input',e=>{
  const raw=e.target.value.trim(),v=Number(raw);
  if(raw!==''&&Number.isFinite(v)&&v>=0&&v<=max){plan[id]=v;render();}
 });
 el(id).addEventListener('change',e=>{
  const raw=e.target.value.trim(),v=Number(raw);
  if(raw!==''&&Number.isFinite(v))plan[id]=Math.max(0,Math.min(max,Math.round(v)));
  e.target.value=String(plan[id]);render();
 });
}
bind('value',1e9);bind('monthly',1e6);bind('limit',100);
['A','B'].forEach(id=>el('choose-'+id).addEventListener('click',()=>{plan.selected=id;refresh();render();}));
el('use-current').addEventListener('change',e=>{plan.useCurrent=e.target.checked;render();});
el('reset').addEventListener('click',()=>{plan=resetState();refresh();render();});
refresh();render();
})();