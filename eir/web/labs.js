// Learning tools share the workspace lock, revision guard, and unsaved-edit recovery.
export function initializeLabs({ getWorkspace, approved, getModel, node, field, input, textarea, button, ensureClean, mutate, api, getPath, setStatus }) {
  const root = document.getElementById('workspace-labs')
  let controls = {}, baseline = '', kind = 'experiment', supersedes = null, preview = null
  const labels = { experiment: 'Experiment Designer', decision: 'Decision Lab', pitch: 'Pitch Practice', stage_review: 'Step Readiness' }
  const val = () => Object.fromEntries(Object.entries(controls).map(([key, el]) => [key, el.value]))
  const learningValues = () => Object.fromEntries(Object.entries(val()).filter(([key]) => key !== 'mentor_questions'))
  const learningDirty = () => JSON.stringify(learningValues()) !== baseline
  const defaultQuestions = 'Which assumption should I test next?\nWho is the actual buyer?\nWhat evidence is missing before the next step?'
  const mentorDirty = () => !!controls.mentor_questions && controls.mentor_questions.value !== defaultQuestions
  const dirty = () => learningDirty() || mentorDirty()
  const current = type => {
    const records = (getWorkspace()?.artifacts || []).filter(item => item.status === 'confirmed')
    const replaced = new Set(records.map(item => item.supersedes_id))
    return records.filter(item => !replaced.has(item.artifact_id) && (!type || item.data.kind === type))
  }
  const list = text => text.split('\n').map(s => s.trim()).filter(Boolean)
  function select(options, value) {
    const el = node('select')
    for (const [id, label] of options) { const option = node('option', label); option.value = id; el.append(option) }
    if (options.some(([id]) => id === value)) el.value = value
    return el
  }
  function add(box, key, label, value = '', options) {
    const shortField = key === 'title' || /^name\d$/.test(key)
    const el = options ? select(options, value) : key === 'capacity' ? input(value, 'number') : shortField ? input(value) : textarea(value, 2)
    el.dataset.lab = key; if (!options) el.maxLength = shortField ? 200 : /^(questions|measures|criteria|missing|assumptions\d|risks\d|missing\d)$/.test(key) ? 6006 : key === 'mentor_questions' ? 3003 : 1000
    if (key === 'capacity') { el.min = '1'; el.max = '10000'; el.step = '1' }
    controls[key] = el; box.append(field(label, el)); return el
  }
  function read() {
    const v = val(), common = { kind, title: v.title.trim(), limitations: v.limitations.trim() || 'Proposed learning exercise; founder reports are unverified.' }
    for (const [key, el] of Object.entries(controls)) {
      if (key === 'mentor_questions' || key.startsWith('evidence:') || (kind === 'decision' && /2$/.test(key) && !v.name2.trim())) continue
      if (!el.value.trim()) { el.setAttribute('aria-invalid', 'true'); el.focus(); throw Error(`Complete “${el.getAttribute('aria-label')}” before saving.`) }
      el.removeAttribute('aria-invalid')
      if (/^(questions|measures|criteria|missing|assumptions\d|risks\d|missing\d)$/.test(key) && (list(el.value).length > 6 || list(el.value).some(item => item.length > 1000))) throw Error(`Use up to six entries of 1,000 characters each for “${el.getAttribute('aria-label')}”.`)
    }
    if (kind === 'experiment') {
      const task = approved()?.tasks.find(item => item.task_id === v.task_id)
      const limit = Math.min(task?.target_count || 0, v.method === 'interview' ? 5 : 10000)
      if (!Number.isInteger(Number(v.capacity)) || Number(v.capacity) < 1 || Number(v.capacity) > limit) throw Error(`Use a whole-number participant count between 1 and ${limit}, within the selected task's target.`)
    }
    if (kind === 'experiment') return { ...common, hypothesis: v.hypothesis, task_id: v.task_id, audience: v.audience, method: v.method, capacity: Number(v.capacity), questions: list(v.questions), measures: list(v.measures), decision_rule: v.decision_rule, status: 'planned' }
    if (kind === 'decision') return { ...common, options: [0, 1, 2].filter(i => i < 2 || v[`name${i}`].trim()).map(i => ({ name: v[`name${i}`], known_cost: v[`cost${i}`] || 'Unknown', assumptions: list(v[`assumptions${i}`]), risks: list(v[`risks${i}`]), missing_information: list(v[`missing${i}`]), next_test: v[`test${i}`] })), comparison: v.comparison, recommendation: v.recommendation }
    if (kind === 'pitch') return { ...common, audience: v.audience, pitch: v.pitch, questions: list(v.questions), clarity: v.clarity, problem_customer: v.problem_customer, evidence: v.evidence, differentiation: v.differentiation, ask: v.ask, revised_pitch: v.revised_pitch, simulated: true }
    return { ...common, material: v.material, criteria: list(v.criteria), evidence_ids: [...root.querySelectorAll('[data-stage-evidence]:checked')].map(el => el.dataset.stageEvidence), judgment: v.judgment, reasoning: v.reasoning, missing: list(v.missing), next_step: v.next_step }
  }
  function editor(box, data = {}) {
    const plan = approved()
    add(box, 'title', 'Title', data.title || '')
    if (kind === 'experiment') {
      add(box, 'task_id', 'Existing plan task', data.task_id, (plan?.tasks || []).map(t => [t.task_id, t.title]))
      add(box, 'hypothesis', 'Hypothesis to challenge', data.hypothesis)
      add(box, 'audience', 'Who will participate?', data.audience)
      add(box, 'method', 'Method', data.method || 'interview', [['interview', 'Interview'], ['observation', 'Observation'], ['prototype_test', 'Prototype test']])
      add(box, 'capacity', 'Maximum participants · no new task is created', data.capacity ?? Math.min(5, plan?.tasks[0]?.target_count || 1))
      add(box, 'questions', 'Neutral questions · one per line', data.questions?.join('\n') || 'Tell me about the last time you faced this problem.\nWhat did you do instead?')
      add(box, 'measures', 'What will you observe? · one per line', data.measures?.join('\n') || 'Recent behavior and current alternatives')
      add(box, 'decision_rule', 'Decision rule · agree before collecting results', data.decision_rule || 'Review recurring patterns and counterexamples before choosing the next test; do not infer market validation.')
    } else if (kind === 'decision') {
      for (let i = 0; i < 3; i++) {
        const option = data.options?.[i] || {}, section = node('fieldset'); section.append(node('legend', `Alternative ${i + 1}${i === 2 ? ' · optional' : ''}`))
        if (i === 2) { const extra = node('details'); extra.open = !!option.name; extra.append(node('summary', 'Add an optional third alternative'), section); box.append(extra) } else box.append(section)
        add(section, `name${i}`, `Alternative ${i + 1} name`, option.name)
        add(section, `cost${i}`, 'Known cost and source · unknown is acceptable', option.known_cost || 'Unknown')
        add(section, `assumptions${i}`, 'Assumptions · one per line', option.assumptions?.join('\n') || 'Customer response is unknown')
        add(section, `risks${i}`, 'Risks · one per line', option.risks?.join('\n') || 'Needs assessment')
        add(section, `missing${i}`, 'Missing information · one per line', option.missing_information?.join('\n') || 'Actual cost and customer behavior')
        add(section, `test${i}`, 'Next test', option.next_test || 'Run a small comparison using observed behavior')
      }
      add(box, 'comparison', 'Comparison', data.comparison || 'Compare against the saved goal, capacity and evidence.')
      add(box, 'recommendation', 'Proposed next step · does not change the plan', data.recommendation || 'Gather missing information before committing.')
    } else if (kind === 'pitch') {
      box.append(node('p', 'SIMULATED PRACTICE ONLY. Questions and feedback are not real interviews, investment interest or evidence.', 'workspace-badge'))
      add(box, 'audience', 'Simulated audience', data.audience || 'customer', [['customer', 'Customer'], ['investor', 'Investor']])
      add(box, 'pitch', 'Your original pitch', data.pitch)
      add(box, 'questions', 'Practice questions · one per line', data.questions?.join('\n') || 'What evidence supports your central claim?')
      for (const [key, label] of [['clarity', 'Clarity feedback'], ['problem_customer', 'Problem and customer feedback'], ['evidence', 'Evidence feedback'], ['differentiation', 'Differentiation feedback'], ['ask', 'Concrete ask feedback']]) add(box, key, label, data[key] || 'Not assessed yet; ask the coach for feedback.')
      add(box, 'revised_pitch', 'Revised pitch · edit after practice', data.revised_pitch || 'Awaiting practice and founder revision.')
    } else {
      box.append(node('p', 'Ordinary-step recommendation only. Criteria are supplied by you; this is not an official Foundry gate or a funding decision.', 'hint'))
      add(box, 'material', 'Your work to review · e.g. a customer/problem canvas', data.material)
      add(box, 'criteria', 'Review criteria · one per line', data.criteria?.join('\n') || 'Distinguish user, buyer and decision-maker\nSeparate observations from assumptions')
      const replaced = new Set((getWorkspace()?.evidence || []).map(e => e.supersedes_id))
      const evidenceBox = node('fieldset'); evidenceBox.append(node('legend', 'Observations to assess, including counterevidence'))
      for (const evidence of (getWorkspace()?.evidence || []).filter(e => !replaced.has(e.evidence_id))) {
        const check = input('', 'checkbox'); check.dataset.stageEvidence = evidence.evidence_id; check.checked = data.evidence_ids?.includes(evidence.evidence_id) || false
        // Include checks in the form baseline and recovery without exposing identifiers.
        const state = input(String(check.checked)); state.hidden = true; controls[`evidence:${evidence.evidence_id}`] = state
        check.onchange = () => { state.value = String(check.checked) }; evidenceBox.append(field(evidence.observation, check), state)
      }
      box.append(evidenceBox)
      add(box, 'judgment', 'Provisional judgment', data.judgment || 'insufficient', [['insufficient', 'Insufficient information'], ['revise', 'Revise this work'], ['ready_for_next_step', 'Ready for the next ordinary step']])
      add(box, 'reasoning', 'Reasons for this judgment', data.reasoning || 'Review the supplied work against each criterion.')
      add(box, 'missing', 'Gaps and uncertainties · one per line', data.missing?.join('\n') || 'Identify unsupported assumptions and missing observations')
      add(box, 'next_step', 'Next step', data.next_step || 'Address the most consequential unsupported assumption.')
    }
    add(box, 'limitations', 'Limitations', data.limitations || 'Founder reports are unverified; small samples do not establish market demand.')
  }
  function display(box, value, key = '') {
    if (Array.isArray(value)) { for (const item of value) display(box, item, key); return }
    if (value && typeof value === 'object') { for (const [name, item] of Object.entries(value)) if (!['kind', 'task_id', 'evidence_ids', 'status', 'simulated'].includes(name)) display(box, item, name); return }
    box.append(node('p', `${key.replaceAll('_', ' ')}: ${value}`, 'memory-summary'))
  }
  function render(data) {
    root.replaceChildren(); controls = {}; preview = null
    if (!getWorkspace()?.goal) { root.append(node('p', 'Approve a plan to open the learning tools.', 'hint')); baseline = JSON.stringify(learningValues()); return }
    const chooser = select(Object.entries(labels), kind)
    chooser.onchange = () => {
      if (learningDirty() && !window.confirm('Discard unsaved learning-tool edits? Saved records remain.')) { chooser.value = kind; return }
      const questions = controls.mentor_questions?.value
      kind = chooser.value; supersedes = null; render()
      if (questions !== undefined) controls.mentor_questions.value = questions
    }
    root.append(field('Learning tool', chooser))
    const form = node('div', undefined, 'lab-editor'); root.append(form); editor(form, data)
    if (supersedes) form.prepend(node('p', 'Revising an existing artifact. The previous version remains in history.', 'workspace-badge'))
    const row = node('div', undefined, 'row')
    for (const [text, endpoint, ai] of [['Ask coach for a draft', '/artifacts/generate', true], ['Save my draft', '/artifacts', false]]) row.append(button(text, async () => {
      ensureClean('lab'); const payload = { data: read(), supersedes_id: supersedes }
      if (ai) { payload.model = getModel(); if (!payload.model) throw Error('Select a coaching model first.') }
      setStatus(ai ? 'The coach is preparing a draft. Please wait; your entered work is retained.' : 'Saving your learning draft…')
      await mutate(endpoint, 'POST', payload, 'Learning draft saved. Review it before confirming. Task counts and goal status are unchanged.', true, undefined, 'lab')
      const saved = root.querySelector('.review-record'); if (saved) { saved.open = true; saved.scrollIntoView({ block: 'start' }) }
    }, ai ? 'primary' : 'secondary'))
    form.append(row)
    const history = node('details'); history.open = true; history.append(node('summary', 'Drafts and learning history'))
    const active = new Set(current().map(item => item.artifact_id))
    for (const item of [...(getWorkspace().artifacts || [])].reverse()) {
      const samePlan = item.plan_id === approved()?.plan_id
      const stale = item.data.kind === 'stage_review' && getWorkspace().events.some(e => e.revision > item.source_revision && ['plan_approved', 'task_updated', 'evidence_added'].includes(e.kind))
      const planVersion = getWorkspace().plans.find(p => p.plan_id === item.plan_id)?.version
      const card = node('details', undefined, 'review-record'); card.append(node('summary', `${labels[item.data.kind]} · ${item.data.title} · ${item.status}${item.status === 'confirmed' && !active.has(item.artifact_id) ? ' · superseded' : ''}${samePlan ? '' : ` · earlier plan v${planVersion}`}`))
      if (item.data.kind === 'pitch') card.append(node('p', 'SIMULATED — never evidence or progress', 'workspace-badge'))
      if (stale) card.append(node('p', 'The assessment basis changed. Prepare a fresh review.', 'workspace-badge'))
      display(card, item.data)
      if (item.status === 'draft') for (const action of samePlan && !stale ? ['confirm', 'reject'] : ['reject']) card.append(button(action === 'confirm' ? 'Confirm this learning draft' : 'Reject this draft', async () => {
        ensureClean(); await mutate('/artifacts/confirm', 'POST', { artifact_id: item.artifact_id, action }, 'Artifact decision saved. Recommendations do not change task progress or goal status.')
      }))
      if (samePlan && (item.status === 'draft' || active.has(item.artifact_id))) card.append(button('Edit a new version', async () => {
        ensureClean(); kind = item.data.kind; supersedes = item.status === 'confirmed' ? item.artifact_id : item.supersedes_id
        const questions = controls.mentor_questions?.value
        render(item.data); controls.mentor_questions.value = questions; baseline = ''; root.scrollIntoView({ block: 'start' })
      }))
      history.append(card)
    }
    root.append(history)
    const brief = node('details'); brief.append(node('summary', 'Mentor Brief · review and export'))
    add(brief, 'mentor_questions', 'Questions for your mentor · up to three, one per line', defaultQuestions)
    brief.append(button('Preview mentor brief', async () => {
      ensureClean('lab')
      preview = await api(getPath('/brief/preview'), 'POST', { expected_revision: getWorkspace().revision, questions: list(controls.mentor_questions.value), reviewed: true })
      preview.questions = controls.mentor_questions.value
      output.textContent = preview.text; confirm.checked = false
    }))
    const output = node('pre', '', 'brief-preview'), confirm = input('', 'checkbox')
    function reviewedPreview() {
      if (!preview || preview.revision !== getWorkspace().revision || preview.questions !== controls.mentor_questions.value || !confirm.checked) throw Error('Preview the current brief and confirm your review before exporting.')
    }
    async function verifyPreview() {
      reviewedPreview()
      const [savedWorkspace, savedProfile] = await Promise.all([api(getPath('')), api(getPath('').replace(/\/workspace$/, ''))])
      if (savedWorkspace.revision !== preview.revision || savedProfile.revision !== preview.profile_revision) {
        preview = null; confirm.checked = false
        throw Error('Saved venture information changed after this preview. Reload the saved workspace and preview the brief again before exporting.')
      }
    }
    brief.append(output, field('I reviewed this brief and its limitations before sharing', confirm), button('Download reviewed brief', async () => {
      await verifyPreview()
      const blob = new Blob([preview.text], { type: 'text/markdown;charset=utf-8' }), url = URL.createObjectURL(blob)
      const link = document.createElement('a'); link.href = url; link.download = 'Virtual-EIR-Mentor-Brief.md'; link.click(); URL.revokeObjectURL(url)
    }), button('Open reviewed print view', async () => {
      reviewedPreview()
      const view = window.open('', '_blank')
      if (!view) throw Error('Allow a local print-preview window, then try again.')
      view.opener = null
      try { await verifyPreview() } catch (error) { view.close(); throw error }
      const doc = view.document; doc.title = 'Virtual EIR Mentor Brief'
      const style = doc.createElement('style')
      style.textContent = '@page{size:A4;margin:15mm}body{margin:0;color:#182330;background:white;font:10pt/1.2 Arial,sans-serif}main{width:180mm;overflow-wrap:anywhere}h1{font-size:16pt;margin:0 0 8px}h2{font-size:10pt;margin:9px 0 3px}p{margin:2px 0}button{margin:16px;padding:8px 16px}@media print{button{display:none}}'
      doc.head.append(style)
      const print = doc.createElement('button'); print.textContent = 'Print / save as PDF'; print.onclick = () => view.print(); doc.body.append(print)
      const paper = doc.createElement('main'); doc.body.append(paper)
      for (const line of preview.text.split('\n').filter(Boolean)) {
        const el = doc.createElement(line.startsWith('## ') ? 'h2' : line.startsWith('# ') ? 'h1' : 'p')
        el.textContent = line.replace(/^#{1,2} /, ''); paper.append(el)
      }
      // Scale the complete selected brief to one A4 page without dropping text.
      paper.style.zoom = String(Math.min(1, 1000 / paper.scrollHeight))
    }))
    root.append(brief); baseline = JSON.stringify(learningValues())
  }
  return {
    render() { supersedes = null; render() },
    hasDraft: dirty,
    ensureClean(except) { if (except !== 'lab' && learningDirty()) throw Error('Save or discard learning-tool edits first.') },
    capture(except) { return dirty() ? { values: except === 'lab' ? { mentor_questions: controls.mentor_questions?.value } : val(), kind, supersedes: except === 'lab' ? null : supersedes, wasLearningDirty: except !== 'lab' && learningDirty() } : null },
    restore(saved) {
      if (!saved) return
      kind = saved.kind; supersedes = saved.supersedes; render()
      for (const [key, value] of Object.entries(saved.values)) if (controls[key]) controls[key].value = value
      for (const el of root.querySelectorAll('[data-stage-evidence]')) el.checked = controls[`evidence:${el.dataset.stageEvidence}`]?.value === 'true'
      if (saved.wasLearningDirty && !learningDirty()) baseline = ''
    },
    updateLocks() { if (getWorkspace()?.goal?.status !== 'active') for (const el of root.querySelectorAll('.lab-editor button,.lab-editor input,.lab-editor select,.lab-editor textarea')) el.disabled = true },
  }
}
