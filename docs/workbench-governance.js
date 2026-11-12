(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f(require('./schema'),require('../integration/hash'),require('../integration/governance'));else r.LexChainWorkbenchGovernance=f(r.LexChainWorkbenchSchema,r.LexChainHash,r.LexChainGovernance);})(typeof globalThis!=='undefined'?globalThis:this,function(S,H,G){
'use strict';const date=S.date,canonical=S.canonical,hash=x=>H.sha256(typeof x==='string'?x:canonical(x));
function validate(registry,mapping){
 S.need(S.plain(registry)&&registry.format==='lexchain-legal-registry-v1'&&S.text(registry.version,5000)&&Array.isArray(registry.sources)&&registry.sources.length<=200&&Array.isArray(registry.versions)&&registry.versions.length<=500,'法律目录格式/规模无效');
 S.need(new Set(registry.sources.map(s=>s.id)).size===registry.sources.length&&new Set(registry.versions.map(v=>v.versionId)).size===registry.versions.length,'来源或版本编号重复');
 for(const s of registry.sources)S.need(S.text(s.id,200)&&S.text(s.text,1000000)&&typeof s.url==='string'&&/^https:\/\//.test(s.url)&&date(s.retrievedAt)&&hash(s.text)===s.sha256,'法律来源原文/HTTPS地址/摘要无效');
 for(const v of registry.versions){S.need(S.text(v.versionId,200)&&S.text(v.ruleId,100)&&S.text(v.mappingVersion,200)&&(!mapping||mapping.rules.some(m=>m.id===v.ruleId&&m.mappingVersion===v.mappingVersion))&&Array.isArray(v.jurisdictions)&&v.jurisdictions.length>0&&v.jurisdictions.every(j=>typeof j==='string'&&/^[A-Z]{2}(?:-[A-Z0-9]+)*$/.test(j))&&['PENDING','APPROVED','REJECTED'].includes(v.review?.status)&&['REVIEWED','UNREVIEWED'].includes(v.transition?.status),'法律版本、映射或审核结构无效');
 for(const key of ['archived','includesSubdivisions','openEnded'])S.need(v[key]===undefined||typeof v[key]==='boolean','法律版本开关必须是布尔值');
 if(v.review.status==='APPROVED'){const s=registry.sources.find(s=>s.id===v.sourceSnapshotId);S.need(s&&s.url===v.sourceUrl&&S.text(v.review.reviewer,120)&&date(v.review.reviewedAt)&&date(v.effectiveFrom)&&((v.openEnded===true&&v.effectiveTo==null)||(v.openEnded!==true&&date(v.effectiveTo)&&v.effectiveTo>v.effectiveFrom))&&v.transition.status==='REVIEWED'&&S.text(v.transition.basis),'已批准法律版本缺少依据/有效区间/审核信息');}}
 S.need(registry.history===undefined||(Array.isArray(registry.history)&&registry.history.length<=500),'法律历史规模无效');let previous='0'.repeat(64);for(const [i,e]of (registry.history||[]).entries()){const {hash:stored,...body}=e;S.need(e.seq===i+1&&body.previousHash===previous&&hash(body)===stored,'法律历史摘要无效');previous=stored;}return registry;
}
function apply(registry,request,recordedAt=new Date().toISOString()){
 validate(registry);
 const need=S.need;
 need(request&&request.expectedVersion===registry.version,'目录修订号不一致');need(typeof request.actor==='string'&&request.actor.trim()&&typeof request.reason==='string'&&request.reason.trim(),'必须提供审核/录入人和理由');
 let previous='0'.repeat(64);for(const record of registry.history||[]){const {hash:stored,...body}=record;need(body.previousHash===previous&&stored===hash(body),'目录历史链不一致');previous=stored;}
 const out=JSON.parse(JSON.stringify(registry)),p=request.payload;need(p&&typeof p==='object'&&!Array.isArray(p),'缺少变更内容');
 if(request.action==='ADD_SOURCE'){
  need(typeof p.id==='string'&&p.id.trim()&&!out.sources.some(s=>s.id===p.id),'来源 id 重复');need(typeof p.text==='string'&&p.text.trim()&&typeof p.url==='string'&&/^https:\/\//.test(p.url)&&date(p.retrievedAt),'来源须有原文、HTTPS出处和获取日期');out.sources.push({...p,sha256:hash(p.text)});
 }else if(request.action==='ADD_VERSION'){
  need(typeof p.versionId==='string'&&!out.versions.some(v=>v.versionId===p.versionId)&&out.versions.some(v=>v.ruleId===p.ruleId&&v.mappingVersion===p.mappingVersion),'新版本 id 或映射无效');need(date(p.effectiveFrom)&&((p.openEnded===true&&(p.effectiveTo===undefined||p.effectiveTo===null))||(p.openEnded!==true&&date(p.effectiveTo)&&p.effectiveTo>p.effectiveFrom)),'生效区间必须明确，结束日为不包含');need(p.includesSubdivisions===undefined||typeof p.includesSubdivisions==='boolean','下级法域标志必须是布尔值');need(Array.isArray(p.jurisdictions)&&p.jurisdictions.length&&p.jurisdictions.every(j=>/^[A-Z]{2}(?:-[A-Z0-9]+)*$/.test(j)),'法域代码无效');const s=out.sources.find(s=>s.id===p.sourceSnapshotId);need(s&&s.url===p.sourceUrl,'版本须绑定原文快照');out.versions.push({...p,review:{status:'PENDING',reviewer:null,reviewedAt:null,reason:'新版本待审核'},transition:{status:'UNREVIEWED',basis:null}});
 }else if(request.action==='REVIEW_VERSION'){
  const v=out.versions.find(v=>v.versionId===p.versionId);need(v&&['APPROVED','REJECTED'].includes(p.status)&&date(p.reviewedAt),'审核目标或状态无效');const source=out.sources.find(s=>s.id===v.sourceSnapshotId);
  if(p.status==='APPROVED')need(source&&hash(source.text)===source.sha256&&date(v.effectiveFrom)&&((v.openEnded===true&&(v.effectiveTo===undefined||v.effectiveTo===null))||(v.openEnded!==true&&date(v.effectiveTo)&&v.effectiveTo>v.effectiveFrom))&&typeof p.transitionBasis==='string'&&p.transitionBasis.trim(),'批准前必须有确定期间、校验原文和过渡规则依据（无过渡也需说明）');
  v.review={status:p.status,reviewer:request.actor,reviewedAt:p.reviewedAt,reason:request.reason};v.transition={status:p.status==='APPROVED'?'REVIEWED':'UNREVIEWED',basis:p.transitionBasis||null};
 }else if(request.action==='RETIRE_CANDIDATE'){
  const v=out.versions.find(v=>v.versionId===p.versionId);need(v&&v.review.status!=='APPROVED','只能归档未经批准的候选版本');v.archived=true;
 }else throw new Error('不支持的目录变更');
 const history=out.history||[];const entry={seq:history.length+1,action:request.action,actor:request.actor,reason:request.reason,payload:p,previousHash:history.at(-1)?.hash||'0'.repeat(64),recordedAt};entry.hash=hash(entry);out.history=[...history,entry];out.version=registry.version+'+'+entry.seq;validate(out);return out;
}
function diff(a,b){S.need(a&&b,'选择两个法律版本');return [...new Set([...Object.keys(a),...Object.keys(b)])].sort().filter(k=>canonical(a[k])!==canonical(b[k])).map(k=>({field:k,before:a[k]??null,after:b[k]??null}));}
function search(registry,query,mapping){
 S.need(S.plain(query)&&typeof query.text==='string'&&query.text.trim().length>0&&query.text.length<=200&&date(query.eventDate)&&S.text(query.jurisdiction,80),'检索须有关键词、事件日期与法域');
 const tokens=[...new Set(query.text.trim().split(/\s+/))],hits=[];
 for(const v of registry.versions){if(v.archived)continue;
  const geographic=(v.jurisdictions||[]).some(j=>query.jurisdiction===j||(v.includesSubdivisions===true&&query.jurisdiction.startsWith(j+'-'))),interval=date(v.effectiveFrom)&&((date(v.effectiveTo)&&v.effectiveTo>v.effectiveFrom&&v.openEnded!==true)||(v.openEnded===true&&v.effectiveTo==null));
  if(!geographic||!interval||query.eventDate<v.effectiveFrom||(v.effectiveTo&&query.eventDate>=v.effectiveTo))continue;
  const s=registry.sources.find(s=>s.id===v.sourceSnapshotId);if(!s||typeof s.text!=='string'||typeof s.url!=='string'||!/^https:\/\//.test(s.url)||!date(s.retrievedAt)||H.sha256(s.text)!==s.sha256)continue;
  const m=mapping.rules.find(m=>m.id===v.ruleId),gate=G.select(registry,v.ruleId,query,m?.mappingVersion),eligible=gate.status==='SELECTED'&&gate.versionId===v.versionId;
  if(!query.includePending&&!eligible)continue;
  const spans=[],matched=new Set();for(const token of tokens){const pattern=new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'giu');let match,count=0;while((match=pattern.exec(s.text))!==null&&count++<20){const start=match.index,end=start+match[0].length;matched.add(token);spans.push({start,end,quote:s.text.slice(start,end),snippet:s.text.slice(Math.max(0,start-40),Math.min(s.text.length,end+60))});}}
  if(spans.length)hits.push({versionId:v.versionId,ruleId:v.ruleId,sourceId:s.id,url:s.url,sourceSha256:s.sha256,eventDate:query.eventDate,jurisdiction:query.jurisdiction,effectiveFrom:v.effectiveFrom,effectiveTo:v.effectiveTo||null,release:eligible?'SELECTED':'REVIEW_REQUIRED',reasons:gate.reasons,spans,matchedTokens:matched.size});
 }
 hits.sort((a,b)=>b.matchedTokens-a.matchedTokens||a.versionId.localeCompare(b.versionId));return {query:S.clone(query),registryVersion:registry.version,registryDigest:S.digest(registry),hits:hits.slice(0,100),total:hits.length,boundary:'只检索当前目录中日期/法域匹配且摘要有效的已录入原文；命中不代表文字支持案件事实，也不是生成式 RAG。'};
}
return {apply,diff,search,validate};
});
