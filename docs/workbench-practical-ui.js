'use strict';
window.LexChainPracticalUI=(()=>{
 const $=id=>document.getElementById(id),P=window.LexChainPractical,e=P.escape;
 let api,answers={},rows=[{month:'',due:'',paid:''}],lastReport=null;
 const formIds=['title','actor','subject','issue','period','eventDate','asOf','jurisdiction','description'];
 function capture(){document.querySelectorAll('[data-practical-fact]').forEach(el=>{answers[el.dataset.practicalFact]=el.dataset.factType==='bool'?(el.value==='unknown'?null:el.value==='yes'):(el.value.trim()===''?null:Number(el.value));});}
 function captureWages(){rows=[...document.querySelectorAll('[data-wage-index]')].map(row=>Object.fromEntries([...row.querySelectorAll('[data-wage-col]')].map(el=>[el.dataset.wageCol,el.value])));}
 function dirty(){if(lastReport){$('practicalFreshness').textContent='输入已修改，下方保留上一次计算结果。点击“分析当前案件”重新计算。';$('practicalFreshness').className='guide-freshness guide-stale';$('practicalCheck').textContent='';}api?.stale();}
 function freeze(){document.querySelectorAll('[data-practical-fact], [data-wage-col], [data-wage-remove]').forEach(el=>el.disabled=api.busy());}
 function renderFacts(){const definitions=P.fields($('practical-issue').value,api.assets),groups=new Map();for(const def of definitions){if(!groups.has(def.group))groups.set(def.group,[]);groups.get(def.group).push(def);}
 $('practicalFacts').innerHTML=[...groups].map(([group,defs])=>'<fieldset><legend>'+e(group)+'</legend><div class="grid">'+defs.map(def=>{const value=answers[def.key];return '<label>'+e(def.label)+(def.type==='bool'?'<select id="practical-fact-'+e(def.key)+'" data-practical-fact="'+e(def.key)+'" data-fact-type="bool"><option value="unknown" '+(value==null?'selected':'')+'>不清楚 / 暂未核实</option><option value="yes" '+(value===true?'selected':'')+'>是</option><option value="no" '+(value===false?'selected':'')+'>否</option></select>':'<input id="practical-fact-'+e(def.key)+'" type="number" data-practical-fact="'+e(def.key)+'" data-fact-type="number" min="'+e(def.minimum??0)+'" '+(def.maximum!==undefined?'max="'+e(def.maximum)+'"':'')+' step="'+(def.integer?'1':'any')+'" value="'+e(value??'')+'" placeholder="不清楚可留空">')+'</label>';}).join('')+'</div></fieldset>').join('');
 const rules=P.issues.find(x=>x.key===$('practical-issue').value);
 $('practicalScope').textContent='当前将使用 '+(rules?.rules?rules.rules.length:34)+' 条相关劳动规则，并自动补齐其前序依赖。未填写的事实保留为未知。';
 $('practicalWages').hidden=!['wage_arrears','all'].includes($('practical-issue').value);
 document.querySelectorAll('[data-practical-fact]').forEach(el=>{el.onchange=()=>{capture();dirty();};el.oninput=()=>{capture();dirty();};});freeze();
 }
 function renderWages(){$('practicalWageRows').innerHTML=rows.map((row,index)=>'<div class="practical-wage-row" data-wage-index="'+index+'"><label>工资月份<input type="month" aria-label="工资第'+(index+1)+'行月份" data-wage-col="month" value="'+e(row.month)+'"></label><label>应发（元）<input type="number" aria-label="工资第'+(index+1)+'行应发" min="0" step="0.01" data-wage-col="due" value="'+e(row.due)+'" placeholder="未知可留空"></label><label>实发（元）<input type="number" aria-label="工资第'+(index+1)+'行实发" min="0" step="0.01" data-wage-col="paid" value="'+e(row.paid)+'" placeholder="未知可留空"></label><button type="button" data-wage-remove="'+index+'" aria-label="删除工资第'+(index+1)+'行">删除</button></div>').join('');
 document.querySelectorAll('[data-wage-col]').forEach(el=>el.oninput=()=>{captureWages();dirty();});document.querySelectorAll('[data-wage-remove]').forEach(el=>el.onclick=()=>{captureWages();rows.splice(Number(el.dataset.wageRemove),1);if(!rows.length)rows.push({month:'',due:'',paid:''});renderWages();dirty();});freeze();}
 function draft(){capture();captureWages();return {...Object.fromEntries(formIds.map(id=>[id,$('practical-'+id).value])),answers:{...answers},wageRows:rows.map(x=>({...x}))};}
 function setDraft(d){for(const id of formIds)$('practical-'+id).value=d[id]??'';answers={...(d.answers||{})};rows=(d.wageRows?.length?d.wageRows:[{month:'',due:'',paid:''}]).map(x=>({...x}));renderFacts();renderWages();}
 function show(c,run){lastReport=P.report(c,run,api.assets);$('practicalResult').hidden=false;$('practicalReport').innerHTML=P.resultHtml(lastReport,api.assets);$('practicalFreshness').className='guide-freshness';$('practicalFreshness').textContent='已完成并归档：'+(run?.id||'当前记录')+'。更改输入后需要重新计算。';$('practicalCheck').textContent=run?.check?.verified?'独立核验通过：规则计算和输入绑定一致；材料真实性与法律适用仍需核对。':'可点击“核验本次分析”独立复核。';document.querySelectorAll('[data-practical-missing]').forEach(b=>b.onclick=()=>{const el=$('practical-fact-'+b.dataset.practicalMissing);if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.focus();}else $('practicalForm').scrollIntoView({behavior:'smooth'});});$('practicalResult').scrollIntoView({behavior:'smooth',block:'start'});}
 function clear(){lastReport=null;$('practicalResult').hidden=true;$('practicalCheck').textContent='';$('practicalFreshness').textContent='';}
 function loaded(run){if(run?.origin?.kind==='PRACTICAL_CASE_INPUT')setDraft(run.origin.practical.draft);}
 function saved(records){const selected=$('practicalSaved').value;$('practicalSaved').innerHTML='<option value="">选择已保存案件</option>'+records.map(r=>'<option value="'+e(r.id)+'">'+e(r.title)+'</option>').join('');if(records.some(r=>r.id===selected))$('practicalSaved').value=selected;}
 function init(callbacks){api=callbacks;$('practical-issue').innerHTML=P.issues.map(i=>'<option value="'+e(i.key)+'">'+e(i.label)+'</option>').join('');$('practical-jurisdiction').value='CN';renderFacts();renderWages();
 $('practical-issue').onchange=()=>{capture();renderFacts();dirty();};for(const id of formIds.filter(x=>x!=='issue'))$('practical-'+id).oninput=dirty;
 $('practicalAddWage').onclick=()=>{captureWages();rows.push({month:'',due:'',paid:''});renderWages();dirty();};
 $('practicalSample').onclick=()=>{setDraft(P.sample());dirty();$('practicalMessage').textContent='已填入可编辑的虚构工资案例。请点击“分析当前案件”，运行真实劳动规则。';};
 $('practicalAnalyze').onclick=()=>api.analyze(draft(),false);
 $('practicalNew').onclick=()=>{setDraft({issue:'wage_arrears',jurisdiction:'CN'});clear();api.detach();$('practicalMessage').textContent='已开启空白案件，旧记录保留。填写后点击分析。';$('practicalForm').scrollIntoView({behavior:'smooth'});};
 $('practicalOpen').onclick=()=>api.open($('practicalSaved').value);
 $('practicalVerify').onclick=()=>api.verify();$('practicalExport').onclick=()=>api.export();
 }
 function feedback(text,error){$('practicalMessage').textContent=text;$('practicalMessage').className=error?'error':'';}
 function checked(r){$('practicalCheck').textContent=r.verified?'独立核验通过：规则计算和输入绑定一致；不证明材料真实或法律适用正确。':'核验未通过：'+r.reason;}
 return {init,show,clear,loaded,saved,feedback,checked,setDraft,dirty,refresh:freeze};
})();
