# Virtual EIR: Goal + Plan and six-feature implementation roadmap

Planning date: October 9, 2026 (America/New_York). Status: scope selected by Mingzhi; implementation not started. Week 4 is the user-confirmed course week. Later week labels/windows below are proposed sequencing, not faculty deadlines or a promise of finishing every feature this week.

## 1. Requirements and boundaries

- Keep the profile-adaptive Persona work R25: engineer/technical, artist/experiential, scientist/academic, business professional/business. Explicit style preference overrides background; common factual standards remain authoritative. See [Persona plan](2026-10-09-week4-persona.md).
- Add an integrated Goal + Plan workspace, inspired by Codex's separation of planning from implementation and evidence-based goal tracking.
- Include all six selected features: Experiment Designer, Evidence Board, Weekly Check-in, Pitch Practice, Decision Lab, Mentor Brief. Their inclusion is Mingzhi's product decision; it is not recorded as Ain approval. Mingzhi reports the teacher suggested expanding features including Plan/Goal.
- Reuse GOAT inference and appearance. Implement venture-specific features in EIR, not by rewriting or relicensing the pre-existing GOAT platform. All user-facing UI, outputs, and recorded examples remain English.
- Scope: local, single-user, fictional cases, existing Ollama/model. No cloud API purchase, model download, invitations, IP/license changes, email sending, background reminders, or live public backend deployment.
- This turn produces planning documents only. The existing Vercel frozen recording remains unchanged. Any later recording refresh is a separate explicit publishing step, not a claim that these features already exist online.

## 2. Verified starting points

| Existing implementation | Consequence for this plan |
| --- | --- |
| `eir/models.py:14`, `:23`, `:30`: evidence, counted actions, and confirmed profile; no structured goals/plans or Persona fields | Extend deliberately with defaults and migration tests; counters alone are not a Goal/Plan feature |
| `eir/models.py:10`, `:40`: unknown fields forbidden and profile context bounded to 5,500 characters | Do not silently inject new JSON fields; keep larger artifacts separate and select a bounded context |
| `eir/store.py:29`, `:103`: SQLite tables and revision-checked confirmed profile update | Reuse the confirmation principle; add versioned feature storage/transactions, not whole-profile overwrites from AI |
| `eir/app.py:91`, `:107`: explicit profile confirmation and chat routes | Add validated, venture-scoped feature contracts; existing chat must remain compatible |
| `eir/coaching.py:52`, `:118`: shared policy, loopback GOAT SSE, chat-only turn persistence | Reuse inference; add EIR orchestration and bounded artifact drafts, without automatic model writes |
| `eir/web/app.js:32`, `:41`, `:106`: unsaved-change detection, rendering, busy-state protection | Extend draft guards and structured panels, preserving GOAT appearance and mobile usability |
| `tests/test_eir.py`, `tests/test_english_demo.py`, `scripts/verify-ui.mjs` | Extend deterministic and isolated UI checks; do not run mutating legacy demo scripts against the clean live database |
| `showcase/README.md`, `scripts/build-eir-showcase.mjs` | Public showcase is static/read-only and separately built; this plan does not deploy a dynamic application |

## 3. Product flow: an integrated Goal + Plan workspace

`Founder profile -> Define Goal -> Clarify -> Draft Plan -> Founder approves -> Work & record -> Review evidence -> Replan or close`

