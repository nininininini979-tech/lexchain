'use strict';
window.LexChainGuidedUI=(()=>{
 const $=id=>document.getElementById(id),Guide=window.LexChainWorkbenchGuide;
 let callbacks,certificate=null,previous=null,shownRunId=null,step=0;
 function mode(advanced){document.body.classList.toggle('guided-mode',!advanced);$('beginnerMode').setAttribute('aria-pressed',String(!advanced));$('researchMode').setAttribute('aria-pressed',String(advanced));$('guideModeHint').textContent=advanced?'完整科研工具：可编辑目录、追溯材料、做实验；白话讲解仍会跟随每次运行。':'入门演绎：先看一个合成案例，逐步理解程序怎样判断。';}
 function settings(){return {paid:$('guidePaid').value==='unknown'?null:$('guidePaid').value==='yes',conflict:$('guideConflict').checked,policy:$('guidePolicy').value};}
 function preset(){const name=$('guideScenario').value;$('guidePaid').value=name==='paid'?'yes':name==='unknown'?'unknown':'no';$('guideConflict').checked=name==='conflict';$('guidePolicy').value='reviewed';draft();}
 function draft(){if(certificate)stale();$('guideSettingHint').textContent='设定已修改。点击“运行这个设定”，会产生新记录；下方旧记录不会随输入自动改变。';}
 function definitions(){if(certificate?.catalogDigest!==callbacks.teachingCatalogDigest)return callbacks.definitions;const aliases={employment_exists:'存在用工关系（示例设定）',wage_paid_on_time_full:'已及时足额支付',double_wage_paid:'补救已完成（合成）',worker_special_protection:'人为开启相反规则（合成）'};return callbacks.definitions.map(f=>({...f,label:aliases[f.key]||f.label}));}
 function draw(){if(!certificate)return;$('guideWalkthrough').innerHTML=Guide.render(certificate,definitions(),step);$('guideStepCount').textContent='第 '+(step+1)+' / 5 步';$('guideBack').disabled=step===0;$('guideNext').disabled=step===4;document.querySelectorAll('[data-guide-step]').forEach(b=>{const selected=Number(b.dataset.guideStep)===step;b.setAttribute('aria-current',selected?'step':'false');});}
 function show(c,runId){$('guideCheck').textContent='记录已载入；可点击“重新核验这份记录”复核。';if(certificate&&shownRunId!==runId)previous=certificate;certificate=c;shownRunId=runId;step=0;$('guideEmpty').hidden=true;$('guideOutput').hidden=false;$('guideFreshness').textContent='正在解读归档 '+runId+'。每一页都对应这份执行记录。';$('guideFreshness').className='guide-freshness';$('guideComparison').innerHTML=previous&&previous!==c?Guide.compare(previous,c,callbacks?definitions():[]):'';if(callbacks)draw();}
 function stale(){$('guideCheck').textContent='';$('guideFreshness').textContent='输入或工作区已变化。下面仍是上一次归档的解释，请重新运行后再判断。';$('guideFreshness').className='guide-freshness guide-stale';}
 function clear(){$('guideCheck').textContent='';certificate=null;previous=null;shownRunId=null;step=0;$('guideEmpty').hidden=false;$('guideOutput').hidden=true;$('guideComparison').textContent='';}
 function init(api){callbacks=api;mode(false);$('beginnerMode').onclick=()=>mode(false);$('researchMode').onclick=()=>mode(true);$('guideScenario').onchange=preset;for(const id of ['guidePaid','guideConflict','guidePolicy'])$(id).onchange=draft;
  $('guideStart').onclick=()=>callbacks.run(settings(),true);
  $('guideRerun').onclick=()=>callbacks.run(settings(),false);
  function go(next){step=next;draw();$('guideReader').scrollIntoView({behavior:'smooth',block:'start'});}
  $('guideBack').onclick=()=>go(Math.max(0,step-1));$('guideNext').onclick=()=>go(Math.min(4,step+1));
  document.querySelectorAll('[data-guide-step]').forEach(b=>b.onclick=()=>go(Number(b.dataset.guideStep)));
  $('guideVerify').onclick=()=>callbacks.verify();$('guideAdvanced').onclick=()=>{mode(true);$('chain').scrollIntoView({behavior:'smooth',block:'start'});};
 }
 function checked(result){$('guideCheck').textContent=result.verified?'独立核验通过：这份记录的规则计算和输入绑定一致；不证明输入真实或法律适用正确。':'未通过独立核验：'+result.reason;}
 function completed(settings){$('guideReader').scrollIntoView({behavior:'smooth',block:'start'});$('guidePaid').value=settings.paid===null?'unknown':settings.paid?'yes':'no';$('guideConflict').checked=settings.conflict;$('guidePolicy').value=settings.policy;$('guideScenario').value=settings.conflict?'conflict':settings.paid===null?'unknown':settings.paid?'paid':'late';$('guideSettingHint').textContent='已用当前设定运行并保存。现在可按 1–5 步阅读，也可以只改一项再对照。';}
 function feedback(text,error){$('guideNotice').textContent=text;$('guideNotice').className=error?'error':'';}
 return {init,show,stale,clear,checked,completed,feedback,refresh:()=>{if(certificate)draw();}};
})();
