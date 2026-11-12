'use strict';
(()=>{
 const $=id=>document.getElementById(id),escape=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 const status={SAT:'可以同时成立',UNSAT:'不能同时成立',VALID:'有效',INVALID:'无效：存在反模型',ENTAILED:'前提推出结论',NOT_ENTAILED:'不能由前提推出',INCONSISTENT_PREMISES:'前提不相容',UNKNOWN:'未判定：达到资源上限'};
 let examples=[],savedResult=null,worker=null,watchdog=null,pending=null;
 function finish(){if(worker)worker.terminate();worker=null;pending=null;clearTimeout(watchdog);$('solve').disabled=false;$('check').disabled=false;}
 function modelTable(model){
  return `<p>根世界：w${model.root}。边表示规范可接受关系；每个世界都有后继。</p><table><thead><tr><th>世界</th><th>命题赋值</th><th>可达世界</th></tr></thead><tbody>${model.worlds.map(w=>`<tr><td>w${w.id}${w.id===model.root?'（根）':''}</td><td>${Object.entries(w.valuation).map(([k,v])=>`${escape(k)}=${v?'真':'假'}`).join('，')||'无原子'}</td><td>${w.successors.map(i=>'w'+i).join('，')}</td></tr>`).join('')}</tbody></table>`;
 }
 function render(r){
  const verified=r.verification&&r.verification.verified;
  if(r.status!=='UNKNOWN'&&!verified){$('result').innerHTML='<h2 class="error">结果未通过独立检查，不能接受此结论</h2><p>'+escape(r.verification?.reason||'缺少检查结果')+'</p>';return;}
  let html=`<div class="status ${r.status==='INCONSISTENT_PREMISES'||r.status==='UNKNOWN'?'warn':''}">${escape(status[r.status]||r.status)}</div><p>${verified?'证书／模型检查通过。':'未得到确定结论。'} 求解步骤 ${r.stats.steps}；耗时 ${r.stats.elapsedMs} ms。</p>`;
  html+='<p>本次检查：<code>'+escape(r.query.premises.length?r.query.premises.join(' ; '):'无前提')+'</code>'+ (r.query.conclusion?' ⊨ <code>'+escape(r.query.conclusion)+'</code>':' 的可满足性')+'</p>';
  if(r.status==='INCONSISTENT_PREMISES')html+='<p class="warn">这些前提在 KD 中没有共同模型。经典后承在这里空真，不能把任意结论当作有实质依据的法律判断。</p>';
  if(r.status==='UNKNOWN')html+='<p>限制：'+escape(r.reason)+'。未判定既不表示无效，也不表示已证实。</p>';
  const certificate=r.certificate||(r.consistency?.status==='UNSAT'?r.consistency.certificate:null);
  if(certificate)html+=`<h2>闭合表证明</h2><p>${certificate.nodes.length} 个证明节点。检查器已验证每步的主公式、分支、模态侧条件和矛盾叶。</p><details><summary>查看证明步骤</summary><pre>${escape(certificate.nodes.map(n=>`#${n.id} ${n.rule} ${n.principal||''}\n  ${n.formulas.join(' ; ')||'∅'}\n  子节点: ${(n.children||[]).join(', ')||'无'}${n.rule==='modal'?'；见证: '+(n.witness===null?'串行性后继':n.witness):''}`).join('\n\n'))}</pre></details>`;
  if(r.countermodel)html+='<h2>反模型</h2><p>根世界满足全部前提，待证结论为假。</p>'+modelTable(r.countermodel);
  else if(r.status==='SAT')html+='<h2>满足前提的模型</h2>'+modelTable(r.consistency.model);
  if(['ENTAILED','VALID'].includes(r.status))html+='<p>前提已另行检查为可满足，排除了因前提不相容产生的空真。</p>';
  html+='<details><summary>完整结果 JSON</summary><pre>'+escape(JSON.stringify(r,null,2))+'</pre></details>';
  $('result').innerHTML=html;
 }
 function run(message){
  finish();pending=message.type;$('solve').disabled=true;$('check').disabled=true;$('error').textContent='';
  function failed(text){finish();if(message.type==='check')$('checkResult').textContent='检查未完成：'+text;else{$('result').innerHTML='';$('error').textContent=text;}}
  try{worker=new Worker('./modal-worker.js');}catch(e){failed('无法启动本地求解线程：'+e.message);return;}
  watchdog=setTimeout(()=>failed('计算达到页面等待上限，已终止；结果未判定。'),12000);
  worker.onerror=e=>failed('计算线程错误：'+e.message);
  worker.onmessage=e=>{finish();const d=e.data;if(d.type==='error'){failed(d.error);return;}
   if(d.type==='checked'){$('checkResult').textContent=d.verification.verified?'检查通过：'+d.verification.kind:'检查未通过：'+d.verification.reason;return;}
   savedResult=d.result;render(savedResult);$('download').disabled=false;};
  worker.postMessage(message);
 }
 function modeChanged(){const m=$('mode').value;$('premises').disabled=m==='validity';$('conclusion').disabled=m==='satisfiability';}
 function invalidate(){finish();savedResult=null;$('download').disabled=true;$('result').innerHTML='';$('error').textContent='';}
 function exampleChanged(){const e=examples.find(x=>x.id===$('example').value);if(!e)return;invalidate();$('mode').value=e.mode;$('premises').value=e.premises.join('\n');$('conclusion').value=e.conclusion||'';modeChanged();}
 $('example').onchange=exampleChanged;$('mode').onchange=()=>{invalidate();modeChanged();};
 $('premises').oninput=invalidate;$('conclusion').oninput=invalidate;
 $('saved').oninput=()=>{if(pending==='check')finish();$('checkResult').textContent='';};
 $('solve').onclick=()=>{
  const mode=$('mode').value,query={mode,premises:mode==='validity'?[]:$('premises').value.split('\n').map(x=>x.trim()).filter(Boolean)};
  if(mode!=='satisfiability')query.conclusion=$('conclusion').value.trim();savedResult=null;$('download').disabled=true;$('result').innerHTML='<p>正在求解并检查证书…</p>';run({type:'solve',query});
 };
 $('check').onclick=()=>{try{const text=$('saved').value;if(text.length>10000000)throw new Error('结果JSON过大');const result=JSON.parse(text);$('checkResult').textContent='正在检查…';run({type:'check',query:result.query,result});}catch(e){$('checkResult').textContent=e.message;}};
 $('download').onclick=()=>{if(!savedResult)return;const url=URL.createObjectURL(new Blob([JSON.stringify(savedResult,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='lexchain-kd-result.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 fetch('./modal-examples.json').then(r=>{if(!r.ok)throw new Error('算例加载失败');return r.json();}).then(data=>{examples=data;exampleChanged();}).catch(e=>{$('error').textContent=e.message;});modeChanged();
})();
