(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LexChainEvidence=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function inspect(text,facts,spans=[],scope={}){
 if(typeof text!=='string'||!facts||typeof facts!=='object'||Array.isArray(facts)||!Array.isArray(spans)||spans.length>500)throw new Error('证据输入格式无效');
 return Object.entries(facts).filter(([,v])=>v!==null).map(([fact,value])=>{
  const refs=spans.filter(s=>s&&s.fact===fact),reasons=[];
  const quotes=refs.map(s=>{
   const valid=Number.isInteger(s.start)&&Number.isInteger(s.end)&&s.start>=0&&s.end>s.start&&s.end<=text.length&&typeof s.quote==='string'&&text.slice(s.start,s.end)===s.quote;
   let support='NEEDS_REVIEW',reason='自动检查只验证引用和有限语言模式，需人工核对主体、时间和否定';
   if(!valid){support='INVALID_SPAN';reason='原文 UTF-16 [start,end) 与引用不一致';}
   else if((scope.subject&&s.subject!==scope.subject)||(scope.period&&s.period!==scope.period)){support='SCOPE_MISMATCH';reason='主体或期间与本案范围不一致';}
   // Deliberately narrow: no general entailment or fact-authentication claim.
   else if(fact==='wage_paid_on_time_full'&&value===true&&/(未到账|未支付|拖欠|迟发|逾期|没有.*(?:支付|发放)|补付)/.test(s.quote)){support='CONTRADICTED';reason='引用含未付、迟付或补付，不能支持按时足额支付=true';}
   else if(fact==='wage_paid_on_time_full'&&value===false&&/(未到账|未支付|拖欠|逾期)/.test(s.quote)&&!/(不是|并非|没有拖欠|未曾|可能|如果|听说|他人)/.test(s.quote)){support='LEXICAL_MATCH';reason='有限欠薪词汇匹配；尚未验证主体、到期时间或事实真实性';}
   return {fact,start:Number.isInteger(s.start)?s.start:null,end:Number.isInteger(s.end)?s.end:null,quote:typeof s.quote==='string'?s.quote:'',subject:s.subject||null,period:s.period||null,anchored:valid,support,reason};
  });
  if(!quotes.length)reasons.push('缺少原文跨度');
  return {fact,value,quotes,anchorStatus:quotes.length&&quotes.every(q=>q.anchored)?'ANCHORED':'UNANCHORED',supportStatus:['INVALID_SPAN','SCOPE_MISMATCH','CONTRADICTED'].find(s=>quotes.some(q=>q.support===s))||(quotes.length===1?quotes[0].support:quotes.length?'NEEDS_REVIEW':'NO_CITATION'),decision:'PENDING_CONFIRMATION',reasons,truthStatus:'NOT_AUTHENTICATED'};
 });
}
function accept(facts,reviews,confirmed){
 const out={...confirmed};for(const r of reviews||[]){if(!r||!own(facts,r.fact)||r.decision!=='ACCEPT'||typeof r.reason!=='string'||!r.reason.trim())throw new Error('确认必须指明候选事实及审核理由');if(!own(confirmed,r.fact))out[r.fact]=facts[r.fact];}return out;
}
return {inspect,accept};
});
