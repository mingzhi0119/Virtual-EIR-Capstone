// Upload the existing private key directly to server-side encrypted env only.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cli = process.env.EIR_VERCEL_CLI
assert.ok(cli, 'Set EIR_VERCEL_CLI to the installed Vercel CLI entrypoint.')
const scope = 'mingzhi0119s-projects'
function api(endpoint) {
  const args = [cli, 'api', endpoint, '--scope', scope]
  const result = spawnSync(process.execPath, args, {
    encoding: 'utf8', windowsHide: true,
  })
  if (result.status !== 0) {
    const safe = (result.stderr || '').replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]').slice(-1800)
    throw new Error('Vercel configuration failed: ' + safe)
  }
  return JSON.parse(result.stdout)
}
const project = api('/v9/projects/virtual-eir-demo')
assert.equal(project.name, 'virtual-eir-demo')
assert.equal(project.ssoProtection?.deploymentType, 'all', 'Protect every URL before configuring a key.')
const text = await readFile(path.join(root, '.env.local'), 'utf8')
const values = Object.fromEntries(text.split(/\r?\n/).filter(line => /^(OPENAI_API_KEY|EIR_OPENAI_MODEL|EIR_OPENAI_MODELS)=/.test(line)).map(line => {
  const split = line.indexOf('=')
  return [line.slice(0, split), line.slice(split + 1).trim()]
}))
assert.ok(values.OPENAI_API_KEY && !/\s/.test(values.OPENAI_API_KEY), 'Private key is missing or invalid.')
const settings = {
  OPENAI_API_KEY: values.OPENAI_API_KEY,
  EIR_OPENAI_MODEL: values.EIR_OPENAI_MODEL || 'gpt-4.1-mini',
  EIR_OPENAI_MODELS: values.EIR_OPENAI_MODELS || values.EIR_OPENAI_MODEL || 'gpt-4.1-mini',
  EIR_DEPLOYMENT_PROTECTED: '1',
}
const auth = JSON.parse(await readFile(path.join(process.env.APPDATA, 'com.vercel.cli/Data/auth.json'), 'utf8'))
assert.ok(auth.token, 'Vercel login is required.')
const result = await fetch(`https://api.vercel.com/v10/projects/${project.id}/env?upsert=true&teamId=${project.accountId}`, {
  method: 'POST', headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(Object.entries(settings).map(([key, value]) => ({ key, value, type: 'encrypted', target: ['preview', 'production'] }))),
})
if (!result.ok) throw new Error(`Vercel env configuration failed (HTTP ${result.status}); response suppressed.`)
const configured = await result.json()
assert.ok(!configured.failed?.length, 'Some server configuration settings failed.')
console.log('Configured backend-only OpenAI key, default model, allowed models and protected-deployment flag. No credential was printed.')
