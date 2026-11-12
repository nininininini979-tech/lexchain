'use strict';
(()=>{const $=id=>document.getElementById(id),esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'),S=LexChainConditionalSyntax;
 const labels={ENTAILED:'所有保留方案均支持该条件义务',NOT_ENTAILED:'无法保证该条件义务：存在反模型',CONSISTENT:'规范在所选策略下可共同处理',INCONSISTENT_NORMS:'全部规范无法共同满足',INCONSISTENT_STRICT_NORMS:'不可撤回规范之间存在冲突',INCONSISTENT_BACKGROUND:'背景约束不相容',INCONSISTENT_FACTS:'事实与背景不相容',VACUOUS_CONTEXT:'查询条件不可能成立：仅有空真',UNKNOWN:'资源不足：未判定'};
 let examples=[],result=null,worker=null,timer=null,pending=null;
 function stop(){if(worker)worker.terminate();worker=null;pending=null;clearTimeout(timer);$('solve').disabled=false;$('check').disabled=false;}
 function invalidate(){stop();result=null;$('download').disabled=true;$('result').innerHTML='';$('error').textContent='';}
 function render(r){if(r.status!=='UNKNOWN'&&!r.verification?.verified){$('result').innerHTML='<h2 class="error">结果未通过凭据核验</h2><p>'+esc(r.verification?.reason||'未核验')+'</p>';return;}
  const p=S.prepare(r.query),sets=r.preferredSets||[];
  let html='<div class="status">'+esc(labels[r.status]||r.status)+'</div><p>'+(r.verification?.verified?'凭据检查通过。':'没有确定结论。')+' 搜索 '+r.stats.rankSearches+' 次；耗时 '+r.stats.elapsedMs+' ms。</p>';
  if(p.query.query)html+='<p>本次查询：<code>O('+esc(p.query.query.ought)+' | '+esc(p.query.query.given)+')</code></p>';
  if(r.status==='NOT_ENTAILED')html+='<p class="warn">未推出不等于推出相反义务；下面仅展示一个反例。</p>';
  if(r.status.startsWith('INCONSISTENT'))html+='<p class="warn">未输出任意义务结论。请依据冲突凭据复核输入。</p>';
  if(r.status==='VACUOUS_CONTEXT')html+='<p class="warn">背景下没有满足查询条件的世界，不能当作可执行义务。</p>';
  if(r.status==='UNKNOWN')html+='<p>'+esc(r.reason)+'。调整问题规模后再试。</p>';
  if(sets.length){html+='<h2>保留的规范方案</h2><p>'+sets.length+' 个方案；'+(p.query.policy==='all'?'当前要求全部规范共同成立，未启用优先序选择。':'保留全部同级不可比较的选择。优先级越高的层先比较，同一层比较集合包含关系。')+'</p><ul>'+sets.slice(0,32).map(s=>'<li>方案 '+s.mask+'：'+esc(s.normIds.join('、')||'空规范集')+'</li>').join('')+'</ul>'+(sets.length>32?'<p>其余方案见完整 JSON。</p>':'');
   const factual=f=>{const a=p.actual.map(w=>S.evaluate(f,S.values(p.atoms,w)));return a.every(Boolean)?'真':a.every(v=>!v)?'假':'未知';};
   html+='<h2>实际情境与规范保留情况</h2><p>履行栏只根据输入事实判断；它与规范是否被保留是两个维度。</p><div class="scroll"><table><thead><tr><th>规范</th><th>有效条件</th><th>实际情境</th><th>保留</th></tr></thead><tbody>';
   p.rules.forEach((n,i)=>{const condition=S.boolean('('+n.given+') & !('+n.unless+')'),app=factual(condition),out=factual(p.ast.norms[i].ought),retained=sets.filter(s=>s.normIds.includes(n.id)).length;const state=app==='假'?'条件不成立':app==='未知'?'适用条件未知':out==='假'?'已违背（按输入事实）':out==='真'?'已满足（按输入事实）':'履行情况未知';html+='<tr><td>'+esc(n.id)+'</td><td><code>'+esc(n.given)+(n.unless==='false'?'':' ∧ ¬('+esc(n.unless)+')')+'</code></td><td>'+state+'</td><td>'+retained+'/'+sets.length+' 方案</td></tr>';});html+='</tbody></table></div>';
  }
  if(r.vacuousNorms?.length)html+='<p class="warn">条件不可能成立的规范：'+esc(r.vacuousNorms.join('、'))+'。这些规范仅空真。</p>';
  const chosen=r.countermodel||(sets.length?{mask:sets[0].mask,ranks:r.audits.find(a=>a.mask===sets[0].mask).ranks}:null);
  if(chosen){const ws=p.universe,context=p.target?.context||[],min=context.length?Math.min(...context.map(w=>chosen.ranks[w])):null;html+='<h2>'+(r.countermodel?'反模型':'代表性排序模型')+'</h2><p>方案 '+chosen.mask+'；数字越小越理想。绿色行为查询条件下的最佳世界，黄色标记为符合输入事实的世界。事实世界不必理想。</p><div class="scroll"><table><thead><tr><th>世界</th><th>排序</th><th>命题赋值</th><th>情境标记</th></tr></thead><tbody>';
   [...ws].sort((a,b)=>chosen.ranks[a]-chosen.ranks[b]||a-b).forEach(w=>{const best=context.includes(w)&&chosen.ranks[w]===min,actual=p.actual.includes(w);html+='<tr'+(best?' class="best"':'')+'><td>w'+w+'</td><td>'+chosen.ranks[w]+'</td><td>'+Object.entries(S.values(p.atoms,w)).map(([a,v])=>esc(a)+'='+(v?'真':'假')).join('，')+'</td><td'+(actual?' class="actual"':'')+'>'+(best?'最佳条件世界 ':'')+(actual?'符合事实 ':'')+(w===r.countermodel?.witness?'反例见证':'')+'</td></tr>';});html+='</tbody></table></div>';}
  if(r.proofs)html+='<p>已核验 '+r.proofs.reduce((n,c)=>n+c.refutations.length,0)+' 份候选反例消去证明，覆盖每个保留方案。</p>';
  html+='<details><summary>完整查询、审计及凭据 JSON</summary><pre>'+esc(JSON.stringify(r,null,2))+'</pre></details>';$('result').innerHTML=html;
 }
 function run(message){stop();pending=message.type;$('solve').disabled=true;$('check').disabled=true;$('error').textContent='';
  const fail=text=>{stop();if(message.type==='check')$('checkResult').textContent='检查未完成：'+text;else{$('result').innerHTML='';$('error').textContent=text;}};
  try{worker=new Worker('./conditional-worker.js');}catch(e){fail(e.message);return;}timer=setTimeout(()=>fail('达到页面20秒等待上限，已终止；没有确定结论'),20000);
  worker.onerror=e=>fail(e.message);worker.onmessage=e=>{stop();const d=e.data;if(d.type==='error'){fail(d.error);return;}if(d.type==='checked'){$('checkResult').textContent=d.verification.verified?'检查通过：'+d.verification.kind:'检查拒绝：'+d.verification.reason;return;}result=d.result;render(result);$('download').disabled=false;};worker.postMessage(message);
 }
 $('query').oninput=invalidate;$('saved').oninput=()=>{if(pending==='check')stop();$('checkResult').textContent='';};
 $('example').onchange=()=>{invalidate();const e=examples.find(x=>x.id===$('example').value);if(e)$('query').value=JSON.stringify(e.input,null,2);};
 $('solve').onclick=()=>{invalidate();try{const text=$('query').value;if(text.length>100000)throw new Error('输入JSON过大');const query=JSON.parse(text);$('result').innerHTML='正在计算并核验…';run({type:'solve',query});}catch(e){$('error').textContent=e.message;}};
 $('check').onclick=()=>{try{if($('saved').value.length>20000000)throw new Error('结果JSON过大');const r=JSON.parse($('saved').value);$('checkResult').textContent='正在检查…';run({type:'check',query:r.query,result:r});}catch(e){$('checkResult').textContent=e.message;}};
 $('download').onclick=()=>{if(!result)return;const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='lexchain-conditional-result.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 fetch('./conditional-examples.json').then(r=>{if(!r.ok)throw new Error('算例读取失败');return r.json();}).then(data=>{examples=data;$('example').onchange();}).catch(e=>{$('error').textContent=e.message;});
})();