This is our EIR design, not a claim that we copy Codex internals or need an OpenAI model/API. Official inspiration: [Plan-first guidance](https://learn.chatgpt.com/guides/best-practices) describes context gathering and clarification before implementation; [Using Goals in Codex](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex) emphasizes measurable outcomes, evidence, boundaries, and user control. Unlike a coding agent, EIR cannot conduct a founder's interviews or sales itself. The founder performs real-world work; EIR prepares drafts and proposes next steps.

### Goal

One active goal per venture in the first version; previous goals retained. Fields: stable ID, objective, explicit success criteria, evidence required, constraints/capacity, optional target date, status, revision. Draft -> active requires confirmation; pause/resume/cancel requires explicit founder action. Closing requires reviewing each success criterion and the evidence status, then explicit founder confirmation. Missing evidence must prevent an unsupported "achieved" label. A founder may archive an unresolved goal without claiming success.

Example learning goal: `Assess whether evening graduate students have a recurring dinner-access problem using five interviews and a written evidence review.` Finishing that learning exercise may be possible even if the proposed business is not supported; do not turn it into `market demand validated`.

### Plan

Plan versions belong to a goal and contain rationale, milestones, ordered tasks, dependencies, owner, optional due date, effort/capacity, completion criteria, expected evidence, and blockers. A planning interaction asks at most two useful questions at a time, labels unknowns, and proposes a bounded plan. First demo respects the existing five-interview capacity. Confirming activates a version; editing an approved plan creates a proposed next version with a visible diff. Replanning never overwrites old versions or rewrites history.

Task states: `not_started`, `in_progress`, `blocked`, `done`, `cancelled`. Founder-confirmed task updates record timestamp, source, count/result, and optional evidence link. An AI suggestion or chat claim is not a confirmed completion. Repeated confirmation must not double-count work. Corrections retain an audit event.

### Progress display

- Keep objective, current plan version, next action, and blockers visible alongside chat.
- Show `2 of 5 interviews completed (40%)` for the specific counted task, with three remaining. Do not label this `40% of business success`.
- Show plan checklist counts separately, with blocked/cancelled tasks explicit. A task is checked only when its confirmed completion criteria are met, not when merely partially completed.
- Show evidence review separately: criteria supported, contradicted, insufficient, or not assessed. Founder reports remain labeled self-reported/unverified where appropriate.
- Replanning can change the task denominator; label the version/change, rather than silently lowering the bar. Cancelled tasks never become completed work. Zero targets/no tasks show `not set`, not a misleading percentage.
- A second session/restart restores the same goal, accepted plan, task status, evidence links, and preferences. Existing conversation history stays intact.

## 4. Proposed release sequence

Each release starts only after its prerequisite gate. If a gate fails, carry the unfinished slice forward; do not bypass it to meet a calendar label. Estimate actual effort after the first vertical slice. Mingzhi owns implementation initially; teammates are unassigned until agreed. Feature design/evaluation can be split without granting access to the entire private GOAT-containing repository.

| Window / release | Scope and exact gate |
| --- | --- |
| Week 4, October 5–11: foundation kickoff | Register all scope; specify shared contracts; begin Persona and one Goal/Plan vertical slice on an isolated DB. It is already October 9: this is a priority window, not a promise to finish R25–R29 by October 11. Gate: no incompatible profile change or unsupported progress claim |
| Proposed Week 5, October 12–18: continuity | Complete and verify R25 Persona, R26 Goal/Plan, R29 Weekly Check-in. Gate: define -> approve -> update 2/5 -> new-session review -> proposed replan -> approve; restart and isolation tests pass |
| Proposed Week 6, October 19–25: evidence-driven coaching | R27 Experiment Designer and R28 Evidence Board. Gate: experiment linked to goal/hypothesis, results attributed correctly, contradictory/small-sample evidence produces cautious review rather than automatic validation |
| Proposed Week 7, October 26–November 1: practice and decisions | R31 Decision Lab, R30 Pitch Practice, R32 Mentor Brief in that implementation order. Gate: decision assumptions labeled, pitch simulation kept out of real evidence, brief preserves confirmed facts/counts and exports safely |
| Proposed Week 8, November 2–8: integrated evaluation | R33 regressions, English/Persona comparisons, end-to-end recordings and updated docs; seek faculty/Ain feedback when available. Gate: feature evidence archived, unresolved failures disclosed; no claimed expert endorsement without actual review |

All six features are scheduled, not reduced to optional placeholders. Calendar windows may be revised with actual effort, team availability and client feedback; the course end date is not inferred from this schedule.

## 5. Ordered implementation checklist

- [x] S0 — Register scope, dependencies, gates and pending task IDs. Evidence: this plan, [roadmap](../../docs/ROADMAP.md), [tracking checklist](../../docs/IMPLEMENTATION_CHECKLIST.md), [planning archive](../../docs/archive/2026-10-09-goal-plan-feature-roadmap.md). Only planning is complete.
- [ ] S1 — Shared contracts and safe persistence design. Touchpoints: `eir/models.py:10`, `:30`, `:40`, `eir/store.py:29`, `:103`, `eir/app.py:91`; proposed `eir/feature_models.py` and `eir/feature_store.py`. Define IDs, venture ownership, revisions, proposal/confirmation boundaries, bounded context and explicit draft errors. Back up before any later live migration; first validate copied fixtures/isolated DB, transactions and recovery. Keep legacy actions intact with stable mappings/no duplication; prevent old clients from overwriting feature state. Archive schema/API decision and compatibility tests.
- [ ] S2 — R25 Persona. Follow P1–P4 in the [existing plan](2026-10-09-week4-persona.md), shared schema first. Touchpoints: `eir/coaching.py:52`, `eir/web/app.js:41`, proposed `eir/personas.py`. Verify four styles, explicit override, unknown background, injection resistance, saved preference and eight English comparisons. Do not weaken common policy.
- [ ] S3 — R26 Goal/Plan draft and approval. Touchpoints: `eir/app.py:91`, `:107`, `eir/coaching.py:52`, `eir/web/app.js:32`; proposed `eir/planning.py`, `eir/prompts/planner.txt`, feature contracts/storage. Add structured goal form and Plan interaction; prepare validated draft with milestones/tasks, allow edit/approve/reject. Model malformed output or unavailable service must leave confirmed state unchanged. Gate: two questions max per clarification turn, explicit objective/criteria, feasible five-interview plan, no state mutation until approval.
- [ ] S4 — R26 progress workspace and versioning. Touchpoints: `eir/store.py:103`, `eir/web/index.html`, `eir/web/app.js:41`, `eir/web/styles.css`; proposed feature routes/store. Add task updates, blockers, criteria/evidence review, explicit pause/resume/cancel and plan-version diff. Gate: 2/5 = 40% task progress, incomplete task not checked, zero denominators handled, stale revision rejected, duplicate update idempotent, goal not achieved solely from task count. Test reload/restart, correction and two-venture isolation before R26 closes.
- [ ] S5 — R29 Weekly Check-in. Touchpoints: `eir/coaching.py:118`, `eir/web/app.js:94`, confirmed feature storage; proposed `eir/checkins.py`, `eir/prompts/checkin.txt`. Button/new-session entry summarizes accepted goal/plan and asks about results and obstacles; propose next priorities or a revised plan. Gate: exact 5 planned / 2 completed / 3 remaining, n=2 limitation; conflicting chat report needs correction confirmation; no automatic updates, reminder service or invented activity.
- [ ] S6 — R27 Experiment Designer. Touchpoints: `eir/models.py:14`, `eir/coaching.py:52`, `eir/app.py:107`; proposed `eir/experiments.py`, `eir/prompts/experiment.txt`. Create experiment card linked to goal, plan task and hypothesis: audience, method, neutral questions, capacity, observed measures, pre-agreed decision rules and limitations. Accept to attach; no inferred execution. Gate: five-interview capacity, no leading willingness-to-buy questions as proof, new experiment remains planned, old task not duplicated.
- [ ] S7 — R28 Evidence Board. Touchpoints: `eir/models.py:14`, `:30`, `eir/store.py:103`, `eir/web/app.js:36`; proposed feature evidence links and `eir/prompts/evidence-review.txt`. Link observations to experiments/hypotheses with source, date, sample, limitation and support/contradiction/unclear stance. Show a suggested interpretation for confirmation; retain conflicting evidence. Gate: can link/unlink/correct with revisions, n=2 not market validation, no invented independent verification, simulated material excluded from real evidence. Closed goal with materially changed evidence must prompt a new review, not silently rewrite old achievement history.
- [ ] S8 — R31 Decision Lab. Touchpoints: `eir/coaching.py:52`, goal/plan/evidence contracts; proposed `eir/decisions.py`, `eir/prompts/decision.txt`. Compare two or three founder-specified options with assumptions, known costs/constraints, risks, missing information and next test. Gate: no fabricated financial/market numbers; unknown inputs stay unknown; changing an assumption produces a traceable new analysis, not an automatic decision or plan update.
- [ ] S9 — R30 Pitch Practice. Touchpoints: `eir/coaching.py:118`, `eir/app.py:107`, session/artifact storage; proposed `eir/pitches.py`, `eir/prompts/pitch.txt`. Founder chooses simulated customer/investor audience; save pitch draft, focused questions and criteria-based feedback (clarity, problem/customer, evidence, differentiation, concrete ask). Gate: one English practice round and edited pitch persist; simulated quotes/reactions are clearly labeled and never counted as interviews, sales, funding or evidence; no fake probability-of-investment scores.
- [ ] S10 — R32 Mentor Brief. Touchpoints: `eir/store.py:78`, `eir/coaching.py:52`, English UI; proposed `eir/briefs.py`, `eir/prompts/brief.txt`. Build one-page English brief from confirmed profile/goal/current plan/evidence: progress, blockers, limitations and top three mentor questions. Review then export Markdown/print view first, without adding PDF/PPT infrastructure. Gate: 5/2/3 exact, sources traceable, no internal prompts/private paths/GOAT source, no automatic send or claimed mentor booking. Export previews disclose included founder data.
- [ ] S11 — R33 Integrated verification and archive. Touchpoints: `tests/test_eir.py`, `tests/test_english_demo.py`, proposed `tests/test_feature_workflow.py`, isolated feature UI verifier, `docs/LOCAL_RUN.md`, `docs/ROADMAP.md`. Run existing regressions plus feature tests; exercise desktop/mobile GOAT themes and draft guards; record real local-model English flow and Persona comparisons. Archive each feature's actual results/failures and update its checkbox only after acceptance. Optional later static recording publication needs explicit scope and refreshed read-only validation; no implicit full-app deployment.

## 6. Feature acceptance matrix

All implementation tasks below remain unchecked. Tests are required deliverables, not assertions of current capability.

| ID / feature | Minimum demonstrable acceptance |
| --- | --- |
| R25 Persona | Four background styles, user override, persisted preferences, eight recorded English outputs; facts and evidence discipline unchanged |
| R26 Goal + Plan | One active goal, editable draft/approval, milestones/tasks/dependencies, five task states, correct counters, user controls, versioned replan, restart/isolation/conflict tests; missing criteria evidence blocks unsupported achievement |
| R27 Experiment Designer | One confirmed experiment linked to hypothesis/goal/task; neutral method and observable decision rule; five-interview capacity respected; no execution invented |
| R28 Evidence Board | Add/link/correct observations, preserve supportive and contradictory evidence, source/limitations visible; simulation excluded; no automatic market-validation claim |
| R29 Weekly Check-in | One new-session review grounded in accepted state; blockers and next priority; proposed replan only; conflicting counts do not overwrite confirmed state |
| R30 Pitch Practice | One saved simulated practice plus revision and rubric feedback; fictional reactions explicitly labeled and isolated from real-world evidence |
| R31 Decision Lab | Two options compared using known inputs/explicit unknowns; traceable assumptions and follow-up test; no invented financials or automated commitments |
| R32 Mentor Brief | One-page preview/export, correct facts/counts, three focused questions, privacy check; founder confirms export, no automatic external communication |
| R33 Integrated QA | All above deterministic checks and isolated UI regression pass; recorded English workflow/Persona review published internally with failures and limitations |

## 7. Verification procedure and stopping gates

1. Baseline: run existing deterministic tests without modifying the live demo. Save test command/output, commit and fixture identifiers.
2. Schema/store: old-profile fixtures, isolated migration/rollback exercise, missing/stale revisions, transaction failures, duplicate confirms, invalid cross-venture IDs, old-client update compatibility and restart restoration. UUID isolation is not multi-user authorization.
3. Draft contracts: malformed/oversized model results, unknown statuses, injected profile/experiment text, missing evidence IDs, model failure. Reject unsafe drafts clearly; confirmed records unchanged. Keep larger artifacts outside the bounded Profile and retrieve only relevant context (current 8,000-character request guard at `eir/coaching.py:52` is not silently removed).
4. Feature checks: each acceptance row gets deterministic fixtures and an isolated UI flow. Verify unsaved drafts cannot disappear on navigation and controls cannot double-submit.
5. Real-model exploratory evaluation: use three fictional ventures (campus dinner, creative service, research commercialization). For each, record goal/plan -> check-in -> experiment/evidence -> decision/pitch -> brief with known fixtures. Add the four-Persona initial/follow-up comparison (eight outputs); preserve prompts, settings, outputs, reviewer notes and failures. These sample sizes are our proposed checks, not faculty mandates or quality certification.
6. User experience: desktop 1440x900 and mobile 390x844; all three inherited themes in light/dark, no horizontal overflow, visible status/limitations and protected drafts. Check visible interface/output English; language adherence in generation is evaluated, not guaranteed from a prompt alone.
7. Close each step only after code, deterministic checks, required real outputs/UI evidence and limitations are archived. Use `docs/archive/YYYY-MM-DD-rXX-<feature>.md`, referencing a local ignored artifact directory for raw logs; commit non-sensitive docs/source. Never put databases, credentials or raw founder-private material in Git/public recordings.

Stop a release on data loss, unauthorized writes, incorrect progress, invented evidence/completed activity, broken old profiles or project leakage. Repair and re-test before checking it off. A failed generation may be recorded as an exploratory failure; it cannot support a claimed successful acceptance example. Do not solve workload pressure by disabling tests.

## 8. Risks, mitigation and decisions

| Risk | Concrete mitigation |
| --- | --- |
| All features promised immediately | Dependency-gated releases; Week 4 kickoff only, proposed later windows, no unconfirmed owner/date assignments |
| Activity confused with business validation | Separate task counts, criteria review and evidence quality; counterexamples and archive-without-success path |
| Model decides what is true or done | Typed drafts, explicit confirmation, source attribution and revisioned/idempotent state transitions |
| Schema changes lose old records | Backward-compatible fixtures, separate artifact storage, mapping tests and copied-DB migration/recovery gate |
| Large artifacts overflow context | Venture-scoped relevant retrieval, bounded summaries with IDs/sources, explicit too-large error and no silent policy truncation |
| Simulated investor/customer response becomes evidence | Artifact-type boundary enforced in storage/retrieval and tested against the Evidence Board |
| Feature UI diverges from GOAT | Extend existing style/theme modules and reuse panels/cards, then theme/mobile QA |
| Public showcase mistaken for new live app | Frozen deployment unchanged; document local-only status; any future public app remains behind R14–R16 security gates |
| Prior personal IP exposed by collaboration | EIR-only increments with baseline attribution; no repo invitations, visibility/license changes or source export in briefs |

Next implementation action after a separate start instruction: S1 shared contracts, then S2 Persona and S3–S4 Goal/Plan vertical slice. This plan itself does not start a Codex persistent Goal or an autonomous background task.
