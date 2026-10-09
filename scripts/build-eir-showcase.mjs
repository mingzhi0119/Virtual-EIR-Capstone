// Explicit allowlist: publish recorded fictional content, never the runtime DB or raw archive.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'var/eir-showcase')
const evidence = JSON.parse(await readFile(path.join(root, 'docs/archive/2026-10-08-english-demo.json'), 'utf8'))
assert.match(evidence.case, /Fictional/)
assert.equal(evidence.model, 'gemma4:26b')
const pick = (value, keys) => Object.fromEntries(keys.map(key => [key, value[key]]))
const publicProfile = value => ({
  ...pick(value, ['name', 'customer', 'problem', 'stage', 'assumptions']),
  actions: value.actions.map(item => pick(item, ['description', 'target_count', 'completed_count', 'result'])),
  evidence: value.evidence.map(item => pick(item, ['observation', 'sample_size', 'source', 'limitation'])),
})
const publicTurns = value => value.map(turn => {
  assert.ok(['user', 'assistant'].includes(turn.role))
  assert.equal(typeof turn.content, 'string')
  return pick(turn, ['role', 'content'])
})
const snapshot = {
  recordedDate: '2026-10-08', model: evidence.model, fictional: true, readOnly: true,
  sessions: [
    { id: 'first-consultation', title: 'First consultation', contextLabel: 'Recorded snapshot after the founder confirmed the five-interview plan.', profile: publicProfile(evidence.confirmed_plan.profile), turns: publicTurns(evidence.initial_response.session.turns) },
    { id: 'follow-up', title: 'Follow-up 1', contextLabel: 'Recorded founder-confirmed results used for the follow-up consultation.', profile: publicProfile(evidence.confirmed_result.profile), turns: publicTurns(evidence.followup_response.session.turns) },
  ],
}
assert.equal(snapshot.sessions[0].profile.actions[0].completed_count, 0)
assert.equal(snapshot.sessions[1].profile.actions[0].completed_count, 2)
const serialized = JSON.stringify(snapshot, null, 2)
assert.doesNotMatch(serialized, /persona_snapshot|system_instruction|session_id|venture_id|owner_id|127\.0\.0\.1|E:\\|C:\\/)
execFileSync(process.execPath, [path.join(root, 'scripts/build-eir-ui.mjs')], { cwd: root, stdio: 'inherit' })
await mkdir(path.join(out, 'assets/generated'), { recursive: true })
for (const [source, target] of [
  ['showcase/index.html', 'index.html'], ['showcase/vercel.json', 'vercel.json'],
  ['showcase/showcase.js', 'assets/showcase.js'], ['showcase/showcase.css', 'assets/showcase.css'],
  ['eir/web/style.css', 'assets/style.css'],
  ['eir/web/generated/appearance.js', 'assets/generated/appearance.js'],
  ['eir/web/generated/appearance.css', 'assets/generated/appearance.css'],
]) await copyFile(path.join(root, source), path.join(out, target))
await writeFile(path.join(out, 'assets/snapshot.js'), `export const snapshot = ${serialized}\n`)
await writeFile(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n')
await writeFile(path.join(out, '.vercelignore'), '.git\n.vercel\n.env\n.env.*\n.gitignore\n*.map\n')
const files = await readdir(out, { recursive: true, withFileTypes: true })
const allowed = new Set(['index.html', 'vercel.json', 'robots.txt', '.vercelignore', 'assets/showcase.js', 'assets/showcase.css', 'assets/style.css', 'assets/snapshot.js', 'assets/generated/appearance.js', 'assets/generated/appearance.css'])
for (const file of files.filter(item => item.isFile())) {
  const relative = path.relative(out, path.join(file.parentPath, file.name)).split(path.sep).join('/')
  // CLI project-linking creates these local control files. They are explicitly excluded above.
  const localControl = relative.startsWith('.vercel/') || relative === '.gitignore' || relative === '.env.local'
  if (!localControl) assert.ok(allowed.has(relative), `Unexpected deployment file: ${relative}`)
}
console.log(`Read-only deployment directory: ${out}`)
console.log('Two recorded sessions; no backend, runtime databases, system prompts, or source maps.')
