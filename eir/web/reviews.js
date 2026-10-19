// Evidence and check-in forms share the workspace's revision checks and edit guards.
export function initializeReviews({ getWorkspace, approved, node, field, input, textarea, button, ensureClean, mutate }) {
  const $ = id => document.getElementById(id)
  const forms = new Map(), baselines = new Map()
  const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const shiftedDate = days => { const date = new Date(); date.setDate(date.getDate() + days); return localDate(date) }
  const activeEvidence = () => {
    const evidence = getWorkspace()?.evidence || []
    const replaced = new Set(evidence.map(item => item.supersedes_id).filter(Boolean))
    return evidence.filter(item => !replaced.has(item.evidence_id))
  }
  const values = name => Object.fromEntries([...forms.get(name).querySelectorAll('[data-name]')].map(control => [control.dataset.name, control.type === 'checkbox' ? control.checked : control.value]))
  const dirty = name => JSON.stringify(values(name)) !== baselines.get(name)
  function control(box, label, element, name) { element.dataset.name = name; box.append(field(label, element)); return element }
  function select(options) {
    const element = node('select')
    for (const [value, title] of options) { const option = node('option', title); option.value = value; element.append(option) }
    return element
  }
  function text(box, label, name, rows = 2) { const element = textarea('', rows); element.maxLength = 1000; return control(box, label, element, name) }
  function date(box, label, name, value) { return control(box, label, input(value, 'date'), name) }
  function createForm(name) {
    const box = $(`workspace-${name}`); box.replaceChildren(); forms.set(name, box)
    return box
  }
  async function save(name, endpoint, body, message) {
    ensureClean(name)
    await mutate(endpoint, 'POST', body, message, true, undefined, name)
  }
  function renderEvidence() {
    const box = createForm('evidence'), evidence = activeEvidence(), plan = approved()
    for (const item of evidence) {
      const details = node('details', undefined, 'review-record')
      details.append(node('summary', `${item.observed_on} · ${item.observation}`))
      details.append(node('p', `Source: ${item.source}\nSample: ${item.sample_size ?? 'Not specified'}\nLimit: ${item.limitation}\nRecorded: ${item.at}${item.supersedes_id ? '\nCorrects an earlier record; original retained in history.' : ''}`, 'memory-summary'))
      box.append(details)
    }
    if (!evidence.length) box.append(node('p', 'No evidence recorded for review yet.', 'hint'))
    const add = node('details'); add.append(node('summary', 'Add an observation or correction')); box.append(add)
    text(add, 'What did you observe?', 'observation')
    text(add, 'Source · interview notes, document or other record', 'source')
    date(add, 'Observation date', 'observed_on', localDate()).max = localDate()
    const sample = input('', 'number'); sample.min = '0'; sample.max = '10000'; sample.step = '1'
    control(add, 'Sample size · leave blank if not applicable', sample, 'sample_size')
    text(add, 'Limitations · what does this evidence not establish?', 'limitation')
    control(add, 'Related task · optional', select([['', 'No specific task'], ...(plan?.tasks || []).map(task => [task.task_id, task.title])]), 'task_id')
    control(add, 'Correct an earlier observation · optional', select([['', 'New observation'], ...evidence.map(item => [item.evidence_id, item.observation])]), 'supersedes_id')
    add.append(button('Confirm evidence', async () => {
      const value = values('evidence')
      await save('evidence', '/evidence', { ...value, sample_size: value.sample_size === '' ? null : Number(value.sample_size), task_id: value.task_id || null, supersedes_id: value.supersedes_id || null }, 'Observation saved with its source and limitations. Earlier reviews may need updating.')
    }, 'primary'))
    const corrected = (getWorkspace().evidence || []).filter(item => !evidence.includes(item))
    if (corrected.length) {
      const history = node('details'); history.append(node('summary', `Earlier observations (${corrected.length})`))
      for (const item of corrected) history.append(node('p', `${item.observed_on} · ${item.observation}\nSource: ${item.source}\nLimit: ${item.limitation}`, 'memory-summary'))
      box.append(history)
    }
  }
  function renderReview() {
    const box = createForm('review'), workspace = getWorkspace(), plan = approved(), evidence = activeEvidence()
    const reviews = workspace.reviews || []
    const latest = reviews.at(-1)
    if (latest) {
      const stale = (workspace.events || []).some(event => event.revision > latest.source_revision && ['plan_approved', 'task_updated', 'evidence_added'].includes(event.kind))
      box.append(node('p', `Last review · Plan v${latest.plan_version} · ${latest.confirmed_achievement ? 'Achievement confirmed by founder' : 'Goal left open'}${stale ? ' · Evidence or plan changed: review again' : ''}`, 'workspace-badge'))
    }
    for (const [index, criterion] of (workspace.goal?.success_criteria || []).entries()) {
      const card = node('div', undefined, 'review-criterion'); card.append(node('h4', criterion))
      control(card, 'Evidence assessment', select([['uncertain', 'Uncertain · more evidence needed'], ['not_supported', 'Not supported'], ['supported', 'Supported by the linked evidence']]), `verdict-${index}`)
      const sources = node('fieldset'); sources.append(node('legend', 'Link observations'))
      for (const item of evidence) {
        const checkbox = input('', 'checkbox')
        control(sources, `${item.observed_on} · ${item.observation}`, checkbox, `evidence-${index}-${item.evidence_id}`)
      }
      if (!evidence.length) sources.append(node('p', 'Add an observation above before marking a criterion supported.', 'hint'))
      card.append(sources); text(card, 'Why does the evidence support, contradict or leave this criterion uncertain?', `reasoning-${index}`)
      box.append(card)
    }
    text(box, 'Overall limits and remaining uncertainty', 'limitations')
    control(box, 'I confirm every criterion is supported and want to mark this learning goal achieved.', input('', 'checkbox'), 'confirm_achievement')
    box.append(node('p', 'Finish or cancel remaining tasks before confirming achievement. This is your evidence judgment; it does not independently verify reports or establish market demand. Leave the box unchecked to save a review and keep working.', 'hint'))
    box.append(button('Confirm evidence review', async () => {
      const value = values('review')
      if (value.confirm_achievement && !window.confirm('Mark this learning goal achieved based on your evidence review? This does not declare the business validated.')) return
      const criteria = workspace.goal.success_criteria.map((_, index) => ({
        criterion_index: index, verdict: value[`verdict-${index}`], reasoning: value[`reasoning-${index}`],
        evidence_ids: evidence.filter(item => value[`evidence-${index}-${item.evidence_id}`]).map(item => item.evidence_id),
      }))
      await save('review', '/reviews', { plan_id: plan.plan_id, criteria, limitations: value.limitations, confirm_achievement: value.confirm_achievement }, value.confirm_achievement ? 'Goal achievement confirmed by your evidence review. Reports and review history are retained.' : 'Evidence review saved. The goal remains active.')
    }, 'primary'))
    if (reviews.length) {
      const history = node('details'); history.append(node('summary', `Evidence review history (${reviews.length})`))
      for (const review of [...reviews].reverse()) {
        const source = workspace.plans.find(item => item.plan_id === review.plan_id)
        const details = node('details'); details.append(node('summary', `${review.at} · Plan v${review.plan_version}${review.confirmed_achievement ? ' · Achievement confirmed' : ' · Review saved'}`))
        for (const assessment of review.criteria) {
          details.append(node('p', `${source?.goal.success_criteria[assessment.criterion_index] || 'Earlier criterion'}\n${assessment.verdict.replaceAll('_', ' ')} · ${assessment.reasoning}`, 'memory-summary'))
          for (const id of assessment.evidence_ids) {
            const item = (workspace.evidence || []).find(record => record.evidence_id === id)
            if (item) details.append(node('p', `${item.observed_on} · ${item.observation}\nSource: ${item.source}\nLimit: ${item.limitation}${activeEvidence().includes(item) ? '' : '\nCorrected since this review.'}`, 'hint'))
          }
        }
        details.append(node('p', `Limits: ${review.limitations}`, 'memory-summary')); history.append(details)
      }
      box.append(history)
    }
  }
  function renderCheckin() {
    const box = createForm('checkin'), checkins = getWorkspace().checkins || []
    const last = checkins.at(-1)
    if (last) box.append(node('p', `${last.next_review_on <= localDate() ? 'Review due' : 'Next review'}: ${last.next_review_on} · Last report through ${last.period_end}`, 'workspace-badge'))
    const dates = node('div', undefined, 'workspace-task-edit')
    date(dates, 'Period starts', 'period_start', shiftedDate(-6))
    date(dates, 'Period ends', 'period_end', localDate()).max = localDate(); box.append(dates)
    text(box, 'What actually happened?', 'results')
    text(box, 'What did you learn? Include uncertainty or contrary evidence.', 'learnings')
    text(box, 'Blockers / support needed · optional', 'blockers')
    text(box, 'Next priorities · one per line, up to five', 'next_priorities', 3)
    date(box, 'Next review date', 'next_review_on', shiftedDate(7))
    box.append(node('p', 'Confirm task counts above first. This report saves a snapshot of current tasks and does not change their counts. The next date is shown here; automatic reminders are not enabled.', 'hint'))
    box.append(button('Confirm weekly check-in', async () => {
      const value = values('checkin')
      await save('checkin', '/checkins', { ...value, plan_id: approved().plan_id, next_priorities: value.next_priorities.split('\n').map(item => item.trim()).filter(Boolean) }, 'Weekly check-in saved. Its results, blockers and next priorities are available in follow-up conversations.')
    }, 'primary'))
    if (checkins.length) {
      const history = node('details'); history.append(node('summary', `Check-in history (${checkins.length})`))
      for (const item of [...checkins].reverse()) {
        const details = node('details'); details.append(node('summary', `${item.period_start} – ${item.period_end} · Plan v${item.plan_version}`))
        details.append(node('p', `Results: ${item.results}\nLearning: ${item.learnings}\nBlockers: ${item.blockers || 'None reported'}\nNext: ${item.next_priorities.join('; ')}\nNext review: ${item.next_review_on}`, 'memory-summary'))
        for (const task of item.task_snapshot) details.append(node('p', `${task.title}: ${task.completed_count}/${task.target_count} · ${task.status.replaceAll('_', ' ')}\n${task.result || 'No result reported'}`, 'hint'))
        history.append(details)
      }
      box.append(history)
    }
  }
  return {
    render() {
      forms.clear(); baselines.clear()
      if (!getWorkspace()?.goal) {
        for (const name of ['evidence', 'review', 'checkin']) $(`workspace-${name}`).replaceChildren(node('p', 'Approve a plan to use this section.', 'hint'))
        return
      }
      renderEvidence(); renderReview(); renderCheckin()
      for (const name of forms.keys()) baselines.set(name, JSON.stringify(values(name)))
    },
    hasDraft: () => [...forms.keys()].some(dirty),
    ensureClean(except) { if ([...forms.keys()].some(name => name !== except && dirty(name))) throw Error('Confirm or discard your evidence, review and check-in edits first.') },
    capture(except) { return Object.fromEntries([...forms.keys()].filter(name => name !== except && dirty(name)).map(name => [name, values(name)])) },
    restore(edits = {}) {
      for (const [name, value] of Object.entries(edits)) for (const control of forms.get(name)?.querySelectorAll('[data-name]') || []) {
        if (Object.hasOwn(value, control.dataset.name)) {
          if (control.type === 'checkbox') control.checked = value[control.dataset.name]
          else control.value = value[control.dataset.name]
        }
      }
    },
    updateLocks() {
      if (getWorkspace()?.goal?.status !== 'active') for (const box of forms.values()) for (const control of box.querySelectorAll('button,input,select,textarea')) control.disabled = true
    },
  }
}
