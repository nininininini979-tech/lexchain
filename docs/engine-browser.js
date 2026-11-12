'use strict';
/** Deterministic K3 conditions, local exceptions and O/F/P labels.
 * No modal proof search, global priorities or cross-rule closure.
 * Missing evidence remains U; invalid data is rejected without coercion.
 */
function loadRuleSet(raw) {
  raw = raw || window.LEXCHAIN_RULESET;
  if (!raw) throw new Error('规则库尚未加载');
  const descMap = {};
  const errors = validateRuleSet(raw);
  if (errors.length) throw validationError('规则库无效', errors, 'INVALID_RULESET');
  for (const f of raw.facts) descMap[f.key] = f;
  return { meta: raw.meta, facts: raw.facts, rules: raw.rules, descMap };
}
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const isRecord = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const CATEGORIES = { obligation: 'OBLIGATION', prohibition: 'FORBIDDEN', permission: 'PERMISSION' };
const NUMBER_OPS = ['==', '>', '>=', '<', '<='];
function validationError(message, errors, code = 'INVALID_FACTS') {
  const e = new Error(message + '：' + errors.join('；'));
  e.code = code; e.details = errors;
  return e;
}
function validateFacts(facts, definitions) {
  if (!isRecord(facts)) return ['facts 必须是对象'];
  const defs = Array.isArray(definitions) ? Object.fromEntries(definitions.map(f => [f.key, f])) : definitions;
  const errors = [];
  for (const [key, value] of Object.entries(facts)) {
    if (!own(defs, key)) { errors.push(`未知事实字段 ${key}`); continue; }
    const def = defs[key];
    if (value === null) continue;
    if (def.type === 'bool') {
      if (typeof value !== 'boolean') errors.push(`${key} 只接受 true/false/null`);
    } else if (def.type === 'number') {
      if (typeof value !== 'number' || !Number.isFinite(value)) errors.push(`${key} 必须是有限数值或 null`);
      else {
        if (def.minimum !== undefined && value < def.minimum) errors.push(`${key} 不得小于 ${def.minimum}`);
        if (def.maximum !== undefined && value > def.maximum) errors.push(`${key} 不得大于 ${def.maximum}`);
        if (def.integer && !Number.isInteger(value)) errors.push(`${key} 必须是整数`);
      }
    } else errors.push(`${key} 的定义类型不受支持`);
  }
  return errors;
}
function assertFacts(facts, definitions) {
  const errors = validateFacts(facts, definitions);
  if (errors.length) throw validationError('事实校验失败', errors);
}
// An unconditional rule requires an explicit constant, never a missing condition.
function validateCondition(cond, defs, at = 'condition', depth = 0, budget = { nodes: 0 }) {
  if (depth > 64 || ++budget.nodes > 4096) return [`${at} 条件树过深或过大`];
  if (!isRecord(cond)) return [`${at} 必须是条件对象；无条件成立请明确使用 {constant:true}`];
  const forms = ['fact', 'not', 'all', 'any', 'constant'].filter(k => own(cond, k));
  if (forms.length !== 1) return [`${at} 必须且只能包含一种条件形式`];
  const form = forms[0], allowed = form === 'fact' ? ['fact', 'eq', 'op', 'value'] : [form];
  const errors = Object.keys(cond).filter(k => !allowed.includes(k)).map(k => `${at} 不支持属性 ${k}`);
  if (form === 'constant') {
    if (typeof cond.constant !== 'boolean') errors.push(`${at}.constant 必须是布尔值`);
  } else if (form === 'not') errors.push(...validateCondition(cond.not, defs, at + '.not', depth + 1, budget));
  else if (form === 'all' || form === 'any') {
    if (!Array.isArray(cond[form]) || !cond[form].length) errors.push(`${at}.${form} 不能为空；请使用显式 constant`);
    else cond[form].forEach((c, i) => errors.push(...validateCondition(c, defs, `${at}.${form}[${i}]`, depth + 1, budget)));
  } else {
    if (typeof cond.fact !== 'string' || !own(defs, cond.fact)) return [...errors, `${at} 未知事实 ${cond.fact}`];
    if (own(cond, 'eq') && (own(cond, 'value') || own(cond, 'op'))) errors.push(`${at} eq 与 op/value 不得混用`);
    const target = own(cond, 'eq') ? cond.eq : own(cond, 'value') ? cond.value : true;
    if (defs[cond.fact].type === 'bool') {
      if (typeof target !== 'boolean' || own(cond, 'op')) errors.push(`${at} 布尔原子只允许 eq/value 布尔值`);
    } else {
      if (!own(cond, 'eq') && !own(cond, 'value')) errors.push(`${at} 数值原子缺少比较值`);
      if (typeof target !== 'number' || !Number.isFinite(target)) errors.push(`${at} 比较值必须是有限数值`);
      if (own(cond, 'op') && !NUMBER_OPS.includes(cond.op)) errors.push(`${at} 非法比较运算符 ${cond.op}`);
    }
  }
  return errors;
}
function validateRule(rule, defs) {
  if (!isRecord(rule)) return ['规则必须是对象'];
  const errors = [];
  for (const k of ['id', 'source', 'text']) if (typeof rule[k] !== 'string' || !rule[k].trim()) errors.push(`规则缺少 ${k}`);
  if (!own(CATEGORIES, rule.category)) errors.push(`${rule.id} 非法 category`);
  const d = rule.deontic;
  if (!isRecord(d) || d.operator !== CATEGORIES[rule.category] || ['bearer', 'act', 'symbol'].some(k => typeof d[k] !== 'string' || !d[k].trim())) errors.push(`${rule.id} deontic 不完整或与 category 不一致`);
  errors.push(...validateCondition(rule.trigger, defs, `${rule.id}.trigger`));
  if (rule.category === 'obligation' || own(rule, 'breach')) errors.push(...validateCondition(rule.breach, defs, `${rule.id}.breach`));
  if (!Array.isArray(rule.exceptions)) errors.push(`${rule.id}.exceptions 必须是数组`);
  else {
    const ids = new Set();
    for (const ex of rule.exceptions) {
      if (!isRecord(ex) || typeof ex.id !== 'string' || !ex.id || typeof ex.source !== 'string' || !ex.source) { errors.push(`${rule.id} 例外缺少 id/source`); continue; }
      if (ids.has(ex.id)) errors.push(`${rule.id} 重复例外 id ${ex.id}`);
      ids.add(ex.id);
      if (Object.keys(ex).some(k => !['id', 'source', 'desc', 'all'].includes(k))) errors.push(`${rule.id}.${ex.id} 例外只支持 all 条件数组`);
      errors.push(...validateCondition({ all: ex.all }, defs, `${rule.id}.${ex.id}`));
    }
  }
  return errors;
}
function validateRuleSet(raw) {
  if (!isRecord(raw) || !Array.isArray(raw.facts) || !Array.isArray(raw.rules)) return ['规则库必须有 facts/rules 数组'];
  const errors = [], defs = Object.create(null), ids = new Set();
  for (const f of raw.facts) {
    if (!isRecord(f) || typeof f.key !== 'string' || !/^[a-z][a-z0-9_]*$/.test(f.key) || !['bool', 'number'].includes(f.type) || typeof f.label !== 'string') { errors.push('事实定义格式错误'); continue; }
    if (own(defs, f.key)) errors.push(`重复事实 key ${f.key}`);
    for (const k of ['minimum', 'maximum']) if (own(f, k) && (typeof f[k] !== 'number' || !Number.isFinite(f[k]))) errors.push(`${f.key}.${k} 必须是有限数值`);
    if (f.minimum > f.maximum) errors.push(`${f.key} 数值范围颠倒`);
    if (own(f, 'integer') && typeof f.integer !== 'boolean') errors.push(`${f.key}.integer 必须是布尔值`);
    defs[f.key] = f;
  }
  for (const rule of raw.rules) {
    if (rule && ids.has(rule.id)) errors.push(`重复规则 id ${rule.id}`);
    if (rule) ids.add(rule.id);
    errors.push(...validateRule(rule, defs));
  }
  return errors;
}
function evalAtom(atom, facts, defs) {
  const errors = validateCondition(atom, defs);
  if (errors.length) throw validationError('原子条件无效', errors, 'INVALID_CONDITION');
  if (!own(atom, 'fact')) throw validationError('原子条件无效', ['缺 fact'], 'INVALID_CONDITION');
  const key = atom.fact, def = defs[key], v = facts[key];
  if (own(facts, key)) assertFacts({ [key]: v }, defs);
  const unknown = !own(facts, key) || v === null;
  const target = own(atom, 'eq') ? atom.eq : own(atom, 'value') ? atom.value : true;
  const op = atom.op || '==';
  let value = 'U';
  if (!unknown) value = (op === '>' ? v > target : op === '>=' ? v >= target : op === '<' ? v < target : op === '<=' ? v <= target : v === target) ? 'T' : 'F';
  const negate = def.type === 'bool' && target === false;
  const name = key.split('_').map(s => s[0].toUpperCase() + s.slice(1)).join('');
  const symbol = def.type === 'number' ? `${key.replace(/_/g, ' ')}${op}${target}` : (negate ? '¬' : '') + name;
  return { fact: key, label: def.label, group: def.group || '', symbol, negate, expected: target, actual: unknown ? null : v, value };
}
function evalCondition(cond, facts, defs) {
  const errors = validateCondition(cond, defs);
  if (errors.length) throw validationError('条件无效', errors, 'INVALID_CONDITION');
  function visit(node) {
    if (own(node, 'constant')) return { value: node.constant ? 'T' : 'F', atoms: [] };
    if (own(node, 'fact')) { const a = evalAtom(node, facts, defs); return { value: a.value, atoms: [a] }; }
    if (own(node, 'not')) { const r = visit(node.not); return { value: r.value === 'T' ? 'F' : r.value === 'F' ? 'T' : 'U', atoms: r.atoms, negated: true }; }
    const children = (node.all || node.any).map(visit), values = children.map(c => c.value);
    const value = node.all ? (values.includes('F') ? 'F' : values.includes('U') ? 'U' : 'T') : (values.includes('T') ? 'T' : values.includes('U') ? 'U' : 'F');
    return { value, atoms: children.flatMap(c => c.atoms) };
  }
  return visit(cond);
}
function unknownFacts(atoms, phase) {
  return atoms.filter(a => a.value === 'U').map(a => ({ fact: a.fact, label: a.label, question: a.label + '？请补充。', reasons: [phase] }));
}
function mergeMissing(items) {
  const seen = new Map();
  for (const item of items) {
    if (!seen.has(item.fact)) seen.set(item.fact, { ...item, reasons: [] });
    const target = seen.get(item.fact);
    target.reasons = [...new Set([...target.reasons, ...(item.reasons || [])])];
  }
  return [...seen.values()];
}
function renderCond(cond, facts, defs) {
  if (own(cond, 'constant')) return cond.constant ? '⊤' : '⊥';
  if (own(cond, 'fact')) return evalAtom(cond, facts, defs).symbol;
  if (own(cond, 'not')) return `¬(${renderCond(cond.not, facts, defs)})`;
  return '(' + (cond.all || cond.any).map(c => renderCond(c, facts, defs)).join(cond.all ? ' ∧ ' : ' ∨ ') + ')';
}
function valueTag(v) { return v === 'T' ? '成立' : v === 'F' ? '不成立' : '未知'; }
function evalRule(rule, facts, defs) {
  const errors = validateRule(rule, defs);
  if (errors.length) throw validationError('规则无效', errors, 'INVALID_RULESET');
  assertFacts(facts, defs);
  const trigger = evalCondition(rule.trigger, facts, defs);
  const exceptions = rule.exceptions.map(ex => ({ id: ex.id, source: ex.source, desc: ex.desc || '', eval: evalCondition({ all: ex.all }, facts, defs) }));
  const exceptionValue = exceptions.some(ex => ex.eval.value === 'T') ? 'T' : exceptions.some(ex => ex.eval.value === 'U') ? 'U' : 'F';
  const breach = rule.category === 'obligation' ? evalCondition(rule.breach, facts, defs) : null;
  const applicability = trigger.value === 'F' ? 'NOT_TRIGGERED' : exceptionValue === 'T' ? 'BLOCKED' : trigger.value === 'U' || exceptionValue === 'U' ? 'PENDING' : 'APPLICABLE';
  const status = trigger.value === 'F' ? 'NOT_TRIGGERED' : exceptionValue === 'T' ? 'DEFEATED' : trigger.value === 'U' ? 'POSSIBLE' : exceptionValue === 'U' ? 'DEFENSIBLE' : rule.category === 'permission' ? 'PERMITTED' : rule.category === 'prohibition' ? 'VIOLATION' : breach.value === 'T' ? 'COMPLIANT' : breach.value === 'F' ? 'VIOLATION' : 'RISK';
  const needed = applicability !== 'NOT_TRIGGERED' && applicability !== 'BLOCKED';
  const missingFactsByPhase = {
    trigger: needed && trigger.value === 'U' ? mergeMissing(unknownFacts(trigger.atoms, 'trigger')) : [],
    exceptions: needed && exceptionValue === 'U' ? mergeMissing(exceptions.flatMap(ex => ex.eval.value === 'U' ? unknownFacts(ex.eval.atoms, `exception:${ex.id}`) : [])) : [],
    fulfillment: needed && trigger.value === 'T' && breach && breach.value === 'U' ? mergeMissing(unknownFacts(breach.atoms, 'fulfillment')) : []
  };
  const result = {
    id: rule.id, source: rule.source, text: rule.text, category: rule.category, deontic: rule.deontic,
    trigger, exceptions, status, dimensions: { trigger: trigger.value, exception: exceptionValue, fulfillment: breach ? breach.value : 'NOT_APPLICABLE', applicability },
    missingFactsByPhase, missingFacts: mergeMissing(Object.values(missingFactsByPhase).flat()),
    remedy: rule.remedy || '', riskNote: rule.risk_note || '', consequenceNote: rule.consequence_note || '',
    symbol: `⟦${rule.id}⟧ ${renderCond(rule.trigger, facts, defs)} → [${status}] ${rule.deontic.symbol}`,
    nlChain: [`触发条件：${valueTag(trigger.value)}。`, `例外条件：${exceptions.length ? valueTag(exceptionValue) : '本规则无例外'}。`]
  };
  if (breach) { result.breach = breach; result.nlChain.push(`履行条件：${valueTag(breach.value)}（独立于规则适用性）。`); }
  const conclusions = {
    NOT_TRIGGERED: '本规则触发条件不满足；不由本规则作出规范结论。',
    DEFEATED: '本规则被成立的例外阻断；不推出相反结论，也不排除其他规则产生义务。',
    POSSIBLE: '触发条件待核实，尚不能确认本规则适用。',
    DEFENSIBLE: breach && breach.value === 'T' ? '履行条件已满足，但例外尚待核实；保留适用性待查状态。' : '例外尚待核实；规范适用及违反/许可结论均未确定。',
    PERMITTED: '按当前事实与本规则，许可条件满足；不表示已经行使该许可。',
    COMPLIANT: '按当前事实，本规则适用且履行条件满足；不证明其他时期或其他规则均合规。',
    VIOLATION: '按当前事实，符合本规则的违反条件。',
    RISK: '本规则适用，履行情况尚待核实。'
  };
  result.nlChain.push(`判定 [${status}]：${conclusions[status]}`);
  if (result.missingFacts.length) result.nlChain.push('待核实：' + result.missingFacts.map(f => f.label).join('、') + '。');
  if (status === 'PERMITTED' && result.consequenceNote) result.nlChain.push(`法律衔接：${result.consequenceNote}`);
  return result;
}
function analyze(facts, ruleSetPath) {
  const rs = loadRuleSet(ruleSetPath);
  assertFacts(facts, rs.descMap);
  const results = rs.rules.map(r => evalRule(r, facts, rs.descMap)), byStatus = {};
  for (const r of results) (byStatus[r.status] = byStatus[r.status] || []).push(r.id);
  let verdict, verdictSymbol;
  if (byStatus.VIOLATION) { verdict = '按当前事实，存在规则违反'; verdictSymbol = 'VIOLATION（条件规则结果）'; }
  else if (byStatus.POSSIBLE) { verdict = '证据不足，待补事实'; verdictSymbol = 'POSSIBLE（触发待查）'; }
  else if (byStatus.RISK || byStatus.DEFENSIBLE) { verdict = '存在法律风险'; verdictSymbol = 'PENDING（履行或例外待查）'; }
  else { verdict = '未发现违反本规则库情形'; verdictSymbol = '未发现违反 ≠ 全面合规证明'; }
  return {
    engine: 'LexChain v0.2（K3 条件求值＋局部例外）', status_policy: '2026-11-11', rulebase: rs.meta.name,
    verdict, verdict_symbol: verdictSymbol, status_counts: byStatus, rules: results,
    missing_facts: mergeMissing(results.flatMap(r => r.missingFacts)),
    disclaimer: '本结果是给定事实与当前规则库下的条件计算，仅为法律风险分析参考，不构成正式法律意见或事实认定。规则的法律效度仍需独立审核。'
  };
}
window.LexChainBrowserEngine = { loadRuleSet, validateFacts, assertFacts, validateCondition, validateRule, validateRuleSet, validationError, evalAtom, evalCondition, evalRule, analyze };
