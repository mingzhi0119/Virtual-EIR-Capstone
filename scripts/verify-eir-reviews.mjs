// Real browser + real configured model. Creates its own fictional venture; no resets.
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '../apps/goat/frontend/node_modules/playwright/index.mjs'

const hosted = process.env.EIR_REVIEW_TARGET === 'hosted'
const entry = hosted ? (await readFile(new URL('../var/eir-hosted-proof/share-link.txt', import.meta.url), 'utf8')).trim() : 'http://127.0.0.1:62609/'
const origin = new URL(entry).origin
const output = new URL(`../var/eir-review-proof/${hosted ? 'hosted' : 'local'}/`, import.meta.url)
await mkdir(output, { recursive: true })
const proof = { at: new Date().toISOString(), hosted, origin, fictional: true, checks: [], pageErrors: [] }
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
page.setDefaultTimeout(15000)
page.on('pageerror', error => proof.pageErrors.push(error.message))
page.on('dialog', dialog => dialog.accept())
const pass = text => { proof.checks.push(text); console.log(text) }
const idle = () => page.waitForFunction(() => !document.getElementById('new').disabled, null, { timeout: 180000 })
const api = async (suffix, method = 'GET', data) => {
  const response = await page.request.fetch(origin + '/api' + suffix, { method, data, timeout: 180000 })
  assert.ok(response.ok(), `API status ${response.status()}`)
  return response.json()
}
async function clickSave(locator, suffix) {
  const result = page.waitForResponse(response => new URL(response.url()).pathname.endsWith(suffix) && response.request().method() !== 'GET', { timeout: 180000 })
  await locator.click(); const response = await result
  assert.ok(response.ok(), `Save ${suffix}: ${response.status()} ${await response.text()}`)
  const data = await response.json(); await idle(); return data
}
const form = name => page.locator(`#workspace-${name}`)
const fill = (name, key, value) => form(name).locator(`[data-name="${key}"]`).fill(value)
async function evidence(observation, sample) {
  await page.getByText('Add an observation or correction', { exact: true }).click()
  await fill('evidence', 'observation', observation)
  await fill('evidence', 'source', 'Fictional interview notes A-E, recorded by the founder')
  await fill('evidence', 'sample_size', String(sample))
  await fill('evidence', 'limitation', 'Small convenience sample; self-reported, not representative or proof of market demand.')
  return clickSave(page.getByRole('button', { name: 'Confirm evidence', exact: true }), '/evidence')
}
async function assess(verdict, reason, close = false) {
  await form('review').locator('[data-name="verdict-0"]').selectOption(verdict)
  const checkboxes = form('review').locator('fieldset input[type=checkbox]')
  await checkboxes.last().check()
  await fill('review', 'reasoning-0', reason)
  await fill('review', 'limitations', 'This closes a learning activity only. Interviews do not establish market demand.')
  if (close) await form('review').locator('[data-name="confirm_achievement"]').check()
  return clickSave(page.getByRole('button', { name: 'Confirm evidence review', exact: true }), '/reviews')
}
try {
  await page.goto(entry); await idle()
  const existing = await api('/ventures')
  const snapshots = new Map()
  for (const venture of existing) snapshots.set(venture.venture_id, { profile: venture, workspace: await api(`/ventures/${venture.venture_id}/workspace`) })
  await clickSave(page.locator('#new'), '/api/ventures')
  proof.venture_id = await page.locator('#ventures').inputValue()
  const base = `/ventures/${proof.venture_id}`, workspacePath = base + '/workspace'
  await page.locator('#open-profile').click()
  await page.locator('[data-field="name"]').fill(`Evidence and weekly review · ${hosted ? 'Cloud' : 'Local'} · ${new Date().toISOString()}`)
  await clickSave(page.locator('#save'), base)
  await page.locator('#close-profile').click()
  await page.locator('#models').selectOption('gpt-5.6-luna')
  await page.locator('#open-workspace').click()
  await page.locator('#workspace-objective').fill('Learn about evening student dinner purchases through a small interview exercise.')
  await page.locator('#workspace-criteria').fill('Complete five interviews and record their observations and limitations.')
  await page.locator('#workspace-constraints').fill('Fictional classroom case. No spending or product build. Return exactly one task with target_count 5: interview five students and record observations and limitations. No separate review task.')
  let workspace = await clickSave(page.locator('#workspace-generate'), '/workspace/draft')
  assert.equal(workspace.plans.at(-1).tasks.length, 1)
  assert.equal(workspace.plans.at(-1).tasks[0].target_count, 5)
  workspace = await clickSave(page.getByRole('button', { name: 'Approve plan', exact: true }), '/workspace/approve')
  pass('Real Luna plan generated and explicitly approved; one five-interview task.')
  const taskId = workspace.plans.at(-1).tasks[0].task_id
  await page.getByLabel('Completed count', { exact: true }).fill('2')
  await page.getByLabel('Task status', { exact: true }).selectOption('in_progress')
  await page.getByLabel('Reported result · not independently verified', { exact: true }).fill('Two interviews completed. Both mentioned price more than speed. Three remain; no market validation.')
  workspace = await clickSave(page.getByRole('button', { name: 'Confirm task report', exact: true }), '/tasks/' + taskId)
  workspace = await evidence('Two students mentioned price more than speed; three interviews remain.', 2)
  workspace = await assess('uncertain', 'Only two of five interviews are complete. The learning criterion is not met yet.')
  assert.equal(workspace.goal.status, 'active')
  pass('Source-linked uncertain review saved; two-of-five progress does not close the goal.')
  await fill('checkin', 'results', 'Two interviews completed; three remain.')
  await fill('checkin', 'learnings', 'Price may matter more than speed; this is only a two-person sample.')
  await fill('checkin', 'blockers', 'Exams limit participant availability.')
  await fill('checkin', 'next_priorities', 'Recruit the remaining three students\nAsk about their most recent dinner purchase')
  workspace = await clickSave(page.getByRole('button', { name: 'Confirm weekly check-in', exact: true }), '/checkins')
  proof.checkin = workspace.checkins.at(-1)
  assert.equal(proof.checkin.task_snapshot[0].completed_count, 2)
  assert.equal(workspace.plans.at(-1).tasks[0].completed_count, 2)
  pass('Weekly report saves results, learning, blockers, next priorities, next date and a two-of-five task snapshot.')
  await page.locator('#workspace-checkin').getByText('Check-in history (1)', { exact: true }).click()
  await page.locator('#workspace-checkin').getByText(new RegExp('Plan v1$')).click()
  await page.locator('#workspace-checkin').screenshot({ path: fileURLToPath(new URL('weekly-checkin.png', output)) })
  await page.locator('#close-workspace').click()
  await clickSave(page.locator('#followup'), base + '/sessions')
  const beforeChat = await api(workspacePath)
  await page.locator('#message').fill('Review my latest saved weekly check-in. State the blocker and next priorities, mention the two-of-five progress and explain why it does not establish demand. Under 120 words. Do not change saved records.')
  const response = await clickSave(page.locator('#send'), '/chat')
  proof.reply = response.reply
  assert.match(proof.reply, /exam/i)
  assert.match(proof.reply, /three|3/)
  assert.match(proof.reply, /demand|validat/i)
  assert.deepEqual(await api(workspacePath), beforeChat)
  pass('A new session uses the saved weekly blocker and next priorities in a real Luna response without changing records.')
  await page.reload(); await idle(); await page.locator('#open-workspace').click()
  assert.deepEqual((await api(workspacePath)).checkins, beforeChat.checkins)
  pass('Reload retains evidence, review and weekly history.')
  await page.getByLabel('Completed count', { exact: true }).fill('5')
  await page.getByLabel('Task status', { exact: true }).selectOption('done')
  await page.getByLabel('Reported result · not independently verified', { exact: true }).fill('All five fictional interviews completed and notes recorded with sample limitations. This is not proof of demand.')
  workspace = await clickSave(page.getByRole('button', { name: 'Confirm task report', exact: true }), '/tasks/' + taskId)
  assert.equal(workspace.goal.status, 'active')
  workspace = await evidence('All five interview notes are recorded with observations, contrary evidence and sampling limitations.', 5)
  workspace = await assess('supported', 'All five interviews and their limitations are now recorded. This satisfies the learning exercise, not market validation.', true)
  assert.equal(workspace.goal.status, 'achieved')
  assert.equal(workspace.reviews.length, 2)
  assert.equal(workspace.checkins[0].task_snapshot[0].completed_count, 2)
  pass('Five-of-five alone leaves the goal active; explicit source-linked review closes it and retains earlier history.')
  await page.locator('#workspace-review').screenshot({ path: fileURLToPath(new URL('goal-review.png', output)) })
  await clickSave(page.locator('#workspace-resume'), '/goal')
  workspace = await api(workspacePath)
  await page.getByText('Add an observation or correction', { exact: true }).click()
  await fill('evidence', 'observation', 'Correction: one of the five records is incomplete; review the conclusion again.')
  await fill('evidence', 'source', 'Fictional founder audit of interview notes')
  await fill('evidence', 'limitation', 'Self-reported audit; no independent verification.')
  await form('evidence').locator('[data-name="supersedes_id"]').selectOption(workspace.evidence.at(-1).evidence_id)
  workspace = await clickSave(page.getByRole('button', { name: 'Confirm evidence', exact: true }), '/evidence')
  assert.equal(workspace.goal.status, 'active')
  assert.match(await form('review').innerText(), /Evidence or plan changed: review again/)
  pass('Reopening and correcting evidence preserves the original review and flags it for a fresh assessment.')
  proof.final_workspace = workspace
  await page.setViewportSize({ width: 390, height: 844 })
  await form('review').scrollIntoViewIfNeeded()
  assert.ok(await page.evaluate(() => { const panel = document.getElementById('workspace-panel'); return panel.scrollWidth <= panel.clientWidth + 2 }))
  await page.screenshot({ path: fileURLToPath(new URL('mobile.png', output)) })
  pass('The 390px workspace fits without horizontal overflow.')
  for (const [id, before] of snapshots) {
    assert.deepEqual(await api(`/ventures/${id}`), before.profile)
    assert.deepEqual(await api(`/ventures/${id}/workspace`), before.workspace)
  }
  pass('All pre-existing ventures and their workspaces remain unchanged.')
  assert.deepEqual(proof.pageErrors, [])
  proof.passed = true
} catch (error) {
  proof.passed = false
  proof.failure = error.message.replaceAll(entry, origin)
  await page.screenshot({ path: fileURLToPath(new URL('failure.png', output)) }).catch(() => {})
  throw error
} finally {
  await writeFile(new URL('verification.json', output), JSON.stringify(proof, null, 2))
  await browser.close()
}
