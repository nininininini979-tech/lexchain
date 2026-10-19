'use strict';
/**
 * LexChain 推理引擎 v0.1
 * 分析哲学形式化内核：
 *  - 道义逻辑：O(应当) / F(禁止) / P(许可)
 *  - 三值判定：T(成立) / F(不成立) / U(证据不足)
 *  - 可废止推理：规则 + 例外(defeater)，例外成立则结论被推翻
 *  - 双层输出：符号层（可审计） + 自然语言层（可阅读）
 * 引擎本身不调用任何 LLM：所有判定均为确定性运算，可逐步复现。
 */

function loadRuleSet(raw) {
  raw = raw || window.LEXCHAIN_RULESET;
  if (!raw) throw new Error('规则库尚未加载');
  const descMap = {};
  for (const f of raw.facts) descMap[f.key] = f;
  return { meta: raw.meta, facts: raw.facts, rules: raw.rules, descMap };
}

/* ---------- 原子评估（三值） ---------- */
function evalAtom(atom, facts, descMap) {
  const key = atom.fact;
  const def = descMap[key] || { label: key, type: 'bool' };
  const v = facts[key];
  const unknown = (v === undefined || v === null || v === '');
  let actualDesc = unknown ? '未知' : String(v);

  let value; // 'T' | 'F' | 'U'
  if (unknown) {
    value = 'U';
  } else if (def.type === 'number') {
    const n = Number(v);
    if (Number.isNaN(n)) { value = 'U'; }
    else {
      const op = atom.op || '==';
      const target = Number(atom.eq !== undefined ? atom.eq : atom.value);
      switch (op) {
        case '>': value = n > target ? 'T' : 'F'; break;
        case '>=': value = n >= target ? 'T' : 'F'; break;
        case '<': value = n < target ? 'T' : 'F'; break;
        case '<=': value = n <= target ? 'T' : 'F'; break;
        default: value = n === target ? 'T' : 'F';
      }
      actualDesc = String(n);
    }
  } else {
    const expected = atom.eq !== undefined ? atom.eq : (atom.value === true);
    value = (Boolean(v) === Boolean(expected)) ? 'T' : 'F';
  }

  const negate = (def.type !== 'number' && atom.eq === false) ||
                 (def.type !== 'number' && atom.eq === undefined && atom.value === false);
  const symbol = (negate ? '¬' : '') + symbolize(key, atom, def);
  return { fact: key, label: def.label, group: def.group || '', symbol, negate, expected: atom.eq !== undefined ? atom.eq : (atom.op ? `${atom.op}${atom.value}` : true), actual: unknown ? null : v, value };
}

