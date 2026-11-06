# Virtual EIR — pre-Week-8 implementation

Later November 5 update: the [pre-launch quality review](Release-Readiness.md) records subsequent fixes, 168 passing tests and the final release boundary. The implementation evidence below is the earlier delivery snapshot.

Prepared November 5, 2026. Week 5–7 product implementation is available locally on `codex/pre-week8-workflows`, based on commit `08db877242c4c578afb2063708dfaf00da677c76`. This is an implementation and exploratory verification record, not an EIR endorsement or a cloud deployment.

The scope follows the [agreed feature sequence](../../.omx/plans/2026-10-09-goal-plan-feature-roadmap.md) and the October 22 Roberto discussion, mapped to behavior below. The detailed internal meeting record is retained privately. Earlier dated delivery records remain historical.

## Delivered workflows

| Window / requirement | Result available for review | Confirmation boundary |
| --- | --- | --- |
| Week 5 — R25 Persona | Four communication styles, explicit preference override and persistent founder context. Added stronger user/buyer separation, stage awareness and evidence discipline. Eight fresh initial/follow-up outputs are archived. | Preferences change wording, not facts. Model-quality limitations and expert acceptance remain separate. |
| Week 5 — R26 Goal + Plan | Editable/approved/versioned plans now include milestone, owner, due date, effort, completion criteria and expected evidence. Milestone progress is visible. Added actions and dependencies save correctly. Existing task states, blockers, evidence reviews, explicit closure and restart/conflict protections remain. | The server retains reported progress and lineage. Completing tasks is not market validation. Unknown owners/dates are left unset. |
| Week 5 — R29 Weekly Check-in | Results, learning, blockers, next priorities and next-review date persist with a server-read task snapshot. A new chat receives the latest confirmed context. | No automatic task updates or scheduled messages. |
| Week 6 — R27 Experiment Designer | A hypothesis links to the current goal and task. Drafts contain audience, method, capacity, neutral questions, observable measures, decision rule and limitations. | Review and confirm before saving as accepted work. Planned experiments do not create completed interviews or duplicate plan tasks. |
| Week 6 — R28 Evidence Board | Observations link to experiments/hypotheses and record supporting, contradictory or unclear stance; sources, dates, samples, limitations and correction history remain visible. | Simulated pitch output cannot serve as an observation source. Corrections do not erase previous records. |
| Week 7 — R31 Decision Lab | Compare two or three founder-specified alternatives with known/unknown costs, assumptions, risks, missing information and next tests. Save a traceable revised analysis. | Model advice cannot replace supplied alternatives, costs or assumptions. No automatic commitment or plan update. |
| Week 7 — R30 Pitch Practice | Customer/investor simulation saves the original pitch, focused questions, five feedback dimensions and revised pitch, with version history. | Clearly labeled simulation; excluded from observation records and task counts. No fabricated investment probability score. |
| Week 7 — R32 Mentor Brief | Compact English preview, exact counts, sources/sample limits, blockers, selected learning and up to three mentor questions. Explicit review unlocks Markdown export and an A4 print view. | Selected/shortened content is disclosed. Changing the workspace or questions requires a fresh preview. No automatic external sending. |
| Roberto — ordinary-step judgment | Founder supplies work and review criteria; the coach proposes readiness, revision or insufficient information, with reasons, gaps and next step. | A readiness recommendation requires linked observations. Stale assessments are flagged and cannot be newly confirmed. This is not goal closure, funding or accelerator admission. |

The implementation keeps a distinction between founder observations, model proposals and simulated practice. Model generation produces advice fields; supplied identities, hypotheses, costs, original pitches and execution status stay under server control. Invalid output returns a clear failure without changing confirmed records.

## Roberto's directions translated into behavior

