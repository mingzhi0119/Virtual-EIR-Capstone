// Uses the GOAT lockfile's existing Vite/React/Lucide dependencies. No extra install.
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const modules = path.join(root, 'apps/goat/frontend/node_modules')
const { build } = await import(pathToFileURL(path.join(modules, 'vite/dist/node/index.js')).href)
await build({
  configFile: false, root, define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  resolve: { alias: Object.fromEntries(['react', 'react-dom', 'react-markdown', 'remark-gfm', 'remark-math', 'rehype-katex', 'katex', 'lucide-react'].map(name => [name, path.join(modules, name)])) },
  build: {
    outDir: path.join(root, 'eir/web/generated'), emptyOutDir: false,
    lib: { entry: path.join(root, 'eir/frontend/appearance.ts'), formats: ['es'], fileName: () => 'appearance.js', cssFileName: 'appearance' },
    sourcemap: false, minify: true,
  },
})
