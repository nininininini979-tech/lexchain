(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./syntax'));else root.LexChainConditional=factory(root.LexChainConditionalSyntax);})(typeof globalThis!=='undefined'?globalThis:this,function(S){
 'use strict';
 class Exhausted extends Error{}
 const now=()=>typeof performance!=='undefined'?performance.now():Date.now();
 function limitsOf(v={}){S.need(S.plain(v),'limits 必须为对象');const defaults={maxSteps:300000,maxMs:3000,maxProofCells:200000},caps={maxSteps:2000000,maxMs:10000,maxProofCells:1000000};for(const [k,n]of Object.entries(v))S.need(S.own(caps,k)&&Number.isInteger(n)&&n>=1&&n<=caps[k],'非法资源限制 '+k);return {...defaults,...v};}
 function solve(input){
  const p=S.prepare(input),limits=limitsOf(input.limits),start=now(),stats={steps:0,rankSearches:0,proofCells:0};
  const tick=()=>{if(++stats.steps>limits.maxSteps)throw new Exhausted('maxSteps');if(now()-start>limits.maxMs)throw new Exhausted('maxMs');};
  const base={format:'lexchain-ranked-result-v1',semantics:'finite-full-valuation-ranked-v1',query:p.query,atoms:p.atoms,universe:p.universe,actualWorlds:p.actual,limits};
  const audits=[];const finish=(status,extra={})=>({...base,status,...extra,stats:{...stats,elapsedMs:Math.round((now()-start)*100)/100}});
  // min(good)<min(bad). For refutation a fixed bad witness must be no worse than every target-context world.
  function rank(rules,witness=null){
   stats.rankSearches++;const assigned=new Set(),ranks=Array(p.count).fill(null),steps=[];let layer=0;
   while(assigned.size<p.universe.length){tick();const remaining=p.universe.filter(w=>!assigned.has(w)),candidate=new Set(remaining),removed=[];
    for(const w of remaining){tick();const blocker=rules.find(r=>r.bad.includes(w)&&!r.good.some(g=>assigned.has(g)));if(blocker){candidate.delete(w);removed.push({world:w,rule:blocker.id});}}
    if(witness!==null&&!assigned.has(witness)&&!candidate.has(witness))for(const w of remaining)if(candidate.has(w)&&p.target.context.includes(w)){candidate.delete(w);removed.push({world:w,predecessor:witness});}
    const accepted=[...candidate];steps.push({accepted,removed});stats.proofCells+=remaining.length;if(stats.proofCells>limits.maxProofCells)throw new Exhausted('maxProofCells');
    if(!accepted.length)return {status:'UNSAT',proof:{format:'rank-elimination-v1',steps}};
    for(const w of accepted){assigned.add(w);ranks[w]=layer;}layer++;
   }
   return {status:'SAT',ranks};
  }
  try{
   if(!p.universe.length)return finish('INCONSISTENT_BACKGROUND');
   if(!p.actual.length)return finish('INCONSISTENT_FACTS');
   const defeasible=p.query.policy==='priority'?p.rules.filter(r=>!r.strict):[],mandatory=p.query.policy==='priority'?p.rules.filter(r=>r.strict):p.rules;
   const selected=mask=>[...mandatory,...defeasible.filter((_,i)=>mask&(1<<i))];
   const total=1<<defeasible.length;
   for(let mask=0;mask<total;mask++){tick();const audit={mask,...rank(selected(mask))};audits.push(audit);if(mask===0&&audit.status==='UNSAT')return finish(p.query.policy==='priority'?'INCONSISTENT_STRICT_NORMS':'INCONSISTENT_NORMS',{audits});}
   const preferred=audits.filter(a=>a.status==='SAT').filter(a=>{
    for(let i=0;i<defeasible.length;i++)if(!(a.mask&(1<<i))){tick();let higher=0;for(let j=0;j<defeasible.length;j++)if((a.mask&(1<<j))&&defeasible[j].priority>=defeasible[i].priority)higher|=1<<j;
     if(audits[higher|(1<<i)].status==='SAT')return false;}
    return true;
   }).map(a=>a.mask);
   const preferredSets=preferred.map(mask=>({mask,normIds:selected(mask).map(r=>r.id)}));
   const vacuousNorms=p.rules.filter(r=>!r.context.length).map(r=>r.id);
   const details={audits,preferredSets,vacuousNorms};
   if(!p.target)return finish('CONSISTENT',details);
   if(!p.target.context.length)return finish('VACUOUS_CONTEXT',details);
   const proofs=[];
   for(const mask of preferred){const refutations=[];for(const witness of p.target.bad){tick();const r=rank(selected(mask),witness);
     if(r.status==='SAT')return finish('NOT_ENTAILED',{...details,countermodel:{mask,witness,ranks:r.ranks}});
     refutations.push({witness,proof:r.proof});
    }proofs.push({mask,refutations});}
   return finish('ENTAILED',{...details,proofs});
  }catch(e){if(!(e instanceof Exhausted))throw e;return finish('UNKNOWN',{reason:e.message});}
 }
 return {solve};
});
