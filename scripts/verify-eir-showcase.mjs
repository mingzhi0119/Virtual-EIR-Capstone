import assert from 'node:assert/strict'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { chromium } from '../apps/goat/frontend/node_modules/playwright/index.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const site = path.join(root, 'var/eir-showcase')
const proof = path.join(root, 'var/eir-showcase-proof')
await mkdir(proof, { recursive: true })
const config = JSON.parse(await readFile(path.join(site, 'vercel.json'), 'utf8'))
const evidence = JSON.parse(await readFile(path.join(root, 'docs/archive/2026-10-08-english-demo.json'), 'utf8'))
const { snapshot } = await import(new URL('../var/eir-showcase/assets/snapshot.js', import.meta.url).href)
const checks = [], errors = [], requests = []
const pass = name => checks.push(name)
assert.deepEqual(snapshot.sessions[0].turns, evidence.initial_response.session.turns.map(({ role, content }) => ({ role, content })))
assert.deepEqual(snapshot.sessions[1].turns, evidence.followup_response.session.turns.map(({ role, content }) => ({ role, content })))
pass('Actual recorded user/model turns preserved verbatim')
const snapshotSource = await readFile(path.join(site, 'assets/snapshot.js'), 'utf8')
assert.doesNotMatch(snapshotSource, /system_instruction|persona_snapshot|owner_id|session_id|venture_id|127\.0\.0\.1|duckdns|github\.com|E:\\|C:\\/)
const localFiles = (await readdir(site, { recursive: true, withFileTypes: true })).filter(item => item.isFile()).map(item => path.relative(site, path.join(item.parentPath, item.name)).split(path.sep).join('/'))
const ignore = await readFile(path.join(site, '.vercelignore'), 'utf8')
for (const rule of ['.vercel', '.env', '.env.*', '.gitignore', '*.map']) assert.ok(ignore.split('\n').includes(rule))
const files = localFiles.filter(file => !file.startsWith('.vercel/') && file !== '.env.local' && file !== '.gitignore')
assert.ok(files.every(file => ['index.html', 'vercel.json', '.vercelignore', 'robots.txt', 'assets/showcase.js', 'assets/showcase.css', 'assets/style.css', 'assets/snapshot.js', 'assets/generated/appearance.js', 'assets/generated/appearance.css'].includes(file)))
assert.ok(!files.some(file => /\.(?:map|sqlite3?|db|py|tsx?|env)$/.test(file)))
pass('Allowlisted bundle excludes source maps, backend, databases, private prompts and machine metadata')

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.txt': 'text/plain; charset=utf-8' }
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1)
    if (!files.includes(relative) || relative.startsWith('.vercel') || relative === 'vercel.json') {
      response.writeHead(404); response.end('Not found'); return
    }
    for (const header of config.headers[0].headers) response.setHeader(header.key, header.value)
    response.setHeader('Content-Type', mime[path.extname(relative)] || 'application/octet-stream')
    response.end(await readFile(path.join(site, relative)))
  } catch { response.writeHead(404); response.end('Not found') }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const remote = process.argv[2]
