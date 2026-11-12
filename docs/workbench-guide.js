(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LexChainWorkbenchGuide=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const truth=value=>value==='T'?'成立':value==='F'?'不成立':'暂不能确定';
const valueText=value=>value===true?'是':value===false?'否':value==null?'不清楚':String(value);
const kindText={O:'应当做',F:'不得做',AUTH:'获得授权'};
const statusText={ACTIVE:'本次保留',BLOCKED:'条件未满足或例外阻断',DEFEATED_PRIORITY:'因优先依据而让位',UNRESOLVED_CONFLICT:'冲突未解决',PENDING_CONFLICT:'存在待确认的冲突',PENDING_APPLICABILITY:'适用条件待确认'};
const localText={NOT_TRIGGERED:'未触发',DEFEATED_EXCEPTION:'被例外阻断',PENDING:'条件待确认',PERMITTED:'授权条件成立',COMPLIANT:'符合本条要求',VIOLATION:'不符合本条要求',RISK:'履行情况待确认'};
const aspectText={norm:'规范是否成立',violation:'是否违反',authorization:'是否获得授权'};
const actionText={pay:'支付款项',remedy:'履行补救要求',rescind:'采取退出行为'};
function label(key,definitions){return definitions.find(f=>f.key===key)?.label||key;}
function title(rule){const action=rule.legalRuleId===null&&rule.action===rule.actionKey?(actionText[rule.actionKey]||rule.action):rule.action;return rule.id+' · '+(kindText[rule.kind]||rule.kind)+'“'+action+'”';}
function condition(tree,definitions){
 if(!tree)return '本类规则没有履行判定。';
 const ast=tree.ast;
 if(Object.prototype.hasOwnProperty.call(ast,'fact')){const expected=Object.prototype.hasOwnProperty.call(ast,'eq')?ast.eq:Object.prototype.hasOwnProperty.call(ast,'value')?ast.value:true;const op={'==':'等于','>':'大于','>=':'至少为','<':'小于','<=':'至多为'}[ast.op||'=='];return label(ast.fact,definitions)+'：输入为“'+valueText(tree.actual)+'”，规则要求'+op+'“'+valueText(expected)+'” → '+truth(tree.value)+'。';}
 if(Object.prototype.hasOwnProperty.call(ast,'constant'))return '这条规则的自身条件设为“'+valueText(ast.constant)+'” → '+truth(tree.value)+'；仍须检查前序依赖和例外。';
 const joining=ast.not?'取反':ast.all?'以下条件要全部成立':'以下条件至少一个成立';return joining+' → '+truth(tree.value)+'。 '+(tree.children||[]).map(t=>condition(t,definitions)).join(' ');
}
function result(node){
 if(node.kind==='AUTH')return '授权：'+truth(node.outputs.authorization)+'。授权成立不表示行为已经实施。';
 return '本条'+(node.kind==='F'?'禁止':'义务')+'：'+truth(node.outputs.norm)+'；是否违反：'+truth(node.outputs.violation)+'。';
}
function model(c,definitions){
 const rules=c.request.catalog.rules;
 const nodes=c.nodes.map(n=>{const rule=rules.find(r=>r.id===n.id);return {id:n.id,title:title(rule),kind:n.kind,condition:condition(n.trace.condition,definitions),dependencies:n.trace.dependencies.map(d=>d.rule+' 的“'+aspectText[d.aspect]+'”为“'+truth(d.value)+'”，作为本条的前序条件。'),trigger:'合并自身条件与全部前序条件后：'+truth(n.trigger)+'。',exceptions:n.trace.exceptions.length?n.trace.exceptions.map(e=>e.id+'：'+condition(e.tree,definitions)).join(' '):'本条没有录入例外。',fulfillment:n.kind==='AUTH'?'这是授权规则，不判断是否履行。':condition(n.trace.fulfillment,definitions),local:localText[n.computedStatus]||n.computedStatus,disposition:statusText[n.disposition]||n.disposition,output:result(n),release:n.release==='REVIEWED_BASE_MAPPING'?'对应基础法律映射已通过系统内的版本选择，仍需核对事实与法律。':'仅供研究；不能据此确认法律请求权。',unknown:['U'].includes(n.outputs.norm)||n.outputs.violation==='U'||n.outputs.authorization==='U'};});
 const facts=Object.entries(c.request.input.facts).map(([key,v])=>({key,label:label(key,definitions),value:valueText(v)}));
 const conflicts=c.conflicts.map(x=>{const p=x.priorityPath.map(id=>c.request.catalog.priorities.find(p=>p.id===id)).filter(Boolean);return {title:x.left+' 与 '+x.right,summary:(x.type==='ACTUAL'?'两条规则的适用条件均成立':'至少一条规则的适用性还不能确定')+'，但对同一主体、行为、期间、日期和法域提出相反要求。',resolution:x.preferred?'本次存在指向 '+x.preferred+' 的已审核优先路径；最终是否保留还要看整个冲突组。':'本次没有可用的已审核优先路径，程序保留争议，不自行挑选一条。',basis:p.map(p=>{const s=c.request.catalog.sources.find(s=>s.id===p.basis.sourceId);return {id:p.id,quote:p.basis.quote,reason:p.basis.reason,source:s?.url||'',reviewer:p.basis.review.reviewer};})};});
 return {facts,nodes,conflicts,policy:c.request.policy==='none'?'不使用优先关系（对照）':'只使用已审核的优先依据',scope:c.request.input.context,active:nodes.filter(n=>c.nodes.find(x=>x.id===n.id).disposition==='ACTIVE').length,pending:nodes.filter(n=>n.unknown).length,violations:c.nodes.filter(n=>n.outputs.violation==='T').map(n=>n.id),derived:JSON.stringify(c.baseCertificate.derivedFacts)!==JSON.stringify(c.request.input.facts)};
}
const stages=[['先看输入','程序从明确输入的事实开始。“不清楚”保留为未知，不会自动补成“否”。'],['逐条看条件','先检查规则自己的条件，再结合依赖和例外，决定它是否能进入本次推导。'],['把规则接起来','后面的规则读取前面规则的明确输出。箭头传递的可能是“是否违反”，不只是“是否有义务”。'],['处理相反要求','只在行为范围相同且要求相反时记录冲突。优先关系必须有录入并审核的依据。'],['读懂本次结果','把规范是否成立、是否违反、是否获得授权分开看，再核对哪些问题还没有答案。']];
function render(c,definitions,step){const m=model(c,definitions),e=escape;let body='';
 if(step===0)body='<dl class="guide-facts">'+m.facts.map(f=>'<div><dt>'+e(f.label)+'</dt><dd>'+e(f.value)+'</dd></div>').join('')+'</dl><p>本次范围：'+e(m.scope.subject)+' / '+e(m.scope.period)+'；事件日期 '+e(m.scope.eventDate)+'；截至 '+e(m.scope.asOf)+'；法域 '+e(m.scope.jurisdiction)+'。</p>'+(c.request.input.sources.length?'<p>本次录入 '+c.request.input.sources.length+' 份材料；录入材料本身不表示内容已被证实。</p>':'<p>本次没有录入原文材料，以上都是输入设定，尚未查证。</p>')+(m.derived?'<p>时间线另有推导事实；查看完整科研工作台中的原始证书，对照输入与派生事实。</p>':'');
 if(step===1)body=m.nodes.map(n=>'<article class="guide-rule"><h4>'+e(n.title)+'</h4><p>'+e(n.condition)+'</p><p>'+e(n.dependencies.length?n.dependencies.join(' '):'没有前序依赖。')+'</p><p>'+e(n.trigger)+' '+e(n.exceptions)+'</p><p><strong>本条局部判断：'+e(n.local)+'</strong></p><p>履行观察：'+e(n.fulfillment)+'</p></article>').join('');
 if(step===2)body='<div class="guide-links">'+c.edges.map(d=>'<p><span>'+e(title(c.request.catalog.rules.find(r=>r.id===d.from)))+'</span><b aria-label="传递"> ↓ </b><span>'+e(title(c.request.catalog.rules.find(r=>r.id===d.to)))+'</span><br>传递“'+e(aspectText[d.aspect])+' = '+e(truth(d.value))+'”</p>').join('')+'</div>'+(c.edges.length?'':'<p>这些规则没有录入前序依赖，本次逐条计算。</p>')+'<p class="guide-callout">前序输出为“暂不能确定”时，后续条件也可能待确认；程序不会把未知当作已经违反。</p>';
 if(step===3)body='<p>本次策略：'+e(m.policy)+'。</p>'+(m.conflicts.length?m.conflicts.map(x=>'<article class="guide-rule"><h4>'+e(x.title)+'</h4><p>'+e(x.summary)+'</p><p>'+e(x.resolution)+'</p>'+x.basis.map(b=>'<blockquote>'+e(b.quote)+'</blockquote><p>理由：'+e(b.reason)+'；声明审核者：'+e(b.reviewer)+'；依据编号：'+e(b.id)+'。</p>').join('')+'</article>').join(''):'<p class="guide-callout">本次选定规则内未检出活动或潜在冲突。它不代表所有未选规则、其他期间或现实法律之间都没有冲突。</p>');
 if(step===4)body='<div class="guide-metrics"><p><strong>'+m.active+'</strong> 条规则的结论被保留</p><p><strong>'+m.pending+'</strong> 条规则仍含待确认输出</p></div>'+m.nodes.map(n=>'<article class="guide-rule"><h4>'+e(n.title)+'</h4><p><span class="guide-badge">'+e(n.disposition)+'</span></p><p>'+e(n.output)+'</p><p class="guide-muted">'+e(n.release)+'</p></article>').join('')+'<p class="guide-callout">下一步：改变“已及时足额支付”的设定，再运行一次，观察补救与授权如何变化。“是”表示原本已按时付清，后来的补付不能改写过去是否逾期。这里的讲解来自执行证书，计算一致不证明事实真实或法律适用正确。</p>';
 return '<div class="guide-step-heading"><span>第 '+(step+1)+' / 5 步</span><h3>'+e(stages[step][0])+'</h3><p>'+e(stages[step][1])+'</p></div>'+body;
}
function compare(before,after,definitions){const e=escape,keys=[...new Set([...Object.keys(before.request.input.facts),...Object.keys(after.request.input.facts)])],changed=keys.filter(k=>before.request.input.facts[k]!==after.request.input.facts[k]);const changes=after.nodes.filter(n=>{const b=before.nodes.find(b=>b.id===n.id);return !b||b.disposition!==n.disposition||JSON.stringify(b.outputs)!==JSON.stringify(n.outputs);});return '<h3>与上一份展示记录对照</h3><p>'+(changed.length?changed.map(k=>e(label(k,definitions))+'：“'+e(valueText(before.request.input.facts[k]))+'” → “'+e(valueText(after.request.input.facts[k]))+'”').join('；'):'已填事实相同。')+'</p>'+(before.request.policy!==after.request.policy?'<p>优先策略也已切换，结果变化可能来自事实或策略。</p>':'')+(before.catalogDigest!==after.catalogDigest||JSON.stringify(before.request.selectedIds)!==JSON.stringify(after.request.selectedIds)||JSON.stringify(before.request.input.context)!==JSON.stringify(after.request.input.context)||before.assetsDigest!==after.assetsDigest?'<p>规则目录、选择范围、可信资产或主体日期也有变化，不能把结果变化单独归因于某项事实。</p>':'')+'<ul>'+changes.map(n=>'<li>'+e(n.id)+'：'+e(statusText[n.disposition]||n.disposition)+'。'+e(result(n))+'</li>').join('')+'</ul>'+(changes.length?'':'<p>这些规则的最终输出没有变化。</p>');}
return {model,render,compare,valueText,stages};
});
