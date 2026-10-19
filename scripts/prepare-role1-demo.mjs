// Real-model rehearsal on the dedicated Role 1 server. Never targets the live DB.
import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { chromium } from '../apps/goat/frontend/node_modules/playwright/index.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const demoRoot = path.join(root, 'var', 'role1-demo')
const port = Number(process.env.EIR_DEMO_PORT || 62609), base = `http://127.0.0.1:${port}`
const inputs = JSON.parse(await readFile(path.join(root, 'deliverables/2026-10-22/demo-inputs.json'), 'utf8'))
const receipt = JSON.parse((await readFile(path.join(demoRoot, `server-${port}.json`), 'utf8')).replace(/^\uFEFF/, ''))
assert.equal(receipt.port, port)
const provider = receipt.provider || 'goat'
if (provider === 'openai') {
  const response = await fetch(base + '/api/models')
  assert.ok(response.ok, 'OpenAI model authentication failed')
  inputs.model = (await response.json()).models[0]
}
assert.equal(receipt.scene, 'empty', 'Start a fresh empty take before preparing checkpoints.')
const takesRoot = path.resolve(demoRoot, 'takes') + path.sep
assert.ok(path.resolve(receipt.database).startsWith(takesRoot), 'Database must be a dedicated Role 1 take.')
const runId = new Date().toISOString().replace(/[:.]/g, '-')
const out = path.join(demoRoot, 'runs', runId)
const snapshots = path.join(demoRoot, provider === 'openai' ? 'snapshots-openai' : 'snapshots')
await mkdir(out, { recursive: true }); await mkdir(snapshots, { recursive: true })
const proof = { run_at: new Date().toISOString(), revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), provider, model: inputs.model, base, database: receipt.database, fictional: true, checks: [], timings: {}, errors: [] }
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })
const page = await context.newPage()
page.on('pageerror', error => proof.errors.push(error.message))
const idle = () => page.waitForFunction(() => !document.getElementById('new').disabled, null, { timeout: 240000 })
const feedback = async text => { await page.waitForFunction(t => document.getElementById('status').textContent.includes(t), text, { timeout: 240000 }); await idle() }
const pass = text => { proof.checks.push(text); console.log(text) }
const api = async (route, method = 'GET', data) => {
  const response = await page.request.fetch(base + '/api' + route, { method, data, timeout: 240000 })
  const result = await response.json()
  assert.ok(response.ok(), JSON.stringify(result)); return result
}
const snapshot = async name => {
  // SQLite backup produces a consistent standalone DB, including any WAL contents.
  execFileSync(path.join(root, 'apps/goat/.venv/Scripts/python.exe'), ['-c', 'import sqlite3,sys; source=sqlite3.connect(sys.argv[1]); target=sqlite3.connect(sys.argv[2]); source.backup(target); target.close(); source.close()', receipt.database, path.join(snapshots, `${name}.sqlite3`)], { cwd: root })
  await page.screenshot({ path: path.join(out, `${name}.png`) })
}
const send = async (message, label) => {
  const beforeWorkspace = await api(`/ventures/${proof.venture_id}/workspace`)
  const beforeProfile = await api(`/ventures/${proof.venture_id}`)
  const responsePromise = page.waitForResponse(r => r.url().endsWith('/chat') && r.request().method() === 'POST', { timeout: 240000 })
  await page.locator('#message').fill(message); await page.locator('#send').click()
  const response = await responsePromise; const body = await response.json()
  assert.ok(response.ok(), JSON.stringify(body)); await feedback('Reply saved')
  proof[label] = body; proof.timings[label] = body.elapsed_seconds
  assert.deepEqual(await api(`/ventures/${proof.venture_id}/workspace`), beforeWorkspace, 'Chat must not mutate workspace.')
  assert.deepEqual(await api(`/ventures/${proof.venture_id}`), beforeProfile, 'Chat must not mutate profile.')
  assert.doesNotMatch(body.reply, /[\u3400-\u9fff]/)
  return body.reply
}
try {
  await page.goto(base); await idle()
  assert.deepEqual(await api('/ventures'), [], 'Preparation requires a new empty take; existing venture data is never cleared.')
  assert.ok((await api('/models')).models.includes(inputs.model))
  await page.locator('#open-appearance').click()
  await page.locator('#theme-style').selectOption('urochester'); await page.locator('#theme-mode').selectOption('light')
  await page.locator('#close-appearance').click()
  await page.locator('#new').click(); await feedback('Fictional venture created.')
  proof.venture_id = await page.locator('#ventures').inputValue()
  const venturePath = `/ventures/${proof.venture_id}`, workspacePath = venturePath + '/workspace'
  await page.locator('#models').selectOption(inputs.model)
  await page.locator('#open-profile').click()
  for (const [field, value] of Object.entries(inputs.profile)) {
    if (['actions', 'evidence'].includes(field)) continue
    if (field === 'assumptions') await page.locator('#field-assumptions').fill(value.join('\n'))
    else {
      const control = page.locator(`[data-field="${field}"]`)
      if (await control.evaluate(input => input.tagName === 'SELECT')) await control.selectOption(value)
      else await control.fill(value)
    }
  }
  await page.locator('#save').click(); await feedback('Venture profile saved.')
  const savedProfile = await api(venturePath)
  assert.equal(savedProfile.profile.founder_background, 'Engineer')
  assert.equal(savedProfile.profile.communication_preference, 'business')
  assert.deepEqual(savedProfile.profile.actions, [])
  await page.screenshot({ path: path.join(out, 'persona.png') })
  await page.locator('#close-profile').click()
  pass('Fictional profile saved; explicit Business preference overrides Engineer background; legacy action counters unused.')
  const initialReply = await send(inputs.initial_message, 'initial_reply')
  assert.match(initialReply, /questions to ask students/i, 'The initial guide must explicitly label the interviewee questions.')
  await snapshot('ready')
  pass('Real English initial consultation; confirmed state unchanged by model.')
  await page.locator('#open-workspace').click()
  await page.locator('#workspace-objective').fill(inputs.goal.objective)
  await page.locator('#workspace-criteria').fill(inputs.goal.success_criteria.join('\n'))
  await page.locator('#workspace-constraints').fill(inputs.goal.constraints)
  await page.screenshot({ path: path.join(out, 'goal.png') })
  const draftResponse = page.waitForResponse(r => r.url().endsWith(workspacePath + '/draft') && r.request().method() === 'POST', { timeout: 240000 })
  const started = Date.now()
  await page.locator('#workspace-generate').click()
  const response = await draftResponse
  proof.generated_plan = await response.json(); proof.timings.plan_seconds = (Date.now() - started) / 1000
  assert.ok(response.ok(), JSON.stringify(proof.generated_plan)); await feedback('AI proposal saved.')
  let workspace = await api(workspacePath)
  assert.equal(workspace.goal, null)
  assert.ok(workspace.plans.at(-1).tasks.every(task => task.completed_count === 0 && task.status === 'not_started'))
  await page.locator('#workspace-draft-heading').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(out, 'raw-ai-draft.png') })
  proof.raw_task_count = workspace.plans.at(-1).tasks.length
  // A disclosed founder edit, never presented as unedited model output.
  for (let index = proof.raw_task_count; index > 1; index--) {
    page.once('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: `Remove task ${index}`, exact: true }).click(); await idle()
  }
  await page.getByLabel('Task 1 title', { exact: true }).fill(inputs.task_title)
  await page.getByLabel('Target count', { exact: true }).fill('5')
  await page.locator('#workspace-rationale').fill(inputs.plan_rationale)
  await page.getByRole('button', { name: 'Confirm and save draft edits', exact: true }).click(); await feedback('Draft edits saved')
  await snapshot('draft')
  pass(`Real AI plan generated (${proof.raw_task_count} task(s)); founder reviewed a single five-interview task; draft has no confirmed goal or completed work.`)
  await page.getByRole('button', { name: 'Approve plan', exact: true }).click(); await feedback('Plan v1 approved.')
  await page.locator('#workspace-progress-heading').scrollIntoViewIfNeeded(); await snapshot('approved')
  const card = page.locator('.workspace-task').first()
  await card.getByLabel('Completed count', { exact: true }).fill('2')
  await card.getByLabel('Task status', { exact: true }).selectOption('in_progress')
  await card.getByLabel('Reported result \u00b7 not independently verified', { exact: true }).fill(inputs.report)
  await card.getByRole('button', { name: 'Confirm task report', exact: true }).click(); await feedback('Task report confirmed.')
  workspace = await api(workspacePath)
  assert.equal(workspace.plans.at(-1).tasks[0].completed_count, 2)
  assert.match(await page.locator('#workspace-summary').textContent(), /2\/5 \(40%\)/)
  await page.locator('#workspace-progress-heading').scrollIntoViewIfNeeded(); await snapshot('progress')
  pass('Founder confirms 2/5 in_progress; three remaining by arithmetic; observation and n=2 limit stored in workspace report.')
  await page.locator('#close-workspace').click(); await page.reload(); await idle()
  const profileAfterReload = await api(venturePath)
  assert.equal(profileAfterReload.profile.communication_preference, 'business')
  await page.locator('#followup').click(); await feedback('New follow-up session created.')
  const reply = await send(inputs.followup_message, 'followup_reply')
  for (const pattern of [/5|five/i, /2|two/i, /3|three/i, /price|cost/i, /small|limit|representative|validat|sample/i]) assert.match(reply, pattern)
  assert.doesNotMatch(reply, /statistically (?:in)?significant\b/i)
  await snapshot('followup')
  pass('New session reads saved Business preference and workspace report; actual reply includes 5/2/3, price observation and sample limits; state unchanged.')
  await page.locator('#open-workspace').click()
  const old = (await api(workspacePath)).plans[0]
  await page.getByRole('button', { name: 'Revise approved plan \u00b7 retain reports', exact: true }).click(); await feedback('Revision proposed')
  await page.locator('#workspace-simple-tasks input[type=text]').first().fill(inputs.revised_task_title)
  await page.locator('#workspace-rationale').fill(inputs.revised_rationale)
  await page.getByRole('button', { name: 'Confirm and save draft edits', exact: true }).click(); await feedback('Draft edits saved')
  await page.getByRole('button', { name: 'Approve plan', exact: true }).click(); await feedback('Plan v2 approved.')
  await page.reload(); await idle(); await page.locator('#open-workspace').click()
  workspace = await api(workspacePath)
  assert.deepEqual(workspace.plans[0], old)
  assert.equal(workspace.plans.at(-1).version, 2)
  assert.equal(workspace.plans.at(-1).tasks[0].completed_count, 2)
  await page.locator('#workspace-history > summary').click()
  await page.locator('#workspace-history-content details').nth(1).locator('summary').click()
  assert.match(await page.locator('#workspace-history-content').textContent(), /Compared with v1/)
  await page.locator('#workspace-history').scrollIntoViewIfNeeded(); await snapshot('final')
  proof.final_workspace = workspace
  proof.profile = profileAfterReload
  proof.sessions = await api(venturePath + '/sessions')
  assert.equal(proof.sessions.length, 2)
  assert.equal(proof.sessions[0].turns.length, 2); assert.equal(proof.sessions[1].turns.length, 2)
  assert.deepEqual(proof.errors, [])
  pass('Approved v2 retains 2/5, unchanged v1 history, saved preference and two consultations; no browser runtime errors.')
  proof.success = true
} catch (error) {
  proof.success = false; proof.failure = error.stack
  await page.screenshot({ path: path.join(out, 'failure.png') }).catch(() => {})
  throw error
} finally {
  await writeFile(path.join(out, 'rehearsal.json'), JSON.stringify(proof, null, 2))
  await writeFile(path.join(demoRoot, 'latest-run.json'), JSON.stringify({ out, success: proof.success }, null, 2))
  await browser.close()
  console.log(`Evidence: ${out}`)
}
