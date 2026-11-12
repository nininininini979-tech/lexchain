(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LexChainTimeline=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function need(x,m){if(!x)throw Object.assign(new Error(m),{code:'INVALID_REQUEST'});}
function date(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;}
function validate(events){
 need(Array.isArray(events)&&events.length<=2000,'事件必须为至多2000项的数组');const ids=new Map();
 for(const e of events){need(e&&typeof e==='object'&&!Array.isArray(e),'事件格式无效');need(typeof e.id==='string'&&/^[\w-]{1,80}$/.test(e.id)&&!ids.has(e.id),'事件 id 重复或无效');need(['WAGE_DUE','PAYMENT','UNPAID_OBSERVATION','DEMAND','RETRACT'].includes(e.type),'事件类型无效');need(date(e.date),'事件日期必须为有效 YYYY-MM-DD');need(typeof e.subject==='string'&&e.subject.trim()&&typeof e.period==='string'&&e.period.trim(),'事件必须提供主体和工资期间');need(typeof e.sourceId==='string'&&e.sourceId.trim(),'事件必须引用材料或自述来源');
  if(['WAGE_DUE','PAYMENT'].includes(e.type))need(Number.isSafeInteger(e.amountCents)&&e.amountCents>0&&e.amountCents<=100000000000,'金额必须为正整数分且不超过10亿元');
  if(e.type==='RETRACT'){const target=ids.get(e.targetId);need(target&&target.type!=='RETRACT'&&target.subject===e.subject&&target.period===e.period&&e.date>=target.date&&typeof e.reason==='string'&&e.reason.trim(),'撤回必须引用先前同主体/期间事件并说明理由');}ids.set(e.id,e);
 }
}
function project(events,asOf,scope={}){
 validate(events);need(date(asOf),'时间线必须明确 asOf 日期');
 const available=events.filter(e=>e.date<=asOf),retracted=new Set(available.filter(e=>e.type==='RETRACT').map(e=>e.targetId));
 const active=available.filter(e=>e.type!=='RETRACT'&&!retracted.has(e.id)&&(!scope.subject||e.subject===scope.subject)&&(!scope.period||e.period===scope.period));const groups=new Map();
 for(const e of active){const key=JSON.stringify([e.subject,e.period]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);}
 const periods=[...groups].map(([key,rows])=>{const [subject,period]=JSON.parse(key),dues=rows.filter(e=>e.type==='WAGE_DUE'),payments=rows.filter(e=>e.type==='PAYMENT');
  const dueCents=dues.reduce((s,e)=>s+e.amountCents,0),paidCents=payments.reduce((s,e)=>s+e.amountCents,0);need(Number.isSafeInteger(dueCents)&&Number.isSafeInteger(paidCents),'金额累加超出安全范围');
  let historicalLate=null;
  if(dues.length){historicalLate=dues.some(d=>d.date<asOf&&dues.filter(x=>x.date<=d.date).reduce((s,x)=>s+x.amountCents,0)>payments.filter(p=>p.date<=d.date).reduce((s,p)=>s+p.amountCents,0));}
  const observedUnpaid=rows.some(e=>e.type==='UNPAID_OBSERVATION');
  return {subject,period,dueCents:dues.length?dueCents:null,paidCents,balanceCents:dues.length?Math.max(0,dueCents-paidCents):null,overpaymentCents:dues.length?Math.max(0,paidCents-dueCents):null,historicalLate,observedUnpaid,eventIds:rows.map(e=>e.id),laterSatisfied:historicalLate===true&&paidCents>=dueCents};
 });
 // Only a scoped, quantified late event supports the negative historical field.
 const scoped=Boolean(scope.subject&&scope.period),late=periods.some(p=>p.historicalLate===true);
 return {asOf,scope,periods,derivedFacts:scoped&&late?{wage_paid_on_time_full:false}:{},limitations:['按自然日计算，到期日结束前不认定逾期；缺失付款记录不证明实际未付','仅在已录入事件范围计算；不把当前余额为零改写为从未逾期','工资期间和主体必须明确；未到期义务不计入当前余额']};
}
return {date,validate,project};
});
