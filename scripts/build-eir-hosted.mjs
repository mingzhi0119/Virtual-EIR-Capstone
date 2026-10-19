// Publish an explicit source bundle; credentials and local data never enter it.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'var/eir-hosted')
execFileSync(process.execPath, [path.join(root, 'scripts/build-eir-ui.mjs')], { cwd: root, stdio: 'inherit' })
const python = ['__init__', 'app', 'coaching', 'models', 'store', 'runtime', 'openai_client', 'personas', 'feature_models', 'feature_store', 'feature_routes', 'planning', 'reviews', 'postgres_store', 'hosted']
const web = ['index.html', 'style.css', 'app.js', 'workspace.js', 'reviews.js', 'generated/appearance.js', 'generated/appearance.css']
const files = [
  ...python.map(name => [`eir/${name}.py`, `eir/${name}.py`]),
  ...web.map(name => [`eir/web/${name}`, `eir/web/${name}`]),
  ['eir/prompts/coach.txt', 'eir/prompts/coach.txt'],
  ['hosting/main.py', 'main.py'], ['hosting/requirements.txt', 'requirements.txt'],
  ['hosting/vercel.json', 'vercel.json'],
]
const allowed = new Set(files.map(([, target]) => target))
for (const [source, target] of files) {
  await mkdir(path.dirname(path.join(out, target)), { recursive: true })
  await copyFile(path.join(root, source), path.join(out, target))
}
allowed.add('.vercelignore')
// Every publishable file is copied above and checked below. Exclude local CLI
// controls explicitly: Vercel's walker prunes directories before negated globs.
await writeFile(path.join(out, '.vercelignore'), '.env*\n.vercel\n.agents\n.claude\nskills-lock.json\n.gitignore\ncreate-project.json\n')
const entries = await readdir(out, { recursive: true, withFileTypes: true })
const manifest = []
for (const entry of entries.filter(item => item.isFile())) {
  const relative = path.relative(out, path.join(entry.parentPath, entry.name)).split(path.sep).join('/')
  if (!allowed.has(relative)) {
    assert.ok(relative.startsWith('.vercel/') || relative.startsWith('.env') || relative.startsWith('.agents/') || relative.startsWith('.claude/') || relative === 'skills-lock.json' || relative === '.gitignore' || relative === 'create-project.json', `Unexpected bundle file: ${relative}`)
    continue
  }
  const text = await readFile(path.join(out, relative), 'utf8')
  assert.doesNotMatch(text, /sk-(?:proj-)?[A-Za-z0-9_-]{30,}/, `Credential in ${relative}`)
  manifest.push(relative)
}
await mkdir(path.join(root, 'var/eir-hosted-proof'), { recursive: true })
await writeFile(path.join(root, 'var/eir-hosted-proof/bundle.json'), JSON.stringify({ files: manifest.sort(), credentials: false, localDatabases: false }, null, 2))
console.log(`Hosted source bundle: ${out} (${manifest.length} allowlisted files)`)
