// Git deployments build from hosting/ and publish the same allowlisted app as the CLI.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cp, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const destination = path.join(root, 'hosting', 'eir')
assert.equal(path.dirname(destination), path.join(root, 'hosting'))
assert.equal(path.basename(destination), 'eir')

// Vercel installs the Python requirements first; Node dependencies are build-only.
if (process.env.VERCEL === '1') {
  execFileSync('npm', ['ci', '--prefix', 'apps/goat/frontend', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: root, stdio: 'inherit' })
}
execFileSync(process.execPath, [path.join(root, 'scripts/build-eir-hosted.mjs')], { cwd: root, stdio: 'inherit' })
const manifest = JSON.parse(await readFile(path.join(root, 'var/eir-hosted-proof/bundle.json'), 'utf8'))
assert.equal(manifest.credentials, false)
assert.equal(manifest.localDatabases, false)
assert.ok(manifest.files.includes('eir/web/generated/appearance.js'))
assert.ok(manifest.files.includes('eir/web/generated/appearance.css'))
await rm(destination, { recursive: true, force: true })
await cp(path.join(root, 'var/eir-hosted/eir'), destination, { recursive: true })
console.log('Vercel app prepared in hosting/eir; build dependencies stay outside the app root.')
