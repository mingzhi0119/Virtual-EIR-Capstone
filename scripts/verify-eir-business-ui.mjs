// Read-only browser verification: appearance, business copy and retained records.
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '../apps/goat/frontend/node_modules/playwright/index.mjs'

const hosted = process.env.EIR_UI_TARGET === 'hosted'
const entry = hosted ? (await readFile(new URL('../var/eir-hosted-proof/share-link.txt', import.meta.url), 'utf8')).trim() : 'http://127.0.0.1:62609/'
const output = new URL(`../var/eir-business-ui/${hosted ? 'hosted' : 'local'}/`, import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
const proof = { hosted, at: new Date().toISOString(), checks: [], errors: [] }
page.on('pageerror', error => proof.errors.push(error.message))
const pass = text => { proof.checks.push(text); console.log(text) }
const idle = () => page.waitForFunction(() => !document.getElementById('new').disabled)
const noDebug = async () => assert.doesNotMatch(await page.locator('body').innerText(), /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b|profile revision|workspace revision|Advanced:|task_id|source_plan_id|Built on GOAT|local services/i)
const api = async path => { const response = await page.request.get(new URL('/api' + path, entry).href); assert.ok(response.ok()); return response.json() }
async function snapshot() {
  const ventures = await api('/ventures')
  return Promise.all(ventures.map(async venture => ({ venture, workspace: await api(`/ventures/${venture.venture_id}/workspace`) })))
}
try {
  await page.goto(entry); await idle()
  if (hosted) {
    const visitor = await browser.newContext()
    const protectedResponse = await visitor.request.get(new URL('/api/ventures', entry).href, { maxRedirects: 0 })
    assert.ok([302, 303, 307, 308, 401, 403].includes(protectedResponse.status()))
    await visitor.close()
    pass('Existing invitation opens the deployment; a visitor without it cannot read venture records.')
  }
  const before = await snapshot()
  assert.match(await page.title(), /Ain Center/)
  await noDebug()
  assert.equal(await page.locator('html').getAttribute('data-theme-style'), 'urochester')
  pass('Ain Center branding and Rochester default; no visible internal identifiers.')
  await page.locator('#open-profile').click()
  assert.equal(await page.locator('#profile').isVisible(), false)
  assert.ok(await page.locator('#field-name').inputValue())
  await page.locator('.profile-context summary').click()
  await noDebug()
  await page.screenshot({ path: fileURLToPath(new URL('venture-profile.png', output)) })
  await page.locator('#close-profile').click()
  pass('Business profile, founder preferences and earlier observations remain accessible.')
  await page.locator('#open-workspace').click()
  await page.locator('#workspace-history').evaluate(el => { el.open = true })
  await page.locator('#workspace-history-content details').evaluateAll(list => list.forEach(el => { el.open = true }))
  await noDebug()
  assert.equal(await page.locator('.workspace-json:visible').count(), 0)
  assert.equal(await page.locator('#workspace-tasks-json:visible').count(), 0)
  await page.screenshot({ path: fileURLToPath(new URL('business-workspace.png', output)) })
  await page.locator('#close-workspace').click()
  pass('Goals, evidence, weekly check-in and readable plan history expose no JSON or UUIDs.')
  await page.locator('#open-appearance').click()
  const backgrounds = new Set()
  for (const style of ['classic', 'urochester', 'thu']) {
    await page.locator('#theme-style').selectOption(style)
    for (const mode of ['light', 'dark', 'system']) {
      await page.locator('#theme-mode').selectOption(mode)
      assert.equal(await page.locator('html').getAttribute('data-theme-style'), style)
      assert.equal(await page.locator('html').getAttribute('data-theme-mode'), mode)
      backgrounds.add(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg-main')))
    }
  }
  assert.ok(backgrounds.size >= 5)
  await page.locator('#theme-mode').selectOption('system')
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.waitForFunction(() => document.documentElement.dataset.themeResolved === 'dark')
  await page.emulateMedia({ colorScheme: 'light' })
  await page.waitForFunction(() => document.documentElement.dataset.themeResolved === 'light')
  pass('Original GOAT theme tokens work across three styles and three modes; System follows device changes.')
  await page.locator('#theme-style').selectOption('urochester')
  await page.locator('#theme-mode').selectOption('dark')
  await page.locator('#theme-font').selectOption('humanist')
  await page.locator('#theme-contrast').fill('65')
  await page.locator('#theme-translucent').uncheck()
  await page.locator('#theme-presets button').nth(1).click()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('goat-ai-appearance')))
  await page.reload(); await idle()
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('goat-ai-appearance'))), saved)
  assert.equal(await page.locator('html').getAttribute('data-theme-resolved'), 'dark')
  await page.locator('#open-appearance').click()
  assert.equal(await page.locator('#theme-font').inputValue(), 'humanist')
  assert.equal(await page.locator('#theme-contrast').inputValue(), '65')
  assert.equal(await page.locator('#theme-translucent').isChecked(), false)
  assert.equal(await page.locator('#theme-accent').inputValue(), saved.accentColor)
  await page.screenshot({ path: fileURLToPath(new URL('theme-dark.png', output)) })
  pass('Accent, font, contrast, sidebar treatment and dark mode survive reload.')
  await page.locator('#theme-reset').click()
  await page.locator('#theme-mode').selectOption('light')
  await page.locator('#close-appearance').click()
  await page.screenshot({ path: fileURLToPath(new URL('desktop-light.png', output)) })
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  for (const name of ['profile', 'workspace', 'appearance']) {
    await page.locator(`#open-${name}`).click()
    assert.equal(await page.locator(`#${name}-panel`).evaluate(dialog => { const b = dialog.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth && dialog.scrollWidth <= b.width }), true)
    await noDebug()
    await page.locator(`#close-${name}`).click()
  }
  await page.screenshot({ path: fileURLToPath(new URL('mobile.png', output)) })
  pass('390px phone layout and all three dialogs fit without horizontal overflow.')
  assert.deepEqual(await snapshot(), before)
  assert.deepEqual(proof.errors, [])
  pass('All saved ventures and workspaces remain unchanged; zero browser errors.')
  proof.passed = true
} catch (error) {
  proof.error = error.stack; process.exitCode = 1; console.error(error)
} finally {
  await writeFile(new URL('verification.json', output), JSON.stringify(proof, null, 2))
  await browser.close()
}
