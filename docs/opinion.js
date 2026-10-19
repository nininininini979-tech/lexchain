'use strict';
(function expose(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LexChainOpinion = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function createOpinionModule() {
  const JURISDICTION = '中华人民共和国大陆地区';
  const COMMON_QUESTIONS = [
    { key: 'employment_exists', label: '是否已实际接受单位安排、提供劳动？', hint: '这里只记录你的陈述；劳动关系认定仍需核对主体、管理和报酬。' }
  ];
  const ISSUES = [
    { key: 'wage_arrears', label: '拖欠工资', hint: '工资少发、迟发或没发', rules: ['R30', 'R38', 'R85', 'R16-P'], questions: [], evidence: ['bank_statement', 'payslip', 'contract', 'attendance', 'messages', 'witness'],
      summary: '先核对约定工资、付款日期及到账记录。差额不一定等于可获支持的欠薪，需要排除合法代扣、重复计算等情况。',
      defenses: ['单位可能主张已经现金或转账支付，需逐月核对付款主体和到账记录。', '应发与实发口径可能不同：税费、社保个人部分、预支及合法代扣需核对，不能只凭差额认定欠薪。', '如单位否认劳动关系，应补充招工、管理、考勤和报酬记录。'],
      next: '如愿意，可书面列出欠付月份、金额和依据向单位核对，并保存送达记录；协商不是投诉或仲裁的必经程序。如考虑解除劳动关系，先请专业人员核对法定条件及书面通知方式，不要仅凭自动意见离职或发送解除通知。' },
    { key: 'no_contract', label: '未签劳动合同', hint: '已工作但没有书面合同', rules: ['R82', 'R14', 'R82-2', 'R14-2', 'R82-3'], questions: [
      { key: 'written_contract_signed', label: '是否签过书面劳动合同（含待核对的电子合同）？' },
      { key: 'worker_refused_contract', label: '单位是否通知签约，而你明确拒绝？' },
      { key: 'employer_written_termination_notice', label: '单位是否因拒签书面通知终止用工？' },
      { key: 'double_wage_paid', label: '单位是否已支付未签合同的二倍工资差额？' }
    ], evidence: ['contract', 'attendance', 'bank_statement', 'messages', 'witness'],
      summary: '是否可主张二倍工资差额，需要核对实际用工时间、书面或电子合同、未签原因、计算期间及当地裁审口径。',
      defenses: ['单位可能提交电子合同、补签合同或签收材料，需要核对真实性和实际签署日期。', '拒签、特殊用工形式、计算期间与时效可能影响二倍工资差额主张。'],
      next: '整理入职、催签、补签及离职时间线，咨询当地劳动仲裁或法律援助后确定主张期间。' },
    { key: 'dismissal', label: '被辞退或解除', hint: '突然被辞退、协商离职', rules: ['R87', 'R46', 'R39', 'R40', 'R41', 'R42', 'R45', 'R50', 'R87-2', 'R87-3'], questions: [
      { key: 'terminated_by_employer', label: '是否由单位单方面提出辞退或解除？' },
      { key: 'mutual_agreement_employer_proposed', label: '是否已与单位协商一致解除，且由单位提出？' },
      { key: 'contract_expired_termination', label: '是否属于劳动合同到期终止？' },
      { key: 'worker_special_protection', label: '是否可能处于孕产哺乳期、医疗期或工伤等特殊保护情形？', hint: '范围及适用条件需要专业核实，不清楚可保留未知。' }
    ], evidence: ['termination', 'contract', 'bank_statement', 'attendance', 'messages'],
      summary: '辞退不自动等于违法解除。解除理由、程序、工作年限及是否已达成有效协议会影响继续履行、经济补偿或赔偿金主张。',
      defenses: ['单位可能主张违纪、不能胜任、合法裁员、协商解除或合同到期，需核对解除理由和程序。', '经济补偿与违法解除赔偿金通常不可重复计算；签署的离职或结算协议应一并复核。'],
      next: '保存解除通知及收到日期，核对单位写明的理由；签署离职、放弃权利或结算文件前，先寻求人工复核。' },
    { key: 'social_insurance', label: '未缴社会保险', hint: '社保停缴、漏缴或未缴', rules: ['R58-SI', 'R38'], questions: [
      { key: 'social_insurance_paid', label: '是否已核对缴费记录，确认单位依法足额缴纳社保？' }
    ], evidence: ['social_insurance', 'contract', 'bank_statement', 'messages'],
      summary: '应核对参保主体、缴费月份和基数。补缴一般需向当地社保征收或经办机构核实，不能直接当作应支付给个人的现金赔偿。',
      defenses: ['单位可能主张通过其他主体参保或已补缴，需核对个人缴费记录。', '补缴、损失赔偿与解除后的经济补偿有不同条件及办理渠道。'],
      next: '先获取官方个人参保缴费记录，向当地社保征收或经办机构核实补缴渠道；如考虑解除，先核对解除事由与通知方式。' },
    { key: 'overtime', label: '加班费', hint: '延时、休息日或节假日加班', rules: ['R44', 'R31'], questions: [
      { key: 'overtime_paid_correctly', label: '相关加班费是否已按适用标准支付？' },
      { key: 'weekend_overtime_compensated', label: '休息日加班是否已全部安排补休？', hint: '工作日延时及法定节假日加班不能仅据此视为已付加班费。' }
    ], evidence: ['attendance', 'payslip', 'bank_statement', 'contract', 'messages'],
      summary: '应先核对工时制度、加班安排、三类加班时数、计薪基数、已付金额及休息日补休。本版不自动计算加班费。',
      defenses: ['单位可能争议加班是否由其安排、时数是否真实，或主张适用特殊工时制度。', '休息日补休与工作日、法定节假日加班的处理不同，需要分别核对。'],
      next: '按日期区分工作日、休息日和法定节假日，保存排班、打卡、任务安排和支付记录，交由人工核对计薪标准。' },
    { key: 'injury', label: '工伤或职业伤害', hint: '受伤、职业病或安全风险', rules: [], questions: [], evidence: ['medical', 'accident', 'contract', 'attendance', 'social_insurance', 'witness'],
      summary: '先保障就医和安全，保留事故及用工材料。是否属于工伤、职业病或新就业形态职业伤害，需要结合事实由相应机构处理。',
      defenses: ['事故时间、地点、工作原因及用工主体可能存在争议，需要保存就医、事故和工作安排记录。'],
      next: '尽快联系当地人社部门或法律援助，核对工伤认定、劳动能力鉴定及申请期限；不要等待本工具给出赔付结论。' },
    { key: 'other', label: '其他劳动争议', hint: '先整理事实与需要的帮助', rules: [], questions: [], evidence: ['contract', 'bank_statement', 'messages', 'witness'],
      summary: '目前仅整理自述、证据和求助路径，尚不足以对其他类型争议作自动法律定性。请带着时间线和材料寻求人工分析。',
      defenses: ['需要先核对争议类型、用工主体、时间线、双方约定及对方的解释。'],
      next: '把发生时间、涉及主体、争议内容和希望解决的问题整理成一页说明，向法律援助、工会或律师咨询。' }
  ];
  const EVIDENCE_CATALOG = [
    { key: 'bank_statement', label: '工资流水或转账记录', purpose: '核对实际到账金额、时间及付款主体' },
    { key: 'payslip', label: '工资条、工资核算明细', purpose: '核对应发标准、组成及扣款项目' },
    { key: 'attendance', label: '考勤、排班或工作记录', purpose: '证明提供劳动、工作时间与安排' },
    { key: 'contract', label: '劳动合同、招工或入职材料', purpose: '核对用工主体、入职时间及约定' },
    { key: 'messages', label: '工作沟通、催款或承诺记录', purpose: '核对双方沟通、承认欠款及催收过程' },
    { key: 'social_insurance', label: '社会保险缴费记录', purpose: '核对参保主体、月份及基数' },
    { key: 'termination', label: '解除通知、离职及结算材料', purpose: '核对解除理由、程序、日期及协议' },
    { key: 'witness', label: '证人及可联系线索', purpose: '补充用工、支付或事故情况' },
    { key: 'medical', label: '病历、诊断及医疗费用材料', purpose: '保留就医时间、伤情及费用记录' },
    { key: 'accident', label: '事故经过与现场材料', purpose: '保存事故时间、地点、工作安排及见证线索' }
  ];
  const blank = value => value === null || value === undefined || String(value).trim() === '';
  const issueFor = key => ISSUES.find(item => item.key === key) || ISSUES[ISSUES.length - 1];
  const questionsFor = key => [...COMMON_QUESTIONS, ...issueFor(key).questions];
  const evidenceFor = key => issueFor(key).evidence.map(k => EVIDENCE_CATALOG.find(item => item.key === k));
  function cents(value) {
    if (blank(value)) return null;
    const text = String(value).trim();
    if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(text)) return NaN;
    const [whole, fraction = ''] = text.split('.');
    return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  }
  function calculateWageClaims(caseData = {}) {
    const rows = (caseData.wageRows || []).filter(row => row && ![row.month, row.due, row.paid].every(blank));
    const errors = [], seen = new Set(), details = [];
    let totalCents = 0, completeMonths = 0;
    rows.forEach((row, index) => {
      const month = String(row.month || '');
      const due = cents(row.due), paid = cents(row.paid);
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) errors.push('第 ' + (index + 1) + ' 行请填写有效月份。');
      if (seen.has(month)) errors.push(month + ' 月份重复，请合并为一行，避免重复计算。');
      seen.add(month);
      if (Number.isNaN(due) || Number.isNaN(paid)) errors.push('第 ' + (index + 1) + ' 行金额须为非负数，最多两位小数。');
      if (due !== null && paid !== null && Number.isFinite(due) && Number.isFinite(paid)) {
        completeMonths++;
        const amount = Math.max(0, due - paid);
        totalCents += amount;
        details.push({ month, due: due / 100, paid: paid / 100, amount: amount / 100 });
      }
    });
    const incompleteMonths = rows.length - completeMonths;
    if (errors.length) totalCents = 0;
    const totalKnownArrears = totalCents / 100;
    const claims = totalCents > 0 ? [{
      id: 'wage_principal', title: '已填完整月份的工资差额小计', amount: totalKnownArrears, unit: '元',
      formula: 'Σ max(0, 同月应发 − 同月实发)',
      assumptions: '按 ' + completeMonths + ' 个完整月份计算。' + (incompleteMonths ? incompleteMonths + ' 个不完整月份未计入。' : '') + '金额均为用户输入，需统一税前/税后口径；尚未确认合法代扣、到账和应付日期，不代表最终可获支持金额。',
      details
    }] : [];
    return { claims, totalKnownArrears, hasEstimate: claims.length > 0, completeMonths, incompleteMonths, totalRows: rows.length, errors };
  }
  function buildFacts(caseData = {}) {
    const facts = {};
    for (const [key, value] of Object.entries(caseData.answers || {})) {
      if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value) && value >= 0)) facts[key] = value;
    }
    if (caseData.stillWorking === 'yes') facts.worker_separated = false;
    if (caseData.stillWorking === 'no') facts.worker_separated = true;
    if (caseData.issue === 'wage_arrears') {
      const wages = calculateWageClaims(caseData);
      if (caseData.latePayment === 'yes' || (caseData.latePayment !== 'no' && caseData.paymentDue === 'yes' && wages.hasEstimate)) facts.wage_paid_on_time_full = false;
    }
    const explicitlyUnknown = Object.fromEntries((caseData.expertUnknowns || []).map(key => [key, null]));
    return { ...facts, ...explicitlyUnknown, ...(caseData.expertOverrides || {}) };
  }
  function buildActions(caseData, issue) {
    const actions = [
      { phase: '现在', title: '保存证据，整理时间线', body: '保留原始文件、完整聊天记录及来源，另做备份。写明发生日期、单位主体和你的诉求，不要只保留裁剪后的截图。' },
      { phase: '接下来', title: '核对并提出请求', body: issue.next },
      { phase: '及时求助', title: '核对办理渠道和时效', body: '可拨打 12333 咨询劳动保障渠道，12348 咨询公共法律服务，或向工会、法律援助机构、律师求助。协商期间也应及时核对仲裁、投诉及其他申请期限；不要因等待回复错过期限。' }
    ];
    if (caseData.issue === 'injury' || /暴力|威胁|未成年|多人欠薪|群体|报复/.test(caseData.description || '')) actions.unshift({
      phase: '优先', title: '尽快获得人工帮助', body: '涉及伤害或安全时先就医、到安全地点；紧急情况拨打 120 或 110。工伤、未成年人、多人欠薪或报复风险应尽快联系当地人社、工会或法律援助，核对专门程序和期限。'
    });
    return actions;
  }
  function buildOpinion(input = {}) {
    const caseData = input.caseData || {}, report = input.report || {};
    const issue = issueFor(caseData.issue);
    const facts = input.facts || buildFacts(caseData);
    const wages = calculateWageClaims(caseData.issue === 'wage_arrears' ? caseData : {});
    const relevant = (report.rules || []).filter(rule => issue.rules.includes(rule.id));
    const employerPermission = rule => rule.deontic?.operator === 'PERMISSION' && rule.deontic.bearer === '用人单位';
    const mapRule = rule => ({
      ruleId: rule.id, source: rule.source || '规则库条目', text: rule.text || '', status: rule.status,
      condition: employerPermission(rule) ? '单位可能援引的解除依据；适用要件、证据及程序均待核实' : rule.status === 'VIOLATION' ? '按所填事实匹配，证据仍待核实' : '按所填事实作条件分析，不能直接认定违法',
      missingFacts: rule.missingFacts || []
    });
    const legalBasis = relevant.filter(rule => !['NOT_TRIGGERED', 'POSSIBLE', 'DEFEATED'].includes(rule.status)).map(mapRule);
    const pendingLegalBasis = relevant.filter(rule => rule.status === 'POSSIBLE').map(mapRule);
    const hasSignal = relevant.some(rule => !employerPermission(rule) &&
      (['VIOLATION', 'RISK', 'DEFENSIBLE'].includes(rule.status) ||
       (rule.status === 'PERMITTED' && rule.deontic?.bearer === '劳动者')));
    const employerDefenses = relevant.filter(rule => employerPermission(rule) && ['PERMITTED', 'DEFENSIBLE'].includes(rule.status))
      .map(rule => '单位可能援引' + (rule.source || rule.id) + '主张' + (rule.deontic.act || '有权解除') + '；这不是劳动者已成立的请求权，仍需核对适用要件、单位举证和解除程序。');
    let headline = issue.label + '：还需补充关键事实';
    let conclusionLevel = '当前无法定性，待补事实';
    let summary = issue.summary;
    if (hasSignal) {
      headline = issue.label + '：存在需进一步核实的主张线索';
      conclusionLevel = '根据自述初步匹配，证据待核实';
    }
    if (caseData.issue === 'wage_arrears') {
      if (wages.hasEstimate) summary = '已填完整月份的工资差额小计为 ' + wages.totalKnownArrears.toFixed(2) + ' 元。' + (wages.incompleteMonths ? '另有 ' + wages.incompleteMonths + ' 个月未计入，不能视为全部欠款。' : '') + issue.summary;
      if (facts.employment_exists === true && facts.wage_paid_on_time_full === false) {
        headline = '根据你的陈述，可能存在未及时足额支付工资的情形';
        conclusionLevel = '存在欠薪线索，事实及证据待核实';
      }
      if (facts.employment_exists === false) summary += '你目前否认存在实际用工，劳动法路径能否适用需先由人工核对。';
      else if (facts.employment_exists !== true) summary += '是否存在劳动关系尚未确认。';
      if (facts.wage_paid_on_time_full === true) summary += '专业事实已标记及时足额支付，与正数差额可能不一致，请核对后再主张。';
      else if (caseData.paymentDue !== 'yes' && caseData.latePayment !== 'yes') summary += '付款期限或迟发情况未确认，差额暂不能认定为已到期欠薪。';
      if (caseData.latePayment === 'yes' && caseData.paymentDue === 'no') summary += '迟发/未足额记录与发薪日期回答不一致，请核对是哪一笔工资及其付款日期。';
    }
    const evidence = caseData.evidence || {};
    const evidenceGaps = evidenceFor(caseData.issue).filter(item => evidence[item.key] !== 'has').map(item => ({
      ...item, status: evidence[item.key] || 'unknown',
      reason: (evidence[item.key] === 'partial' ? '已有部分，建议补齐。' : '尚未提供或确认。') + item.purpose + '。'
    }));
    const missingMap = new Map();
    relevant.forEach(rule => (rule.missingFacts || []).forEach(item => missingMap.set(item.fact, item.label)));
    questionsFor(caseData.issue).forEach(question => {
      if (facts[question.key] === undefined || facts[question.key] === null) missingMap.set(question.key, question.label);
    });
    const items = Object.entries(facts).filter(([, value]) => value !== null && value !== undefined).map(([key, value]) => ({
      key, label: (input.factDefinitions || []).find(item => item.key === key)?.label || questionsFor(caseData.issue).find(item => item.key === key)?.label || key,
      value, source: Object.prototype.hasOwnProperty.call(caseData.expertOverrides || {}, key) ? '专业面板手动修正（待核实）' : (key === 'wage_paid_on_time_full' && caseData.issue === 'wage_arrears' ? '由自述金额及付款时间整理（待核实）' : '用户自述')
    }));
    return {
      jurisdiction: JURISDICTION, headline, summary, conclusionLevel,
      legalBasis, pendingLegalBasis, claims: wages.claims, evidenceGaps,
      missingFacts: [...missingMap].map(([key, label]) => ({ key, label })),
      counterarguments: [...issue.defenses, ...employerDefenses], actions: buildActions(caseData, issue),
      factsUsed: { items, wageMonths: wages.completeMonths, incompleteMonths: wages.incompleteMonths },
      coverageNote: caseData.issue === 'injury' ? '当前规则库未覆盖工伤认定、职业伤害赔付和申请期限，仅提供材料整理与人工转介。' :
        caseData.issue === 'other' ? '其他争议仅提供材料整理与求助路径，尚无自动定性。' : '本版仅估算工资差额；加班费、二倍工资差额、经济补偿和赔偿金仍需人工核算。地方规定及最新裁审口径未核验。',
      disclaimer: '初步分析 · 未经律师或法律援助人员复核。事实和证据状态均由你填写，系统未查验材料；不构成正式律师法律意见。条文节选以官方最新文本为准。'
    };
  }
  return { ISSUES, COMMON_QUESTIONS, EVIDENCE_CATALOG, questionsFor, evidenceFor, issueFor, calculateWageClaims, buildFacts, buildOpinion };
});
