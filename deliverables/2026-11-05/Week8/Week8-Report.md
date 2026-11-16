# Week 8 integrated evaluation

November 5, 2026. Implementation lead: Mingzhi. Scope follows the proposed November 2–8 R33 milestone: integration regressions, English/Persona comparisons, end-to-end evidence and updated documentation. The October 22 Roberto meeting remains the requirements source; this report does not introduce new faculty deadlines or assign work to teammates.

**Technical evaluation and its internal evidence archive are complete. Coaching-quality approval remains open.** This is a protected fictional classroom prototype, not an Ain-approved service for confidential founder data.

The authorized release is **deployed and verified** at the [protected Vercel demo](https://virtual-eir-demo.vercel.app). The [deployment record](Deployment-Record.md) documents six cloud check groups, two actual hosted generation calls, retained data, access protection and earlier failed attempts.

## Acceptance evidence

| Area | Actual result | Evidence |
| --- | --- | --- |
| Deterministic application tests | 168 passed, 1 skipped after the Week 8 prompt changes. The skip requires a separately configured live PostgreSQL test database. | Existing test suite and release checks |
| Browser/API integration | 12 groups pass, including readable validation, recovery, draft retention, revisions and stale-export prevention. | [Browser receipt](evidence/browser.json) |
| Existing workspace edge regression | 10/10 passed in the preceding final review; unchanged product UI since that run. | [Retained regression receipt](../release-check/workspace-edges.json) |
| Appearance | Three themes × light/dark × desktop/390px: 12 combinations pass. Close controls remain visible. | [Desktop](evidence/desktop-learning.png), [phone](evidence/mobile-urochester-dark.png) |
| Real local model workflows | Three complete cases: idea-stage Campus dinner, prototype Music practice, growth-stage Window repair. All generate/approve a plan and four learning artifacts, save a check-in, return in a fresh session and export a brief. Zero contract retries/failures in this run. | [Complete outputs](evidence/workflows-final.json) |
| Persona comparison | Eight fresh outputs across four backgrounds and initial/follow-up phases, plus the earlier failed-quality iteration retained. All English. | [Review and open defects](Persona-Review.md) |
| Recording | 80.68-second actual English UI acceptance recording; fictional seeded starting plan, no audio or live generation in the clip. | [MP4](Integrated-Workflow.mp4), [viewing/reproduction guide](Demo-Guide.md) |
| Mentor handoff | Reviewed Markdown and printable layout preserve 5 planned / 2 completed / 3 remaining and source/simulation limits. | [Brief](evidence/Mentor-Brief.md), [print view](evidence/mentor-brief-print.png) |
| Static verification | Ruff check/format, TypeScript, ESLint and whitespace checks pass. | Current source checks |
| Vercel production | READY; invitation/anonymous denial verified; two real hosted generation calls and six cloud check groups pass. Seven original ventures retained; one new fictional case added. | [Release record](Deployment-Record.md), [cloud receipt](evidence/cloud-check.json) |

The deterministic counts and saved data pass. The three free-form follow-ups omit an explicit completed count, even though they mention five planned and three remaining. The Persona Scientist intake invents an initial count, and some observational proposals infer motivation. These are disclosed failures in coaching quality, not passed assertions. See the full review before choosing examples for a presentation.

## Requirement closure

| Requirement | Week 8 technical disposition | Separate acceptance condition |
| --- | --- | --- |
| R25 Persona | Persistence/override/context and four styles implemented; matched outputs archived | Independent quality review open; factual/style defects remain |
| R26 Goal/Plan | Owners, milestones, dates, effort, completion/evidence criteria and versioned progress exercised | Founder-confirmed activity is not market validation |
| R27 Experiment Designer | Plan/task/hypothesis linkage, capacity and draft confirmation exercised | Interviews are planned, not automatically executed |
| R28 Evidence Board | Contrary observations, sources, limitations and experiment linkage exercised; corrections retained | Reports are not independently verified |
| R29 Weekly Check-in | Three fresh workflows save results, learning, blockers, priorities and review dates | No reminders or automatic count changes |
| R31 Decision Lab | Two/three alternatives, unknown costs and revisions exercised | AI suggestion is not founder approval |
| R30 Pitch Practice | Original/revised history and five feedback dimensions exercised | Simulated feedback never becomes evidence |
| R32 Mentor Brief | Preview/review/download/print and stale-state guards exercised | Nothing is automatically sent |
| Roberto step assessment | Criteria, material, evidence, reasons and gaps exercised | Provisional only; no funding/admission/Ain judgment |
| S11/R33 integrated QA and archive | Complete for the scoped technical/fictional evaluation | Expert sign-off remains a separate open gate |

## Outstanding work requiring further evidence

1. Obtain actual EIR/faculty review using the [blank review sheet](../EIR-Review-Sheet.md); no external message was sent and no endorsement is claimed.
2. Improve the disclosed free-form factual and observation-quality defects, then rerun matched cases. Prompt compliance is not a deterministic guarantee.
3. Obtain official Foundry criteria and agreed Blackboard access before implementing institutional integration. Do not invent official material.
4. Before confidential real-founder use, implement user-level access isolation and an explicit history/capacity policy. Current admitted visitors share fictional records.
5. Validate an independent successor's deployment and maintenance handoff. A successful author-run release is not independent reproducibility evidence.

The historical weekly plans and prior failure receipts remain preserved. Local databases, invite tokens, API keys and raw cloud records are excluded from this delivery folder. The public read-only showcase remains the older version; this evaluation video was not published there.
