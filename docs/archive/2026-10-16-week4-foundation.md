# Week 4 foundation implementation and evidence archive

Recorded October 16, 2026 (America/New_York). Week 4 is the course label confirmed by Mingzhi. Implementation was completed to the foundation demonstration stage on October 16, not October 11. The October 9 plans and their October 5–11 kickoff window remain historical planning records.

## Status at this handoff

Final foundation verification: **79 automated tests passed, including 42 workspace tests; 10 real-model workflow groups, 21 legacy UI groups and 8 mock-network edge groups passed**. Independent architecture re-review **APPROVED** the foundation and closed all seven findings after the scoped cleanup. Full R26, the six future features and strict Persona coaching-quality acceptance remain open. No CI-green or expert-endorsement claim is made.

Scope is shared persistence, profile-adaptive Persona, and a Goal/Plan draft–approve–report–revise demonstration. This does not complete full R26 or the six later features. See the [progress report](../../deliverables/2026-10-16/Week4-Progress-Report.md) and [speaker script](../../deliverables/2026-10-16/Week4-Speaker-Script.md).

## Implementation and evidence map

| Area | Implemented foundation | Repository evidence / remaining boundary |
| --- | --- | --- |
| Confirmed profile | Optional founder background and explicit communication preference; old profiles receive compatible defaults; revision-checked confirmation remains required | `eir/models.py`, `eir/web/app.js`, `eir/web/index.html`, `tests/test_personas.py` |
| Persona | Engineer → technical; Artist → experiential; Scientist → academic; Business professional → business; explicit preference overrides background; unknown/mixed background uses general coaching | `eir/personas.py`, `eir/coaching.py`, `eir/prompts/coach.txt`; profession is a communication hint, not a personality inference |
| Persistence | Venture-scoped versioned workspace in separate `workspaces` / `workspace_revisions` tables in the same SQLite database as profiles/sessions | `eir/feature_store.py`, `eir/feature_models.py`; legacy profile actions are not silently converted to workspace tasks |
| Context | Legacy profile content excluding the two new Persona fields retains its 5,500-character limit; Persona fields are separately bounded; selected workspace context is bounded to 1,600 characters and combined system context to 8,000 | `eir/models.py`, `eir/feature_store.py`, `eir/coaching.py`; policy-first budget and explicitly partial profile selection added; final combined verification passed |
| Drafts | Existing GOAT chat API / local Ollama produce a typed JSON proposal; candidate goal remains attached to draft; edit, approve, reject are explicit | `eir/planning.py`, `eir/feature_routes.py`; invalid output leaves confirmed state unchanged; final boundary regressions passed |
| Progress | Five task states; absolute reported counts, corrections, duplicate-confirmation protection, revision conflicts, blockers and result text | `eir/feature_models.py`, `eir/planning.py`, `tests/test_workspace.py`; 2/5 = 40% of the interview task, not business validation |
| User control | Pause/resume/cancel; saved plan history; unsaved-edit guards | `eir/web/workspace.js`, `eir/web/index.html`; history is retained when cancelling |
| Revision | `Revise approved plan · retain reports` creates a new draft carrying reports; the recorded UI workflow approves v2 while retaining 2/5 and v1 history | `var/week4-proof/workflow-real.json`; task-lineage/diff and stale retained-report proposal fixes implemented, final workflow/edge rerun passed and re-review approved |
| Fresh generation | `Generate AI plan` starts a fresh proposal with zero task counts, with an explicit warning; earlier reports stay in history | `eir/web/index.html`, `eir/planning.py`; distinct from revising an approved plan |
| Goal outcome | Task completion never automatically marks a goal achieved; unsupported achievement requests are rejected | Criterion-by-criterion evidence review and supported goal closure are future work |

## Recorded verification snapshot

- Automated: `apps/goat/.venv/Scripts/python.exe -m pytest tests -q -p no:cacheprovider` returned **65 passed in 3.81s** during this documentation pass. This was before the architecture repairs; it is not the final test result.
- Workflow: `var/week4-proof/workflow-real.json` records ten successful UI groups: profile confirmation; real plan generation; draft edit/approval; progress/conflict boundaries; pause/resume and draft protection; real new-session follow-up; report-preserving v2 revision; venture isolation; responsive themes; no browser runtime errors. The final repair rerun passed.
- Layout: recorded desktop 1440×1000 and mobile 390×844; Classic, University of Rochester, and Tsinghua themes, each in light/dark. These are twelve theme/viewport combinations within the UI group count, not twelve additional independent quality evaluations.
- Real model: `gemma4:26b` through the existing GOAT API and local Ollama. The corrected workflow follow-up states five planned, two completed, three remaining, a two-person convenience sample, and no market-validation claim. It changes no confirmed progress.
- Databases: workflow experiments use isolated `var/week4-proof/workflow.sqlite3` on port 62608; Persona comparisons use isolated `var/week4-proof/personas.sqlite3`. The model/platform services are shared local dependencies; the test venture data is separate from the live demo.

