// Fully intercepted browser proof: no running service, saved database or model calls.
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { chromium } from '../apps/goat/frontend/node_modules/playwright/index.mjs'

const origin = 'https://request-recovery.invalid'
const web = new URL('../eir/web/', import.meta.url)
const output = new URL('../var/request-recovery-proof/', import.meta.url)
const checks = [], errors = []
const browser = await chromium.launch({ channel: 'msedge', headless: true })
async function fixture(scenario = '') {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })
  page.setDefaultTimeout(10000)
  page.on('pageerror', error => errors.push(error.message))
  const venture = { venture_id: 'v1', revision: 0, profile: { name: 'Fictional recovery venture', customer: 'Students', problem: 'Dinner access', stage: 'idea', assumptions: [], evidence: [], actions: [], founder_background: '', communication_preference: 'auto' } }
  const otherVenture = { ...structuredClone(venture), venture_id: 'v2', profile: { ...structuredClone(venture.profile), name: 'Second fictional venture' } }
  const ventures = [venture, otherVenture]
  const sessions = [{ session_id: 's1', venture_id: 'v1', turns: [] }, { session_id: 's2', venture_id: 'v1', turns: [] }]
  const goal = { objective: 'Understand recent behavior', success_criteria: ['Review observations'], constraints: 'Five interviews', status: 'active' }
  const workspace = { revision: 1, goal, plans: [{ plan_id: 'p1', version: 1, status: 'approved', goal, rationale: 'Review recent behavior', tasks: [{ task_id: 't1', title: 'Interview students', target_count: 5, completed_count: 2, status: 'in_progress', blocker: '', result: 'Two interviews', dependencies: [] }] }], evidence: [], reviews: [], checkins: [], artifacts: [], events: [] }
  if (scenario === 'approval-fixture') workspace.plans.push({ ...structuredClone(workspace.plans[0]), plan_id: 'p2', version: 2, status: 'draft', tasks: [{ ...structuredClone(workspace.plans[0].tasks[0]), task_id: 't2' }] })
  const writes = []
  await page.addInitScript(initialScenario => {
    window.recoveryScenario = initialScenario
    window.requestTimeouts = []
    localStorage.setItem('eir-session-v1', 's1')
    const originalTimeout = window.setTimeout.bind(window)
    window.setTimeout = (callback, delay, ...args) => {
      if ([30000, 210000].includes(delay)) {
        window.requestTimeouts.push(delay)
        return originalTimeout(callback, delay === 30000 ? 80 : 160, ...args)
      }
      return originalTimeout(callback, delay, ...args)
    }
    const originalFetch = window.fetch.bind(window)
    const pending = signal => new Promise((resolve, reject) => {
      if (signal.aborted) reject(new DOMException('Aborted', 'AbortError'))
      else signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
    })
    window.fetch = async (url, options) => {
      if (url === '/api/models' && window.recoveryScenario === 'models') return pending(options.signal)
      if (url === '/api/models' && window.recoveryScenario === 'body') return { ok: true, json: () => pending(options.signal) }
      if (url.endsWith('/chat') && window.recoveryScenario === 'unsaved-chat') throw TypeError('Connection lost before a response')
      if (options.method !== 'GET' && window.recoveryScenario === 'unsaved-write') throw TypeError('Connection lost before a response')
      const response = await originalFetch(url, options)
      if (url === '/api/ventures' && options.method === 'POST' && window.recoveryScenario === 'saved-venture') throw TypeError('Created venture response lost')
      if (url.endsWith('/approve') && window.recoveryScenario === 'saved-approval') throw TypeError('Approved plan response lost')
      if (url.endsWith('/chat') && window.recoveryScenario === 'saved-chat') return pending(options.signal)
      if (url.endsWith('/chat') && window.recoveryScenario === 'saved-json-error') return new Response(JSON.stringify({ detail: 'Committed response unavailable' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
      return response
    }
  }, scenario)
  await page.route('**/*', async route => {
    const url = new URL(route.request().url())
    assert.equal(url.origin, origin)
    const pathname = url.pathname
    if (pathname.startsWith('/api/')) {
      const method = route.request().method()
      if (method !== 'GET') writes.push({ pathname, method })
      let data
      if (pathname === '/api/models') data = { models: ['fictional-model'] }
      else if (pathname === '/api/ventures' && method === 'POST') {
        data = { ...structuredClone(venture), venture_id: 'v3', profile: { ...structuredClone(venture.profile), name: 'Recovered newly created venture' } }; ventures.push(data)
      } else if (pathname === '/api/ventures') data = ventures
      else if (pathname === '/api/ventures/v1' && method === 'PUT') {
        venture.profile = route.request().postDataJSON().profile; venture.revision++; data = venture
      } else if (pathname === '/api/ventures/v1') data = venture
      else if (pathname === '/api/ventures/v1/sessions') data = sessions
      else if (pathname === '/api/ventures/v1/sessions/s1') data = sessions[0]
      else if (pathname === '/api/ventures/v1/sessions/s2') data = sessions[1]
      else if (pathname === '/api/ventures/v1/workspace') data = workspace
      else if (['/api/ventures/v1/workspace/draft', '/api/ventures/v1/workspace/artifacts/generate'].includes(pathname)) { workspace.revision++; data = workspace }
      else if (pathname === '/api/ventures/v1/workspace/approve') { workspace.plans[1].status = 'approved'; workspace.revision++; data = workspace }
      else if (pathname === '/api/ventures/v2') data = otherVenture
      else if (pathname === '/api/ventures/v2/sessions') data = []
      else if (pathname === '/api/ventures/v2/workspace') data = workspace
      else if (pathname === '/api/ventures/v3') data = ventures.find(item => item.venture_id === 'v3')
      else if (pathname === '/api/ventures/v3/sessions') data = []
      else if (pathname === '/api/ventures/v3/workspace') data = workspace
      else if (pathname === '/api/ventures/v1/sessions/s1/chat') {
        sessions[0].turns.push({ role: 'user', content: route.request().postDataJSON().message }, { role: 'assistant', content: 'Saved coaching reply; review your evidence.' })
        data = { session: sessions[0], elapsed_seconds: 1 }
      } else throw Error(`Unexpected API request: ${method} ${pathname}`)
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) })
    }
    if (pathname === '/favicon.ico') return route.fulfill({ status: 204, body: '' })
    const filename = pathname === '/' ? 'index.html' : pathname.replace(/^\/assets\//, '')
    const contentType = filename.endsWith('.html') ? 'text/html' : filename.endsWith('.css') ? 'text/css' : 'text/javascript'
    return route.fulfill({ contentType, body: await readFile(new URL(filename, web)) })
  })
  const idle = () => page.waitForFunction(() => !document.getElementById('new').disabled)
  await page.goto(origin); await idle()
  return { page, idle, writes, sessions }
}
try {
  for (const scenario of ['models', 'body']) {
    const { page } = await fixture(scenario)
    assert.match(await page.locator('#status').innerText(), /took too long/)
    assert.equal(await page.locator('#new').isEnabled(), true)
    assert.equal(await page.locator('#request-recover').isVisible(), false)
    assert.ok((await page.evaluate(() => window.requestTimeouts)).includes(30000))
    checks.push(`A hanging ${scenario === 'body' ? 'response body' : 'GET'} expires and unlocks the interface`)
    await page.close()
  }
  const { page, idle, writes, sessions } = await fixture()
  await page.evaluate(() => { window.recoveryScenario = 'saved-chat' })
  await page.locator('#message').fill('Review my two interviews.')
  await page.locator('#send').click(); await idle()
  assert.match(await page.locator('#status').innerText(), /save outcome is unknown/)
  assert.equal(await page.locator('#message').inputValue(), 'Review my two interviews.')
  assert.equal(sessions[0].turns.length, 2)
  await page.locator('#send').click(); await idle()
  assert.equal(writes.length, 1)
  assert.match(await page.locator('#status').innerText(), /previous request may already have saved/)
  assert.ok((await page.evaluate(() => window.requestTimeouts)).includes(210000))
  checks.push('A committed chat with a lost response retains its message and blocks duplicate submission; generation has 210 seconds')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.locator('#message').fill('')
  assert.equal(await page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented }), true)
  for (const [selector, value, previous] of [['#ventures', 'v2', 'v1'], ['#sessions', 's2', 's1']]) {
    await page.locator(selector).selectOption(value); await idle()
    assert.equal(await page.locator(selector).inputValue(), previous)
    assert.match(await page.locator('#status').innerText(), /Recover saved state.*before changing/)
  }
  await page.locator('#new').click(); await idle()
  assert.match(await page.locator('#status').innerText(), /Recover saved state.*before changing/)
  assert.equal(writes.length, 1)
  await page.locator('#message').fill('Review my two interviews.')
  await page.locator('#open-profile').click()
  await page.locator('#field-name').fill('Retained unsaved venture name')
  await page.locator('#close-profile').click()
  await page.locator('#open-workspace').click()
  await page.locator('#workspace-objective').fill('Retained unsaved goal')
  await page.locator('[data-lab="title"]').fill('Retained unsaved experiment')
  await page.locator('#close-workspace').click()
  await page.locator('#ventures').selectOption('v2'); await idle()
  assert.equal(await page.locator('#ventures').inputValue(), 'v1')
  assert.match(await page.locator('#status').innerText(), /Recover saved state.*before changing/)
  await page.locator('#open-workspace').click()
  assert.equal(await page.locator('#workspace-objective').inputValue(), 'Retained unsaved goal')
  assert.equal(await page.locator('[data-lab="title"]').inputValue(), 'Retained unsaved experiment')
  await page.locator('#request-recover-workspace-status').click(); await idle()
  assert.equal(await page.locator('#workspace-objective').inputValue(), 'Retained unsaved goal')
  assert.equal(await page.locator('[data-lab="title"]').inputValue(), 'Retained unsaved experiment')
  assert.equal(await page.locator('#request-recover-workspace-status').isVisible(), false)
  await page.locator('#close-workspace').click()
  assert.equal(await page.locator('#message').inputValue(), '')
  assert.equal(await page.locator('#transcript article').count(), 2)
  await page.locator('#open-profile').click()
  assert.equal(await page.locator('#field-name').inputValue(), 'Retained unsaved venture name')
  await page.locator('#save').click(); await idle()
  assert.equal(writes.length, 2)
  assert.equal(writes[1].method, 'PUT')
  assert.equal(sessions[0].turns.length, 2)
  checks.push('Recovery reads the saved reply, clears only its matching composer, preserves profile/goal/learning drafts and permits subsequent saves')
  await page.locator('#close-profile').click()
  await page.locator('#open-workspace').click()
  page.once('dialog', dialog => dialog.accept())
  await page.locator('#workspace-discard').click()
  await page.locator('#close-workspace').click()
  await page.locator('#sessions').selectOption('s2'); await idle()
  assert.equal(await page.locator('#sessions').inputValue(), 's2')
  await page.locator('#ventures').selectOption('v2'); await idle()
  assert.equal(await page.locator('#ventures').inputValue(), 'v2')
  checks.push('Uncertain writes block venture/session changes and new ventures without losing drafts; normal navigation resumes after recovery')
  await page.close()
  const failed = await fixture()
  await failed.page.evaluate(() => { window.recoveryScenario = 'unsaved-chat' })
  await failed.page.locator('#message').fill('Retry only after checking saved history.')
  await failed.page.locator('#send').click(); await failed.idle()
  await failed.page.locator('#request-recover').click(); await failed.idle()
  assert.match(await failed.page.locator('#status').innerText(), /reply is not visible yet/)
  assert.equal(await failed.page.locator('#request-recover').isVisible(), true)
  assert.equal(failed.writes.length, 0)
  await failed.page.evaluate(() => { const now = Date.now(); Date.now = () => now + 210001 })
  failed.page.once('dialog', dialog => dialog.accept())
  await failed.page.locator('#request-recover').click(); await failed.idle()
  assert.equal(await failed.page.locator('#request-recover').isVisible(), false)
  assert.equal(await failed.page.locator('#message').inputValue(), 'Retry only after checking saved history.')
  await failed.page.evaluate(() => { window.recoveryScenario = '' })
  await failed.page.locator('#send').click(); await failed.idle()
  assert.equal(failed.writes.length, 1)
  assert.equal(failed.sessions[0].turns.length, 2)
  checks.push('An unsaved disconnected chat stays guarded during processing, then permits an explicitly reviewed retry without losing its message')
  await failed.page.close()
  const jsonError = await fixture()
  await jsonError.page.evaluate(() => { window.recoveryScenario = 'saved-json-error' })
  await jsonError.page.locator('#message').fill('Recover a committed JSON server error.')
  await jsonError.page.locator('#send').click(); await jsonError.idle()
  assert.match(await jsonError.page.locator('#status').innerText(), /Committed response unavailable.*save outcome is unknown/)
  await jsonError.page.locator('#send').click(); await jsonError.idle()
  assert.equal(jsonError.writes.length, 1)
  await jsonError.page.locator('#request-recover').click(); await jsonError.idle()
  assert.equal(await jsonError.page.locator('#transcript article').count(), 2)
  assert.equal(await jsonError.page.locator('#message').inputValue(), '')
  assert.equal(jsonError.writes.length, 1)
  await jsonError.page.close()
  checks.push('A JSON 500 after a committed write also requires recovery and never automatically repeats the request')
  const creation = await fixture()
  await creation.page.evaluate(() => { window.recoveryScenario = 'saved-venture' })
  await creation.page.locator('#new').click(); await creation.idle()
  assert.match(await creation.page.locator('#status').innerText(), /save outcome is unknown/)
  await creation.page.locator('#open-profile').click()
  await creation.page.locator('#field-name').fill('Keep venture A profile draft')
  await creation.page.locator('#close-profile').click()
  await creation.page.locator('#message').fill('Keep venture A composer draft')
  await creation.page.locator('#open-workspace').click()
  await creation.page.locator('#workspace-objective').fill('Keep venture A goal draft')
  await creation.page.locator('[data-lab="title"]').fill('Keep venture A experiment draft')
  await creation.page.locator('#request-recover-workspace-status').click(); await creation.idle()
  assert.match(await creation.page.locator('#workspace-status').innerText(), /created venture was recovered.*current venture and local edits were retained/)
  assert.equal(await creation.page.locator('#workspace-objective').inputValue(), 'Keep venture A goal draft')
  assert.equal(await creation.page.locator('[data-lab="title"]').inputValue(), 'Keep venture A experiment draft')
  assert.equal(await creation.page.locator('#request-recover-workspace-status').isVisible(), false)
  await creation.page.locator('#close-workspace').click()
  assert.equal(await creation.page.locator('#ventures').inputValue(), 'v1')
  assert.equal(await creation.page.locator('#ventures option[value="v3"]').count(), 1)
  assert.equal(await creation.page.locator('#message').inputValue(), 'Keep venture A composer draft')
  await creation.page.locator('#open-profile').click()
  assert.equal(await creation.page.locator('#field-name').inputValue(), 'Keep venture A profile draft')
  await creation.page.locator('#save').click(); await creation.idle()
  await creation.page.locator('#close-profile').click()
  await creation.page.locator('#message').fill('')
  await creation.page.locator('#open-workspace').click()
  creation.page.once('dialog', dialog => dialog.accept())
  await creation.page.locator('#workspace-discard').click()
  await creation.page.locator('#close-workspace').click()
  await creation.page.locator('#ventures').selectOption('v3'); await creation.idle()
  assert.equal(await creation.page.locator('#ventures').inputValue(), 'v3')
  assert.equal(creation.writes.filter(item => item.pathname === '/api/ventures' && item.method === 'POST').length, 1)
  await creation.page.close()
  checks.push('A committed new venture is added to the list without replacing the current venture or any later profile/goal/learning/composer drafts')
  for (const edit of ['draft', 'task']) {
    const approval = await fixture('approval-fixture')
    await approval.page.locator('#open-workspace').click()
    await approval.page.evaluate(() => { window.recoveryScenario = 'saved-approval' })
    await approval.page.getByRole('button', { name: 'Approve plan', exact: true }).click(); await approval.idle()
    const control = approval.page.locator(edit === 'draft' ? '#workspace-rationale' : '#workspace-tasks .workspace-task input[type="number"]')
    const value = edit === 'draft' ? 'Keep edits made after the uncertain approval' : '3'
    await control.fill(value)
    await approval.page.locator('#request-recover-workspace-status').click(); await approval.idle()
    assert.match(await approval.page.locator('#workspace-status').innerText(), /Copy the edits.*discard the old local edits/)
    assert.equal(await control.inputValue(), value)
    assert.equal(await approval.page.locator('#request-recover-workspace-status').isVisible(), true)
    approval.page.once('dialog', dialog => dialog.accept())
    await approval.page.locator('#workspace-discard').click()
    await approval.page.locator('#request-recover-workspace-status').click(); await approval.idle()
    assert.equal(await approval.page.locator('#request-recover-workspace-status').isVisible(), false)
    assert.match(await approval.page.locator('#workspace-tasks').innerText(), /Approved v2/)
    assert.equal(approval.writes.length, 1)
    await approval.page.close()
  }
  checks.push('Recovery retains the old interface and lock when confirmed plan changes would erase later draft/task edits; explicit discard allows recovery')
  for (const action of ['plan', 'artifact', 'profile', 'venture', 'session']) {
    const pending = await fixture()
    await pending.page.evaluate(() => { window.recoveryScenario = 'unsaved-write' })
    let submit
    if (action === 'plan' || action === 'artifact') {
      await pending.page.locator('#open-workspace').click()
      if (action === 'artifact') {
        await pending.page.locator('[data-lab="title"]').fill('Retained pending experiment')
        await pending.page.locator('[data-lab="hypothesis"]').fill('The student pays')
        await pending.page.locator('[data-lab="audience"]').fill('Evening students')
      }
      submit = action === 'plan' ? pending.page.locator('#workspace-generate') : pending.page.locator('#workspace-labs').getByRole('button', { name: 'Ask coach for a draft', exact: true })
    } else if (action === 'profile') {
      await pending.page.locator('#open-profile').click()
      await pending.page.locator('#field-name').fill('Retained pending profile')
      submit = pending.page.locator('#save')
    } else {
      await pending.page.setViewportSize({ width: 1440, height: 900 })
      submit = pending.page.locator(action === 'venture' ? '#new' : '#followup')
    }
    await submit.click(); await pending.idle()
    const recover = pending.page.locator(action === 'plan' || action === 'artifact' ? '#request-recover-workspace-status' : action === 'profile' ? '#request-recover-profile-status' : '#request-recover')
    assert.equal(await recover.isVisible(), true)
    await recover.click(); await pending.idle()
    assert.match(await pending.page.locator('#status').innerText(), /saved change is not visible yet/)
    assert.equal(await recover.isVisible(), true)
    await submit.click(); await pending.idle()
    assert.equal(pending.writes.length, 0)
    if (action === 'plan' || action === 'artifact') {
      await pending.page.evaluate(() => { const now = Date.now(); Date.now = () => now + 210001 })
      pending.page.once('dialog', dialog => dialog.accept())
      await recover.click(); await pending.idle()
      assert.equal(await recover.isVisible(), false)
      await pending.page.evaluate(() => { window.recoveryScenario = '' })
      await submit.click(); await pending.idle()
      assert.equal(pending.writes.length, 1)
    }
    if (action === 'profile') assert.equal(await pending.page.locator('#field-name').inputValue(), 'Retained pending profile')
    await pending.page.close()
  }
  checks.push('Unconfirmed plan/artifact/profile/venture/session writes stay guarded; AI generation retries only after the processing window and explicit review')
  assert.deepEqual(errors, [])
  await mkdir(output, { recursive: true })
  await writeFile(new URL('verification.json', output), JSON.stringify({ passed: true, checks, errors, at: new Date().toISOString(), isolation: 'All requests intercepted; no live database or model calls.' }, null, 2) + '\n')
  console.log(checks.join('\n'))
  console.log(`${checks.length}/${checks.length} request recovery groups passed`)
} finally {
  await browser.close()
}