- **Coach and challenge:** prompts request a consequential unsupported assumption, rationale and feasible test. Learning artifacts require substantive founder inputs rather than silently completing an entire process.
- **Persistent context:** current goal/plan, numeric activity, observations, learning artifacts and check-ins are selected for new sessions within the existing context budgets. Missing context is disclosed rather than treated as absent evidence.
- **User versus buyer:** music teachers/school purchasers and building managers/payment approvers appear in the fictional demonstrations. The coach must distinguish these roles instead of treating the founder as the customer.
- **Different entry stages:** the real-model cases cover idea, prototype and growth. These replace the older generic three-case proposal with cases reflecting the meeting examples; they are not actual customer interviews.
- **Ordinary-step assessment:** provisional reasoning is available directly. Every ordinary step does not require a human approval workflow.
- **Keep the first version practical:** a maintained general knowledge base, automatic mentor notifications and institutional integration are not treated as prerequisites for basic coaching.

## Verification

| Check | Observed result |
| --- | --- |
| Python regression suite | 150 passed; 1 optional live PostgreSQL check skipped because no test database was configured. Baseline before this work: 134 passed, 1 skipped. |
| New learning/storage tests | Exercise explicit confirmation, revisions, restart and venture isolation, wrong/stale links, malformed model output, simulation exclusion, exact-count briefs, metadata dates, new-task dependency remapping and legacy plan fingerprint compatibility. |
| Actual browser/API workflow | 9 groups passed against an isolated SQLite-backed app: experiment → counterevidence → decision → pitch revision → step review → draft recovery → reviewed export/print → added task/replan → appearance checks. No browser errors. |
| Existing workspace browser regressions | 10/10 groups passed with fully intercepted fixtures, including independent report drafts, pause/resume, failed saves, lineage and navigation protection. |
| Appearance | Classic, THU and URochester themes × light/dark × desktop/mobile: 12 viewport/theme combinations without horizontal overflow; desktop 1440px and mobile 390px. Screenshots were visually inspected. |
| Real local model | Three complete fictional workflows passed with `gemma4:26b`: Campus dinner (idea), Music practice (prototype), Window repair (growth). Each generated a plan and four learning artifacts, confirmed 2/5 interview progress, saved contrary observations/check-in, opened a new chat and exported a brief. Final workflow receipt reports no API failures. |
| Persona comparison | Four backgrounds × initial/follow-up; eight English outputs retained with profiles, inputs and model settings. These are exploratory outputs, not a human quality score. |
| Static/build checks | Ruff, TypeScript and ESLint passed. Hosted/Vercel package preparation succeeded with the new modules/assets included in the allowlist. No deployment was performed. |

The deterministic suite proves state and API behavior. Fictional local model runs demonstrate functioning generation and continuity; they do not establish production reliability or expert coaching quality. OpenAI production generation and a live PostgreSQL migration were not exercised in this run.

### Failures found and handled

1. Local generation sometimes returned narrative, invalid keys, a misspelled plan field, null optional metadata or paragraph bullets instead of a string. Invalid drafts were rejected; optional empty metadata and lossless paragraph formatting were normalized. Model output still has to validate.
2. An early model attempt rewrote experiment execution status and other supplied inputs. Advice-only output contracts now keep those facts on the server; the model cannot invent execution by changing a structured field.
3. Long combined context failed the existing request guard during development. Per-feature contracts and bounded selected context restored the 8,000-character system budget; the long-profile regression passes.
4. The existing “Add an action” control created an ID that the save API rejected. Temporary new-task IDs now map to server IDs, including dependencies, without forging previous-task lineage. Both draft editing and approved-plan revision are tested.
5. Early follow-ups used unsupported statistical-significance language and overlong explanations. Persona runs also exposed profession-based emotional assumptions, an incorrect “halfway” description of 2/5 and extra closing questions. These outputs are preserved, the prompts/style guidance were corrected, and refreshed evidence is reported in [Coaching review](Coaching-Review.md). A prompt change is not a guarantee against future model errors.

### Evidence files