Final foundation verification: **79 automated tests passed, including 42 workspace tests; 10 real-model workflow groups, 21 legacy UI groups and 8 mock-network edge groups passed**. Independent architecture re-review **APPROVED** the foundation and closed all seven findings after the scoped cleanup. Full R26, the six future features and strict Persona coaching-quality acceptance remain open. No CI-green or expert-endorsement claim is made.

Latest context repair: the old 5,500-character limit excludes the two new Persona fields (background ≤200 characters, preference enum). Policy, Persona, planner instructions and workspace data are budgeted first within the 8,000-character system-context guard. The full venture profile is included if it fits; otherwise an explicitly partial view includes omitted-item counts and shortened-field paths, retaining the first action/evidence/assumption when present and shortening strings through 120/80/40-character stages. Full storage is unchanged, and omitted information is marked unknown with an instruction to ask for detail. Policies are not silently dropped. The main owner reported three focused tests passing for an exact-5,500-character legacy fixture (load/list/health) and chat/planning with 1,280-character workspace context. These are focused repair checks, not the final combined suite.

## Persona comparison and preserved failures

`var/week4-proof/persona-real.json` contains eight real responses: initial consultation plus follow-up for each of four styles, with inputs, saved profile, model/settings and outputs. This run records temperature 0.2 and `think=false`. All eight are English in the recorded comparison; the script's automatic English check is only a character-based screen, not an independent language or quality assessment.

The main reviewer read all eight. Each initial response asks two intake questions and proposes a concrete three-interview action within the five-interview capacity. Each follow-up preserves 5 planned / 2 completed / 3 remaining, explains small-sample/generalization limits, and invents no completed work. Technical, experiential, academic and business framing are observable, with overlap. The main owner's detailed eight-by-five review table is a separate final evaluation artifact, not reproduced or pre-approved here.

Remaining quality failures must stay visible:

- Engineer and Business initial responses still address the founder as though they were the target customer, despite the guard against that assumption.
- The Engineer follow-up asks a hypothetical extra-payment question and overstates its ability to quantify price elasticity. Replace this with neutral questions about actual recent purchases and observed trade-offs.
- The Artist follow-up contains the typo `e.le.`.
- Some responses exceed the requested 180-word limit.

P4 can close as a **completed recorded evaluation with disclosed failures**. It does not mean every coaching-quality criterion passes. R25 remains open for strict final quality acceptance; its foundation implementation and exploratory comparison are delivered.

Preserve the initial workflow failure in `var/week4-proof/workflow-initial-statistical-wording.json`: the model used “statistically insignificant” without an appropriate test. The common policy was hardened and the corrected workflow rerun avoids that claim. Earlier Persona runs remain in `var/week4-proof/persona-baseline.json` and `var/week4-proof/persona-pre-stereotype-guard.json`. Prompt changes and one successful rerun are not a guarantee for all future outputs.

## Live-data and deployment boundary

Pre-migration backup: `var/backups/eir-pre-week4-20261016.sqlite3`. The implementation owner reported integrity check `ok`, one venture and three sessions. The subsequent raw-row comparison confirmed legacy tables unchanged; new workspace tables contained zero live records after migration. These are the recorded migration snapshot, not a substitute for final verification after further repairs. Deterministic compatibility/restart tests use isolated databases.

The local EIR entry is `http://127.0.0.1:62607`, restarted with the new backend; GOAT uses port 62606 and Ollama port 11434. Readiness is a point-in-time observation, not a service availability promise. See [local instructions](../LOCAL_RUN.md).

This documentation lane changes only its eight assigned Markdown files. It creates no commits or external writes. The October 8 PPT and raw meeting transcript belong to other work and are untouched. The new presentation and final quality notes belong to the main owner. Vercel stays the frozen older recording; there is no public/cloud backend, new invitation, licensing change, GOAT-source change or claim of Ain/expert approval.

## Tracking decisions and next gate

- P1–P3: implemented with initial compatibility, request, persistence/correction and isolation evidence; post-repair foundation regression gate passed.
- P4: recorded evaluation complete, with the quality failures above.
- S1–S3: foundation delivery recorded; this is not full acceptance of every future Persona/Goal/Plan requirement.
- S4 / full R26: open. Remaining scope includes milestones, task owners/dates, criterion/evidence review and supported goal closure; foundation boundary repairs and reruns are complete.
- S5–S11 / R27–R33: open. Normal follow-up context is demonstrated; the dedicated Weekly Check-in feature is not implemented.

Mingzhi is the implementation lead recorded in the approved plan. Teammate owners and deadlines remain unassigned until agreed. Next deliverables are the seven-finding disposition and combined regression proof, the main owner's final Persona review and rendered ten-slide presentation, then a concrete R26 completion slice. No course deadline or expert review appointment is invented.

## Sources

Paths above are relative to the repository root unless linked. Approved scope: [Persona plan](../../.omx/plans/2026-10-09-week4-persona.md), [Goal/Plan plan](../../.omx/plans/2026-10-09-goal-plan-feature-roadmap.md). Tracking: [checklist](../IMPLEMENTATION_CHECKLIST.md), [roadmap](../ROADMAP.md). Raw local evidence under `var/` is ignored by Git and requires the local workspace; a source-only clone does not include it.
