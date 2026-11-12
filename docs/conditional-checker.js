(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./syntax'));else root.LexChainConditionalChecker=factory(root.LexChainConditionalSyntax);})(typeof globalThis!=='undefined'?globalThis:this,function(S){
 'use strict';
 // Independent of solver/search. Shared trust: propositional parser and input contract.
 const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),need=S.need;
 function verify(input,result){try{
  const p=S.prepare(input);need(S.plain(result)&&result.format==='lexchain-ranked-result-v1'&&result.semantics==='finite-full-valuation-ranked-v1','结果格式错误');
  need(eq(result.query,p.query)&&eq(result.atoms,p.atoms)&&eq(result.universe,p.universe)&&eq(result.actualWorlds,p.actual),'输入或世界集合绑定错误');
  if(result.status==='UNKNOWN')return {verified:false,kind:'undecided',reason:'资源不足未判定'};
  // Re-evaluate original ASTs with a separate truth function, not the solver's extension evaluator.
  function truth(f,w){switch(f.op){case 'atom':return !!(w&(1<<p.atoms.indexOf(f.name)));case 'const':return f.value;case 'not':return !truth(f.arg,w);case 'and':return truth(f.left,w)&&truth(f.right,w);case 'or':return truth(f.left,w)||truth(f.right,w);case 'implies':return !truth(f.left,w)||truth(f.right,w);case 'iff':return truth(f.left,w)===truth(f.right,w);default:throw new Error('检查器不接受非命题节点');}}
  const independentUniverse=Array.from({length:p.count},(_,w)=>w).filter(w=>p.ast.background.every(f=>truth(f,w)));
  need(eq(independentUniverse,p.universe)&&eq(independentUniverse.filter(w=>p.ast.facts.every(f=>truth(f,w))),p.actual),'世界集合未通过独立真值计算');
  if(!p.universe.length){need(result.status==='INCONSISTENT_BACKGROUND','未标记背景不相容');return {verified:true,kind:result.status};}
  if(!p.actual.length){need(result.status==='INCONSISTENT_FACTS','未标记事实不相容');return {verified:true,kind:result.status};}
  const rules=p.query.norms.map((n,i)=>{const a=p.ast.norms[i],good=[],bad=[],context=[];for(const w of p.universe)if(truth(a.given,w)&&!truth(a.unless,w)){context.push(w);(truth(a.ought,w)?good:bad).push(w);}return {...n,good,bad,context};});
  const target=p.ast.query?{context:p.universe.filter(w=>truth(p.ast.query.given,w)),bad:p.universe.filter(w=>truth(p.ast.query.given,w)&&!truth(p.ast.query.ought,w))}:null;
  const defeasible=p.query.policy==='priority'?rules.filter(n=>!n.strict):[],mandatory=p.query.policy==='priority'?rules.filter(n=>n.strict):rules;
  const selected=mask=>[...mandatory,...defeasible.filter((_,i)=>mask&(1<<i))];
  function model(ranks,ns,witness=null){need(Array.isArray(ranks)&&ranks.length===p.count,'模型必须覆盖完整赋值空间');const u=new Set(p.universe);
   for(let w=0;w<p.count;w++)need(u.has(w)?Number.isInteger(ranks[w])&&ranks[w]>=0&&ranks[w]<p.count:ranks[w]===null,'非法排序或背景外世界');
   const min=ws=>ws.length?Math.min(...ws.map(w=>ranks[w])):Infinity;
   for(const n of ns)need(!n.context.length||min(n.good)<min(n.bad),'排序模型违反规则 '+n.id);
   if(witness!==null)need(target&&target.bad.includes(witness)&&ranks[witness]===min(target.context),'未给出最佳条件世界中的反例');
  }
  let cells=0;
  function deadlock(proof,ns,witness=null){need(S.plain(proof)&&proof.format==='rank-elimination-v1'&&Array.isArray(proof.steps)&&proof.steps.length>0&&proof.steps.length<=p.count,'消去证明格式错误');
   const assigned=new Set(),byId=new Map(ns.map(n=>[n.id,n]));
   for(let i=0;i<proof.steps.length;i++){const step=proof.steps[i];need(S.plain(step)&&Array.isArray(step.accepted)&&Array.isArray(step.removed),'证明步骤格式错误');const remaining=p.universe.filter(w=>!assigned.has(w)),candidate=new Set(remaining);
    cells+=remaining.length;need(cells<=1000000,'证明检查规模超限');need(step.removed.length<=remaining.length,'重复消去记录');
    for(const removal of step.removed){need(S.plain(removal)&&candidate.has(removal.world),'重复或非法消去世界');
     if(S.own(removal,'rule')){need(!S.own(removal,'predecessor'),'消去理由含混');const n=byId.get(removal.rule);need(n&&n.bad.includes(removal.world)&&!n.good.some(w=>assigned.has(w)),'严格次序阻塞理由不成立');}
     else{need(witness!==null&&removal.predecessor===witness&&target.context.includes(removal.world)&&!assigned.has(witness)&&!candidate.has(witness),'查询见证次序阻塞理由不成立');}
     candidate.delete(removal.world);
    }
    need(eq(step.accepted,[...candidate]),'本层接纳集合缺失或被篡改');
    for(const w of candidate){need(!ns.some(n=>n.bad.includes(w)&&!n.good.some(g=>assigned.has(g))),'接纳了尚被规范阻塞的世界');need(witness===null||!target.context.includes(w)||assigned.has(witness)||candidate.has(witness),'接纳集合不满足见证次序');}
    if(!candidate.size){need(remaining.length>0&&i===proof.steps.length-1,'闭合步骤位置错误');return;}
    candidate.forEach(w=>assigned.add(w));
   }
   throw new Error('证明没有最终死锁');
  }
  need(Array.isArray(result.audits),'缺少一致性凭据');const audits=result.audits;
  if(['INCONSISTENT_NORMS','INCONSISTENT_STRICT_NORMS'].includes(result.status)){
   need(result.status===(p.query.policy==='priority'?'INCONSISTENT_STRICT_NORMS':'INCONSISTENT_NORMS'),'冲突类别不符');need(audits.length===1&&audits[0].mask===0&&audits[0].status==='UNSAT','缺少强制规则冲突凭据');deadlock(audits[0].proof,mandatory);return {verified:true,kind:result.status};
  }
  need(audits.length===(1<<defeasible.length),'一致性审计未覆盖所有子集');
  for(let mask=0;mask<audits.length;mask++){const a=audits[mask];need(S.plain(a)&&a.mask===mask,'子集审计重复或错序');if(a.status==='SAT')model(a.ranks,selected(mask));else{need(a.status==='UNSAT','子集状态无效');deadlock(a.proof,selected(mask));}}
  const levels=[...new Set(defeasible.map(n=>n.priority))].sort((a,b)=>b-a);
  function dominates(a,b){for(const level of levels){let left=0,right=0;defeasible.forEach((n,i)=>{if(n.priority===level){left|=a&(1<<i);right|=b&(1<<i);}});if(left!==right)return (left|right)===left;}return false;}
  const sat=audits.filter(a=>a.status==='SAT').map(a=>a.mask),preferred=sat.filter(b=>!sat.some(a=>dominates(a,b)));
  need(preferred.length>0&&eq(result.preferredSets,preferred.map(mask=>({mask,normIds:selected(mask).map(n=>n.id)}))),'优先子理论不完整或策略选择错误');
  need(eq(result.vacuousNorms,rules.filter(n=>!n.context.length).map(n=>n.id)),'空条件规范标记错误');
  if(!target)need(result.status==='CONSISTENT','无查询时状态错误');
  else if(!target.context.length)need(result.status==='VACUOUS_CONTEXT','不可能查询条件未标记');
  else if(result.status==='NOT_ENTAILED'){const c=result.countermodel;need(S.plain(c)&&preferred.includes(c.mask),'反模型不属于保留的优先子理论');model(c.ranks,selected(c.mask),c.witness);}
  else{need(result.status==='ENTAILED'&&Array.isArray(result.proofs)&&result.proofs.length===preferred.length,'缺少全部优先子理论的蕴涵证明');
   for(let i=0;i<preferred.length;i++){const c=result.proofs[i];need(c.mask===preferred[i]&&Array.isArray(c.refutations)&&c.refutations.length===target.bad.length,'未覆盖全部反例候选');for(let j=0;j<target.bad.length;j++){const r=c.refutations[j];need(r.witness===target.bad[j],'见证缺失或错序');deadlock(r.proof,selected(c.mask),r.witness);}}}
  return {verified:true,kind:result.status,preferredTheories:preferred.length,trustBoundary:'独立于排序搜索；共享命题解析及输入契约；不认证法条或证据'};
 }catch(e){return {verified:false,kind:'rejected',reason:e.message};}}
 return {verify};
});
