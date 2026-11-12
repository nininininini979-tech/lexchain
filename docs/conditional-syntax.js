(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../modal/syntax'));else root.LexChainConditionalSyntax=factory(root.LexChainModalSyntax);})(typeof globalThis!=='undefined'?globalThis:this,function(S){
 'use strict';
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),plain=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
 function need(ok,message){if(!ok)throw new Error(message);}
 function keys(o,allowed){need(plain(o),'输入必须为对象');need(Object.keys(o).every(k=>allowed.includes(k)),'含不支持的字段');}
 function boolean(text){const f=S.parse(text);function walk(a){need(!['box','diamond','forbid'].includes(a.op),'条件模块的 given/ought/unless 只接受命题公式，不能嵌套 O/P/F');if(a.arg)walk(a.arg);if(a.left)walk(a.left);if(a.right)walk(a.right);}walk(f);return f;}
 function evaluate(f,values){switch(f.op){case 'atom':return values[f.name];case 'const':return f.value;case 'not':return !evaluate(f.arg,values);case 'and':return evaluate(f.left,values)&&evaluate(f.right,values);case 'or':return evaluate(f.left,values)||evaluate(f.right,values);case 'implies':return !evaluate(f.left,values)||evaluate(f.right,values);case 'iff':return evaluate(f.left,values)===evaluate(f.right,values);default:throw new Error('非命题节点');}}
 function values(atoms,id){return Object.fromEntries(atoms.map((a,i)=>[a,!!(id&(1<<i))]));}
 function prepare(input){
  keys(input,['policy','background','facts','norms','query','limits']);
  const policy=input.policy||'all';need(['all','priority'].includes(policy),'policy 必须为 all 或 priority');
  const strings=(v,name,max)=>{v=v===undefined?[]:v;need(Array.isArray(v)&&v.length<=max,name+' 数量超限');v.forEach(boolean);return [...v];};
  const background=strings(input.background,'background',16),facts=strings(input.facts,'facts',16);
  need(Array.isArray(input.norms)&&input.norms.length<=24,'norms 必须为至多24项的数组');const ids=new Set();
  const norms=input.norms.map(n=>{keys(n,['id','given','ought','unless','priority','strict']);need(typeof n.id==='string'&&/^[\p{L}\p{N}_-]{1,48}$/u.test(n.id)&&!ids.has(n.id),'规则 id 必须唯一且只含字母、数字、下划线或连字符');ids.add(n.id);
   const given=n.given===undefined?'true':n.given,unless=n.unless===undefined?'false':n.unless,priority=n.priority===undefined?0:n.priority,strict=n.strict===undefined?false:n.strict;
   boolean(given);boolean(n.ought);boolean(unless);need(Number.isInteger(priority)&&priority>=-100&&priority<=100,'priority 必须为 -100 至100的整数');need(typeof strict==='boolean','strict 必须为布尔值');return {id:n.id,given,ought:n.ought,unless,priority,strict};});
  if(policy==='priority')need(norms.filter(n=>!n.strict).length<=10,'优先序策略最多10条可废止规则；其余规则需明确为 strict');
  let query=null;if(input.query!==undefined&&input.query!==null){keys(input.query,['given','ought']);const given=input.query.given===undefined?(facts.length?facts.map(x=>'('+x+')').join(' & '):'true'):input.query.given;boolean(given);boolean(input.query.ought);query={given,ought:input.query.ought};}
  const ast={background:background.map(boolean),facts:facts.map(boolean),norms:norms.map(n=>({given:boolean(n.given),ought:boolean(n.ought),unless:boolean(n.unless)})),query:query?{given:boolean(query.given),ought:boolean(query.ought)}:null};
  const names=new Set();[...ast.background,...ast.facts,...ast.norms.flatMap(n=>[n.given,n.ought,n.unless]),...(ast.query?[ast.query.given,ast.query.ought]:[])].forEach(f=>S.collectAtoms(f,names));const atoms=[...names].sort();need(atoms.length<=8,'有限排序模块最多8个命题原子');
  const count=1<<atoms.length,universe=[],actual=[];
  for(let id=0;id<count;id++){const v=values(atoms,id);if(ast.background.every(f=>evaluate(f,v))){universe.push(id);if(ast.facts.every(f=>evaluate(f,v)))actual.push(id);}}
  function ext(given,ought,unless){const good=[],bad=[],context=[];for(const id of universe){const v=values(atoms,id);if(evaluate(given,v)&&(!unless||!evaluate(unless,v))){context.push(id);(evaluate(ought,v)?good:bad).push(id);}}return {good,bad,context};}
  const rules=norms.map((n,i)=>({...n,...ext(ast.norms[i].given,ast.norms[i].ought,ast.norms[i].unless)}));
  const target=ast.query?ext(ast.query.given,ast.query.ought):null;
  return {query:{policy,background,facts,norms,query},ast,atoms,count,universe,actual,rules,target};
 }
 return {prepare,boolean,evaluate,values,need,own,plain};
});
