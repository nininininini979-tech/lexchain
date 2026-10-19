'use strict';
// Local and Pages adapters share the intake and opinion code. No cloud extraction in worker mode.
window.LexChainRuntime = (() => {
  const isStatic = document.querySelector('meta[name="lexchain-mode"]').content === 'static';
  let rules;
  async function request(url, body) {
    const response = await fetch(url, body === undefined ? {} : {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '服务暂时不可用（' + response.status + '）');
    return data;
  }
  return {
    isStatic,
    async schema() {
      if (!isStatic) return request('/api/schema');
      const response = await fetch('./rules/labor-rules.json');
      if (!response.ok) throw new Error('规则库加载失败，请检查网络后重试');
      rules = await response.json();
      window.LEXCHAIN_RULESET = rules;
      return { facts: rules.facts, rulebase: rules.meta, presets: [], has_key: false };
    },
    async analyze(body) {
      if (!isStatic) return request('/api/analyze', body);
      if (!rules) throw new Error('规则库尚未加载');
      if (body.text) throw new Error('公开版不自动解释自由文本。请在事实面板逐项确认后，点击「用当前事实集分析」。');
      const facts = { ...(body.facts || {}) };
      return { facts_used: facts, extraction: null, report: window.LexChainBrowserEngine.analyze(facts, rules) };
    }
  };
})();