function symbolize(key, atom, def) {
  if (def.type === 'number') {
    const short = key.replace(/_/g, ' ');
    return `${short}${atom.op || '=='}${atom.value !== undefined ? atom.value : atom.eq}`;
  }
  // 驼峰式命题符号：EmploymentExists
  return key.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

/* ---------- 条件评估（AND/OR 递归嵌套） ---------- */
function evalCondition(cond, facts, descMap) {
  if (!cond) return { value: 'T', atoms: [] };
  if (cond.fact) {
    const a = evalAtom(cond, facts, descMap);
    return { value: a.value, atoms: [a] };
  }
  if (cond.not) {
    const r = evalCondition(cond.not, facts, descMap);
    const value = r.value === 'T' ? 'F' : r.value === 'F' ? 'T' : 'U';
    return { value, atoms: r.atoms, negated: true };
  }
  if (cond.all) {
    const atoms = [];
    let value = 'T';
    for (const sub of cond.all) {
      const r = evalCondition(sub, facts, descMap);
      atoms.push(...r.atoms);
      if (r.value === 'F') value = 'F';
      else if (r.value === 'U' && value === 'T') value = 'U';
    }
    return { value, atoms };
  }
  if (cond.any) {
    const atoms = [];
    let value = 'F';
    for (const sub of cond.any) {
      const r = evalCondition(sub, facts, descMap);
      atoms.push(...r.atoms);
      if (r.value === 'T') value = 'T';
      else if (r.value === 'U' && value === 'F') value = 'U';
    }
    return { value, atoms };
  }
  return { value: 'T', atoms: [] };
}

/* ---------- 单条规则评估 ---------- */
function evalRule(rule, facts, descMap) {
  const trig = evalCondition(rule.trigger, facts, descMap);
  const result = {
    id: rule.id,
    source: rule.source,
    text: rule.text,
    category: rule.category,
    deontic: rule.deontic,
    trigger: trig,
    exceptions: [],
    status: 'NOT_TRIGGERED',
    symbol: '',
    nlChain: [],
    missingFacts: [],
    remedy: rule.remedy || '',
    riskNote: rule.risk_note || '',
    consequenceNote: rule.consequence_note || ''
  };

  if (trig.value === 'F') {
    result.status = 'NOT_TRIGGERED';
    result.symbol = `⟦${rule.id}⟧ (${renderCond(rule.trigger, facts, descMap)}) ⇒ 不触发`;
    result.nlChain.push(`要件核对：本条不适用于当前事实（${trig.atoms.filter(a => a.value === 'F').map(a => `「${a.label}」不成立`).join('；') || '要件不满足'}）。`);
    return result;
  }

  // 例外（defeater）核查
  let defeated = null;
  let exceptionPending = false;
  for (const ex of (rule.exceptions || [])) {
    const exEval = evalCondition({ all: ex.all }, facts, descMap);
    result.exceptions.push({ id: ex.id, source: ex.source, desc: ex.desc || '', eval: exEval });
    if (exEval.value === 'T') { defeated = ex; break; }
    if (exEval.value === 'U') exceptionPending = true;
  }

  if (defeated) {
    result.status = 'DEFEATED';
    result.symbol = `⟦${rule.id}⟧ (${renderCond(rule.trigger, facts, descMap)}) ⇒⋯ ⊣[${defeated.source}] ${rule.deontic.symbol}`;
    result.nlChain.push(`要件核对：${trig.atoms.map(a => `「${a.label}」${valueTag(a.value)}`).join('，')}——表面成立。`);
    result.nlChain.push(`例外核查：成立例外【${defeated.source}】${defeated.desc ? `（${defeated.desc}）` : ''}。`);
    result.nlChain.push(`结论：义务被例外推翻（defeated），不产生${rule.deontic.act}义务。`);
    return result;
  }

  if (trig.value === 'U') {
    result.status = 'POSSIBLE';
    const unknown = uniqueUnknown(trig.atoms);
    result.missingFacts = unknown;
    result.symbol = `⟦${rule.id}⟧ (${renderCond(rule.trigger, facts, descMap)}) ⇒? ${rule.deontic.symbol}   [证据不足: ${unknown.map(f => f.fact).join(', ')}]`;
    result.nlChain.push(`要件核对：${trig.atoms.map(a => `「${a.label}」${valueTag(a.value)}`).join('，')}。`);
    result.nlChain.push(`结论：证据不足（三值判定 U）。补齐以下事实后方可判定：${unknown.map(f => `「${f.label}」`).join('、')}。`);
    return result;
  }

  // 触发成立，核查例外是否待定
  if (exceptionPending) {
    result.status = 'DEFENSIBLE';
    const pending = [];
    for (const ex of result.exceptions) {
      if (ex.eval.value === 'U') pending.push(...uniqueUnknown(ex.eval.atoms));
    }
    result.missingFacts = uniqueUnknown(pending);
    result.symbol = `⟦${rule.id}⟧ (${renderCond(rule.trigger, facts, descMap)}) ⇒_dft ${rule.deontic.symbol}   [待排除例外: ${pending.map(f => f.fact).join(', ')}]`;
    result.nlChain.push(`要件核对：${trig.atoms.map(a => `「${a.label}」${valueTag(a.value)}`).join('，')}——成立。`);
    result.nlChain.push(`例外核查：存在待查证例外【${result.exceptions.find(e => e.eval.value === 'U').source}】，暂按可废止成立处理。`);
  } else {
    result.symbol = `⟦${rule.id}⟧ (${renderCond(rule.trigger, facts, descMap)}) ⇒ ${rule.deontic.symbol}`;
    result.nlChain.push(`要件核对：${trig.atoms.map(a => `「${a.label}」${valueTag(a.value)}`).join('，')}——全部成立。`);
    result.nlChain.push(`例外核查：${result.exceptions.length ? '例外情形均不成立。' : '本条无例外规定。'}`);
  }

  // 违约/履行核查
  if (rule.category === 'prohibition') {
    // 禁令类规则：触发要件成立即构成违反（无需履行核查）。
    // 已承担赔偿后果（如已付 2N）不改变"禁令曾被违反"的定性。
    result.status = exceptionPending ? 'DEFENSIBLE' : 'VIOLATION';
    result.nlChain.push(`禁令核查：${result.deontic.bearer}实施了被禁止行为（${result.deontic.act}），要件成立。`);
    result.nlChain.push(`判定：违反禁止性规定（VIOLATION）。`);
    if (!result.symbol.includes('⇒')) result.symbol += ` ⇒ ${rule.deontic.symbol}`;
  } else if (rule.category === 'obligation' && rule.breach) {
    const br = evalCondition(rule.breach, facts, descMap);
    result.breach = br;
    if (br.value === 'F') {
      result.status = exceptionPending ? 'DEFENSIBLE' : 'VIOLATION';
      result.nlChain.push(`履行核查：「${br.atoms.filter(a => a.value === 'F').map(a => a.label).join('、') || '义务'}」未履行。`);
      result.nlChain.push(`判定：${result.status === 'VIOLATION' ? '已违反（VIOLATION）' : '疑似违反（待例外查证）'}。`);
    } else if (br.value === 'U') {
      result.status = exceptionPending ? 'DEFENSIBLE' : 'RISK';
      const brUnknown = uniqueUnknown(br.atoms);
      result.missingFacts = brUnknown;
      result.nlChain.push('履行核查：履行情况未知。');
      result.nlChain.push(`判定：存在法律风险（待查证履行情况）。需补齐：${brUnknown.map(f => `「${f.label}」`).join('、')}。`);
    } else {
      result.status = 'COMPLIANT';
      result.nlChain.push('履行核查：义务已履行。');
      result.nlChain.push('判定：合规（COMPLIANT）。');
    }
    if (!result.symbol.includes('⇒')) result.symbol += ` ⇒ ${rule.deontic.symbol}`;
  } else if (rule.category === 'permission') {
    result.status = exceptionPending ? 'DEFENSIBLE' : 'PERMITTED';
    result.nlChain.push(`判定：许可成立（PERMITTED）——${result.deontic.bearer}有权${result.deontic.act}。`);
    if (result.consequenceNote) result.nlChain.push(`法律衔接：${result.consequenceNote}`);
  }

  return result;
}

function renderCond(cond, facts, descMap) {
  if (!cond) return '⊤';
  if (cond.fact) return evalAtom(cond, facts, descMap).symbol;
  if (cond.not) return `¬(${renderCond(cond.not, facts, descMap)})`;
  if (cond.all) return cond.all.map(c => renderCond(c, facts, descMap)).join(' ∧ ');
  if (cond.any) return '(' + cond.any.map(c => renderCond(c, facts, descMap)).join(' ∨ ') + ')';
  return '⊤';
}

function valueTag(v) {
  return v === 'T' ? '✔ 成立' : v === 'F' ? '✘ 不成立' : '? 未知';
}

function uniqueUnknown(atoms) {
  const seen = new Map();
  for (const a of atoms) {
    if (a.value === 'U' && !seen.has(a.fact)) {
      seen.set(a.fact, { fact: a.fact, label: a.label, question: a.label.replace(/（.*）/, '') + '？请补充。' });
    }
  }
  return [...seen.values()];
}

/* ---------- 生成总报告 ---------- */
function analyze(facts, ruleSet) {
  const rs = loadRuleSet(ruleSet);
  const results = rs.rules.map(r => evalRule(r, facts, rs.descMap));
  const byStatus = {};
  for (const r of results) (byStatus[r.status] = byStatus[r.status] || []).push(r.id);

  const violations = results.filter(r => r.status === 'VIOLATION');
  const risks = results.filter(r => r.status === 'RISK' || r.status === 'DEFENSIBLE');
  const possible = results.filter(r => r.status === 'POSSIBLE');
  const missing = [];
  const seenF = new Set();
  for (const r of [...possible, ...risks]) {
    for (const m of r.missingFacts) {
      if (!seenF.has(m.fact)) { seenF.add(m.fact); missing.push(m); }
    }
  }

  // 总体三值判定
  let verdict, verdictSymbol;
  if (violations.length > 0) {
    verdict = '存在违法行为';
    verdictSymbol = '⊥ (规范被违反)';
  } else if (possible.length > 0) {
    verdict = '证据不足，待补事实';
    verdictSymbol = 'U (三值判定：证据不足)';
  } else if (risks.length > 0) {
    verdict = '存在法律风险';
    verdictSymbol = '◇ (风险存在)';
  } else {
    verdict = '未发现违反本规则库情形';
    verdictSymbol = '⊤ (当前规则库下合规)';
  }

  return {
    engine: 'LexChain v0.1 (deontic + three-valued + defeasible)',
    rulebase: rs.meta.name,
    verdict, verdict_symbol: verdictSymbol,
    status_counts: byStatus,
    rules: results,
    missing_facts: missing,
    disclaimer: '本结果由确定性规则引擎生成，仅为法律风险分析参考，不构成正式法律意见。条文以官方最新文本为准，重大事项请咨询执业律师。'
  };
}

window.LexChainBrowserEngine = { loadRuleSet, evalAtom, evalCondition, evalRule, analyze };
