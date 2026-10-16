// Run: node scripts/verify-week4-workspace-edges.mjs
// Fully intercepted browser fixture: no server, database, Ollama or model calls.
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '../apps/goat/frontend/node_modules/playwright/index.mjs'

const web = new URL('../eir/web/', import.meta.url)
const proofFile = new URL('../var/week4-proof/workspace-edges.json', import.meta.url)
const origin = 'http://workspace-edges.invalid'
const checks = [], pageErrors = [], blockedRequests = []
const proof = {
  run_at: new Date().toISOString(),
  command: 'node scripts/verify-week4-workspace-edges.mjs',
  browser: 'installed Microsoft Edge / Playwright headless',
  isolation: 'All browser requests intercepted; workspace API is an in-memory mock. No live database or model calls.',
  checks,
  passed: false,
}
let browser

async function check(name, action) {
  try {
    await action()
    checks.push({ name, passed: true })
    console.log(`PASS ${checks.length}: ${name}`)
  } catch (error) {
    checks.push({ name, passed: false, error: error.message })
    throw error
  }
}

try {
  browser = await chromium.launch({ channel: 'msedge', headless: true })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })
  page.setDefaultTimeout(10000)
  page.on('pageerror', error => pageErrors.push(error.message))
  const assets = new Map([
    ['/', ['index.html', 'text/html']],
    ['/assets/style.css', ['style.css', 'text/css']],
    ['/assets/generated/appearance.css', ['generated/appearance.css', 'text/css']],
    ['/assets/workspace.js', ['workspace.js', 'text/javascript']],
  ])
  await page.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.origin !== origin) {
      blockedRequests.push(url.href)
      return route.abort('blockedbyclient')
    }
    // Main's app integration is intentionally outside this module-level edge suite.
    if (url.pathname === '/assets/app.js') return route.fulfill({ contentType: 'text/javascript', body: '' })
    if (url.pathname === '/favicon.ico') return route.fulfill({ status: 204, body: '' })
    const asset = assets.get(url.pathname)
    if (!asset) {
      blockedRequests.push(url.href)
      return route.abort('blockedbyclient')
    }
    await route.fulfill({ contentType: asset[1], body: await readFile(new URL(asset[0], web)) })
  })
  await page.goto(origin)
  await page.evaluate(async () => {
    const { initializeWorkspace } = await import('/assets/workspace.js')
    const goal = { objective: 'Assess dinner access', success_criteria: ['Review interview observations'], constraints: 'Five interviews', status: 'active' }
    const task = (id, title, dependencies = []) => ({ task_id: id, source_task_id: null, title, target_count: 5, completed_count: 0, status: 'not_started', blocker: '', result: '', dependencies })
    window.edgeFixture = {
      revision: 2,
      goal,
      plans: [
        { plan_id: 'old', version: 1, status: 'draft', goal, rationale: 'Older pending draft', tasks: [task('old-a', 'Old task')] },
        { plan_id: 'active', version: 2, status: 'approved', goal, rationale: 'Current approved work', tasks: [task('a', 'Interview A'), task('b', 'Review B', ['a'])] },
      ],
      events: [],
    }
    window.edgeRequests = []
    window.edgeFailNext = false
    const api = async (path, method = 'GET', body) => {
      const fixture = window.edgeFixture
      window.edgeRequests.push(structuredClone({ path, method, body }))
      if (method === 'GET' && path === '/ventures/v1/workspace') return structuredClone(fixture)
      if (body?.expected_revision !== fixture.revision) throw Error('Mock expected_revision mismatch')
      if (window.edgeFailNext) { window.edgeFailNext = false; throw Error('409 mock revision conflict') }
      const active = fixture.plans.find(plan => plan.plan_id === 'active')
      if (method === 'PUT' && path.endsWith('/workspace/draft')) {
        const source = fixture.plans.find(plan => plan.plan_id === body.plan_id)
        if (source.status === 'approved') {
          const ids = Object.fromEntries(source.tasks.map(t => [t.task_id, `revision-${t.task_id}`]))
          fixture.plans.push({
            ...structuredClone(source), plan_id: 'revision', version: 3, status: 'draft', rationale: body.rationale,
            source_plan_id: source.plan_id, source_plan_revision: fixture.revision,
            tasks: body.tasks.map(t => ({ ...t, task_id: ids[t.task_id], source_task_id: t.task_id, dependencies: t.dependencies.map(id => ids[id]) })),
          })
          // No source event: prove the explicit Plan/Task lineage contract works.
        } else Object.assign(source, structuredClone({ rationale: body.rationale, tasks: body.tasks }))
      } else if (method === 'POST' && path.includes('/workspace/tasks/')) {
        if (fixture.goal.status !== 'active') throw Error('Mock: resume the goal before recording progress')
        const item = active.tasks.find(t => path.endsWith(`/${t.task_id}`))
        if (!item) throw Error('Mock: task not found')
        const { expected_revision: revision, ...values } = body
        if (revision !== fixture.revision) throw Error('Mock task revision mismatch')
        Object.assign(item, values)
      } else if (method === 'POST' && path.endsWith('/workspace/goal')) fixture.goal.status = body.status
      else throw Error(`Unexpected mock request: ${method} ${path}`)
      fixture.revision++
      return structuredClone(fixture)
    }
    const workspace = initializeWorkspace({
      api, getVenture: () => ({ venture_id: 'v1' }), getModel: () => 'existing-ollama', requireSaved: () => {}, onStatus: () => {},
      run: async action => { workspace.setBusy(true); try { await action() } finally { workspace.setBusy(false) } },
    })
    window.edgeWorkspace = workspace
    await workspace.load('v1')
  })
  const idle = () => page.waitForFunction(() => document.getElementById('workspace-panel').getAttribute('aria-busy') === 'false')
  const click = async locator => { await locator.click(); await idle() }
  const named = name => page.getByRole('button', { name, exact: true })
  const card = name => page.locator('.workspace-task').filter({ has: page.getByRole('heading', { name, exact: true }) })
  const field = (name, label) => card(name).getByLabel(label, { exact: true })
  const report = async (name, count, result) => {
    await field(name, 'Completed count').fill(count)
    await field(name, 'Task status').selectOption('in_progress')
    await field(name, 'Reported result · not independently verified').fill(result)
  }
  const confirm = name => click(card(name).getByRole('button', { name: 'Confirm task report', exact: true }))
  const localDraftsRetained = async () => {
    assert.equal(await page.locator('#workspace-objective').inputValue(), 'Locally edited goal')
    assert.equal(await page.locator('#workspace-rationale').inputValue(), 'Locally edited rationale')
    assert.equal(await page.locator('#workspace-tasks-json').inputValue(), '{invalid advanced JSON')
  }
  await click(page.locator('#open-workspace'))

  await check('Older v1 draft is excluded after approved v2; revise-approved button creates v3', async () => {
    assert.match(await page.locator('#workspace-draft').textContent(), /No pending draft/)
    assert.equal(await page.locator('#workspace-rationale').count(), 0)
    await click(named('Revise approved plan · retain reports'))
    assert.match(await page.locator('#workspace-draft').textContent(), /Proposed v3/)
    assert.equal(await page.evaluate(() => window.edgeFixture.plans[0].status), 'draft')
    assert.equal(await page.evaluate(() => window.edgeFixture.plans[2].source_plan_id), 'active')
  })
  await page.locator('#workspace-objective').fill('Locally edited goal')
  await page.locator('#workspace-rationale').fill('Locally edited rationale')
  await page.locator('#workspace-tasks-json').evaluate(input => { input.value = '{invalid advanced JSON'; input.dispatchEvent(new Event('input', { bubbles: true })) })
  await report('Interview A', '2', 'Two interviews; founder report, not independently verified')
  await report('Review B', '1', 'One review; founder report')

  await check('A confirms independently while B and goal/rationale/invalid-JSON drafts remain local', async () => {
    await confirm('Interview A')
    assert.deepEqual(await page.evaluate(() => window.edgeFixture.plans[1].tasks.map(t => t.completed_count)), [2, 0])
    assert.equal(await field('Review B', 'Completed count').inputValue(), '1')
    assert.equal(await field('Review B', 'Reported result · not independently verified').inputValue(), 'One review; founder report')
    await localDraftsRetained()
    assert.equal(await page.evaluate(() => window.edgeWorkspace.hasDraft()), true)
  })
  await check('Confirmed 2/5 displays 40% task progress and leaves the goal active', async () => {
    assert.match(await card('Interview A').textContent(), /2\/5 \(40%\) task progress/)
    assert.equal(await page.evaluate(() => window.edgeFixture.goal.status), 'active')
  })
  await report('Interview A', '3', 'Third interview is still a local report draft')
  await check('A failed B confirmation preserves both report drafts and other local edits', async () => {
    const before = await page.evaluate(() => structuredClone(window.edgeFixture))
    await page.evaluate(() => { window.edgeFailNext = true })
    await confirm('Review B')
    assert.match(await page.locator('#workspace-status').textContent(), /409 mock revision conflict/)
    assert.deepEqual(await page.evaluate(() => window.edgeFixture), before)
    assert.equal(await field('Interview A', 'Completed count').inputValue(), '3')
    assert.equal(await field('Review B', 'Completed count').inputValue(), '1')
    await localDraftsRetained()
  })
  await check('B retries independently while A and other local drafts remain unsaved', async () => {
    await confirm('Review B')
    assert.deepEqual(await page.evaluate(() => window.edgeFixture.plans[1].tasks.map(t => t.completed_count)), [2, 1])
    assert.equal(await field('Interview A', 'Completed count').inputValue(), '3')
    assert.equal(await field('Interview A', 'Reported result · not independently verified').inputValue(), 'Third interview is still a local report draft')
    await localDraftsRetained()
  })
  await check('Pause locks every task-report control; resume preserves drafts and permits confirmation', async () => {
    await click(page.locator('#workspace-pause'))
    assert.equal(await page.locator('.workspace-task input,.workspace-task select,.workspace-task textarea,.workspace-task button').evaluateAll(controls => controls.length > 0 && controls.every(control => control.disabled)), true)
    assert.equal(await page.locator('#workspace-resume').isEnabled(), true)
    assert.equal(await field('Interview A', 'Completed count').inputValue(), '3')
    await localDraftsRetained()
    await click(page.locator('#workspace-resume'))
    assert.equal(await field('Interview A', 'Completed count').isEnabled(), true)
    assert.equal(await field('Interview A', 'Completed count').inputValue(), '3')
    await localDraftsRetained()
    await confirm('Interview A')
    assert.deepEqual(await page.evaluate(() => window.edgeFixture.plans[1].tasks.map(t => t.completed_count)), [3, 1])
    await localDraftsRetained()
  })
  await check('Source lineage shows target 5 → 7 without false added/removed tasks or dependency changes', async () => {
    page.once('dialog', dialog => dialog.accept())
    await click(page.locator('#workspace-discard'))
    await page.evaluate(() => window.edgeWorkspace.load('v1'))
    const history = page.locator('#workspace-history-content > details').filter({ has: page.locator('summary', { hasText: 'Plan v3 · draft' }) })
    assert.match(await history.textContent(), /Compared with v2:/)
    await page.getByLabel('Target count', { exact: true }).first().fill('7')
    await click(named('Confirm and save draft edits'))
    const difference = await history.locator('p').allTextContents()
    const text = difference.join('\n')
    assert.match(text, /target count 5 → 7/)
    assert.doesNotMatch(text, /Added: Interview A|Removed: Interview A|Added: Review B|Removed: Review B/)
    assert.doesNotMatch(text, /dependencies .*→/)
    assert.equal(await page.evaluate(() => window.edgeFixture.plans[2].tasks[0].source_task_id), 'a')
  })
  await check('390px modal fits; no page errors or unmocked network requests', async () => {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    assert.equal(await page.locator('#workspace-panel').evaluate(dialog => { const bounds = dialog.getBoundingClientRect(); return bounds.left >= 0 && bounds.right <= innerWidth && dialog.scrollWidth <= bounds.width }), true)
    assert.deepEqual(pageErrors, [])
    assert.deepEqual(blockedRequests, [])
  })
  proof.passed = true
} catch (error) {
  proof.error = error.stack || error.message
  process.exitCode = 1
  console.error(`FAIL: ${error.message}`)
} finally {
  if (browser) await browser.close()
  proof.passed_count = checks.filter(check => check.passed).length
  proof.failed_count = checks.filter(check => !check.passed).length
  proof.page_errors = pageErrors
  proof.blocked_requests = blockedRequests
  await mkdir(new URL('.', proofFile), { recursive: true })
  await writeFile(proofFile, JSON.stringify(proof, null, 2) + '\n')
  console.log(`${proof.passed_count}/${checks.length} workspace edge checks passed. Proof: ${fileURLToPath(proofFile)}`)
}
