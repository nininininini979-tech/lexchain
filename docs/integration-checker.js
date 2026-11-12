(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../conditional/checker'),require('./hash'));else root.LexChainBusinessChecker=factory(root.LexChainConditionalChecker,root.LexChainHash);})(typeof globalThis!=='undefined'?globalThis:this,function(M,S){
'use strict';
// This module never imports the business evaluator, governance selector, evidence checker or timeline projector.
const canonical=x=>Array.isArray(x)?'['+x.map(canonical).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
const equal=(a,b)=>canonical(a)===canonical(b),own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function verify(c,assets,expectedInput){try{
 const need=(x,m)=>{if(!x)throw new Error(m);};
 const validDate=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\d$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().substring(0,10)===s;
 need(c?.format==='lexchain-business-certificate-v1','证书格式错误');need(c.catalogVersion===assets.mapping.version&&c.registryVersion===assets.registry.version,'可信目录版本不匹配');
 need(equal(c.catalogSnapshot,assets),'完整可信目录快照绑定不一致');
 const input=c.input;need(input&&input.facts&&input.context&&typeof input.context==='object'&&!Array.isArray(input.context)&&Array.isArray(input.sources)&&Array.isArray(input.events)&&Array.isArray(input.evidence),'证书缺少输入');
 if(expectedInput)need(equal(input,expectedInput),'外部输入绑定不一致');
 const defs=Object.fromEntries(assets.rules.facts.map(f=>[f.key,f]));
 function factsOK(fs){need(fs&&typeof fs==='object'&&!Array.isArray(fs),'事实不是对象');for(const [k,v]of Object.entries(fs)){const d=defs[k];need(own(defs,k),'未知事实');if(v===null)continue;need(d.type==='bool'?typeof v==='boolean':typeof v==='number'&&Number.isFinite(v)&&(d.minimum===undefined||v>=d.minimum)&&(d.maximum===undefined||v<=d.maximum)&&(!d.integer||Number.isInteger(v)),'事实类型/范围错误');}}
 factsOK(input.facts);const ctx=input.context;
 if(ctx.ruleContexts!==undefined){need(ctx.ruleContexts&&typeof ctx.ruleContexts==='object'&&!Array.isArray(ctx.ruleContexts),'逐规则范围格式无效');for(const [id,override] of Object.entries(ctx.ruleContexts)){need(assets.mapping.rules.some(m=>m.id===id)&&override&&typeof override==='object'&&!Array.isArray(override)&&Object.keys(override).every(k=>['eventDate','jurisdiction'].includes(k))&&(override.eventDate===undefined||validDate(override.eventDate))&&(override.jurisdiction===undefined||typeof override.jurisdiction==='string'&&override.jurisdiction.trim()),'逐规则日期或法域无效');}}
 for(const k of ['eventDate','asOf'])if(ctx[k]!==undefined&&ctx[k]!=='')need(validDate(ctx[k]),'日期无效');for(const k of ['jurisdiction','subject','period'])if(ctx[k]!==undefined)need(typeof ctx[k]==='string','范围必须是字符串');
 need(input.sources.length<=500&&new Set(input.sources.map(s=>s.id)).size===input.sources.length&&input.sources.every(s=>typeof s.id==='string'&&typeof s.text==='string'),'来源无效');
 const source=id=>input.sources.find(s=>s.id===id);
 function val(n,f){
  if(own(n,'constant'))return n.constant?'T':'F';
  if(own(n,'fact')){const v=f[n.fact];if(v===null||v===undefined)return 'U';const t=own(n,'eq')?n.eq:own(n,'value')?n.value:true;const op=n.op||'==';const tests={'==':()=>v===t,'>':()=>v>t,'>=':()=>v>=t,'<':()=>v<t,'<=':()=>v<=t};need(tests[op],'非法比较');return tests[op]()?'T':'F';}
  if(n.not)return {T:'F',F:'T',U:'U'}[val(n.not,f)];const vs=(n.all||n.any).map(x=>val(x,f));need(vs.length,'空条件');return n.all?(vs.every(v=>v==='T')?'T':vs.some(v=>v==='F')?'F':'U'):(vs.some(v=>v==='T')?'T':vs.every(v=>v==='F')?'F':'U');
 }
 function tree(n,f){const value=val(n,f);if(own(n,'fact'))return {kind:'atom',fact:n.fact,actual:own(f,n.fact)?f[n.fact]:null,operator:n.op||'==',expected:own(n,'eq')?n.eq:own(n,'value')?n.value:true,value};if(own(n,'constant'))return {kind:'constant',value};const children=[];for(const x of n.not?[n.not]:n.all||n.any)children.push(tree(x,f));return {kind:n.not?'not':n.all?'all':'any',value,children};}
 const ids=new Map();need(input.events.length<=2000,'事件过多');
 for(const e of input.events){need(e&&typeof e.id==='string'&&/^[\w-]{1,80}$/.test(e.id)&&!ids.has(e.id)&&validDate(e.date)&&source(e.sourceId)&&typeof e.subject==='string'&&e.subject.trim()&&typeof e.period==='string'&&e.period.trim(),'事件无效');need(['WAGE_DUE','PAYMENT','UNPAID_OBSERVATION','DEMAND','RETRACT'].includes(e.type),'事件类型无效');
  if(e.type==='WAGE_DUE'||e.type==='PAYMENT')need(Number.isSafeInteger(e.amountCents)&&e.amountCents>0&&e.amountCents<=100000000000,'事件金额无效');
  if(e.type==='RETRACT'){const t=ids.get(e.targetId);need(t&&t.type!=='RETRACT'&&t.subject===e.subject&&t.period===e.period&&e.date>=t.date&&typeof e.reason==='string'&&e.reason.trim(),'撤回无效');}ids.set(e.id,e);
 }
 let timeline=null;const f={...input.facts},conflicts=[];
 if(input.events.length){need(validDate(ctx.asOf),'时间线缺少截至日期');const present=input.events.filter(e=>e.date<=ctx.asOf),revoked=present.filter(e=>e.type==='RETRACT').map(e=>e.targetId),groups=[];
  for(const e of present){if(e.type==='RETRACT'||revoked.includes(e.id)||(ctx.subject&&e.subject!==ctx.subject)||(ctx.period&&e.period!==ctx.period))continue;let g=groups.find(g=>g.subject===e.subject&&g.period===e.period);if(!g){g={subject:e.subject,period:e.period,events:[]};groups.push(g);}g.events.push(e);}
  const periods=groups.map(g=>{let due=0,paid=0,hasDue=false,late=false;const dates=[...new Set(g.events.map(e=>e.date))].sort();for(const d of dates){for(const e of g.events.filter(e=>e.date===d)){if(e.type==='WAGE_DUE'){hasDue=true;due+=e.amountCents;}if(e.type==='PAYMENT')paid+=e.amountCents;}if(d<ctx.asOf&&g.events.some(e=>e.date===d&&e.type==='WAGE_DUE')&&due>paid)late=true;}need(Number.isSafeInteger(due)&&Number.isSafeInteger(paid),'金额溢出');return {subject:g.subject,period:g.period,dueCents:hasDue?due:null,paidCents:paid,balanceCents:hasDue?Math.max(0,due-paid):null,overpaymentCents:hasDue?Math.max(0,paid-due):null,historicalLate:hasDue?late:null,observedUnpaid:g.events.some(e=>e.type==='UNPAID_OBSERVATION'),eventIds:g.events.map(e=>e.id),laterSatisfied:hasDue&&late&&paid>=due};});
  const derived=ctx.subject&&ctx.period&&periods.some(p=>p.historicalLate===true)?{wage_paid_on_time_full:false}:{};
  need(c.timeline&&equal(c.timeline.periods,periods)&&c.timeline.asOf===ctx.asOf&&equal(c.timeline.scope,ctx)&&equal(c.timeline.derivedFacts,derived)&&equal(c.timeline.limitations,['按自然日计算，到期日结束前不认定逾期；缺失付款记录不证明实际未付','仅在已录入事件范围计算；不把当前余额为零改写为从未逾期','工资期间和主体必须明确；未到期义务不计入当前余额']),'时间线计算或限定声明不一致');timeline=c.timeline;
  for(const [k,v]of Object.entries(derived)){if(own(f,k)&&f[k]!==null&&f[k]!==v){conflicts.push({fact:k,submitted:f[k],timeline:v});f[k]=null;}else if(!own(f,k))f[k]=v;}
 }else need(c.timeline===null,'虚构时间线');
 need(equal(f,c.derivedFacts)&&equal(conflicts,c.conflicts),'事实投影或冲突处理不一致');
 need(input.evidence.length<=500&&Array.isArray(c.evidence)&&c.evidence.length===input.evidence.length,'证据批次缺失');
 for(let i=0;i<input.evidence.length;i++){
  const e=input.evidence[i],s=source(e.sourceId),o=c.evidence[i];need(s&&o.sourceId===e.sourceId&&Array.isArray(o.candidates),'证据来源错误');factsOK(e.facts);need(Array.isArray(e.spans===undefined?[]:e.spans)&&(e.spans||[]).length<=500,'跨度格式无效');const entries=Object.entries(e.facts).filter(([,v])=>v!==null);need(entries.length===o.candidates.length,'候选事实遗漏');
  entries.forEach(([key,value],j)=>{const out=o.candidates[j],refs=(e.spans||[]).filter(r=>r&&r.fact===key);need(out.fact===key&&out.value===value&&out.decision==='PENDING_CONFIRMATION'&&out.truthStatus==='NOT_AUTHENTICATED'&&out.quotes.length===refs.length,'候选绑定或真实性声明无效');
   refs.forEach((r,k)=>{const q=out.quotes[k],anchored=Number.isInteger(r.start)&&Number.isInteger(r.end)&&r.start>=0&&r.end>r.start&&r.end<=s.text.length&&typeof r.quote==='string'&&s.text.substring(r.start,r.end)===r.quote;let support='NEEDS_REVIEW';if(!anchored)support='INVALID_SPAN';else if((ctx.subject&&r.subject!==ctx.subject)||(ctx.period&&r.period!==ctx.period))support='SCOPE_MISMATCH';else if(key==='wage_paid_on_time_full'&&value===true&&/(未到账|未支付|拖欠|迟发|逾期|没有.*(?:支付|发放)|补付)/.test(r.quote))support='CONTRADICTED';else if(key==='wage_paid_on_time_full'&&value===false&&/(未到账|未支付|拖欠|逾期)/.test(r.quote)&&!/(不是|并非|没有拖欠|未曾|可能|如果|听说|他人)/.test(r.quote))support='LEXICAL_MATCH';need(q.fact===key&&q.start===(Number.isInteger(r.start)?r.start:null)&&q.end===(Number.isInteger(r.end)?r.end:null)&&q.quote===(typeof r.quote==='string'?r.quote:'')&&q.subject===(r.subject||null)&&q.period===(r.period||null)&&q.anchored===anchored&&q.support===support&&q.reason===({NEEDS_REVIEW:'自动检查只验证引用和有限语言模式，需人工核对主体、时间和否定',INVALID_SPAN:'原文 UTF-16 [start,end) 与引用不一致',SCOPE_MISMATCH:'主体或期间与本案范围不一致',CONTRADICTED:'引用含未付、迟付或补付，不能支持按时足额支付=true',LEXICAL_MATCH:'有限欠薪词汇匹配；尚未验证主体、到期时间或事实真实性'})[support],'跨度、支持状态或限定说明不一致');});
   need(equal(out.reasons,refs.length?[]:['缺少原文跨度']),'引用说明不一致');
   need(out.anchorStatus===(refs.length&&out.quotes.every(q=>q.anchored)?'ANCHORED':'UNANCHORED')&&out.supportStatus===(['INVALID_SPAN','SCOPE_MISMATCH','CONTRADICTED'].find(s=>out.quotes.some(q=>q.support===s))||(refs.length===1?out.quotes[0].support:refs.length?'NEEDS_REVIEW':'NO_CITATION')),'支持汇总不一致');
  });
 }
 const interval=v=>validDate(v.effectiveFrom)&&((validDate(v.effectiveTo)&&v.effectiveTo>v.effectiveFrom&&v.openEnded!==true)||(v.openEnded===true&&(v.effectiveTo===null||v.effectiveTo===undefined)));
 function legal(m){const ctx={eventDate:input.context.ruleContexts?.[m.id]?.eventDate||input.context.eventDate||null,jurisdiction:input.context.ruleContexts?.[m.id]?.jurisdiction||input.context.jurisdiction||null};const all=assets.registry.versions.filter(v=>v.ruleId===m.id&&!v.archived),why=[];
  if(!validDate(ctx.eventDate))why.push('MISSING_EVENT_DATE');if(typeof ctx.jurisdiction!=='string'||!ctx.jurisdiction.trim())why.push('MISSING_JURISDICTION');
  const geo=all.filter(v=>(v.jurisdictions||[]).some(j=>ctx.jurisdiction===j||(v.includesSubdivisions===true&&typeof ctx.jurisdiction==='string'&&ctx.jurisdiction.indexOf(j+'-')===0)));
  if(ctx.jurisdiction&&!geo.length)why.push('NO_JURISDICTION_MATCH');const dated=[];
  for(const v of geo)if(interval(v)&&ctx.eventDate>=v.effectiveFrom&&(!v.effectiveTo||ctx.eventDate<v.effectiveTo))dated.push(v);
  if(geo.some(v=>!interval(v)))why.push('UNKNOWN_EFFECTIVE_INTERVAL');if(ctx.eventDate&&!dated.length)why.push('NO_DATE_MATCH');if(dated.length>1)why.push('AMBIGUOUS_VERSIONS');const v=dated.length===1?dated[0]:null;
  if(v){if(v.mappingVersion!==m.mappingVersion)why.push('MAPPING_VERSION_MISMATCH');if(v.review?.status!=='APPROVED'||!v.review.reviewer||!validDate(v.review.reviewedAt))why.push('LEGAL_REVIEW_PENDING');if(v.transition?.status!=='REVIEWED'||!v.transition.basis)why.push('TRANSITION_REVIEW_PENDING');const s=(assets.registry.sources||[]).find(x=>x.id===v.sourceSnapshotId);if(!s||typeof s.text!=='string'||!s.text||!s.url||!validDate(s.retrievedAt)||!v.sourceUrl||s.url!==v.sourceUrl)why.push('SOURCE_SNAPSHOT_MISSING');else if(!/^[a-f0-9]{64}$/.test(s.sha256||'')||S.sha256(s.text)!==s.sha256)why.push('SOURCE_SNAPSHOT_DIGEST_MISMATCH');}
  return {status:why.length?'REVIEW_REQUIRED':'SELECTED',versionId:v?v.versionId:null,candidateIds:all.map(v=>v.versionId),reasons:[...new Set(why)]};
 }
 const mappings=assets.mapping.rules;need(c.steps?.length===mappings.length&&new Set(c.steps.map(s=>s.id)).size===mappings.length&&mappings.length===assets.rules.rules.length,'规则步骤遗漏或重复');
 const seen=new Map(),counts={},comparison=[];
 for(const step of c.steps){const m=mappings.find(m=>m.id===step.id);need(m&&m.mappingVersion===step.mappingVersion&&step.kind===m.kind,'映射绑定错误');const raw=val(m.condition,f),evs=m.exceptions.map(e=>val(e.condition,f)),ex=evs.includes('T')?'T':evs.includes('U')?'U':'F',h=m.fulfillment?val(m.fulfillment,f):'NOT_APPLICABLE';let t=raw,dependency=null;
  if(m.violationOf){const p=seen.get(m.violationOf);need(p,'依赖缺失或未拓扑排序');dependency={id:p.id,status:p.computedStatus};const dep=p.computedStatus==='VIOLATION'?'T':['NOT_TRIGGERED','DEFEATED','COMPLIANT'].includes(p.computedStatus)?'F':'U';t=t==='F'||dep==='F'?'F':t==='U'||dep==='U'?'U':'T';}
  const a=t==='F'||ex==='T'?'F':t==='U'||ex==='U'?'U':'T',computed=t==='F'?'NOT_TRIGGERED':ex==='T'?'DEFEATED':t==='U'?'POSSIBLE':ex==='U'?'DEFENSIBLE':m.kind==='AUTH'?'PERMITTED':h==='T'?'COMPLIANT':h==='F'?'VIOLATION':'RISK',g=legal(m);
  if(m.violationOf&&seen.get(m.violationOf).governance.status!=='SELECTED'){g.reasons.push('DEPENDENCY_REVIEW_PENDING');g.status='REVIEW_REQUIRED';}
  if(m.exceptions.some(e=>e.basisId&&(assets.mapping.priorityBases||[]).find(b=>b.id===e.basisId)?.reviewStatus!=='APPROVED')){g.reasons.push('PRIORITY_BASIS_REVIEW_PENDING');g.status='REVIEW_REQUIRED';}
  need(equal(step.legalContext,{eventDate:ctx.ruleContexts?.[m.id]?.eventDate||ctx.eventDate||null,jurisdiction:ctx.ruleContexts?.[m.id]?.jurisdiction||ctx.jurisdiction||null}),'逐规则法律事件日期或法域错误');
  need(equal(step.evaluations,{condition:tree(m.condition,f),exceptions:m.exceptions.map(e=>({id:e.id,tree:tree(e.condition,f)})),fulfillment:m.fulfillment?tree(m.fulfillment,f):null}),'条件树中的中间值错误');
  need(equal(step.dependency,dependency)&&step.condition===raw&&step.effectiveCondition===t&&step.exception===ex&&step.fulfillment===h&&step.applicable===a&&step.computedStatus===computed&&equal(step.governance,g),'条件、依赖或版本选择错误 '+m.id);
  if(m.kind==='AUTH')need(step.modal===null,'授权不得冒充弱许可或义务证明');else{const ought=m.kind==='F'?'!act':'act';const query={policy:'all',norms:[{id:m.id,given:'applicable',ought}],facts:a==='U'?[]:[a==='T'?'applicable':'!applicable'],query:{given:'applicable',ought}};need(step.modal&&step.modal.scope==='local-two-atom-conditional-contract'&&equal(step.modal.input,query),'模态输入绑定不一致');need(step.modal.result.status==='ENTAILED'&&M.verify(query,step.modal.result).verified,'条件规范子证书失败');}
  const status=computed==='NOT_TRIGGERED'?'NOT_TRIGGERED':g.status==='SELECTED'?computed:'REVIEW_REQUIRED';need(step.status===status,'发布状态错误');seen.set(m.id,step);(counts[status]??=[]).push(m.id);
 }
 for(const old of assets.rules.rules){const t=val(old.trigger,input.facts),es=old.exceptions.map(e=>val({all:e.all},input.facts)),ex=es.includes('T')?'T':es.includes('U')?'U':'F',h=old.category==='obligation'?val(old.breach,input.facts):null;const legacy=t==='F'?'NOT_TRIGGERED':ex==='T'?'DEFEATED':t==='U'?'POSSIBLE':ex==='U'?'DEFENSIBLE':old.category==='permission'?'PERMITTED':old.category==='prohibition'?'VIOLATION':h==='T'?'COMPLIANT':h==='F'?'VIOLATION':'RISK',s=seen.get(old.id);comparison.push({id:old.id,legacy,computed:s.computedStatus,released:s.status,changed:legacy!==s.computedStatus,reasons:mappings.find(m=>m.id===old.id).limits});}
 const sortedCounts={};for(const r of assets.rules.rules){const s=seen.get(r.id);(sortedCounts[s.status]??=[]).push(r.id);}
 need(equal(c.comparison,comparison)&&equal(c.statusCounts,sortedCounts),'新旧比较或计数不一致');
 return {verified:true,checkedRules:seen.size,modalCertificates:c.steps.filter(s=>s.modal).length,inputBinding:expectedInput?'EXTERNAL_INPUT_MATCHED':'SELF_CONTAINED_ONLY',boundary:'复核受信任规则/映射/版本目录上的计算；不证明原文真实、人工审核权威或法律适用正确。'};
 }catch(e){return {verified:false,reason:e.message};}}
return {verify,canonical};
});
