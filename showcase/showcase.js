import { initializeAppearance, paintIcons, renderMarkdown } from './generated/appearance.js'
import { snapshot } from './snapshot.js'

const $ = id => document.getElementById(id)
const entries = snapshot.sessions

function renderProfile(entry) {
  const profile = entry.profile
  for (const field of ['name', 'customer', 'problem', 'stage']) $(`field-${field}`).value = profile[field]
  $('field-assumptions').value = profile.assumptions.join('\n')
  $('profile').value = JSON.stringify(profile, null, 2)
  $('revision').textContent = entry.contextLabel
  $('action-summary').textContent = profile.actions.map(action => `${action.description}\n\nPlanned: ${action.target_count} · Completed: ${action.completed_count} · Remaining: ${Math.max(0, action.target_count - action.completed_count)}\n${action.result || 'No results reported yet.'}`).join('\n\n') || 'No confirmed action yet.'
  $('evidence-summary').textContent = profile.evidence.map(item => `${item.observation}\nSample: ${item.sample_size} · ${item.source}\nLimit: ${item.limitation}`).join('\n\n') || 'No evidence reported yet.'
}

function selectSession(id) {
  const entry = entries.find(item => item.id === id) || entries[0]
  $('sessions').value = entry.id
  $('chat-title').textContent = entry.title
  $('status').textContent = `${entry.title} · Actual recorded model output · No live inference`
  $('recorded-model').textContent = `Recorded with ${snapshot.model}`
  const action = entry.profile.actions[0]
  $('context-summary').textContent = `Recorded profile · ${action.target_count} planned / ${action.completed_count} completed / ${Math.max(0, action.target_count - action.completed_count)} remaining`
  renderProfile(entry)
  const transcript = $('transcript')
  transcript.replaceChildren()
  for (const turn of entry.turns) {
    const article = document.createElement('article')
    article.className = turn.role
    const label = document.createElement('strong')
    label.textContent = turn.role === 'user' ? 'Founder (fictional case)' : 'Virtual EIR · recorded response'
    const content = document.createElement('div')
    content.className = 'message-content'
    if (turn.role === 'assistant') content.innerHTML = renderMarkdown(turn.content)
    else content.textContent = turn.content
    article.append(label, content)
    transcript.append(article)
  }
  for (const button of document.querySelectorAll('[data-session]')) button.setAttribute('aria-current', String(button.dataset.session === entry.id))
  $('conversation').scrollTop = 0
  history.replaceState(null, '', `#${entry.id}`)
}

for (const entry of entries) {
  const option = document.createElement('option')
  option.value = entry.id
  option.textContent = entry.title
  $('sessions').append(option)
  const button = document.createElement('button')
  button.className = 'session-item'
  button.dataset.session = entry.id
  const icon = document.createElement('span')
  icon.dataset.icon = 'chat'
  const title = document.createElement('span')
  title.textContent = entry.title
  button.append(icon, title)
  button.onclick = () => selectSession(entry.id)
  $('session-list').append(button)
}
$('sessions').onchange = () => selectSession($('sessions').value)
$('initial').onclick = () => selectSession('first-consultation')
$('followtext').onclick = () => selectSession('follow-up')
$('composer').onsubmit = event => event.preventDefault()
for (const panel of ['profile', 'appearance']) {
  $(`open-${panel}`).onclick = () => $(`${panel}-panel`).showModal()
  $(`close-${panel}`).onclick = () => $(`${panel}-panel`).close()
}
window.addEventListener('hashchange', () => selectSession(location.hash.slice(1)))
initializeAppearance()
paintIcons()
selectSession(location.hash.slice(1))
