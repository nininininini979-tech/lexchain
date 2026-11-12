(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./syntax'));
  else root.LexChainKD=factory(root.LexChainModalSyntax);
})(typeof globalThis!=='undefined'?globalThis:this,function(S){
  'use strict';
  const now=()=>typeof performance!=='undefined'?performance.now():Date.now();
  class Exhausted extends Error {}
  function limitsOf(input={}) {
    if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('limits 必须是对象');
    const defaults={maxSteps:10000,maxWorlds:2000,maxMs:2000},caps={maxSteps:50000,maxWorlds:5000,maxMs:5000};
    for(const [k,v]of Object.entries(input))if(!Object.prototype.hasOwnProperty.call(defaults,k)||!Number.isInteger(v)||v<1||v>caps[k])throw new Error('非法资源限制 '+k);
    return {...defaults,...input};
  }
  function solve(input) {
    const q=S.prepare(input), limits=limitsOf(input.limits),started=now();
    const stats={steps:0,branches:0,modalObligations:0,proofNodes:0};
    const formulas=new Map(),proofs=[],memo=new Map();
    function register(f){const k=S.key(f);if(!formulas.has(k)){formulas.set(k,f);if(f.arg)register(f.arg);if(f.left)register(f.left);if(f.right)register(f.right);}return k;}
    const canonical=xs=>[...new Set(xs)].sort();
    function tick(){if(++stats.steps>limits.maxSteps)throw new Exhausted('maxSteps');if(now()-started>limits.maxMs)throw new Exhausted('maxMs');}
    function closed(set,rule,extra={}) {const id=proofs.length;proofs.push({id,formulas:set,rule,...extra});stats.proofNodes++;return {sat:false,proof:id};}
    function valuation(set){const v=Object.fromEntries(q.atoms.map(a=>[a,false]));for(const k of set){const f=formulas.get(k);if(f.op==='literal')v[f.atom]=!f.negative;}return v;}
    function rootModel(set,children){
      const worlds=[{id:0,valuation:valuation(set),successors:[]}];
      if(!children.length)worlds[0].successors=[0];
      for(const child of children){
        const offset=worlds.length;
        if(offset+child.worlds.length>limits.maxWorlds)throw new Exhausted('maxWorlds');
        worlds[0].successors.push(child.root+offset);
        for(const w of child.worlds)worlds.push({id:w.id+offset,valuation:{...w.valuation},successors:w.successors.map(n=>n+offset)});
      }
      return {logic:'KD',root:0,worlds};
    }
    function search(raw) {
      tick();const set=canonical(raw),cacheKey=JSON.stringify(set);if(memo.has(cacheKey))return memo.get(cacheKey);
      function done(result){memo.set(cacheKey,result);return result;}
      const signs=new Map();
      for(const k of set){const f=formulas.get(k);if(f.op==='const'&&!f.value)return done(closed(set,'close'));
        if(f.op==='literal'){if(signs.has(f.atom)&&signs.get(f.atom)!==f.negative)return done(closed(set,'close'));signs.set(f.atom,f.negative);}}
      const conjunction=set.find(k=>formulas.get(k).op==='and');
      if(conjunction){const f=formulas.get(conjunction),child=search([...set.filter(k=>k!==conjunction),S.key(f.left),S.key(f.right)]);
        return done(child.sat?child:closed(set,'and',{principal:conjunction,children:[child.proof]}));}
      const disjunction=set.find(k=>formulas.get(k).op==='or');
      if(disjunction){stats.branches++;const f=formulas.get(disjunction),rest=set.filter(k=>k!==disjunction),left=search([...rest,S.key(f.left)]);
        if(left.sat)return done(left);const right=search([...rest,S.key(f.right)]);
        return done(right.sat?right:closed(set,'or',{principal:disjunction,children:[left.proof,right.proof]}));}
      const boxes=set.filter(k=>formulas.get(k).op==='box'),diamonds=set.filter(k=>formulas.get(k).op==='diamond');
      const boxContents=boxes.map(k=>S.key(formulas.get(k).arg));
      const obligations=diamonds.length?diamonds:(boxes.length?[null]:[]),models=[];
      for(const witness of obligations){stats.modalObligations++;const child=search(witness===null?boxContents:[...boxContents,S.key(formulas.get(witness).arg)]);
        if(!child.sat)return done(closed(set,'modal',{witness,children:[child.proof]}));models.push(child.model);}
      return done({sat:true,model:rootModel(set,models)});
    }
    function certificate(id){const used=new Map();function visit(i){if(used.has(i))return;const node=proofs[i];used.set(i,node);for(const c of node.children||[])visit(c);}visit(id);
      return {format:'lexchain-kd-tableau-v1',logic:'KD',root:id,nodes:[...used.values()].sort((a,b)=>a.id-b.id)};}
    const budget={nodes:0};const roots=q.parsed.map(f=>register(S.nnf(f,false,budget)));
    const query={mode:q.mode,premises:q.premises,...(q.goal?{conclusion:q.conclusion}:{})};
    let consistency=null;
    try {
      const base=search(roots);consistency=base.sat?{status:'SAT',model:base.model}:{status:'UNSAT',certificate:certificate(base.proof)};
      let result;
      if(q.mode==='satisfiability')result={status:base.sat?'SAT':'UNSAT',consistency};
      else if(!base.sat)result={status:'INCONSISTENT_PREMISES',entails:true,nonVacuous:false,consistency,
        note:'KD经典局部后承下前提无模型，后承空真；不能据此作出实质法律结论。'};
      else {
        const negGoal=register(S.nnf(q.goal,true,budget)),test=search([...roots,negGoal]);
        result=test.sat?{status:q.mode==='validity'?'INVALID':'NOT_ENTAILED',entails:false,nonVacuous:true,consistency,countermodel:test.model}
          :{status:q.mode==='validity'?'VALID':'ENTAILED',entails:true,nonVacuous:true,consistency,certificate:certificate(test.proof)};
      }
      return {format:'lexchain-kd-result-v1',logic:'KD',query,...result,stats:{...stats,elapsedMs:Math.round((now()-started)*100)/100},limits};
    }catch(error){if(!(error instanceof Exhausted))throw error;
      return {format:'lexchain-kd-result-v1',logic:'KD',query,status:'UNKNOWN',reason:error.message,consistency,stats:{...stats,elapsedMs:Math.round((now()-started)*100)/100},limits};}
  }
  return {solve};
});
