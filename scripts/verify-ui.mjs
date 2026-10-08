// Automated behavior proof, not manual visual verification. Chat is mocked here;
// real model and storage evidence is recorded by verify-demo.py.
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { chromium } from '../apps/goat/frontend/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
try {
  await page.goto('http://127.0.0.1:62607')
  await page.waitForFunction(() => document.getElementById('models').options.length > 0)
  await page.locator('#new').click()
  await page.waitForFunction(() => document.getElementById('status').textContent.includes('已建立虚构项目') && !document.getElementById('new').disabled)
  assert.match(await page.locator('#revision').textContent(), /版本 1/)
  const venture = await page.locator('#ventures').inputValue()
  await page.locator('#plan').click()
  const planned = JSON.parse(await page.locator('#profile').inputValue())
  assert.equal(planned.actions[0].target_count, 5)
  assert.equal(planned.actions[0].completed_count, 0)
  await page.locator('#save').click()
  await page.waitForFunction(() => document.getElementById('revision').textContent.includes('版本 2'))
  await page.locator('#result').click()
  await page.locator('#followtext').click()
  await page.locator('#send').click()
  await page.waitForFunction(() => document.getElementById('status').textContent.includes('未保存修改'))
  await page.locator('#save').click()
  await page.waitForFunction(() => document.getElementById('revision').textContent.includes('版本 3'))
  await page.locator('#followup').click()
  await page.waitForFunction(() => document.getElementById('status').textContent.includes('已建立全新跟进会话') && !document.getElementById('followup').disabled)
  assert.equal(await page.locator('#sessions option').count(), 2)
  const session = await page.locator('#sessions').inputValue()
  assert.equal(await page.evaluate(id => localStorage.getItem(`eir-session-${id}`), venture), session)
  await page.reload()
  await page.waitForFunction(() => document.getElementById('models').options.length > 0)
  assert.equal(await page.locator('#ventures').inputValue(), venture)
  assert.equal(await page.locator('#sessions').inputValue(), session)
  const restored = JSON.parse(await page.locator('#profile').inputValue())
  assert.equal(restored.actions[0].target_count, 5)
  assert.equal(restored.actions[0].completed_count, 2)
  assert.equal(restored.evidence[0].sample_size, 2)
  // Model failure must surface visibly and leave the confirmed editor intact.
  await page.route('**/api/ventures/*/sessions/*/chat', route => route.fulfill({
    status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'Mock model unavailable' }),
  }))
  await page.locator('#followtext').click()
  await page.locator('#send').click()
  await page.waitForFunction(() => document.getElementById('status').textContent.includes('Mock model unavailable'))
  assert.equal(JSON.parse(await page.locator('#profile').inputValue()).actions[0].completed_count, 2)
  // Invalid JSON helpers must explain the error instead of crashing the page.
  const confirmedText = await page.locator('#profile').inputValue()
  await page.locator('#profile').fill('{')
  await page.locator('#plan').click()
  await page.waitForFunction(() => document.getElementById('status').classList.contains('error'))
  assert.equal(await page.locator('#profile').inputValue(), '{')
  await page.locator('#profile').fill(confirmedText)
  // Unsaved state blocks creation, and formatting-only changes do not block chat.
  const draft = JSON.parse(confirmedText)
  draft.actions[0].completed_count = 3
  await page.locator('#profile').fill(JSON.stringify(draft))
  const beforeSessions = await page.locator('#sessions option').count()
  await page.locator('#followup').click()
  await page.waitForFunction(() => document.getElementById('status').textContent.includes('未保存修改'))
  assert.equal(await page.locator('#sessions option').count(), beforeSessions)
  await page.locator('#profile').fill(JSON.stringify(JSON.parse(confirmedText)))
  await page.locator('#send').click()
  await page.waitForFunction(() => document.getElementById('status').textContent.includes('Mock model unavailable'))
  // A failed project-list load cannot combine one venture with another session.
  const otherResponse = await page.request.post('http://127.0.0.1:62607/api/ventures', { data: { name: 'UI isolation fixture' } })
  const other = await otherResponse.json()
  await page.reload()
  await page.waitForFunction(() => document.getElementById('models').options.length > 0)
  await page.route(`**/api/ventures/${other.venture_id}/sessions`, route => route.fulfill({
    status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'Mock session-list failure' }),
  }))
  await page.locator('#ventures').selectOption(other.venture_id)
  await page.waitForFunction(() => document.getElementById('status').textContent.includes('Mock session-list failure'))
  assert.equal(await page.locator('#ventures').inputValue(), venture)
  assert.equal(await page.locator('#sessions').inputValue(), session)
  // A successful reply stays visible even when sidebar refresh fails afterward.
  await page.unroute('**/api/ventures/*/sessions/*/chat')
  const active = await (await page.request.get(`http://127.0.0.1:62607/api/ventures/${venture}/sessions/${session}`)).json()
  await page.route('**/api/ventures/*/sessions/*/chat', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({
      session: { ...active, turns: [{ role: 'user', content: 'mock question' }, { role: 'assistant', content: 'Mock saved reply stays visible' }] },
      reply: 'Mock saved reply stays visible', context_revision: 3, elapsed_seconds: 0.1,
      goat_session_id: `eir-${session}`,
    }),
  }))
  await page.route(`**/api/ventures/${venture}/sessions`, route => route.request().method() !== 'GET' ? route.continue() : route.fulfill({
    status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'Mock refresh failure' }),
  }))
  await page.locator('#followtext').click()
  await page.locator('#send').click()
  await page.waitForFunction(() => document.getElementById('status').textContent.includes('回复已保存') && document.getElementById('status').textContent.includes('列表刷新失败'))
  assert.match(await page.locator('#transcript').textContent(), /Mock saved reply stays visible/)
  // A persisted creation must be remembered before the sidebar GET can fail.
  await page.locator('#followup').click()
  await page.waitForFunction(() => document.getElementById('status').textContent.includes('新会话已建立；列表刷新失败'))
  const createdSession = await page.evaluate(id => localStorage.getItem(`eir-session-${id}`), venture)
  assert.notEqual(createdSession, session)
  assert.match(await page.locator('#sessionmeta').textContent(), new RegExp(createdSession))
  await page.unroute(`**/api/ventures/${venture}/sessions`)
  await page.reload()
  await page.waitForFunction(() => document.getElementById('models').options.length > 0)
  assert.equal(await page.locator('#sessions').inputValue(), createdSession)
  assert.deepEqual(errors, [])
  const evidence = {
    run_at: new Date().toISOString(), browser: 'installed Edge / Playwright headless',
    model_calls: 'mocked for chat success/error UI feedback; real model proof is separate',
    checks: ['project creation', 'plan confirmation', 'unsaved edit chat guard', 'result confirmation',
      'new follow-up session', 'page reload project/session/state recovery', 'visible model error', 'invalid JSON helper feedback',
      'unsaved follow-up guard', 'formatting-only edit accepted', 'atomic failed project switch', 'saved reply survives failed refresh',
      'created session survives failed refresh and reload', 'no page errors'],
    passed: true,
  }
  await writeFile(new URL('../docs/archive/2026-10-08-ui-proof.json', import.meta.url), JSON.stringify(evidence, null, 2))
  console.log('14 automated UI behavior checks passed; no screenshots or manual visual claims.')
} finally {
  await browser.close()
}
