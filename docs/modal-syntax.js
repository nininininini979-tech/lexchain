(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LexChainModalSyntax = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const LIMITS = { characters: 12000, tokens: 512, depth: 48, premises: 32, normalizedNodes: 8192, atoms: 64 };
  function fail(message, offset) {
    const e = new Error(message + (offset === undefined ? '' : `（位置 ${offset + 1}）`));
    e.code = 'INVALID_FORMULA'; throw e;
  }
  function parse(text) {
    if (typeof text !== 'string' || !text.trim()) fail('公式不能为空');
    if (text.length > LIMITS.characters) fail('公式过长');
    const tokens = []; let pos = 0;
    const symbols = [['<->','iff'],['↔','iff'],['->','implies'],['→','implies'],['!','not'],['¬','not'],['&','and'],['∧','and'],['|','or'],['∨','or'],['□','box'],['◇','diamond'],['⊤','true'],['⊥','false'],['(','('],[')',')']];
    while (pos < text.length) {
      if (/\s/u.test(text[pos])) { pos++; continue; }
      const symbol = symbols.find(([s]) => text.startsWith(s,pos));
      if (symbol) { tokens.push({type:symbol[1],pos}); pos+=symbol[0].length; }
      else {
        const m = /^[\p{L}_][\p{L}\p{N}_]*/u.exec(text.slice(pos));
        if (!m) fail('无法识别的字符 '+text[pos],pos);
        const reserved = { O:'box', P:'diamond', F:'forbid', true:'true', false:'false' };
        tokens.push({type:Object.prototype.hasOwnProperty.call(reserved,m[0])?reserved[m[0]]:'atom',name:m[0],pos}); pos+=m[0].length;
      }
      if (tokens.length > LIMITS.tokens) fail('公式符号过多');
    }
    tokens.push({type:'end',pos:text.length}); let i=0;
    function take(type) { if(tokens[i].type!==type) fail('预期 '+type+'，实际 '+tokens[i].type,tokens[i].pos); return tokens[i++]; }
    function prefix(depth) {
      if(depth>LIMITS.depth) fail('公式嵌套过深',tokens[i].pos);
      const t=tokens[i];
      if(['not','box','diamond','forbid'].includes(t.type)) {i++;return {op:t.type,arg:prefix(depth+1)};}
      if(t.type==='(') {i++;const f=iff(depth+1);take(')');return f;}
      if(t.type==='atom') {i++;return {op:'atom',name:t.name};}
      if(t.type==='true'||t.type==='false') {i++;return {op:'const',value:t.type==='true'};}
      fail('预期命题、常量或带括号的公式',t.pos);
    }
    function and(depth) {let f=prefix(depth);while(tokens[i].type==='and'){i++;f={op:'and',left:f,right:prefix(depth)};}return f;}
    function or(depth) {let f=and(depth);while(tokens[i].type==='or'){i++;f={op:'or',left:f,right:and(depth)};}return f;}
    function implies(depth) {const f=or(depth);if(tokens[i].type==='implies'){if(depth>LIMITS.depth)fail('蕴含链过深');i++;return {op:'implies',left:f,right:implies(depth+1)};}return f;}
    function iff(depth) {let f=implies(depth);if(tokens[i].type==='iff'){i++;f={op:'iff',left:f,right:implies(depth)};if(tokens[i].type==='iff')fail('连续双条件请加括号',tokens[i].pos);}return f;}
    const ast=iff(0);take('end');return ast;
  }
  function nnf(ast, negative=false, budget={nodes:0}) {
    if(++budget.nodes>LIMITS.normalizedNodes) fail('规范化展开超过限制');
    const go=(a,n=negative)=>nnf(a,n,budget);
    switch(ast.op) {
      case 'atom':return {op:'literal',atom:ast.name,negative};
      case 'const':return {op:'const',value:negative?!ast.value:ast.value};
      case 'not':return go(ast.arg,!negative);
      case 'and':case 'or':return {op:negative?(ast.op==='and'?'or':'and'):ast.op,left:go(ast.left),right:go(ast.right)};
      case 'implies':return {op:negative?'and':'or',left:go(ast.left,!negative),right:go(ast.right,negative)};
      case 'iff':return {op:'or',left:{op:'and',left:go(ast.left,false),right:go(ast.right,negative)},right:{op:'and',left:go(ast.left,true),right:go(ast.right,!negative)}};
      case 'box':case 'diamond':return {op:negative?(ast.op==='box'?'diamond':'box'):ast.op,arg:go(ast.arg)};
      case 'forbid':return {op:negative?'diamond':'box',arg:go(ast.arg,!negative)};
      default:fail('不支持的语法节点');
    }
  }
  function key(f) {
    if(f.op==='literal')return (f.negative?'!':'')+f.atom;
    if(f.op==='const')return f.value?'true':'false';
    if(f.op==='box'||f.op==='diamond')return (f.op==='box'?'O':'P')+'('+key(f.arg)+')';
    return '('+key(f.left)+(f.op==='and'?' & ':' | ')+key(f.right)+')';
  }
  function collectAtoms(ast, found=new Set()) {
    if(ast.op==='atom')found.add(ast.name);
    if(ast.arg)collectAtoms(ast.arg,found);
    if(ast.left)collectAtoms(ast.left,found);
    if(ast.right)collectAtoms(ast.right,found);
    return found;
  }
  function prepare(input) {
    if(!input||typeof input!=='object'||Array.isArray(input))fail('查询必须是对象');
    if(Object.keys(input).some(k=>!['mode','premises','conclusion','limits'].includes(k)))fail('查询含不支持的字段');
    const mode=input.mode||(input.conclusion===undefined?'satisfiability':'entailment');
    if(!['satisfiability','entailment','validity'].includes(mode))fail('未知查询模式');
    const premises=input.premises===undefined?[]:input.premises;
    if(!Array.isArray(premises)||premises.length>LIMITS.premises)fail('premises 必须是至多32条公式的数组');
    if(mode==='validity'&&premises.length)fail('有效性检查不接受局部前提；请使用后承模式');
    if(mode==='satisfiability'&&input.conclusion!==undefined)fail('可满足性模式不接受 conclusion');
    const parsed=premises.map(parse), conclusion=mode==='satisfiability'?null:parse(input.conclusion);
    const atoms=new Set();parsed.forEach(f=>collectAtoms(f,atoms));if(conclusion)collectAtoms(conclusion,atoms);
    if(atoms.size>LIMITS.atoms)fail('命题原子超过64个');
    return {mode,premises:[...premises],conclusion:input.conclusion,parsed,goal:conclusion,atoms:[...atoms].sort()};
  }
  return {parse,nnf,key,prepare,collectAtoms,LIMITS};
});
