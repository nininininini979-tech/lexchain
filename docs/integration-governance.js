(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./timeline'),require('./hash'));else root.LexChainGovernance=factory(root.LexChainTimeline,root.LexChainHash);})(typeof globalThis!=='undefined'?globalThis:this,function(T,S){
'use strict';
function interval(v){return T.date(v.effectiveFrom)&&((T.date(v.effectiveTo)&&v.effectiveTo>v.effectiveFrom&&v.openEnded!==true)||(v.openEnded===true&&(v.effectiveTo===null||v.effectiveTo===undefined)));}
function select(registry,ruleId,context,mappingVersion){
 const versions=registry.versions.filter(v=>v.ruleId===ruleId&&!v.archived),reasons=[];
 if(!T.date(context.eventDate))reasons.push('MISSING_EVENT_DATE');
 if(typeof context.jurisdiction!=='string'||!context.jurisdiction.trim())reasons.push('MISSING_JURISDICTION');
 const geographic=versions.filter(v=>(v.jurisdictions||[]).some(j=>context.jurisdiction===j||(v.includesSubdivisions===true&&typeof context.jurisdiction==='string'&&context.jurisdiction.startsWith(j+'-'))));
 if(context.jurisdiction&&!geographic.length)reasons.push('NO_JURISDICTION_MATCH');
 const dated=geographic.filter(v=>interval(v)&&context.eventDate>=v.effectiveFrom&&(!v.effectiveTo||context.eventDate<v.effectiveTo));
 if(geographic.some(v=>!interval(v)))reasons.push('UNKNOWN_EFFECTIVE_INTERVAL');
 if(context.eventDate&&!dated.length)reasons.push('NO_DATE_MATCH');
 if(dated.length>1)reasons.push('AMBIGUOUS_VERSIONS');
 const v=dated.length===1?dated[0]:null;
 if(v){
  if(v.mappingVersion!==mappingVersion)reasons.push('MAPPING_VERSION_MISMATCH');
  if(v.review?.status!=='APPROVED'||!v.review.reviewer||!T.date(v.review.reviewedAt))reasons.push('LEGAL_REVIEW_PENDING');
  if(v.transition?.status!=='REVIEWED'||!v.transition.basis)reasons.push('TRANSITION_REVIEW_PENDING');
  const source=(registry.sources||[]).find(s=>s.id===v.sourceSnapshotId);
  if(!source||typeof source.text!=='string'||!source.text||!source.url||!T.date(source.retrievedAt)||!v.sourceUrl||v.sourceUrl!==source.url)reasons.push('SOURCE_SNAPSHOT_MISSING');else if(!/^[a-f0-9]{64}$/.test(source.sha256||'')||S.sha256(source.text)!==source.sha256)reasons.push('SOURCE_SNAPSHOT_DIGEST_MISMATCH');
 }
 return {status:reasons.length?'REVIEW_REQUIRED':'SELECTED',versionId:v?v.versionId:null,candidateIds:versions.map(x=>x.versionId),reasons:[...new Set(reasons)]};
}
return {select};
});
