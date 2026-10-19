'use strict';
(function installWorkerIntake() {
  const $ = id => document.getElementById(id);
  const opinion = () => window.LexChainOpinion;
  let caseFile = freshCase();
  let step = 0;
  let analysis = null;
  let analyzing = false;

  function freshCase() {
    return { issue: '', answers: {}, latePayment: 'unknown', paymentDue: 'unknown',
      location: '', description: '', stillWorking: 'unknown', wageRows: [{ month: '', due: '', paid: '' }], evidence: {}, expertOverrides: {}, expertUnknowns: [] };
  }
  function clearExpertFact(key) {
    delete caseFile.expertOverrides[key];
    caseFile.expertUnknowns = caseFile.expertUnknowns.filter(item => item !== key);
  }
  function updateExpertFacts(rawFacts) {
    const previous = opinion().buildFacts(caseFile);
    const confirmed = cleanFacts(rawFacts);
    // Only facts explicitly cleared from an existing value become unknown.
    // The other empty controls must not overwrite unrelated intake answers.
    caseFile.expertUnknowns = [...new Set([...caseFile.expertUnknowns,
      ...Object.keys(previous).filter(key => previous[key] != null && !(key in confirmed))])]
      .filter(key => !(key in confirmed));
    caseFile.expertOverrides = confirmed;
  }
  function escape(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function triSelect(key, value, label, hint) {
    return `<label for="answer-${escape(key)}">${escape(label)}</label><select id="answer-${escape(key)}" data-fact-key="${escape(key)}"><option value="unknown" ${value == null ? 'selected' : ''}>不清楚 / 暂不回答</option><option value="yes" ${value === true ? 'selected' : ''}>是</option><option value="no" ${value === false ? 'selected' : ''}>否</option></select>${hint ? `<small class="field-hint">${escape(hint)}</small>` : ''}`;
  }
  function progress() {
    const labels = ['问题', '事实', '证据', '意见'];
    $('workerProgress').innerHTML = labels.map((label, i) => `<span class="${i === step ? 'current' : i < step ? 'complete' : ''}" ${i === step ? 'aria-current="step"' : ''}>${label}</span>`).join('');
  }
  function issueForm() {
    const issues = opinion().ISSUES;
    return `<p class="worker-lead">选择最接近的情况。不确定时可选「其他」，不会因为选项自动认定事实。</p><div class="issue-grid">${issues.map(item => `<button type="button" class="issue-choice ${caseFile.issue === item.key ? 'selected' : ''}" aria-pressed="${caseFile.issue === item.key}" data-issue="${escape(item.key)}"><b>${escape(item.label)}</b><small>${escape(item.hint)}</small></button>`).join('')}</div>`;
  }
  function wageRowsForm() {
    return `<h3 class="form-subhead">按月填写工资</h3><p class="field-hint">不确定的金额可留空；每个月分别核算，不会把多付月份抵扣欠付月份。</p><div class="worker-wage-head"><span>工资所属月份</span><span>应发（元）</span><span>实发（元）</span><span></span></div><div id="workerWageRows">${caseFile.wageRows.map((row, index) => `<div class="worker-wage-row"><label class="wage-month"><span>工资所属月份</span><input data-wage-field="month" data-row-index="${index}" type="month" value="${escape(row.month)}" aria-label="第 ${index + 1} 个月份"></label><label><span>应发（元）</span><input data-wage-field="due" data-row-index="${index}" type="number" min="0" step="0.01" value="${escape(row.due)}" placeholder="未知" aria-label="${escape(row.month || '第 ' + (index + 1) + ' 个月')}应发金额"></label><label><span>实发（元）</span><input data-wage-field="paid" data-row-index="${index}" type="number" min="0" step="0.01" value="${escape(row.paid)}" placeholder="未知" aria-label="${escape(row.month || '第 ' + (index + 1) + ' 个月')}实发金额"></label><button class="icon-btn" type="button" data-remove-row="${index}" aria-label="删除第 ${index + 1} 个月">×</button></div>`).join('')}</div><button type="button" class="worker-link" id="addWageRow">＋ 新增月份</button>`;
  }
  function factsForm() {
    if (!caseFile.issue) return '<p class="worker-lead">请先选择一个争议类型。</p>';
    const effectiveFacts = opinion().buildFacts(caseFile);
    const stillWorking = effectiveFacts.worker_separated === true ? 'no' : effectiveFacts.worker_separated === false ? 'yes' : 'unknown';
    const questions = opinion().questionsFor(caseFile.issue).map(q => triSelect(q.key, effectiveFacts[q.key], q.label, q.hint)).join('');
    const duration = `<label for="monthsEmployed">实际在该单位工作时长（月，可留空）</label><input id="monthsEmployed" type="number" min="0" step="0.1" value="${escape(effectiveFacts.months_employed)}" placeholder="不清楚可留空"><label for="workerStillWorking">目前是否还在该单位工作？</label><select id="workerStillWorking"><option value="unknown" ${stillWorking === 'unknown' ? 'selected' : ''}>不清楚 / 暂不回答</option><option value="yes" ${stillWorking === 'yes' ? 'selected' : ''}>还在工作</option><option value="no" ${stillWorking === 'no' ? 'selected' : ''}>已经离开</option></select>`;
    const overtime = caseFile.issue === 'overtime' ? ['workday', 'weekend', 'holiday'].map((type, index) => `<label for="overtime-${type}">${['工作日延时', '休息日', '法定节假日'][index]}加班小时数（可留空）</label><input id="overtime-${type}" data-number-fact="overtime_${type}_hours" type="number" min="0" step="0.1" value="${escape(effectiveFacts['overtime_' + type + '_hours'])}" placeholder="不清楚可留空">`).join('') : '';
    const wageQuestions = caseFile.issue === 'wage_arrears'
      ? triSelect('latePayment', caseFile.latePayment === 'yes' ? true : caseFile.latePayment === 'no' ? false : null, '是否有工资超过约定日期仍未足额到账？') +
        triSelect('paymentDue', caseFile.paymentDue === 'yes' ? true : caseFile.paymentDue === 'no' ? false : null, '相关工资的约定发薪日期是否已经过去？') : '';
    return `<div class="worker-form"><p class="worker-lead">只填写你目前知道的情况；「不清楚」会保留为未知，不会被当作「否」。</p>${Object.keys(caseFile.expertOverrides).length ? '<p class="coverage-note">已带入专业面板修正。修改某个回答后，将以新回答重新计算；其他专业事实继续保留。</p>' : ''}${questions}${wageQuestions}${duration}${overtime}<label for="workerLocation">实际工作地点（可不填）</label><input id="workerLocation" value="${escape(caseFile.location)}" placeholder="例如：广东省东莞市"><label for="workerDescription">补充经过（仅在本机页面暂存）</label><textarea id="workerDescription" placeholder="可写发生时间、单位如何回复、你希望解决什么。请勿填写身份证号或完整银行卡号。">${escape(caseFile.description)}</textarea>${caseFile.issue === 'wage_arrears' ? wageRowsForm() : ''}</div>`;
  }
  function evidenceForm() {
    const catalog = opinion().evidenceFor(caseFile.issue);
    return `<p class="worker-lead">不需要上传。逐项标记现有材料，结果会告诉你哪些最值得优先整理。</p><div class="worker-evidence">${catalog.map(item => `<div class="evidence-row"><div><b>${escape(item.label)}</b><small>${escape(item.purpose)}</small></div><select data-evidence-key="${escape(item.key)}" aria-label="${escape(item.label)}状态"><option value="unknown" ${!caseFile.evidence[item.key] || caseFile.evidence[item.key] === 'unknown' ? 'selected' : ''}>待确认</option><option value="has" ${caseFile.evidence[item.key] === 'has' ? 'selected' : ''}>已有</option><option value="partial" ${caseFile.evidence[item.key] === 'partial' ? 'selected' : ''}>部分有</option><option value="missing" ${caseFile.evidence[item.key] === 'missing' ? 'selected' : ''}>没有</option></select></div>`).join('')}</div><p class="redact-note">请勿在材料中公开身份证号、完整银行卡号或住址。此工具不上传文件，也不会替你提交投诉或仲裁。</p>`;
  }
  function readFacts(validate) {
    if (!$('workerDescription')) return '';
    analysis = null;
    const previous = opinion().buildFacts(caseFile);
    const answerEls = document.querySelectorAll('[data-fact-key]');
    answerEls.forEach(el => {
      if (el.dataset.factKey === 'latePayment') caseFile.latePayment = el.value === 'unknown' ? 'unknown' : el.value === 'yes' ? 'yes' : 'no';
      else if (el.dataset.factKey === 'paymentDue') caseFile.paymentDue = el.value === 'unknown' ? 'unknown' : el.value === 'yes' ? 'yes' : 'no';
      else {
        const value = el.value === 'unknown' ? null : el.value === 'yes';
        if (value !== (previous[el.dataset.factKey] ?? null)) clearExpertFact(el.dataset.factKey);
        caseFile.answers[el.dataset.factKey] = value;
      }
    });
    if ($('monthsEmployed')) {
      const raw = $('monthsEmployed').value;
      const value = raw === '' ? null : Number(raw);
      if (validate && value !== null && (!Number.isFinite(value) || value < 0)) return '工作时长请填写非负数，或留空。';
      if (value !== (previous.months_employed ?? null)) clearExpertFact('months_employed');
      caseFile.answers.months_employed = value;
    }
    document.querySelectorAll('[data-number-fact]').forEach(el => {
      const value = el.value === '' ? null : Number(el.value);
      if (value !== (previous[el.dataset.numberFact] ?? null)) clearExpertFact(el.dataset.numberFact);
      caseFile.answers[el.dataset.numberFact] = value;
    });
    if ($('workerStillWorking')) {
      const value = $('workerStillWorking').value === 'unknown' ? null : $('workerStillWorking').value === 'no';
      if (value !== (previous.worker_separated ?? null)) clearExpertFact('worker_separated');
      caseFile.stillWorking = $('workerStillWorking').value;
    }
    if ($('workerLocation')) caseFile.location = $('workerLocation').value.trim();
    if ($('workerDescription')) caseFile.description = $('workerDescription').value.trim();
    if ($('workerWageRows')) {
      caseFile.wageRows = [...document.querySelectorAll('.worker-wage-row')].map(row => ({
        month: row.querySelector('[data-wage-field="month"]').value,
        due: row.querySelector('[data-wage-field="due"]').value,
        paid: row.querySelector('[data-wage-field="paid"]').value
      }));
    }
    if (validate && caseFile.issue === 'wage_arrears') {
      const result = opinion().calculateWageClaims(caseFile);
      if (result.errors.length) return result.errors.join(' ');
    }
    return '';
  }
  function collectEvidence() {
    document.querySelectorAll('[data-evidence-key]').forEach(el => { caseFile.evidence[el.dataset.evidenceKey] = el.value; });
  }
  function factList(items) {
    return items && items.length ? `<ul>${items.map(item => `<li>${escape(item.label)}${item.value === undefined ? '' : '：' + escape(item.value === true ? '是' : item.value === false ? '否' : item.value)} <small>（${escape(item.source || '用户自述，待核实')}）</small></li>`).join('')}</ul>` : '<p>尚无已确认事实；请补充或保留为未知。</p>';
  }
  function opinionView(data) {
    if (!data || !data.report) return '<p>尚未生成意见。</p>';
    const result = opinion().buildOpinion({ caseData: caseFile, facts: data.facts_used || {}, report: data.report, factDefinitions: SCHEMA.facts });
    const knownRules = result.legalBasis.map(rule => `<li><b>${escape(rule.source)}</b> ${escape(rule.text)}<small class="rule-caveat">${escape(rule.condition)}</small></li>`).join('');
    const pendingRules = result.pendingLegalBasis.map(rule => `<li><b>${escape(rule.source)}</b><small>尚未匹配；待确认：${escape((rule.missingFacts || []).map(x => x.label).join('、') || '进一步事实')}。不会据此认定成立。</small></li>`).join('');
    const claims = result.claims.length ? result.claims.map(claim => `<div class="claim-line"><div><b>${escape(claim.title)}</b><small class="formula">${escape(claim.formula)}</small><small>${escape(claim.assumptions)}</small></div><strong>¥${claim.amount.toFixed(2)}</strong></div>`).join('') : '<p>当前没有可计算的主张金额；其他项目不会猜算。</p>';
    const gaps = result.evidenceGaps.length ? `<ul>${result.evidenceGaps.map(item => `<li>${escape(item.label)}：${escape(item.reason)}</li>`).join('')}</ul>` : '<p>已标记的相关证据目前较完整；材料尚未由系统查看。</p>';
    const missing = result.missingFacts.length ? `<ul>${result.missingFacts.map(item => `<li>${escape(item.label)}</li>`).join('')}</ul>` : '<p>规则库未返回额外待确认事实。</p>';
    const defenses = `<ul>${result.counterarguments.map(text => `<li>${escape(text)}</li>`).join('')}</ul>`;
    const actions = result.actions.map(item => `<div class="action-item"><span>${escape(item.phase)}</span><div><b>${escape(item.title)}</b><p>${escape(item.body)}</p></div></div>`).join('');
    const rules = knownRules || pendingRules
      ? `${knownRules ? `<ul>${knownRules}</ul>` : '<p>暂无已匹配条文。</p>'}${pendingRules ? `<h4>待确认的相关条文</h4><ul>${pendingRules}</ul>` : ''}`
      : '<p>该类型尚无自动匹配的规则；当前仅整理事实、证据和求助路径。</p>';
    const bannerTone = result.conclusionLevel.includes('待核实') ? 'caution' : '';
    return `<div class="worker-opinion"><div class="opinion-banner ${bannerTone}"><small>${escape(result.conclusionLevel)} · ${escape(result.jurisdiction)}</small><h3>${escape(result.headline)}</h3><p>${escape(result.summary)}</p></div><p class="coverage-note">${escape(result.coverageNote)}</p><section class="opinion-section"><h3>可能主张与金额</h3>${claims}</section><section class="opinion-section"><h3>证据缺口</h3>${gaps}</section><section class="opinion-section"><h3>可选的下一步</h3><div class="action-list">${actions}</div></section><details class="opinion-details"><summary>查看相关法条与适用条件</summary><section class="opinion-section">${rules}</section></details><details class="opinion-details"><summary>查看事实依据、待确认项及其他解释</summary><section class="opinion-section"><h3>当前事实依据</h3>${factList(result.factsUsed.items)}<h4>补充经过（未自动提取或查证）</h4><p>${escape(caseFile.description || "未填写")}</p><p>工作地点：${escape(caseFile.location || "未填写")}；该地点未用于匹配地方规定。</p><h4>还需确认的事实</h4>${missing}<h4>需要核对的其他解释</h4>${defenses}</section></details><p class="worker-disclaimer">${escape(result.disclaimer)}</p><div class="result-actions"><button type="button" class="btn ghost" id="editWorkerCase">修改案件信息</button><button type="button" class="btn" id="openExpertReview">查看专业审阅</button><button type="button" class="worker-link" id="resetWorkerCase">清空本次资料</button></div></div>`;
  }
  function render() {
    document.body.classList.add('worker-mode');
    $('workerSurface').hidden = false;
    $('expertSurface').hidden = true;
    $('workerModeBtn').classList.add('active');
    $('expertModeBtn').classList.remove('active');
    $('workerModeBtn').setAttribute('aria-selected', 'true');
    $('expertModeBtn').setAttribute('aria-selected', 'false');
    $('workerMeta').textContent = `适用范围：中国大陆劳动争议 · ${SCHEMA && SCHEMA.rulebase ? SCHEMA.rulebase.name : '规则库'} · 地方口径及最新裁审指南未核验`;
    progress();
    $('workerError').hidden = true;
    $('workerContent').innerHTML = step === 0 ? issueForm() : step === 1 ? factsForm() : step === 2 ? evidenceForm() : opinionView(analysis);
    $('workerBackBtn').hidden = step === 0 || step === 3;
    $('workerNextBtn').hidden = step === 3;
    $('workerNextBtn').disabled = analyzing;
    $('workerBackBtn').disabled = analyzing;
    $('expertModeBtn').disabled = analyzing;
    $('workerNextBtn').textContent = analyzing ? '正在分析…' : step === 0 ? '开始整理' : step === 1 ? '继续核对证据' : '生成初步意见';
    $('workerBackBtn').onclick = back;
    $('workerNextBtn').onclick = next;
    document.querySelectorAll('[data-issue]').forEach(button => button.onclick = () => {
      caseFile.issue = button.dataset.issue;
      analysis = null;
      render();
    });
    if (step === 1 && caseFile.issue === 'wage_arrears') {
      $('workerWageRows').oninput = () => { clearExpertFact('wage_paid_on_time_full'); };
      ['answer-latePayment', 'answer-paymentDue'].forEach(id => $(id).onchange = () => { clearExpertFact('wage_paid_on_time_full'); });
      $('addWageRow').onclick = () => { readFacts(false); caseFile.wageRows.push({ month: '', due: '', paid: '' }); render(); };
      document.querySelectorAll('[data-remove-row]').forEach(button => button.onclick = () => {
        readFacts(false);
        const index = Number(button.dataset.removeRow);
        if (caseFile.wageRows.length > 1) caseFile.wageRows.splice(index, 1);
        render();
      });
    }
    if (step === 2) document.querySelectorAll('[data-evidence-key]').forEach(el => el.onchange = () => { caseFile.evidence[el.dataset.evidenceKey] = el.value; });
    if (step === 3) {
      $('resetWorkerCase').onclick = reset;
      $('editWorkerCase').onclick = () => { step = 1; render(); };
      $('openExpertReview').onclick = enterExpert;
    }
  }
  function fail(message) {
    $('workerError').textContent = message;
    $('workerError').hidden = false;
  }
  async function next() {
    if (step === 0) {
      if (!caseFile.issue) return fail('请先选择最接近的争议类型。');
      step = 1;
      render();
      return $('workerProgress').scrollIntoView({ block: 'start' });
    }
    if (step === 1) {
      const error = readFacts(true);
      if (error) return fail(error);
      step = 2;
      render();
      return $('workerProgress').scrollIntoView({ block: 'start' });
    }
    if (step === 2) {
      collectEvidence();
      analyzing = true;
      render();
      try {
        analysis = await LexChainRuntime.analyze({ facts: opinion().buildFacts(caseFile) });
        analyzing = false;
        step = 3;
        render();
        $('workerProgress').scrollIntoView({ block: 'start' });
      } catch (error) {
        analyzing = false;
        render();
        fail('分析暂时失败：' + error.message);
      }
    }
  }
  function back() {
    if (step === 1) readFacts(false);
    if (step === 2) collectEvidence();
    step = Math.max(0, step - 1);
    render();
  }
  function enterExpert() {
    if (!$('expertSurface').hidden) return;
    if (step === 1) readFacts(false);
    if (step === 2) collectEvidence();
    setFacts(analysis && analysis.facts_used || opinion().buildFacts(caseFile));
    $('eventText').value = caseFile.description;
    document.body.classList.remove('worker-mode');
    $('workerSurface').hidden = true;
    $('expertSurface').hidden = false;
    if (analysis) window.renderExpertReport(analysis);
    else $('report').innerHTML = '<p class="meta-note">请用当前事实集重新分析；之前的报告已失效。</p>';
    $('workerModeBtn').classList.remove('active');
    $('expertModeBtn').classList.add('active');
    $('workerModeBtn').setAttribute('aria-selected', 'false');
    $('expertModeBtn').setAttribute('aria-selected', 'true');
    $('expertSurface').scrollIntoView({ block: 'start' });
  }
  async function enterWorker() {
    if (!$('workerSurface').hidden) return;
    const expertFacts = cleanFacts(FACT_STATE);
    const baseline = cleanFacts(opinion().buildFacts(caseFile));
    const keys = new Set([...Object.keys(expertFacts), ...Object.keys(baseline)]);
    const changed = [...keys].some(key => expertFacts[key] !== baseline[key]);
    if (changed) {
      updateExpertFacts(expertFacts);
      try { analysis = await LexChainRuntime.analyze({ facts: opinion().buildFacts(caseFile) }); }
      catch (error) {
        analysis = null; step = 2; render();
        return fail('专业面板中的事实已修改，但重新分析失败；请重试后再查看更新后的意见。');
      }
    }
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function receiveExpertAnalysis(data) {
    analysis = data;
    updateExpertFacts(data.facts_used || {});
  }
  function reset() {
    caseFile = freshCase(); step = 0; analysis = null; analyzing = false;
    setFacts({});
    $('eventText').value = '';
    $('report').innerHTML = '';
    render();
  }
  function init() {
    $('workerModeBtn').onclick = enterWorker;
    $('expertModeBtn').onclick = enterExpert;
    render();
  }
  window.LexChainWorker = { init, receiveExpertAnalysis, reset, getCase: () => caseFile };
})();
