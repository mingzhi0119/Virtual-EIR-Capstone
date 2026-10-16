// Reproduce the editable Artifact Session design, then validate and render PPTX.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { addWeek4Slides } from './week4-deck.mjs'

const workspaceDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const { SKILL_DIR, RUNTIME_NODE_MODULES, RUNTIME_PYTHON } = process.env
for (const [key, value] of Object.entries({ SKILL_DIR, RUNTIME_NODE_MODULES, RUNTIME_PYTHON })) {
  if (!value || !path.isAbsolute(value)) throw Error(`Set an absolute ${key}`)
}
const { finalizePresentation } = await import(pathToFileURL(path.join(SKILL_DIR, 'container_tools/artifact_tool_utils.mjs')).href)
const { Presentation, PresentationFile, FileBlob } = await import(pathToFileURL(path.join(RUNTIME_NODE_MODULES, '@oai/artifact-tool/dist/artifact_tool.mjs')).href)
const buildDir = path.join(workspaceDir, 'var/week4-proof')
const finalPath = path.join(workspaceDir, 'deliverables/2026-10-16/Virtual-EIR-Week4.pptx')
// Session-host native export stayed pending with zero bytes; use the bundled exporter.
const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } })
const cover = presentation.slides.add()
cover.background.fill = '#0D1424'
for (const [value, top, size, height, color] of [
  ['Virtual EIR', 172, 72, 110, '#FFFFFF'],
  ['Week 4 milestone\nAdaptive coaching and founder action planning', 313, 30, 130, '#D1DCEE'],
  ['Mingzhi Hu  /  Faculty update  /  October 16, 2026', 605, 21, 45, '#B7C6DC'],
]) {
  const shape = cover.shapes.add({ geometry: 'textbox', position: { left: 72, top, width: 1120, height }, fill: 'none', line: { fill: 'none', width: 0 } })
  shape.text = value
  shape.text.style = { typeface: 'Arial', fontSize: size, color, bold: size === 72 }
}
cover.speakerNotes.text = 'Today I will show the Week 4 foundation: adaptive coaching style and an explicit Goal and Plan workspace. This extends my pre-existing GOAT AI platform. The examples are fictional and the system runs locally. We distinguish delivered application behavior from unvalidated coaching quality and future features. Sources: Week4-Progress-Report.md and approved Week 4 plans.'
const screenshots = {}
for (const name of ['persona-detail.png', 'goal-form.png', 'progress-detail.png']) screenshots[name] = new Uint8Array(await fs.readFile(path.join(buildDir, name)))
addWeek4Slides(presentation, buildDir, screenshots)
await (await PresentationFile.exportPptx(presentation)).save(path.join(buildDir, 'Week4-candidate.pptx'))
const result = await finalizePresentation({
  workspaceDir,
  candidatePath: path.join(buildDir, 'Week4-candidate.pptx'),
  finalPath,
  pythonExecutable: RUNTIME_PYTHON,
  integrityValidatorPath: path.join(SKILL_DIR, 'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath: path.join(SKILL_DIR, 'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs: ['--expected-slide-size-emu', '12192000,6858000', '--validate-bullet-geometry', '--validate-heading-fit'],
  explicitTotalSlideCount: 10,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  fontPolicy: { basis: 'design', families: ['Arial'] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(buildDir, `Week4-${Date.now()}.validation.json`),
})
console.log(JSON.stringify(result))
const verified = await PresentationFile.importPptx(await FileBlob.load(finalPath))
for (let i = 0; i < verified.slides.items.length; i++) {
  const slide = verified.slides.items[i]
  const png = await verified.export({ slide, format: 'png', scale: 1 })
  await fs.writeFile(path.join(buildDir, `slide-${String(i + 1).padStart(2, '0')}.png`), new Uint8Array(await png.arrayBuffer()))
}
console.log('Final PPTX re-imported and all ten slides rendered.')
