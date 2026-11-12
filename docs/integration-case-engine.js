(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../engine'),require('../conditional/solver'),require('./timeline'),require('./evidence'),require('./governance'));else root.LexChainCaseEngine=factory(root.LexChainBrowserEngine,root.LexChainConditional,root.LexChainTimeline,root.LexChainEvidence,root.LexChainGovernance);})(typeof globalThis!=='undefined'?globalThis:this,function(E,C,T,V,G){
'use strict';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),clone=x=>JSON.parse(JSON.stringify(x));
function validate(input,assets){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('分析输入必须是对象');
 const errors=E.validateRuleSet(assets.rules);if(errors.length)throw new Error(errors.join(';'));
 E.assertFacts(input.facts===undefined?{}:input.facts,assets.rules.facts);
 if(input.context!==undefined&&(!input.context||typeof input.context!=='object'||Array.isArray(input.context)))throw new Error('context 必须是对象');
 const context=input.context||{};
 for(const k of ['eventDate','asOf'])if(context[k]!==undefined&&context[k]!==''&&!T.date(context[k]))throw new Error(k+' 必须为有效 YYYY-MM-DD');
 for(const k of ['jurisdiction','subject','period'])if(context[k]!==undefined&&typeof context[k]!=='string')throw new Error(k+' 必须为字符串');
 const maps=assets.mapping.rules,ids=assets.rules.rules.map(r=>r.id);
 if(context.ruleContexts!==undefined){if(!context.ruleContexts||typeof context.ruleContexts!=='object'||Array.isArray(context.ruleContexts))throw new Error('ruleContexts 必须是规则id到日期/法域的对象');for(const [id,c]of Object.entries(context.ruleContexts)){if(!ids.includes(id)||!c||typeof c!=='object'||Array.isArray(c)||Object.keys(c).some(k=>!['eventDate','jurisdiction'].includes(k))||(c.eventDate!==undefined&&!T.date(c.eventDate))||(c.jurisdiction!==undefined&&(typeof c.jurisdiction!=='string'||!c.jurisdiction.trim())))throw new Error('逐规则日期/法域覆盖无效');}}

 if(maps.length!==ids.length||new Set(maps.map(m=>m.id)).size!==ids.length||maps.some(m=>!ids.includes(m.id)))throw new Error('映射必须逐条覆盖且不能重复');
 const defs=Object.fromEntries(assets.rules.facts.map(f=>[f.key,f]));
 for(const m of maps){for(const c of [m.condition,...m.exceptions.map(e=>e.condition),...(m.fulfillment?[m.fulfillment]:[])]){const errs=E.validateCondition(c,defs);if(errs.length)throw new Error(errs.join(';'));}if(!['O','F','AUTH'].includes(m.kind))throw new Error('规范类型无效');}
 if(!Array.isArray(assets.registry.versions)||new Set(assets.registry.versions.map(v=>v.versionId)).size!==assets.registry.versions.length)throw new Error('法律版本 id 重复');
 const sources=input.sources===undefined?[]:input.sources;if(!Array.isArray(sources)||sources.length>500||new Set(sources.map(s=>s?.id)).size!==sources.length||sources.some(s=>!s||typeof s.id!=='string'||typeof s.text!=='string'))throw new Error('来源必须有唯一id和原文');
 if(input.events!==undefined){T.validate(input.events);for(const event of input.events)if(!sources.some(s=>s.id===event.sourceId))throw new Error('时间线事件引用不存在的来源 '+event.sourceId);}
 const evidence=input.evidence===undefined?[]:input.evidence;if(!Array.isArray(evidence)||evidence.length>500)throw new Error('证据批次过多');
 for(const e of evidence){if(!e||typeof e!=='object'||Array.isArray(e)||!Array.isArray(e.spans===undefined?[]:e.spans)||(e.spans||[]).length>500)throw new Error('证据批次或跨度无效');if(!sources.some(s=>s.id===e.sourceId))throw new Error('证据引用不存在的来源');E.assertFacts(e.facts,assets.rules.facts);}
}
function analyze(input,assets){
 validate(input,assets);input=clone({facts:input.facts===undefined?{}:input.facts,context:input.context===undefined?{}:input.context,events:input.events===undefined?[]:input.events,sources:input.sources===undefined?[]:input.sources,evidence:input.evidence===undefined?[]:input.evidence});
 const context=input.context,defs=Object.fromEntries(assets.rules.facts.map(f=>[f.key,f]));
 const timeline=input.events.length?T.project(input.events,context.asOf,context):null;
 const facts={...input.facts},conflicts=[];
 for(const [k,v] of Object.entries(timeline?.derivedFacts||{})){
  if(own(facts,k)&&facts[k]!==null&&facts[k]!==v){conflicts.push({fact:k,submitted:facts[k],timeline:v});facts[k]=null;}else if(!own(facts,k))facts[k]=v;
 }
 const evidence=input.evidence.map(e=>({sourceId:e.sourceId,candidates:V.inspect(input.sources.find(s=>s.id===e.sourceId).text,e.facts,e.spans||[],context)}));
 const original=assets.rules.rules.map(r=>E.evalRule(r,input.facts,defs));
 const results=[],steps=[],remaining=[...assets.mapping.rules];
 const ev=c=>E.evalCondition(c,facts,defs);
 const trace=n=>{const value=ev(n).value;if(own(n,'fact'))return {kind:'atom',fact:n.fact,actual:own(facts,n.fact)?facts[n.fact]:null,operator:n.op||'==',expected:own(n,'eq')?n.eq:own(n,'value')?n.value:true,value};if(own(n,'constant'))return {kind:'constant',value};const kind=n.not?'not':n.all?'all':'any';return {kind,value,children:(n.not?[n.not]:n.all||n.any).map(trace)};};
 while(remaining.length){const i=remaining.findIndex(m=>!m.violationOf||steps.some(s=>s.id===m.violationOf));if(i<0)throw new Error('规则依赖存在环或缺失');const m=remaining.splice(i,1)[0],base=assets.rules.rules.find(r=>r.id===m.id);
  const trigger=ev(m.condition),exceptions=m.exceptions.map(e=>({...e,eval:ev(e.condition)})),ex=exceptions.some(e=>e.eval.value==='T')?'T':exceptions.some(e=>e.eval.value==='U')?'U':'F',fulfill=m.fulfillment?ev(m.fulfillment):null;
  let dependency=null,condition=trigger.value;
  if(m.violationOf){const parent=steps.find(s=>s.id===m.violationOf);dependency={id:parent.id,status:parent.computedStatus};const d=parent.computedStatus==='VIOLATION'?'T':['NOT_TRIGGERED','DEFEATED','COMPLIANT'].includes(parent.computedStatus)?'F':'U';condition=condition==='F'||d==='F'?'F':condition==='U'||d==='U'?'U':'T';}
  const applicable=condition==='F'?'F':ex==='T'?'F':condition==='U'||ex==='U'?'U':'T';
  let computedStatus=condition==='F'?'NOT_TRIGGERED':ex==='T'?'DEFEATED':condition==='U'?'POSSIBLE':ex==='U'?'DEFENSIBLE':m.kind==='AUTH'?'PERMITTED':fulfill.value==='T'?'COMPLIANT':fulfill.value==='F'?'VIOLATION':'RISK';
  let modal=null;
  if(m.kind!=='AUTH'){
   const ought=m.kind==='F'?'!act':'act',query={policy:'all',norms:[{id:m.id,given:'applicable',ought}],facts:applicable==='U'?[]:[applicable==='T'?'applicable':'!applicable'],query:{given:'applicable',ought}};
   modal={input:query,result:C.solve(query),scope:'local-two-atom-conditional-contract'};
  }
  const legalContext={eventDate:context.ruleContexts?.[m.id]?.eventDate||context.eventDate||null,jurisdiction:context.ruleContexts?.[m.id]?.jurisdiction||context.jurisdiction||null};
  const governance=G.select(assets.registry,m.id,legalContext,m.mappingVersion);
  if(m.violationOf&&steps.find(s=>s.id===m.violationOf).governance.status!=='SELECTED'){governance.reasons.push('DEPENDENCY_REVIEW_PENDING');governance.status='REVIEW_REQUIRED';}
  if(m.exceptions.some(e=>e.basisId&&(assets.mapping.priorityBases||[]).find(b=>b.id===e.basisId)?.reviewStatus!=='APPROVED')){governance.reasons.push('PRIORITY_BASIS_REVIEW_PENDING');governance.status='REVIEW_REQUIRED';}
  let status=computedStatus==='NOT_TRIGGERED'?'NOT_TRIGGERED':governance.status==='SELECTED'?computedStatus:'REVIEW_REQUIRED';
  if(modal&&modal.result.status!=='ENTAILED'){status='REVIEW_REQUIRED';}
  const dimensions={trigger:condition,exception:ex,fulfillment:fulfill?fulfill.value:'NOT_APPLICABLE',applicability:applicable==='T'?'APPLICABLE':applicable==='U'?'PENDING':'BLOCKED'};
  const missing=new Map();for(const [phase,result]of [['trigger',trigger],...exceptions.map(e=>['exception:'+e.id,e.eval]),['fulfillment',fulfill]])if(result)for(const a of result.atoms.filter(a=>a.value==='U')){if(!missing.has(a.fact))missing.set(a.fact,{fact:a.fact,label:a.label,question:a.label+'？',reasons:[]});missing.get(a.fact).reasons.push(phase);}
  const needed=computedStatus!=='NOT_TRIGGERED'&&computedStatus!=='DEFEATED';
  const missingFactsByPhase={trigger:needed&&condition==='U'?[...missing.values()].filter(x=>x.reasons.includes('trigger')):[],exceptions:needed&&ex==='U'?[...missing.values()].filter(x=>x.reasons.some(p=>p.startsWith('exception:'))):[],fulfillment:needed&&condition==='T'&&fulfill?.value==='U'?[...missing.values()].filter(x=>x.reasons.includes('fulfillment')):[]};
  const mf=[...new Map(Object.values(missingFactsByPhase).flat().map(x=>[x.fact,x])).values()];
  const evaluations={condition:trace(m.condition),exceptions:m.exceptions.map(e=>({id:e.id,tree:trace(e.condition)})),fulfillment:m.fulfillment?trace(m.fulfillment):null};
  const step={evaluations,legalContext,id:m.id,mappingVersion:m.mappingVersion,kind:m.kind,condition:trigger.value,effectiveCondition:condition,exception:ex,fulfillment:dimensions.fulfillment,applicable,dependency,computedStatus,status,governance,modal};steps.push(step);
  results.push({...E.evalRule(base,facts,defs),trigger,exceptions,breach:fulfill,status,computedStatus,dimensions,governance,mapping:m,missingFacts:mf,missingFactsByPhase,
   symbol:m.formula+' → 计算：'+computedStatus+' / 发布：'+status,
   nlChain:[`条件 ${condition}；例外 ${ex}；历史履行 ${dimensions.fulfillment}。`,`规范映射：${m.formula}。行为命题与履行观察分离。`,...(dependency?[`违约后义务依赖 ${dependency.id} 的计算状态 ${dependency.status}；不把许可当作已实施行为。`]:[]),`计算状态 ${computedStatus}；业务发布状态 ${status}。`,...(status==='REVIEW_REQUIRED'?['版本/法域/过渡或审核信息不足：'+governance.reasons.join('、')]:[]),...m.limits],
   riskNote:status==='REVIEW_REQUIRED'?'原规则注释尚未通过法律审核；请结合本条映射限制核对。':base.risk_note||'',
   originalRiskNote:base.risk_note||'',
   remedy:status==='REVIEW_REQUIRED'?'待法律要件与版本审核后确定救济；研究计算不直接形成已成立的请求权。':base.remedy||''});
 }
 results.sort((a,b)=>assets.rules.rules.findIndex(r=>r.id===a.id)-assets.rules.rules.findIndex(r=>r.id===b.id));
 const counts={};results.forEach(r=>(counts[r.status]??=[]).push(r.id));
 const comparison=results.map(r=>({id:r.id,legacy:original.find(o=>o.id===r.id).status,computed:r.computedStatus,released:r.status,changed:original.find(o=>o.id===r.id).status!==r.computedStatus,reasons:r.mapping.limits}));
 const missing=new Map();results.forEach(r=>r.missingFacts.forEach(f=>missing.set(f.fact,f)));
 const report={engine:'LexChain v0.3 · 条件规范业务接入',status_policy:'2026-11-12',rulebase:assets.rules.meta.name,verdict:counts.REVIEW_REQUIRED?'研究计算已完成，法律适用待审核':counts.VIOLATION?'按当前事实，存在规则违反':'条件计算完成，仍需核对事实',verdict_symbol:'计算正确不等于事实真实或法律适用正确',status_counts:counts,rules:results,missing_facts:[...missing.values()],comparison,timeline,fact_conflicts:conflicts,evidence,boundary:assets.mapping.boundary,disclaimer:'采用原受控事实的研究映射；所有未获审核的法律版本不发布确定法律结论。原文匹配与人工确认均不证明材料真实。'};
 const certificate={format:'lexchain-business-certificate-v1',catalogSnapshot:clone(assets),catalogVersion:assets.mapping.version,registryVersion:assets.registry.version,input,derivedFacts:facts,timeline,evidence,conflicts,steps,comparison,statusCounts:counts};
 return {facts_used:facts,report,certificate};
}
return {analyze,validate};
});
