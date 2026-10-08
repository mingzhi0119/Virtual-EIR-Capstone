import { initializeAppearance, paintIcons, renderMarkdown } from './generated/appearance.js'

const $ = id => document.getElementById(id)
let venture = null, session = null, busy = false, sessionList = []
const initial = { name: 'Campus dinner delivery (fictional)', customer: 'Students studying on campus in the evening', problem: 'Getting an affordable dinner during evening study may be inconvenient', stage: 'idea', assumptions: ['Students care most about delivery speed; not yet tested'], evidence: [], actions: [] }
const initialMessage = 'I want to offer dinner delivery to students studying on campus in the evening. This is only an idea; I have not interviewed anyone. I assume speed matters most. I can interview at most five people this week. Ask two useful questions and suggest one concrete validation action for this week.'
const followupMessage = 'I have saved the interview results. Review them against the previous action plan and suggest how to adjust the next step. Explain the limits of the evidence and do not confuse planned interviews with completed interviews.'
const stored = key => { try { return localStorage.getItem(key) } catch { return null } }
const remember = (key, value) => { try { localStorage.setItem(key, value) } catch { /* Database remains the source of truth. */ } }
function status(text, error = false) {
  for (const id of ['status', 'profile-status', 'appearance-status']) { $(id).textContent = text; $(id).classList.toggle('error', error) }
}
async function api(path, method = 'GET', body) {
  const response = await fetch('/api' + path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
  const data = await response.json()
  if (!response.ok) throw Error(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))
  return data
}
function option(value, text) { const node = document.createElement('option'); node.value = value; node.textContent = text; return node }
function editable() {
  if (!venture) throw Error('Create or select a venture first.')
  let profile
  try { profile = JSON.parse($('profile').value) } catch { throw Error('Profile JSON is invalid. Correct it before continuing; your draft is unchanged.') }
  if (!profile || typeof profile !== 'object' || !Array.isArray(profile.actions) || !Array.isArray(profile.evidence) || !Array.isArray(profile.assumptions)) throw Error('Profile must be a JSON object with actions, evidence and assumptions arrays.')
  return profile
}
function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, normalized(value[key])]))
  return value
}
function dirty() { return !!venture && JSON.stringify(normalized(editable())) !== JSON.stringify(normalized(venture.profile)) }
function markDraft() { try { $('draft-dot').hidden = !dirty() } catch { $('draft-dot').hidden = false } }
function requireSaved() { if (dirty()) throw Error('You have unsaved profile changes. Confirm and save them first.') }
function requireSwitchReady() { requireSaved(); if ($('message').value.trim()) throw Error('You have an unsent message. Send it or clear it before changing venture or session.') }
function renderMemory(profile) {
  const action = profile.actions?.[0]
  $('action-summary').textContent = action ? `${action.description}\n\nPlanned: ${action.target_count} · Completed: ${action.completed_count} · Remaining: ${Math.max(0, action.target_count - action.completed_count)}\n${action.result || 'No results reported yet.'}` : 'No confirmed action yet.'
  $('evidence-summary').textContent = profile.evidence?.length ? profile.evidence.map(item => `${item.observation}\nSample: ${item.sample_size} · ${item.source}\nLimit: ${item.limitation}`).join('\n\n') : 'No evidence reported yet.'
}
function renderFields(profile) {
  for (const input of document.querySelectorAll('[data-field]')) input.value = profile[input.dataset.field] || ''
  $('field-assumptions').value = (profile.assumptions || []).join('\n')
  renderMemory(profile)
}
function render() {
  if (!venture) return
  $('profile').value = JSON.stringify(venture.profile, null, 2); renderFields(venture.profile)
  $('revision').textContent = `Confirmed revision ${venture.revision} · Venture ${venture.venture_id}`
  $('chat-title').textContent = venture.profile.name
  const action = venture.profile.actions[0]
  $('context-summary').textContent = action ? `Saved context · ${action.target_count} planned / ${action.completed_count} completed / ${Math.max(0, action.target_count - action.completed_count)} remaining · Revision ${venture.revision}` : `Saved venture context · ${venture.profile.stage} stage · Revision ${venture.revision}`
  markDraft(); renderTurns()
}
function renderTurns() {
  const box = $('transcript'); box.replaceChildren()
  const hasTurns = !!session?.turns.length; $('welcome').hidden = hasTurns
  const prompts = document.querySelector('.starter-prompts')
  ;(hasTurns ? $('prompt-tools') : $('welcome')).append(prompts)
  for (const turn of session?.turns || []) {
    const node = document.createElement('article'); node.className = turn.role
    const label = document.createElement('strong'); label.textContent = turn.role === 'user' ? 'You' : 'Virtual EIR'
    const content = document.createElement('div'); content.className = 'message-content'
    if (turn.role === 'assistant') content.innerHTML = renderMarkdown(turn.content)
    else content.textContent = turn.content
    node.append(label, content); box.append(node)
  }
  $('sessionmeta').textContent = session ? `Session ${session.session_id} · ${session.turns.length / 2} exchanges` : ''
  $('conversation').scrollTop = $('conversation').scrollHeight
}
function renderSessionNavigation() {
  $('sessions').replaceChildren(...sessionList.map((item, index) => option(item.session_id, `${index === 0 ? 'First consultation' : `Follow-up ${index}`} · ${item.turns.length / 2} exchanges`)))
  $('session-list').replaceChildren(...sessionList.map((item, index) => {
    const button = document.createElement('button'); button.className = 'session-item'; button.dataset.session = item.session_id
    button.setAttribute('aria-current', String(item.session_id === session?.session_id))
    const icon = document.createElement('span'); icon.dataset.icon = 'chat'
    const title = document.createElement('span'); title.textContent = index === 0 ? 'First consultation' : `Follow-up ${index}`
    button.append(icon, title); button.onclick = () => run(() => selectSession(item.session_id)); return button
  }))
  paintIcons($('session-list')); if (session) $('sessions').value = session.session_id
}
function setSessions(list, selected) {
  sessionList = list; session = list.find(item => item.session_id === selected) || list.at(-1) || null
  if (session) remember(`eir-session-${venture.venture_id}`, session.session_id)
  renderSessionNavigation(); renderTurns()
}
function retainSession(created) {
  session = created; remember(`eir-session-${venture.venture_id}`, created.session_id)
  if (!sessionList.some(item => item.session_id === created.session_id)) sessionList.push(created)
  else sessionList = sessionList.map(item => item.session_id === created.session_id ? created : item)
  renderSessionNavigation(); renderTurns()
}
async function refreshSessions(selected) { setSessions(await api(`/ventures/${venture.venture_id}/sessions`), selected) }
async function load(id) {
  try {
    const next = await api(`/ventures/${id}`); const list = await api(`/ventures/${id}/sessions`)
    venture = next; remember('eir-selected-venture', id); setSessions(list, stored(`eir-session-${id}`)); render()
    status('Restored the confirmed venture profile and conversation history.')
  } catch (error) { if (venture) $('ventures').value = venture.venture_id; throw error }
}
async function refreshVentures(selected) {
  const list = await api('/ventures'); $('ventures').replaceChildren(...list.map(item => option(item.venture_id, item.profile.name)))
  const id = selected || stored('eir-selected-venture'); const chosen = list.find(item => item.venture_id === id) || list[0]
  if (chosen) { $('ventures').value = chosen.venture_id; await load(chosen.venture_id) }
}
function disabled(value) {
  busy = value
  for (const element of document.querySelectorAll('button,select,textarea,input')) element.disabled = value
  for (const id of ['plan', 'result', 'save', 'followup', 'initial', 'followtext']) $(id).disabled = value || !venture
  for (const input of document.querySelectorAll('[data-field],#field-assumptions,#profile')) input.disabled = value || !venture
  let invalid = false
  if (venture) { try { editable() } catch { invalid = true } }
  for (const input of document.querySelectorAll('[data-field],#field-assumptions')) input.disabled ||= invalid
  $('send').disabled = value || !$('models').value || !venture || !$('message').value.trim()
}
async function run(task) { if (busy) return; disabled(true); try { await task() } catch (error) { status(error.message, true) } finally { disabled(false) } }
async function selectSession(id) {
  const previous = session
  try { requireSwitchReady(); retainSession(await api(`/ventures/${venture.venture_id}/sessions/${id}`)); status('Opened the saved session. The same confirmed venture context is available.') }
  catch (error) { if (previous) $('sessions').value = previous.session_id; throw error }
}
$('new').onclick = () => run(async () => {
  requireSwitchReady(); const created = await api('/ventures', 'POST', initial)
  // Retain a successful POST before any optional GET can fail.
  venture = created; session = null; sessionList = []; remember('eir-selected-venture', created.venture_id)
  $('ventures').append(option(created.venture_id, created.profile.name)); $('ventures').value = created.venture_id
  renderSessionNavigation(); render()
  try { retainSession(await api(`/ventures/${created.venture_id}/sessions`, 'POST')) }
  catch (error) { status(`Fictional venture created; initial session could not be created: ${error.message}. Send a message to retry in this venture.`, true); return }
  try { await refreshVentures(created.venture_id) }
  catch (error) { status(`Fictional venture created and retained; list refresh failed: ${error.message}. Reload to recover this venture.`, true); return }
  status('Fictional venture created. Start the first consultation, then confirm the action plan.')
})
$('ventures').onchange = () => run(async () => { try { requireSwitchReady(); await load($('ventures').value) } catch (error) { if (venture) $('ventures').value = venture.venture_id; throw error } })
$('sessions').onchange = () => run(() => selectSession($('sessions').value))
$('save').onclick = () => run(async () => {
  const profile = editable(); venture = await api(`/ventures/${venture.venture_id}`, 'PUT', { profile, expected_revision: venture.revision })
  const selected = [...$('ventures').options].find(item => item.value === venture.venture_id)
  if (selected) selected.textContent = venture.profile.name
  render(); status('Profile confirmed and saved. The next model call will use this revision.')
})
function draft(profile, text) { $('profile').value = JSON.stringify(profile, null, 2); renderFields(profile); markDraft(); status(text) }
$('plan').onclick = () => run(async () => {
  const profile = editable(); profile.actions = [{ description: 'Interview five students studying on campus in the evening about their most recent dinner purchase, alternatives and cost. Record their concerns and actual words.', target_count: 5, completed_count: 0, result: '' }]
  draft(profile, 'Fictional plan prepared, not saved. Review it and confirm to save.')
})
$('result').onclick = () => run(async () => {
  const profile = editable()
  if (!profile.actions.length || !profile.actions[0] || typeof profile.actions[0] !== 'object') throw Error('Prepare and save the initial action plan first.')
  profile.actions[0].completed_count = 2; profile.actions[0].result = 'Only two interviews completed. Both students reported that price mattered more than delivery speed.'
  profile.evidence = [{ observation: 'Two students reported more concern about price than speed.', sample_size: 2, source: 'Fictional case: founder-confirmed report', limitation: 'Only two convenience samples; does not represent the market or establish willingness to pay.' }]
  draft(profile, 'Fictional results prepared, not saved. Completed: 2; planned: 5. Review and confirm.')
})
$('followup').onclick = () => run(async () => {
  if (!venture) throw Error('Create or select a venture first.')
  requireSwitchReady(); retainSession(await api(`/ventures/${venture.venture_id}/sessions`, 'POST'))
  try { await refreshSessions(session.session_id) } catch (error) { status(`New session created; list refresh failed: ${error.message}`, true); return }
  status('New follow-up session created. It will use the same confirmed venture profile.')
})
function prepareMessage(text) {
  if ($('message').value.trim() && $('message').value.trim() !== text) {
    status('You have an unsent message. Send it or clear it before choosing another starter.', true); return
  }
  $('message').value = text; disabled(false); $('message').focus()
}
$('initial').onclick = () => prepareMessage(initialMessage)
$('followtext').onclick = () => prepareMessage(followupMessage)
$('message').oninput = () => disabled(busy)
$('composer').onsubmit = event => { event.preventDefault(); run(async () => {
  if (!venture) throw Error('Create or select a venture first.')
  requireSaved(); const message = $('message').value.trim()
  if (!message) throw Error('Enter a message before sending.')
  if (!$('models').value) throw Error('No installed model available. Check GOAT and Ollama, then retry model discovery.')
  if (!session) retainSession(await api(`/ventures/${venture.venture_id}/sessions`, 'POST'))
  status('Asking the local model through GOAT AI… Your confirmed profile will not be changed.')
  const result = await api(`/ventures/${venture.venture_id}/sessions/${session.session_id}/chat`, 'POST', { message, model: $('models').value })
  retainSession(result.session); $('message').value = ''
  const saved = `Reply saved · Profile revision ${result.context_revision} · ${result.elapsed_seconds}s. Review suggestions before updating facts.`
  try { await refreshSessions(session.session_id) } catch (error) { status(`${saved} List refresh failed: ${error.message}`, true); return }
  status(saved)
}) }
$('message').onkeydown = event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !busy) { event.preventDefault(); $('composer').requestSubmit() } }
for (const input of document.querySelectorAll('[data-field],#field-assumptions')) input.addEventListener('input', () => {
  try {
    const profile = editable()
    if (input.id === 'field-assumptions') profile.assumptions = input.value.split('\n').map(text => text.trim()).filter(Boolean)
    else profile[input.dataset.field] = input.value
    $('profile').value = JSON.stringify(profile, null, 2); renderMemory(profile); markDraft()
  } catch (error) { status(error.message, true) }
})
$('profile').oninput = () => { try { renderFields(editable()) } catch (error) { status(error.message, true) } markDraft(); disabled(busy) }
for (const name of ['profile', 'appearance']) {
  $(`open-${name}`).onclick = () => $(`${name}-panel`).showModal()
  $(`close-${name}`).onclick = () => $(`${name}-panel`).close()
}
window.addEventListener('beforeunload', event => { try { if (dirty() || $('message').value.trim()) { event.preventDefault(); event.returnValue = '' } } catch { event.preventDefault(); event.returnValue = '' } })
async function discoverModels() {
  const list = (await api('/models')).models; $('models').replaceChildren(...list.map(model => option(model, model)))
  if (list.includes('gemma4:26b')) $('models').value = 'gemma4:26b'
  if (!list.length) throw Error('No installed model available. Check Ollama and retry model discovery.')
}
$('refresh-models').onclick = () => run(async () => { await discoverModels(); status('Local model list refreshed.') })
initializeAppearance()
await run(async () => {
  const results = await Promise.allSettled([refreshVentures(), discoverModels()]); const failures = results.filter(result => result.status === 'rejected')
  if (failures.length) status(failures.map(result => result.reason.message).join(' '), true)
  else status(venture ? 'Venture restored. You can continue the conversation in English.' : 'Local services connected. Create a fictional venture to begin.')
})