- [Three complete model workflows](evidence/real-model.json) and [refreshed follow-ups](evidence/followup-final.json).
- [Final eight Persona outputs](evidence/persona-real.json), [earlier Persona outputs](evidence/persona-before-final-prompt.json), and [intermediate style-check outputs](evidence/persona-before-style-fix.json).
- [Browser receipt](evidence/browser.json), [workspace regression receipt](evidence/workspace-edges.json), and [bundle allowlist](evidence/bundle.json).
- [Reviewed sample brief](evidence/Mentor-Brief.md), [print view](evidence/mentor-brief-print.png), [desktop learning tools](evidence/desktop-learning.png), and [390px dark workspace](evidence/mobile-urochester-dark.png).

All archived cases are fictional. Runtime databases, credentials and model request logs stay in ignored local directories. The raw failed model attempts remain in `var/pre-week8-proof/real-model-attempt*.json`; this report does not replace those failures with the successful final receipt.

## Demonstration guide

Use the isolated local app at `http://127.0.0.1:62618` while its server is running. Select a fictional Week 7 venture or the latest “Browser acceptance” venture.

1. Open **Goal & Plan**. Show the approved goal, milestone/owner fields, task counts and previous plan versions.
2. Under the learning tools choose **Experiment Designer**. Enter the actual hypothesis and task; ask for advice, inspect the draft and confirm.
3. Add an observation linked to the experiment, including source, sample limitation and a contradictory stance.
4. Open a new conversation and ask what changes in light of those observations. Verify 5 planned / 2 completed / 3 remaining against stored state.
5. Compare two alternatives in **Decision Lab** and revise a **Pitch Practice** artifact. Show the simulation label and history.
6. Use **Step Readiness** with explicit criteria and linked observations. Inspect reasons/gaps; do not describe the answer as Ain approval.
7. Preview **Mentor Brief**, inspect the selected evidence and three questions, acknowledge review, then export Markdown or open the print view.

Reproduce checks from the repository root using the existing project environment:

```powershell
apps/goat/.venv/Scripts/python.exe -m pytest tests -q
apps/goat/.venv/Scripts/python.exe -m ruff check eir tests scripts/verify-pre-week8.py scripts/seed-pre-week8-ui.py scripts/verify-week4-personas.py
node apps/goat/frontend/node_modules/typescript/bin/tsc -p eir/frontend/tsconfig.json
node apps/goat/frontend/node_modules/eslint/bin/eslint.js --config eir/frontend/eslint.config.mjs "eir/web/*.js" scripts/verify-pre-week8-ui.mjs
node scripts/build-eir-vercel.mjs
node scripts/verify-week4-workspace-edges.mjs
```

The actual browser verifier needs the app on port 62618 with `EIR_DB_PATH` set to this repository's `var/pre-week8-proof/demo.sqlite3`; it seeds only that isolated database. Real model verifiers additionally need GOAT at loopback port 62606 with `gemma4:26b` available. See [Local run](../../docs/LOCAL_RUN.md) for service startup.

```powershell
node scripts/verify-pre-week8-ui.mjs
apps/goat/.venv/Scripts/python.exe scripts/verify-pre-week8.py
apps/goat/.venv/Scripts/python.exe scripts/verify-pre-week8.py --followup-only
apps/goat/.venv/Scripts/python.exe scripts/verify-week4-personas.py --output var/pre-week8-proof/personas
```

## Week 8 handoff and external dependencies

Implementation is ready for review. These items cannot be represented as completed software work:

- **EIR quality review:** use the [review sheet](EIR-Review-Sheet.md) with the complete examples; obtain actual reviewer feedback before claiming independent acceptance.
- **Official Foundry/24-step guidance:** receive/version the promised materials and agree on criteria. The prototype deliberately does not reconstruct a missing official checklist.
- **Blackboard:** Liza and the school need to establish the permitted entry point, hosting, access and account requirements. A local build is not a Blackboard deployment.
- **Real cases and sharing permission:** confirm participation, permitted use and anonymization before importing actual EIR case material.
- **Release:** this branch has local changes and a prepared bundle. No push, public publication, message to teammates or production database change was made as part of this implementation.

No new team owner or deadline is assigned by this report. Existing unrelated work and dated presentation files are preserved.
