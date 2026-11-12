'use strict';
// Local API and static Pages use the same integrated business model.
window.LexChainRuntime = (() => {
  const isStatic = document.querySelector('meta[name="lexchain-mode"]').content === 'static';
  let rules,assetPromise;
  async function request(url, body) {
    const response = await fetch(url, body === undefined ? {} : {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body, (key, value) => {
        if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('数值超出有效范围，请核对后重试');
        return value;
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '服务暂时不可用（' + response.status + '）');
    return data;
  }
  async function getAssets(){if(!assetPromise)assetPromise=Promise.all(['labor-rules','labor-mapping','legal-registry'].map(n=>request('./rules/'+n+'.json'))).then(([r,m,g])=>{rules=r;window.LEXCHAIN_RULESET=r;return {rules:r,mapping:m,registry:g};}).catch(e=>{assetPromise=null;throw e;});return assetPromise;}
  return {
    isStatic,getAssets,
    async schema() {
      if (!isStatic) return request('/api/schema');
      await getAssets();
      return { facts: rules.facts, rulebase: rules.meta, presets: [], has_key: false };
    },
    async analyze(body) {
      JSON.stringify(body,(key,value)=>{if(typeof value==='number'&&!Number.isFinite(value))throw new Error('数值超出有效范围，请核对后重试');return value;});
      if(window.LexChainResearch)body=await window.LexChainResearch.beforeAnalyze(body);
      let data;
      if(!isStatic)data=await request('/api/analyze',body);
      else {
        if(body.text)throw new Error('公开版不自动解释自由文本。请在事实面板逐项确认后，点击「用当前事实集分析」。');
        const a=await getAssets(),facts=body.facts===undefined?{}:body.facts;
        const submitted={facts,context:body.context===undefined?{}:body.context,events:body.events===undefined?[]:body.events,sources:body.sources===undefined?[]:body.sources,evidence:body.evidence===undefined?[]:body.evidence};
        const integrated=window.LexChainCaseEngine.analyze(submitted,a);
        const checked=window.LexChainBusinessChecker.verify(integrated.certificate,a,submitted);
        if(!checked.verified)throw new Error('独立执行复核失败：'+checked.reason);
        data={...integrated,confirmed_facts:facts,extraction:null,certificate_check:checked};
        if(body.caseId&&window.LexChainResearch){const certificateDigest=await window.LexChainResearch.hash(data.certificate);data.case=await window.LexChainResearch.save([{type:'ANALYSIS',payload:{certificateDigest,certificate:data.certificate}}]);}
      }
      window.LexChainResearch?.result(data);return data;
    }
  };
})();
