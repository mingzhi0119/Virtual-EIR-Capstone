// Read-only screenshots of the isolated, fictional verification venture.
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '../apps/goat/frontend/node_modules/playwright/index.mjs'

const out = new URL('../var/week4-proof/', import.meta.url)
const proof = JSON.parse(await readFile(new URL('workflow-real.json', out), 'utf8'))
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.addInitScript(id => {
    localStorage.setItem('eir-selected-venture', id)
  }, proof.venture_id)
  await page.goto('http://127.0.0.1:62608')
  await page.waitForFunction(() => !document.getElementById('new').disabled)
  await page.locator('#open-profile').click()
  await page.locator('.persona-fields').screenshot({ path: fileURLToPath(new URL('persona-detail.png', out)) })
  await page.locator('#close-profile').click()
  await page.locator('#open-workspace').click()
  await page.locator('.workspace-task').first().screenshot({ path: fileURLToPath(new URL('progress-detail.png', out)) })
  await page.locator('#workspace-panel').evaluate(el => { el.scrollTop = 0 })
  await page.locator('.workspace-section').first().screenshot({ path: fileURLToPath(new URL('goal-form.png', out)) })
  await page.locator('#workspace-panel').screenshot({ path: fileURLToPath(new URL('goal-detail.png', out)) })
  await page.locator('#workspace-history summary').first().click()
  await page.locator('#workspace-history').screenshot({ path: fileURLToPath(new URL('history-detail.png', out)) })
} finally { await browser.close() }