if (remote) assert.equal(new URL(remote).origin, 'https://virtual-eir-showcase.vercel.app')
const address = remote ? new URL(remote).origin : `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('request', request => requests.push({ url: request.url(), method: request.method() }))
async function idle() { await page.waitForFunction(() => document.getElementById('transcript').children.length === 2) }
try {
  const response = await page.goto(address)
  await idle()
  assert.equal(response.status(), 200)
  assert.match(response.headers()['content-security-policy'], /connect-src 'none'/)
  assert.match(response.headers()['x-robots-tag'], /noindex/)
  assert.equal(await page.locator('html').getAttribute('lang'), 'en')
  assert.match(await page.locator('.recording-banner').innerText(), /No new replies are generated/)
  assert.equal(await page.locator('#sessions option').count(), 2)
  assert.match(await page.locator('#context-summary').textContent(), /5 planned \/ 0 completed \/ 5 remaining/)
  for (const id of ['new', 'send', 'message']) assert.equal(await page.locator(`#${id}`).isDisabled(), true)
  assert.equal(await page.locator('button').filter({ hasText: 'Confirm and save' }).count(), 0)
  pass('English first-session page, read-only disclosure and disabled writes')
  await page.locator('#open-profile').click()
  assert.match(await page.locator('#action-summary').textContent(), /Completed: 0/)
  assert.equal(await page.locator('#field-name').getAttribute('readonly'), '')
  assert.equal(await page.locator('#evidence-summary').textContent(), 'No evidence reported yet.')
  await page.locator('#close-profile').click()
  await page.locator('#followtext').click()
  assert.match(await page.locator('#context-summary').textContent(), /5 planned \/ 2 completed \/ 3 remaining/)
  assert.match(await page.locator('.assistant .message-content').textContent(), /completed 2 out of your planned 5 interviews/)
  assert.equal(await page.locator('.katex-error').count(), 0)
  await page.locator('#open-profile').click()
  assert.match(await page.locator('#action-summary').textContent(), /Completed: 2/)
  assert.match(await page.locator('#evidence-summary').textContent(), /Sample: 2/)
  await page.locator('#advanced-profile summary').click()
  const publicProfile = JSON.parse(await page.locator('#profile').inputValue())
  assert.deepEqual(publicProfile, snapshot.sessions[1].profile)
  assert.match(await page.locator('#profile-panel').textContent(), /hypothetical willingness-to-pay/)
  await page.locator('#close-profile').click()
  pass('Follow-up and corresponding founder-confirmed snapshot retain 5 planned / 2 completed / 3 remaining')
  await page.reload(); await idle()
  assert.equal(await page.locator('#sessions').inputValue(), 'follow-up')
  await page.locator('[data-session="first-consultation"]').click()
  assert.equal(await page.locator('#sessions').inputValue(), 'first-consultation')
  pass('Session buttons, deep links and reload select the correct recording')
  await page.locator('#open-appearance').click()
  for (const theme of ['classic', 'urochester', 'thu']) {
    await page.locator('#theme-style').selectOption(theme)
    for (const mode of ['light', 'dark']) {
      await page.locator('#theme-mode').selectOption(mode)
      const colors = await page.evaluate(() => ({ background: getComputedStyle(document.body).backgroundColor, text: getComputedStyle(document.body).color }))
      assert.notEqual(colors.background, colors.text)
    }
  }
  await page.locator('#theme-style').selectOption('classic')
  await page.locator('#theme-mode').selectOption('light')
  await page.locator('#close-appearance').click()
  await page.locator('#followtext').click()
  await page.screenshot({ path: path.join(proof, remote ? 'remote-desktop.png' : 'desktop.png'), fullPage: true })
  pass('Three GOAT themes and light/dark mode remain available without any backend')
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await page.locator('#sessions').selectOption('first-consultation')
  await page.locator('#sessions').selectOption('follow-up')
  await page.screenshot({ path: path.join(proof, remote ? 'remote-mobile.png' : 'mobile.png'), fullPage: true })
  await page.locator('#open-profile').click()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await page.locator('#profile-panel').press('Escape')
  pass('Mobile session navigation and profile dialog fit the viewport')
  assert.ok(requests.every(request => request.method === 'GET' && request.url.startsWith(address) && !new URL(request.url).pathname.startsWith('/api')))
  assert.deepEqual(errors, [])
  assert.doesNotMatch(await page.locator('body').innerText(), /[\u4e00-\u9fff]/)
  pass('No model/API calls, external requests, mutations, Chinese visible text or browser errors')
  if (remote) {
    const deployedSnapshot = await fetch(`${address}/assets/snapshot.js`)
    assert.equal(deployedSnapshot.status, 200)
    assert.equal(await deployedSnapshot.text(), snapshotSource)
    for (const privatePath of ['/api/health', '/.env.local', '/eir/app.py', '/apps/goat/server.py', '/assets/generated/appearance.js.map']) {
      const blocked = await fetch(`${address}${privatePath}`)
      assert.equal(blocked.status, 404, `Unexpected public route: ${privatePath}`)
    }
    pass('Anonymous production access, exact recorded-content fidelity and 404 for API/private/source-map routes')
  }
  await writeFile(path.join(proof, remote ? 'remote-verification.json' : 'verification.json'), JSON.stringify({ passed: true, target: remote || 'isolated-local-static-server', checks, networkRequests: requests.length, errors, bundleFiles: files.filter(file => !file.startsWith('.vercel/')), artifactDirectory: 'var/eir-showcase-proof' }, null, 2))
  console.log(JSON.stringify({ passed: true, checks, networkRequests: requests.length, errors }, null, 2))
} finally {
  await browser.close()
  await new Promise(resolve => server.close(resolve))
}
