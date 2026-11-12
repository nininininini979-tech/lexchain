(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./timeline'),require('./evidence'));else root.LexChainHistory=factory(root.LexChainTimeline,root.LexChainEvidence);})(typeof globalThis!=='undefined'?globalThis:this,function(T,V){
'use strict';
const canonical=x=>Array.isArray(x)?'['+x.map(canonical).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function need(x,m){if(!x)throw Object.assign(new Error(m),{code:'INVALID_REQUEST'});}
function validContext(p){
 need(p&&typeof p==='object'&&!Array.isArray(p),'案件范围必须是对象');
 need(T.date(p.eventDate)&&T.date(p.asOf)&&typeof p.subject==='string'&&p.subject.trim()&&typeof p.period==='string'&&p.period.trim()&&typeof p.jurisdiction==='string'&&p.jurisdiction.trim(),'案件范围、法域和日期必须填写');
 if(p.ruleContexts!==undefined){need(p.ruleContexts&&typeof p.ruleContexts==='object'&&!Array.isArray(p.ruleContexts),'逐规则范围格式无效');for(const [id,c]of Object.entries(p.ruleContexts))need(/^R[0-9]+(?:-[A-Z0-9]+)*$/.test(id)&&c&&typeof c==='object'&&!Array.isArray(c)&&Object.keys(c).every(k=>['eventDate','jurisdiction'].includes(k))&&(c.eventDate===undefined||T.date(c.eventDate))&&(c.jurisdiction===undefined||typeof c.jurisdiction==='string'&&c.jurisdiction.trim()),'逐规则范围格式无效');}
}
// Metadata assigned by the log is not part of the computational input.
function analysisInput(state){const clean=x=>{const {recordId,...rest}=x;return rest;};return {facts:state.factState,context:state.context,events:state.timeline,sources:state.sources.map(clean),evidence:state.evidence.map(clean)};}
function normalizeInput(input){const clean=x=>{const {recordId,...rest}=x;return rest;};return {...input,sources:input.sources.map(clean),evidence:input.evidence.map(clean)};}

function replay(events,definitions,options={}){
 need(Array.isArray(events)&&events.length<=10000,'来源历史过大或格式错误');
 const knownRevision=options.knownRevision??events.length;need(Number.isInteger(knownRevision)&&knownRevision>=0&&knownRevision<=events.length,'历史修订号必须为有效整数');
 const defs=Object.fromEntries(definitions.map(f=>[f.key,f])),state={context:{},sources:[],facts:[],timeline:[],evidence:[],reviews:[],analyses:[]},ids=new Set();
 for(const event of events.slice(0,knownRevision)){need(event&&event.seq===ids.size+1&&typeof event.id==='string'&&!ids.has(event.id)&&typeof event.actor==='string'&&event.actor.trim()&&typeof event.recordedAt==='string'&&Number.isFinite(Date.parse(event.recordedAt)),'历史顺序、作者或记录时间无效');ids.add(event.id);const p=event.payload;need(p&&typeof p==='object'&&!Array.isArray(p),'历史内容格式错误');
  if(event.type==='SOURCE'){need(typeof p.id==='string'&&/^[\w-]{1,80}$/.test(p.id)&&typeof p.text==='string'&&p.text.trim()&&typeof p.title==='string'&&!state.sources.some(s=>s.id===p.id),'来源 id 重复或原文为空');state.sources.push({...p,recordId:event.id});}
  else if(event.type==='CONTEXT'){validContext(p);state.context={...p};}
  else if(event.type==='FACT'){
   const d=defs[p.key];need(own(defs,p.key),'未知事实字段');need(p.value===null||(d.type==='bool'?typeof p.value==='boolean':typeof p.value==='number'&&Number.isFinite(p.value)&&(d.minimum===undefined||p.value>=d.minimum)&&(d.maximum===undefined||p.value<=d.maximum)&&(!d.integer||Number.isInteger(p.value))),'事实值无效');
   need(typeof p.subject==='string'&&p.subject.trim()&&typeof p.period==='string'&&p.period.trim()&&T.date(p.effectiveAt)&&typeof p.reason==='string'&&p.reason.trim()&&state.sources.some(s=>s.id===p.sourceId),'事实必须填写主体、期间、发生日期、原因及来源');
   const prior=state.facts.filter(f=>f.key===p.key&&f.subject===p.subject&&f.period===p.period).at(-1);
   if(!prior)need(p.changeType==='INITIAL'&&!p.supersedes,'首次事实必须标记 INITIAL');
   else {need(['CORRECTION','REAL_WORLD_CHANGE'].includes(p.changeType)&&p.supersedes===prior.recordId,'修订必须引用同字段最新记录并注明更正/现实变化');if(p.changeType==='CORRECTION')need(p.effectiveAt===prior.effectiveAt,'更正须保留原事实发生日期');else{need(p.effectiveAt>=prior.effectiveAt,'现实变化日期不得早于原记录');need(p.key!=='wage_paid_on_time_full','历史是否按时支付不能因后来补付而改为及时；请记录付款事件或更正原记录');}}
   if(p.reviewId){const rev=state.reviews.find(r=>r.recordId===p.reviewId);const batch=state.evidence.find(e=>e.recordId===rev?.evidenceId);need(rev&&rev.decision==='ACCEPT'&&rev.fact===p.key&&batch?.facts[p.key]===p.value&&batch.sourceId===p.sourceId&&state.reviews.filter(r=>r.evidenceId===rev.evidenceId&&r.fact===rev.fact).at(-1)?.recordId===rev.recordId&&rev.subject===p.subject&&rev.period===p.period,'事实未绑定当前有效且同范围的接受审核');}
   state.facts.push({...p,recordId:event.id,seq:event.seq,recordedAt:event.recordedAt});
  }
  else if(event.type==='TIMELINE'){need(state.sources.some(s=>s.id===p.sourceId),'时间线缺少来源');T.validate([...state.timeline,p]);state.timeline.push({...p});}
  else if(event.type==='EVIDENCE'){need(state.sources.some(s=>s.id===p.sourceId)&&p.facts&&typeof p.facts==='object'&&!Array.isArray(p.facts)&&Array.isArray(p.spans),'抽取记录格式无效');for(const [key,v]of Object.entries(p.facts)){const d=defs[key];need(own(defs,key)&&(v===null||(d.type==='bool'?typeof v==='boolean':typeof v==='number'&&Number.isFinite(v)&&(d.minimum===undefined||v>=d.minimum)&&(d.maximum===undefined||v<=d.maximum)&&(!d.integer||Number.isInteger(v)))),'候选事实无效');}state.evidence.push({...p,recordId:event.id});}
  else if(event.type==='REVIEW'){const batch=state.evidence.find(e=>e.recordId===p.evidenceId);need(batch&&Object.prototype.hasOwnProperty.call(batch.facts,p.fact)&&['ACCEPT','REJECT'].includes(p.decision)&&typeof p.reason==='string'&&p.reason.trim(),'审核必须引用抽取记录及理由');need(p.decision!=='ACCEPT'||p.support==='SUPPORTED_BY_TEXT','接受前必须人工确认文字支持；不表示真实性验证');if(p.decision==='ACCEPT'){validContext(state.context);const source=state.sources.find(s=>s.id===batch.sourceId);const candidate=V.inspect(source.text,batch.facts,batch.spans,state.context).find(c=>c.fact===p.fact);need(candidate&&candidate.anchorStatus==='ANCHORED'&&!['CONTRADICTED','SCOPE_MISMATCH'].includes(candidate.supportStatus),'候选缺少有效原文引用、存在冲突或范围不符，不能作为抽取结果接受');}state.reviews.push({...p,subject:state.context.subject,period:state.context.period,seq:event.seq,recordId:event.id,actor:event.actor,recordedAt:event.recordedAt});}
  else if(event.type==='ANALYSIS'){need(typeof p.certificateDigest==='string'&&/^[a-f0-9]{64}$/.test(p.certificateDigest)&&p.certificate&&p.certificate.format==='lexchain-business-certificate-v1','分析记录缺少证书及摘要');state.analyses.push({...p,recordId:event.id});}
  else throw new Error('不支持的历史事件类型');
 }
 const scope=options.context??state.context,asOf=options.asOf??scope.asOf;if(asOf!==undefined)need(T.date(asOf),'回看日期无效');
 const corrected=new Set(state.facts.filter(f=>f.seq<=knownRevision&&f.changeType==='CORRECTION').map(f=>f.supersedes));
 const factState={},provenance={};
 for(const f of state.facts.filter(f=>f.seq<=knownRevision&&!corrected.has(f.recordId)&&f.subject===scope.subject&&f.period===scope.period&&(!asOf||f.effectiveAt<=asOf)).sort((a,b)=>a.effectiveAt.localeCompare(b.effectiveAt)||a.seq-b.seq)){const review=f.reviewId?state.reviews.find(r=>r.recordId===f.reviewId):null;const active=!review||state.reviews.filter(r=>r.evidenceId===review.evidenceId&&r.fact===review.fact).at(-1)?.recordId===review.recordId;factState[f.key]=active?f.value:null;provenance[f.key]={...f,reviewActive:active};}
 return {...state,factState,provenance,revision:knownRevision,totalRevision:events.length};
}
return {canonical,replay,validContext,analysisInput,normalizeInput};
});
