(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./syntax'));
  else root.LexChainKDChecker=factory(root.LexChainModalSyntax);
})(typeof globalThis!=='undefined'?globalThis:this,function(S){
  'use strict';
  // Deliberately does not import the solver or call search. Shared trust: parser/NNF.
  function requireThat(ok,message){if(!ok)throw new Error(message);}
  const plain=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const canonical=xs=>[...new Set(xs)].sort();
  function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
  function checkClosure(certificate,roots){
    requireThat(plain(certificate)&&certificate.format==='lexchain-kd-tableau-v1'&&certificate.logic==='KD','证书格式错误');
    requireThat(Array.isArray(certificate.nodes)&&certificate.nodes.length>0&&certificate.nodes.length<=50000,'证明节点数量无效');
    const defs=new Map(),nodes=new Map(),visiting=new Set(),checked=new Map();
    function register(f){const k=S.key(f);defs.set(k,f);if(f.arg)register(f.arg);if(f.left)register(f.left);if(f.right)register(f.right);}
    roots.forEach(register);
    for(const n of certificate.nodes){requireThat(plain(n)&&Number.isInteger(n.id)&&n.id>=0&&!nodes.has(n.id),'重复或非法证明节点');nodes.set(n.id,n);}
    function visit(id,raw,depth=0){
      requireThat(depth<=2048,'证明深度超限');const expected=canonical(raw),node=nodes.get(id);
      requireThat(node&&same(node.formulas,expected),'节点公式集合与规则展开不符');
      if(checked.has(id)){requireThat(same(checked.get(id),expected),'共享证明节点前提不同');return;}
      requireThat(!visiting.has(id),'证明存在循环');visiting.add(id);
      const fs=expected.map(k=>{requireThat(defs.has(k),'证书含输入之外的公式');return defs.get(k);});
      if(node.rule==='close'){
        const signs=new Map();let contradiction=fs.some(f=>f.op==='const'&&!f.value);
        for(const f of fs)if(f.op==='literal'){if(signs.has(f.atom)&&signs.get(f.atom)!==f.negative)contradiction=true;signs.set(f.atom,f.negative);}
        requireThat(contradiction,'闭合叶没有矛盾');requireThat(!node.children||node.children.length===0,'闭合叶不得有子节点');
      }else if(node.rule==='and'||node.rule==='or'){
        requireThat(expected.includes(node.principal),'主公式不在节点中');const f=defs.get(node.principal);
        requireThat(f.op===node.rule,'主公式连接词错误');
        requireThat(Array.isArray(node.children)&&node.children.length===(node.rule==='and'?1:2),'分支数量错误');
        const rest=expected.filter(k=>k!==node.principal);
        if(node.rule==='and')visit(node.children[0],[...rest,S.key(f.left),S.key(f.right)],depth+1);
        else {visit(node.children[0],[...rest,S.key(f.left)],depth+1);visit(node.children[1],[...rest,S.key(f.right)],depth+1);}
      }else if(node.rule==='modal'){
        requireThat(!fs.some(f=>f.op==='and'||f.op==='or'),'模态步骤前必须完成布尔展开');
        requireThat(Array.isArray(node.children)&&node.children.length===1,'模态闭合只引用一个不可满足义务');
        const boxes=fs.filter(f=>f.op==='box').map(f=>S.key(f.arg)),diamonds=expected.filter(k=>defs.get(k).op==='diamond');
        if(node.witness===null){requireThat(diamonds.length===0&&boxes.length>0,'串行性步骤的侧条件不满足');visit(node.children[0],boxes,depth+1);}
        else {requireThat(diamonds.includes(node.witness),'缺少对应可能式见证');visit(node.children[0],[...boxes,S.key(defs.get(node.witness).arg)],depth+1);}
      }else throw new Error('未知证明规则');
      visiting.delete(id);checked.set(id,expected);
    }
    visit(certificate.root,roots.map(S.key));
    requireThat(checked.size===nodes.size,'证书含无关或不可达节点');
    return {verified:true,kind:'closed-tableau',nodes:checked.size};
  }
  function evaluateModel(model,asts){
    requireThat(plain(model)&&model.logic==='KD'&&Array.isArray(model.worlds)&&model.worlds.length>0&&model.worlds.length<=5000,'模型格式无效');
    const worlds=new Map(),atoms=new Set();asts.forEach(a=>S.collectAtoms(a,atoms));
    for(const w of model.worlds){
      requireThat(plain(w)&&Number.isInteger(w.id)&&w.id>=0&&!worlds.has(w.id),'世界编号无效');
      requireThat(plain(w.valuation),'世界赋值必须是对象');
      for(const a of atoms)requireThat(own(w.valuation,a)&&typeof w.valuation[a]==='boolean','模型缺少二值赋值 '+a);
      for(const value of Object.values(w.valuation))requireThat(typeof value==='boolean','模型含非布尔赋值');
      requireThat(Array.isArray(w.successors)&&w.successors.length>0&&w.successors.length<=5000,'KD串行性不满足');
      requireThat(new Set(w.successors).size===w.successors.length,'重复边');worlds.set(w.id,w);
    }
    requireThat(worlds.has(model.root),'缺少根世界');
    let edgeCount=0;
    for(const w of worlds.values())for(const s of w.successors){requireThat(worlds.has(s),'边指向不存在世界');if(++edgeCount>50000)throw new Error('模型边数超限');}
    const memo=new WeakMap();let operations=0;
    function val(f,id){
      if(++operations>2000000)throw new Error('模型检查资源上限');
      if(!memo.has(f))memo.set(f,new Map());const cache=memo.get(f);if(cache.has(id))return cache.get(id);
      const w=worlds.get(id);let answer;
      switch(f.op){
        case 'atom':answer=w.valuation[f.name];break;
        case 'const':answer=f.value;break;
        case 'not':answer=!val(f.arg,id);break;
        case 'and':answer=val(f.left,id)&&val(f.right,id);break;
        case 'or':answer=val(f.left,id)||val(f.right,id);break;
        case 'implies':answer=!val(f.left,id)||val(f.right,id);break;
        case 'iff':answer=val(f.left,id)===val(f.right,id);break;
        case 'box':answer=w.successors.every(s=>val(f.arg,s));break;
        case 'diamond':answer=w.successors.some(s=>val(f.arg,s));break;
        case 'forbid':answer=w.successors.every(s=>!val(f.arg,s));break;
        default:throw new Error('模型检查不支持节点');
      }
      cache.set(id,answer);return answer;
    }
    return asts.map(a=>val(a,model.root));
  }
  function verify(input,result){
    try {
      const q=S.prepare(input);requireThat(plain(result)&&result.format==='lexchain-kd-result-v1'&&result.logic==='KD','结果格式错误');
      const normalized={mode:q.mode,premises:q.premises,...(q.goal?{conclusion:q.conclusion}:{})};
      requireThat(same(result.query,normalized),'证书查询与待检查输入不符');
      const budget={nodes:0},roots=q.parsed.map(f=>S.nnf(f,false,budget));
      if(result.status==='UNKNOWN')return {verified:false,kind:'undecided',reason:'资源限制下未判定；不能把 UNKNOWN 当作无效或有效'};
      requireThat(plain(result.consistency),'缺少前提一致性凭据');
      let consistency;
      if(result.consistency.status==='SAT'){
        const values=evaluateModel(result.consistency.model,q.parsed);requireThat(values.every(Boolean),'一致性模型未满足全部前提');consistency='SAT';
      }else if(result.consistency.status==='UNSAT'){checkClosure(result.consistency.certificate,roots);consistency='UNSAT';}
      else throw new Error('一致性状态无效');
      if(q.mode==='satisfiability')requireThat(result.status===consistency,'可满足性状态与凭据矛盾');
      else if(consistency==='UNSAT')requireThat(result.status==='INCONSISTENT_PREMISES'&&result.entails===true&&result.nonVacuous===false,'不相容前提未明确标记');
      else {
        requireThat(result.nonVacuous===true,'一致前提需标记非空真');
        if(result.status===(q.mode==='validity'?'VALID':'ENTAILED')){
          requireThat(result.entails===true,'后承标记错误');checkClosure(result.certificate,[...roots,S.nnf(q.goal,true,budget)]);
        }else if(result.status===(q.mode==='validity'?'INVALID':'NOT_ENTAILED')){
          requireThat(result.entails===false,'非后承标记错误');const values=evaluateModel(result.countermodel,[...q.parsed,q.goal]);
          requireThat(values.slice(0,-1).every(Boolean)&&values.at(-1)===false,'反模型未同时满足前提并否定结论');
        }else throw new Error('结论状态与模式不符');
      }
      return {verified:true,kind:result.status,consistency,trustBoundary:'共享公式解析/NNF；检查器独立于搜索器，不是法律效度证明'};
    }catch(error){return {verified:false,kind:'rejected',reason:error.message};}
  }
  return {verify,checkClosure,evaluateModel};
});
