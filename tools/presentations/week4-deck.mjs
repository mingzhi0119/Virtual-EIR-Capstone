// Native, editable content shared by Artifact Session and bundled PPTX export.
export function addWeek4Slides(presentation, assetRoot, assetBytes = {}) {
  const ink = '#14243A', muted = '#56657A', blue = '#245CE2', white = '#FFFFFF'
  function text(slide, value, x, y, width, height, size = 25, color = ink, bold = false) {
    const shape = slide.shapes.add({ geometry: 'textbox', position: { left: x, top: y, width, height }, fill: 'none', line: { fill: 'none', width: 0 } })
    shape.text = value
    shape.text.style = { typeface: 'Arial', fontSize: size, color, bold }
    return shape
  }
  function slide(title, section, notes) {
    const s = presentation.slides.add({ width: 1280, height: 720, background: { fill: white } })
    text(s, section.toUpperCase(), 64, 28, 1100, 30, 17, blue, true)
    text(s, title, 64, 76, 1150, 90, 38, ink, true)
    text(s, 'VIRTUAL EIR  /  WEEK 4 MILESTONE  /  OCT 16, 2026', 64, 672, 1080, 26, 14, muted)
    text(s, String(presentation.slides.items.length).padStart(2, '0'), 1152, 672, 64, 26, 14, muted)
    s.speakerNotes.text = notes
    return s
  }
  function lines(s, values, x = 68, y = 204, width = 1110, gap = 94) {
    values.forEach((v, i) => text(s, v, x, y + i * gap, width, gap - 12, 27))
  }
  function picture(s, name, x, y, width, height, alt) {
    const source = assetBytes[name] ? { blob: assetBytes[name], contentType: 'image/png' } : { path: assetRoot + '/' + name }
    s.images.add({ ...source, alt, position: { left: x, top: y, width, height }, fit: 'contain' })
  }
  let s = slide('From a continuing chat to a founder workspace', 'Delivered scope',
    'The faculty direction was to adapt the coaching persona and explore useful features, including Goal and Plan. Mingzhi supplied the four-profile mapping in the October 9 conversation. We implemented the Week 4 foundation, completed and reported on October 16, not retroactively on October 11. This is not delivery of all six future features. Sources: approved Week 4 plans; eir models/personas/planning/feature_store and web workspace; Week4-Progress-Report.md.')
  lines(s, [
    'Adapt the explanation to the founder — keep the facts unchanged.',
    'Define a measurable goal, review a plan, then approve it.',
    'Record real-world work explicitly; retain earlier plan versions.',
    'Reuse GOAT AI inference and appearance; extend the EIR layer.'
  ], 68, 204, 1110, 99)
  s = slide('Four communication styles, one evidence standard', 'Adaptive Persona',
    'A self-described background selects a starting style; explicit preference overrides it. Mixed or unknown backgrounds use general coaching. The final comparison records four backgrounds times initial/follow-up, with the same fictional facts and model. Styles are observable but overlap; this is not evidence of improved outcomes. Some model answers still address the founder as the customer; the engineering follow-up uses a hypothetical price probe and overstates price-elasticity inference. These remain quality limitations. Sources: eir/personas.py; tests/test_personas.py; persona-real.json; Persona-Review.md.')
  const rows = [
    ['Engineer', 'Technical constraints, trade-offs, measurable tests'],
    ['Artist', 'Experience, empathetic language, narrative framing'],
    ['Scientist', 'Hypotheses, methods, observations, limitations'],
    ['Business professional', 'Customer segment, value, cost and decision trade-offs']
  ]
  rows.forEach(([label, body], i) => { text(s, label, 68, 201 + i * 88, 350, 65, 27, blue, true); text(s, body, 430, 201 + i * 88, 770, 65, 27) })
  text(s, '8 recorded English responses  ·  Shared facts  ·  User-selected preference', 68, 584, 1130, 50, 22, muted)
  s = slide('The founder can choose and correct the style', 'Actual interface',
    'This is a real screenshot of the local isolated fictional case, not a design mockup. Founder background and communication preference are editable in Venture profile. Confirm and save profile is required; the next call uses the confirmed revision. Old profiles load with defaults. Tests cover preference override, mixed/unknown backgrounds, restart, correction and venture isolation. Source: screenshot persona-detail.png from capture-week4-eir.mjs; tests/test_personas.py.')
  lines(s, ['Optional background', 'Explicit preference wins', 'Confirmation before use', 'Facts and counts stay separate'], 68, 205, 460, 90)
  picture(s, 'persona-detail.png', 570, 201, 635, 360, 'Actual founder background and communication preference controls')
  text(s, 'Captured from the running local app · fictional case', 570, 586, 635, 45, 18, muted)
  s = slide('Plan first. Review before activation.', 'Goal + Plan',
    'The founder enters an objective, observable success criteria and constraints. The existing local GOAT API and Ollama model generate a typed JSON proposal. The real run proposed five interviews and two evidence-review tasks; the founder then simplified it to one counted task for the demonstration. The draft does not activate a goal or record completed work. Drafts are editable, approvable and rejectable. Invalid or unavailable model output leaves confirmed state unchanged. The screenshot shows the actual local goal form; source workflow-real.json, planning.py, feature_routes.py and UI verification.')
  lines(s, ['1  Define outcome and capacity', '2  Generate an AI proposal', '3  Edit and review the draft', '4  Approve explicitly'], 68, 207, 500, 89)
  picture(s, 'goal-form.png', 610, 185, 600, 460, 'Actual Goal and Plan form in the local app')
  s = slide('40% of the task — not 40% business validation', 'Progress with boundaries',
    'Five planned interviews, two founder-reported completed interviews, three remaining. The task remains in progress. Absolute counts prevent repeat confirmation from double counting; stale revisions and counts above the target are rejected. Reported results are explicitly unverified. A done task requires full target count and a written result. Goal achievement is blocked until a future criterion-by-criterion evidence review exists. Source: actual progress-detail.png, feature_models.py, planning.py, test_workspace.py and workflow-real.json.')
  text(s, '5 planned\n2 reported complete\n3 remaining', 68, 213, 460, 210, 39, blue, true)
  text(s, 'Activity is observable.\nMarket demand is still unproven.', 68, 459, 470, 125, 28)
  picture(s, 'progress-detail.png', 570, 199, 635, 409, 'Actual task report showing 2 of 5 and unverified results')
  s = slide('A new conversation remembers the approved plan', 'Continuity and versioning',
    'A real new-session response used the approved workspace and reported evidence without replaying old turns. It retained 5/2/3 and warned about the two-person convenience sample. Replanning uses a proposed v2, not an overwrite of v1. The Revise approved plan button retains reported counts for review; fresh AI generation starts new zero-count tasks with a visible warning and keeps prior reports in history. SQLite revisions survive re-instantiation/restart tests. Source: workflow-real.json; test_workspace.py; eir/web/workspace.js.')
  text(s, '“Planned: 5 interviews\nCompleted: 2 interviews\nRemaining: 3 interviews”', 68, 205, 690, 188, 36, blue, true)
  text(s, 'Real local-model follow-up · fictional founder report', 68, 410, 690, 45, 19, muted)
  text(s, 'v1 is retained.\nv2 is proposed.\nApproval activates v2.', 842, 215, 350, 220, 29)
  text(s, 'The two-person sample is not generalized to market demand.', 68, 533, 1125, 70, 28)
  s = slide('Verified behavior, with failures kept visible', 'Evidence and limitations',
    'Fresh automated results: 79 root EIR tests, including 42 workspace tests, 10 Persona tests and three context-budget tests. Ten isolated real-model workflow groups, 21 legacy UI checks and eight mock-network edge checks passed. Desktop 1440 and mobile 390, all three GOAT themes in light and dark were exercised. Eight final Persona outputs were read individually. An earlier workflow response called n=2 findings statistically insignificant without analysis; the original is preserved, policy strengthened and the workflow rerun. Remaining wording/probing weaknesses are recorded, not called expert-validated coaching. Sources: verification scripts, raw fictional outputs, Persona-Review.md and archive.')
  lines(s, ['79 deterministic tests passed', '10 real-workflow + 21 legacy UI checks', '8 final Persona responses reviewed in English'], 68, 202, 1100, 91)
  text(s, 'Known limits', 68, 503, 290, 42, 24, blue, true)
  text(s, 'Model wording and neutral probing still need work. No Ain/EIR expert validation yet.\nLocal single-user prototype; public Vercel recording remains unchanged.', 68, 553, 1120, 87, 23)
  s = slide('Next: turn recorded activity into better learning', 'Six-feature roadmap',
    'These six features remain planned, not implemented by this milestone. Dependency order is Weekly Check-in after Goal/Plan continuity; Experiment Designer and Evidence Board for linked methods and observations; Decision Lab, Pitch Practice and Mentor Brief next. Their inclusion was Mingzhi product scope, not documented Ain approval. Acceptance deliverables and owners must be agreed, not assumed. R26 full closure still needs evidence-criteria review and richer planning metadata. Source: approved Goal/Plan roadmap and implementation checklist.')
  const future = [
    ['1  Weekly Check-in', 'Results, blockers and proposed priorities'],
    ['2  Experiment Designer', 'Neutral method and observable decision rules'],
    ['3  Evidence Board', 'Sources, sample limits and conflicting evidence'],
    ['4  Decision Lab', 'Options, explicit assumptions and next tests'],
    ['5  Pitch Practice', 'Labeled simulation, focused feedback and revision'],
    ['6  Mentor Brief', 'Reviewable one-page progress and questions']
  ]
  future.forEach(([label, body], i) => { text(s, label, 68, 187 + i * 72, 420, 55, 25, blue, true); text(s, body, 512, 187 + i * 72, 700, 55, 25) })
  s = slide('What we need to validate with faculty and Ain', 'Discussion',
    'Ask for specific feedback, not a claim of approval. The three questions can be asked with the actual five-interview case. Team ownership remains unassigned until agreed. Existing GOAT AI remains Mingzhi pre-existing personal work; this milestone extends EIR-specific logic without changing the GOAT source, permissions or license. No legal interpretation of the Capstone agreement is implied. Sources: project boundaries and Week4 report.')
  lines(s, [
    'Which first-time founder journey should we prioritize?',
    'What evidence should justify closing a learning goal?',
    'Can an EIR review our four styles and neutral interview probes?'
  ], 68, 204, 1115, 104)
  text(s, 'Next handoff: agreed evaluation cases, named owners and observable deliverables.', 68, 555, 1120, 70, 25, blue, true)
}
