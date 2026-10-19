// EIR-only UI. The host supplies its existing API, local model and shared run lock.
import { initializeReviews } from './reviews.js'
export function initializeWorkspace({ api, getVenture, getModel, requireSaved, onStatus, run }) {
  const $ = id => document.getElementById(id)
  const panel = $('workspace-panel')
  const states = ['not_started', 'in_progress', 'blocked', 'done', 'cancelled']
  let workspace = null, ventureId = null, busy = false, running = false, loading = 0
  let formBaseline = '', draftBaseline = '', taskBaselines = new Map()
  const taskEditors = new Map()
  const sortedPlans = () => [...(workspace?.plans || [])].sort((a, b) => a.version - b.version)
  const approved = () => sortedPlans().filter(p => p.status === 'approved').at(-1)
  const proposed = () => sortedPlans().filter(p => p.status === 'draft' && p.version > (approved()?.version || 0)).at(-1)
  const reviews = initializeReviews({ getWorkspace: () => workspace, approved, node, field, input, textarea, button, ensureClean, mutate })
  const form = () => ({ objective: $('workspace-objective').value.trim(), success_criteria: $('workspace-criteria').value.split('\n').map(s => s.trim()).filter(Boolean), constraints: $('workspace-constraints').value.trim() })
  const formText = () => JSON.stringify(form())
  const goalDirty = () => !!workspace && formText() !== formBaseline
  const draftText = () => proposed() ? JSON.stringify({ rationale: $('workspace-rationale')?.value, tasks: $('workspace-tasks-json')?.value }) : ''
  const draftDirty = () => draftText() !== draftBaseline
  const taskValue = controls => ({ completed_count: controls.count.value === '' ? null : Number(controls.count.value), status: controls.status.value, blocker: controls.blocker.value, result: controls.result.value })
  const changedTasks = () => [...taskEditors].filter(([id, c]) => JSON.stringify(taskValue(c)) !== taskBaselines.get(id))
  function hasDraft() { return !!workspace && (goalDirty() || draftDirty() || changedTasks().length > 0 || reviews.hasDraft()) }
  function say(message, error = false) {
    $('workspace-status').textContent = message
    $('workspace-status').classList.toggle('error', error)
    onStatus?.(message, error)
  }
  function node(tag, text, className) {
    const n = document.createElement(tag)
    if (text !== undefined) n.textContent = text
    if (className) n.className = className
    return n
  }
  function field(label, control) { const n = node('label', label); control.setAttribute('aria-label', label); n.append(control); return n }
  function button(text, action, className = 'secondary') {
    const n = node('button', text, className); n.type = 'button'; n.onclick = () => dispatch(action); return n
  }
  function input(value, type = 'text') { const n = node('input'); n.type = type; n.value = value ?? ''; return n }
  function textarea(value, rows = 2) { const n = node('textarea'); n.value = value || ''; n.rows = rows; return n }
  function selectedVenture() { const v = getVenture(); return typeof v === 'string' ? v : v?.venture_id }
  function ensureCurrent() {
    if (!workspace || !ventureId || selectedVenture() !== ventureId) throw Error('Open the saved workspace for the selected venture first.')
  }
  function ensureClean(except) {
    reviews.ensureClean(except)
    if (except !== 'goal' && goalDirty()) throw Error('Your goal edits need a new AI proposal. Generate it or discard local edits first.')
    if (except !== 'draft' && draftDirty()) throw Error('Confirm and save draft edits or discard them first.')
    if (changedTasks().some(([id]) => id !== except)) throw Error('Confirm each edited task report or discard local edits first.')
  }
  function updateLocks() {
    const locked = busy || running
    for (const element of panel.querySelectorAll('button,input,select,textarea')) element.disabled = locked || !workspace
    $('close-workspace').disabled = locked
    $('open-workspace').disabled = locked || !getVenture()
    const state = workspace?.goal?.status
    $('workspace-pause').disabled ||= state !== 'active'
    $('workspace-resume').disabled ||= !['paused', 'achieved'].includes(state)
    $('workspace-resume').textContent = state === 'achieved' ? 'Reopen goal for correction' : 'Confirm resume'
    $('workspace-cancel').disabled ||= !['active', 'paused'].includes(state)
    $('workspace-generate').disabled ||= state === 'cancelled'
    for (const element of panel.querySelectorAll('.workspace-task input,.workspace-task select,.workspace-task textarea,.workspace-task button')) element.disabled ||= state !== 'active'
    $('workspace-discard').disabled ||= !hasDraft()
    $('workspace-draft-dot').hidden = !hasDraft()
    reviews.updateLocks()
    panel.setAttribute('aria-busy', String(locked))
  }
  async function dispatch(action) {
    if (busy || running) return
    running = true; updateLocks()
    try {
      await run(async () => {
        try { ensureCurrent(); await requireSaved(); await action() }
        catch (error) { say(`${error.message} Your local edits are retained.`, true) }
      })
    } catch (error) { say(`${error.message} Your local edits are retained.`, true) }
    finally { running = false; updateLocks() }
  }
  const path = suffix => `/ventures/${encodeURIComponent(ventureId)}/workspace${suffix}`
  function captureLocalEdits(confirmedTaskId, confirmedReviewForm) {
    return {
      goal: goalDirty() ? ['objective', 'criteria', 'constraints'].map(key => $(`workspace-${key}`).value) : null,
      draft: draftDirty() ? { planId: proposed()?.plan_id, rationale: $('workspace-rationale').value, json: $('workspace-tasks-json').value,
        simple: [...$('workspace-simple-tasks').children].map(row => [...row.querySelectorAll('input')].map(control => control.value)) } : null,
      tasks: changedTasks().filter(([id]) => id !== confirmedTaskId).map(([id, controls]) => [id, Object.fromEntries(Object.entries(controls).map(([key, control]) => [key, control.value]))]),
      reviews: reviews.capture(confirmedReviewForm),
    }
  }
  function restoreLocalEdits(edits) {
    reviews.restore(edits.reviews)
    if (edits.goal) ['objective', 'criteria', 'constraints'].forEach((key, index) => { $(`workspace-${key}`).value = edits.goal[index] })
    if (edits.draft && edits.draft.planId === proposed()?.plan_id) {
      $('workspace-rationale').value = edits.draft.rationale; $('workspace-tasks-json').value = edits.draft.json
      try { renderSimpleTasks(JSON.parse(edits.draft.json)) } catch { /* Keep an interrupted edit intact. */ }
      // Preserve even invalid advanced JSON and temporarily invalid simple inputs.
      edits.draft.simple.forEach((values, index) => {
        const row = $('workspace-simple-tasks').children[index]
        if (row) [...row.querySelectorAll('input')].forEach((control, i) => { control.value = values[i] })
      })
    }
    for (const [id, values] of edits.tasks) {
      const controls = taskEditors.get(id)
      if (controls) for (const [key, value] of Object.entries(values)) controls[key].value = value
    }
    updateLocks()
  }
  async function mutate(suffix, method, body, message, preserveLocal = false, confirmedTaskId, confirmedReviewForm) {
    const edits = preserveLocal ? captureLocalEdits(confirmedTaskId, confirmedReviewForm) : null
    const result = await api(path(suffix), method, { ...body, expected_revision: workspace.revision })
    workspace = result; render(); if (edits) restoreLocalEdits(edits); say(message)
  }
  function contextSummary() {
    if (!workspace) return 'Goal & Plan not loaded.'
    const goal = workspace.goal, plan = approved()
    if (!goal) return proposed() ? 'Plan proposal saved · awaiting founder approval.' : 'No confirmed goal · define your next step.'
    const current = plan?.tasks.find(t => !['done', 'cancelled'].includes(t.status)) || plan?.tasks.at(-1)
    const task = current ? ` · ${current.title}: ${countText(current)}` : ''
    const blocked = plan?.tasks.filter(t => t.status === 'blocked').length || 0
    return `${goal.objective} · ${goal.status}${plan ? ` · Plan v${plan.version}` : ''}${task}${blocked ? ` · ${blocked} blocked` : ''} · Task activity; evidence unverified.`
  }
  function countText(task) {
    if (!(task.target_count > 0)) return `${task.completed_count} reported · target not set`
    return `${task.completed_count}/${task.target_count} (${Math.round(task.completed_count / task.target_count * 100)}%) task progress`
  }
  function draftTasks() {
    let tasks
    try { tasks = JSON.parse($('workspace-tasks-json').value) } catch { throw Error('Task JSON is invalid. Correct it before saving.') }
    if (!Array.isArray(tasks) || !tasks.length || tasks.length > 12) throw Error('The draft must contain between one and twelve tasks.')
    const ids = new Set()
    for (const t of tasks) {
      if (!t || typeof t !== 'object' || typeof t.task_id !== 'string' || !t.task_id || ids.has(t.task_id)) throw Error('Each task needs a unique task_id.')
      ids.add(t.task_id)
      if (typeof t.title !== 'string' || !t.title.trim() || t.title.length > 500 || !Number.isInteger(t.target_count) || t.target_count < 1 || t.target_count > 10000) throw Error('Each task needs a title and a whole-number target between 1 and 10,000.')
      if (!Number.isInteger(t.completed_count) || t.completed_count < 0 || t.completed_count > t.target_count || !states.includes(t.status) || !Array.isArray(t.dependencies)) throw Error('Check task counts, status and dependencies.')
    }
    if (tasks.some(t => t.dependencies.some(id => !ids.has(id) || id === t.task_id))) throw Error('Dependencies must name another task in this draft.')
    return tasks
  }
  function renderSimpleTasks(tasks) {
    const box = $('workspace-simple-tasks'); box.replaceChildren()
    tasks.forEach((task, index) => {
      const row = node('div', undefined, 'workspace-task-edit')
      const title = input(task.title), target = input(task.target_count, 'number'); target.min = '1'; target.max = '10000'; target.step = '1'
      title.maxLength = 500
      title.oninput = () => patchTask(index, 'title', title.value)
      target.oninput = () => patchTask(index, 'target_count', Number(target.value))
      row.append(field(`Task ${index + 1} title`, title), field('Target count', target)); box.append(row)
      box.append(button(`Remove task ${index + 1}`, async () => {
        const current = draftTasks()
        if (current.length === 1) throw Error('Keep at least one action in your plan.')
        if (!window.confirm(`Remove “${current[index].title}” from this draft? Earlier saved plans and reports remain in history.`)) return
        const removed = current.splice(index, 1)[0]
        current.forEach(item => { item.dependencies = item.dependencies.filter(id => id !== removed.task_id) })
        $('workspace-tasks-json').value = JSON.stringify(current); renderSimpleTasks(current)
      }))
      const dependencies = node('fieldset'); dependencies.append(node('legend', 'Start after'))
      for (const other of tasks.filter(item => item.task_id !== task.task_id)) {
        const check = input('', 'checkbox'); check.checked = task.dependencies.includes(other.task_id)
        check.onchange = () => {
          const current = JSON.parse($('workspace-tasks-json').value)[index].dependencies
          patchTask(index, 'dependencies', check.checked ? [...new Set([...current, other.task_id])] : current.filter(id => id !== other.task_id))
        }
        dependencies.append(field(other.title, check))
      }
      if (tasks.length > 1) box.append(dependencies)

    })
    box.append(button('Add an action', async () => {
      const current = draftTasks()
      if (current.length >= 12) throw Error('Keep your plan to twelve actions or fewer.')
      current.push({ task_id: crypto.randomUUID(), title: 'New action', target_count: 1, completed_count: 0, status: 'not_started', blocker: '', result: '', dependencies: [] })
      $('workspace-tasks-json').value = JSON.stringify(current); renderSimpleTasks(current)
    }))
    updateLocks()
  }
  function patchTask(index, key, value) {
    try {
      const tasks = JSON.parse($('workspace-tasks-json').value)
      tasks[index][key] = value; $('workspace-tasks-json').value = JSON.stringify(tasks, null, 2)
      updateLocks()
    } catch { say('Correct the advanced task JSON before using simple controls. Your edits are retained.', true) }
  }
  function renderDraft() {
    const box = $('workspace-draft'); box.replaceChildren()
    const plan = proposed()
    if (!plan) { box.append(node('p', 'No pending draft. Generate a first plan or a new version using the goal above.', 'memory-summary')); return }
    box.append(node('p', `Proposed v${plan.version} · draft · not approved`, 'workspace-badge'))
    if (plan.goal) box.append(node('p', `Proposed goal: ${plan.goal.objective}\nSuccess criteria: ${plan.goal.success_criteria.join('; ')}\nConstraints: ${plan.goal.constraints || 'None stated'}`, 'memory-summary'))
    const rationale = textarea(plan.rationale, 3); rationale.id = 'workspace-rationale'; rationale.maxLength = 2000
    box.append(field('Plan rationale', rationale))
    const simple = node('div'); simple.id = 'workspace-simple-tasks'; box.append(simple)
    const json = textarea(JSON.stringify(plan.tasks, null, 2)); json.id = 'workspace-tasks-json'; json.hidden = true; json.setAttribute('aria-hidden', 'true'); box.append(json)
    json.addEventListener('change', () => {
      try { renderSimpleTasks(draftTasks()) } catch (error) { say(error.message, true) }
    })
    const controls = node('div', undefined, 'row')
    controls.append(button('Confirm and save draft edits', async () => {
      ensureClean('draft'); const tasks = draftTasks()
      await mutate('/draft', 'PUT', { plan_id: plan.plan_id, rationale: rationale.value, tasks }, 'Draft edits saved for review. The plan still needs approval.')
    }), button('Approve plan', async () => {
      ensureClean(); await mutate('/approve', 'POST', { plan_id: plan.plan_id }, `Plan v${plan.version} approved. Task progress still requires your reports.`)
    }, 'primary'), button('Reject draft', async () => {
      ensureClean(); await mutate('/reject', 'POST', { plan_id: plan.plan_id }, `Draft v${plan.version} rejected; retained in history.`)
    }))
    box.append(controls); renderSimpleTasks(plan.tasks)
  }
  function renderTasks() {
    const box = $('workspace-tasks'); box.replaceChildren(); taskEditors.clear(); taskBaselines.clear()
    const plan = approved()
    if (!plan) { box.append(node('p', 'Approve a plan before confirming task reports.', 'memory-summary')); return }
    const completed = plan.tasks.filter(t => t.status === 'done').length
    const cancelled = plan.tasks.filter(t => t.status === 'cancelled').length
    box.append(node('p', `Approved v${plan.version} · ${completed}/${plan.tasks.length} tasks done · ${cancelled} cancelled`, 'workspace-badge'))
    if (workspace.goal?.status !== 'active') box.append(node('p', 'Task reports are read-only while this goal is not active. Resume a paused goal to continue; local report drafts are retained.', 'hint'))
    box.append(button('Revise approved plan · retain reports', async () => {
      ensureClean()
      if (proposed()) throw Error('Review or reject the pending draft before starting another revision.')
      await mutate('/draft', 'PUT', { plan_id: plan.plan_id, rationale: `Revision proposed from v${plan.version}. ${plan.rationale}`, tasks: plan.tasks }, 'Revision proposed with existing reports retained. Edit and review it before approval.')
    }))
    for (const task of plan.tasks) {
      const card = node('div', undefined, 'workspace-task')
      card.append(node('h4', task.title), node('p', countText(task), 'memory-summary'))
      if (task.target_count > 0) {
        const meter = node('progress'); meter.max = task.target_count; meter.value = task.completed_count
        meter.setAttribute('aria-label', `${task.title}: ${countText(task)}`); card.append(meter)
      }
      if (task.dependencies?.length) card.append(node('p', `After: ${task.dependencies.map(id => plan.tasks.find(item => item.task_id === id)?.title || 'Earlier task').join('; ')}`, 'meta'))
      const count = input(task.completed_count, 'number'); count.min = '0'; count.max = String(task.target_count); count.step = '1'
      const status = node('select')
      for (const state of states) { const option = node('option', state.replaceAll('_', ' ')); option.value = state; status.append(option) }
      status.value = task.status
      const blocker = textarea(task.blocker), result = textarea(task.result, 3); blocker.maxLength = 500; result.maxLength = 1000
      const controls = { count, status, blocker, result }; taskEditors.set(task.task_id, controls)
      taskBaselines.set(task.task_id, JSON.stringify(taskValue(controls)))
      const row = node('div', undefined, 'workspace-task-edit')
      row.append(field('Completed count', count), field('Task status', status))
      card.append(row, field('Blocker / what is needed', blocker), field('Reported result · not independently verified', result))
      const confirm = button('Confirm task report', async () => {
        if (workspace.goal?.status !== 'active') throw Error('Resume the goal before recording task progress.')
        const value = taskValue(controls)
        if (count.value === '' || !Number.isInteger(value.completed_count) || value.completed_count < 0 || value.completed_count > task.target_count) throw Error('Completed count must be a whole number between zero and the target.')
        if (value.status === 'blocked' && !value.blocker.trim()) throw Error('Describe the blocker before confirming a blocked task.')
        if (value.status === 'done' && (value.completed_count !== task.target_count || !value.result.trim())) throw Error('A done task needs its target count and a reported result. Use in progress for partial work.')
        await mutate(`/tasks/${encodeURIComponent(task.task_id)}`, 'POST', value, 'Task report confirmed. Other local edits are retained. Counts measure task activity; evidence remains unverified.', true, task.task_id)
      })
      const rowButtons = node('div', undefined, 'row'); rowButtons.append(confirm); card.append(rowButtons); box.append(card)
    }
  }
  function renderHistory() {
    const box = $('workspace-history-content'); box.replaceChildren()
    const plans = sortedPlans()
    if (!plans.length) box.append(node('p', 'No plan versions yet.', 'hint'))
    plans.forEach((plan, index) => {
      const details = node('details'); details.append(node('summary', `Plan v${plan.version} · ${plan.status}`))
      details.append(node('p', plan.rationale, 'memory-summary'))
      const sourceEvent = workspace.events?.find(event => event.plan_id === plan.plan_id && event.detail?.source_plan_id && event.detail.source_plan_id !== plan.plan_id)
      const sourceId = plan.source_plan_id || sourceEvent?.detail.source_plan_id
      const previous = plans.find(p => p.plan_id === sourceId) || [...plans.slice(0, index)].reverse().find(p => plan.tasks.some(t => t.source_task_id && p.tasks.some(old => old.task_id === t.source_task_id))) || plans[index - 1]
      if (previous) {
        const before = new Map(previous.tasks.map(t => [t.task_id, t]))
        const after = new Map(plan.tasks.map(t => [t.task_id, t]))
        const matched = new Set()
        const previousDependency = id => after.get(id)?.source_task_id || id
        const changes = []
        if (plan.rationale !== previous.rationale) changes.push('Rationale changed.')
        for (const [id, t] of after) {
          const old = before.get(t.source_task_id) || before.get(id)
          if (!old) changes.push(`Added: ${t.title} (target ${t.target_count}).`)
          else {
            matched.add(old.task_id)
            const fields = ['title', 'target_count', 'completed_count', 'status', 'blocker', 'result', 'dependencies']
            const comparable = { ...t, dependencies: t.dependencies.map(previousDependency) }
            const changed = fields.filter(key => JSON.stringify(old[key]) !== JSON.stringify(comparable[key]))
            if (changed.length) changes.push(`${t.title}: ${changed.map(key => `${({ target_count: 'target', completed_count: 'completed', dependencies: 'prerequisites' })[key] || key} ${key === 'dependencies' ? 'updated' : `${String(old[key]).replaceAll('_', ' ')} → ${String(comparable[key]).replaceAll('_', ' ')}`}`).join('; ')}.`)
          }
        }
        for (const [id, t] of before) if (!matched.has(id)) changes.push(`Removed: ${t.title}.`)
        if (plan.goal && previous.goal && JSON.stringify(plan.goal) !== JSON.stringify(previous.goal)) changes.unshift('Goal or success criteria updated.')
        details.append(node('p', `Compared with v${previous.version}: ${changes.join(' ') || 'No task or rationale changes.'}`, 'memory-summary'))
      }
      if (plan.goal) details.append(node('p', `Goal: ${plan.goal.objective}\nSuccess criteria: ${plan.goal.success_criteria.join('; ')}\nCapacity: ${plan.goal.constraints || 'Not specified'}`, 'memory-summary'))
      for (const task of plan.tasks) details.append(node('p', `${task.title} · ${task.completed_count}/${task.target_count} · ${task.status.replaceAll('_', ' ')}${task.result ? `\nReported result: ${task.result}` : ''}${task.blocker ? `\nBlocker: ${task.blocker}` : ''}`, 'memory-summary'))
      box.append(details)
    })

  }
  function render() {
    const goal = workspace.goal, candidate = proposed()?.goal || goal
    $('workspace-objective').value = candidate?.objective || ''
    $('workspace-criteria').value = (candidate?.success_criteria || []).join('\n')
    $('workspace-constraints').value = candidate?.constraints || ''
    $('workspace-goal-state').textContent = goal ? `Goal: ${goal.status}${goal.target_date ? ` · Target date: ${goal.target_date}` : ''}. No automatic achievement.` : 'No confirmed goal.'
    $('workspace-summary').textContent = contextSummary()
    formBaseline = formText(); renderDraft(); draftBaseline = draftText(); renderTasks(); renderHistory(); reviews.render(); updateLocks()
  }
  async function load(id) {
    if (hasDraft()) throw Error('You have unsaved Goal & Plan changes. Confirm or discard them before navigating or reloading.')
    const ticket = ++loading
    const result = id ? await api(`/ventures/${encodeURIComponent(id)}/workspace`) : null
    if (ticket !== loading) return
    ventureId = id || null; workspace = result
    if (workspace) { render(); say('Saved Goal & Plan workspace loaded.') }
    else {
      reviews.render()
      taskEditors.clear(); taskBaselines.clear(); formBaseline = ''; draftBaseline = ''
      for (const name of ['objective', 'criteria', 'constraints']) $(`workspace-${name}`).value = ''
      for (const name of ['draft', 'tasks', 'history-content']) $(`workspace-${name}`).replaceChildren()
      $('workspace-summary').textContent = 'Choose a venture to define your next step.'
      updateLocks()
    }
  }
  $('open-workspace').onclick = () => {
    if (!getVenture() || busy || running) return
    panel.showModal(); updateLocks()
  }
  // Closing preserves local edits; navigation uses hasDraft() to prevent replacement.
  $('close-workspace').onclick = () => { if (!busy && !running) panel.close() }
  panel.addEventListener('cancel', event => { if (busy || running) event.preventDefault() })
  panel.addEventListener('input', updateLocks)
  panel.addEventListener('change', updateLocks)
  $('workspace-generate').onclick = () => dispatch(async () => {
    ensureClean('goal'); const goal = form()
    if (!goal.objective || !goal.success_criteria.length) throw Error('Enter an objective and at least one success criterion.')
    if (goal.objective.length > 1000 || goal.constraints.length > 1000 || goal.success_criteria.length > 8 || goal.success_criteria.some(s => s.length > 500)) throw Error('Use up to 1,000 characters for objective and constraints, and up to eight criteria of 500 characters each.')
    const model = getModel()
    if (!model) throw Error('Choose a coaching model before generating a plan.')
    say('Generating a proposal with the selected model…')
    await mutate('/draft', 'POST', { ...goal, model }, 'AI proposal saved. Review its goal, rationale and tasks; approve explicitly to activate it.')
  })
  for (const [id, state] of [['pause', 'paused'], ['resume', 'active'], ['cancel', 'cancelled']]) {
    $(`workspace-${id}`).onclick = () => dispatch(async () => {
      if (state === 'cancelled') ensureClean()
      if (state === 'cancelled' && !window.confirm('Cancel this goal? Its saved plans and reports will remain in history.')) return
      await mutate('/goal', 'POST', { status: state }, `Goal ${state}. Saved plans, reported results and other local edits are retained.`, true)
    })
  }
  $('workspace-refresh').onclick = () => dispatch(async () => { ensureClean(); await load(ventureId) })
  $('workspace-discard').onclick = () => {
    if (busy || running || !hasDraft()) return
    if (window.confirm('Discard unsaved goal, draft and task report edits in this tab? Saved workspace history will remain.')) { render(); say('Local edits discarded. Reload saved workspace if someone else has updated this venture.') }
  }
  window.addEventListener('beforeunload', event => { if (hasDraft() || running) { event.preventDefault(); event.returnValue = '' } })
  updateLocks()
  return { load, hasDraft, setBusy(value) { busy = !!value; updateLocks() }, contextSummary }
}
