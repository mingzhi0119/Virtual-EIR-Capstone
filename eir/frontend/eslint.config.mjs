import { createRequire } from 'node:module'
const require = createRequire(new URL('../../apps/goat/frontend/package.json', import.meta.url))
const js = require('@eslint/js')
const globals = require('globals')
export default [
  { ignores: ['eir/web/generated/**'] },
  { ...js.configs.recommended, files: ['eir/web/*.js', 'showcase/*.js', 'scripts/*eir*.mjs', 'scripts/verify-ui.mjs', 'scripts/verify-week4-workspace-edges.mjs'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { 'no-unused-vars': ['error', { caughtErrors: 'none' }] } },
]
