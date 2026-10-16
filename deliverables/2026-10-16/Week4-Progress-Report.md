# Virtual EIR — Week 4 Progress Report

Report date: October 16, 2026 (America/New_York)
Implementation lead: Mingzhi
Status: Week 4 foundation implemented, verified and independently approved; broader features and coaching-quality acceptance remain open

## Outcome and scope

We extended the existing Virtual EIR prototype with founder-confirmed coaching preferences and a working Goal/Plan foundation: define a learning goal, generate an AI proposal, review and approve it, record task progress, and propose a revised plan while retaining history. The implementation milestone is October 16. “Week 4” is the course label; the October 5–11 window in the October 9 roadmap was a foundation kickoff proposal, not the actual completion date or a faculty deadline.

Final foundation verification: **79 automated tests passed, including 42 workspace tests; 10 real-model workflow groups, 21 legacy UI groups and 8 mock-network edge groups passed**. Independent architecture re-review **APPROVED** the foundation and closed all seven findings after the scoped cleanup. Full R26, the six future features and strict Persona coaching-quality acceptance remain open. No CI-green or expert-endorsement claim is made.

## Actual implementation versus planned capability

| Area | Delivered foundation | Still pending |
| --- | --- | --- |
| Founder profile / Persona | Optional background and explicit style preference; confirmed saves; compatible old-profile defaults; four mapped styles, explicit override and general fallback for unknown/mixed backgrounds | Final quality acceptance and broader evaluation; known generated-response failures below |
| Goal / Plan | Objective, success criteria and constraints; real local-model typed JSON proposal; draft edit, approval and rejection; dependencies and version history | Full milestone structure, task owners/dates, criterion-by-criterion evidence review and supported goal closure |
| Progress / control | Five task states, absolute counts and corrections, blockers/results, duplicate/stale update protections, pause/resume/cancel, report-preserving revision; backend lineage/stale-proposal fixes implemented | Final workflow/edge reruns and architecture acceptance |
| Continuity | New-session coaching reads confirmed profile plus selected approved workspace context; recorded follow-up retains 5/2/3 | Dedicated Weekly Check-in workflow and its feature acceptance |
| Six future features | Roadmap scope and acceptance gates retained | Experiment Designer, Evidence Board, Weekly Check-in, Pitch Practice, Decision Lab and Mentor Brief remain pending |

Source: the approved [Persona plan](../../.omx/plans/2026-10-09-week4-persona.md), [Goal/Plan plan](../../.omx/plans/2026-10-09-goal-plan-feature-roadmap.md), and current implementation listed in the [foundation archive](../../docs/archive/2026-10-16-week4-foundation.md). Proposal wording in the October 9 documents describes that historical baseline; the October 16 additions record implementation progress.

## Founder control and coaching behavior

The founder can save a background and choose a preferred communication style. Engineer maps to technical framing, Artist to experience and narrative, Scientist to hypotheses and methods, and Business professional to business framing. An explicit preference overrides the background. Unknown or mixed backgrounds use general coaching. The adaptation changes explanations and examples; the intended factual and evidence standards stay common across styles. Profession must not be treated as a personality diagnosis or proof that the founder shares the customer's experience.

The Goal/Plan workspace separates a proposal from approved state. A real local-model response is parsed and validated as a typed JSON draft. The founder can edit, approve or reject it. Draft creation saves a proposal, not a confirmed goal or completed action. Invalid output leaves confirmed state unchanged. Task reporting uses five states: not started, in progress, blocked, done and cancelled. Counts are absolute reports, so confirming “two completed” again should not add two more; stale changes are rejected. These guards have initial evidence and are being rechecked after the boundary repairs.

The button **Revise approved plan · retain reports** creates a new draft carrying reported work. The recorded UI workflow reaches approved v2 while retaining the two reported interviews and v1 history. **Generate AI plan** has a different meaning: a fresh proposal starts with zero task counts and warns the user, while previous reports remain in history. Task-lineage/diff and stale retained-report proposal fixes are implemented; their final UI/edge rerun and architecture acceptance remain pending.

Two of five interviews is **40% of that interview task**, with three remaining. It is not 40% business validation. Founder reports are not independently verified, and completing all tasks does not automatically achieve the goal. The prototype blocks achievement until a future criterion-by-criterion evidence review is supported; it does not yet implement that review or goal closure.

## Persistence, compatibility and reuse

Versioned workspace state lives in separate `workspaces` and `workspace_revisions` tables in the same SQLite file as legacy venture profiles and sessions. It is separate from the profile schema, not a separate live database. Old profile fields retain defaults, and legacy actions are not silently converted or duplicated into workspace tasks. A new session retrieves confirmed current state rather than requiring the founder to paste the previous conversation.

Legacy profile content retains its 5,500-character serialized admission limit **excluding the two new Persona fields**. Background is separately bounded to 200 characters and preference to an enum, preserving old profiles at the original limit. Selected workspace context is bounded to 1,600 characters. The existing 8,000-character system-context budget reserves common policy, Persona, planner instructions and workspace context first. It includes the full venture profile if possible, otherwise an explicitly partial view with omission counts and shortened-field paths, retaining the first item from each action/evidence/assumption list when present. Full storage remains unchanged; omitted information is unknown and the coach should ask for detail. No policy is silently dropped. Three focused long-legacy/context checks were reported passing; final combined regression passed (79 tests).

The pre-migration backup is `var/backups/eir-pre-week4-20261016.sqlite3`. The implementation owner reported integrity `ok`, one venture and three sessions, and subsequently confirmed raw legacy tables unchanged with zero live workspace records after migration. This is the migration snapshot; final checks must cover the later fixes. Workflow and Persona test ventures use isolated databases under `var/week4-proof/`, with the workflow server on port 62608 rather than live port 62607.

## Verification and quality limits

| Evidence | Recorded result | Interpretation |
| --- | --- | --- |
| Automated suite | 79 passed, including 42 workspace tests | Final post-cleanup suite; not a CI or expert-quality claim |
| Legacy UI regression | 21 isolated groups passed | Original interface remains usable |
| Isolated workflow | 10 real-model groups passed; 8 mock-network edge groups passed separately | Final repair rerun; fictional isolated data |
| Responsive appearance | Desktop 1440×1000 and mobile 390×844; all three inherited themes, light/dark | Recorded layout/overflow checks, not expert usability certification |
| Persona comparison | Eight real outputs, four backgrounds × initial/follow-up; `gemma4:26b`, temperature 0.2, `think=false` | Small exploratory comparison with human reading, not proof of general reliability |
| Independent architecture review | APPROVED; all seven findings closed | Week 4 foundation scope only |

The main reviewer read all eight final Persona responses. All are English. Each initial response asks two questions and proposes three interviews within the five-interview capacity. Every follow-up reports five planned, two completed, three remaining and a small-sample/generalization limit, without inventing completed work. The four intended styles are observable, with overlap.

The comparison also exposes unresolved quality problems: Engineer and Business initials sometimes question the founder as though they were the target customer; the Engineer follow-up uses hypothetical extra-payment probing and overstates its ability to quantify price elasticity; the Artist follow-up contains `e.le.`; some answers exceed 180 words. These findings require neutral questions about actual customer behavior, better perspective control and output editing. P4 is complete as a recorded comparison with disclosed failures. R25 is implemented and exploratorily evaluated, while strict coaching-quality acceptance remains open. The detailed eight-by-five table is archived in Persona-Review.md.

An initial workflow reply used “statistically insignificant” without a test. That failure is preserved in `var/week4-proof/workflow-initial-statistical-wording.json`. After policy hardening, the corrected `workflow-real.json` reply uses small-sample limits without a formal significance claim. Earlier Persona attempts are preserved in `persona-baseline.json` and `persona-pre-stereotype-guard.json`. A corrected run does not establish perfect compliance in future generations.

## Next deliverables and ownership

| Next deliverable | Acceptance evidence | Owner / timing |
| --- | --- | --- |
| Seven-finding foundation acceptance gate — COMPLETE | Final regression and independent approval recorded | Mingzhi / October 16 |
| Week 4 presentation and archive — COMPLETE | Ten-slide editable PPTX, all final slides rendered/inspected, Persona review and validation receipt | Mingzhi / October 16 |
| Complete remaining R26 scope | Milestones, owners/dates, criteria/evidence review, supported goal closure, updated regression evidence | Mingzhi initially; teammate owners and dates unassigned until agreed |
| Implement the next feature slices | Dedicated Weekly Check-in first, then Experiment Designer / Evidence Board, followed by Decision Lab, Pitch Practice and Mentor Brief, each with its own gate | Owners and dates to be agreed; original windows remain proposals |
| Obtain coaching feedback | A reviewer reads concrete examples and records corrections against a rubric | Faculty/Ain reviewer and appointment unconfirmed |

P1–P4 and S1–S3 have foundation delivery/evaluation records. R25 strict quality acceptance, S4/full R26 and S5–S11/R27–R33 remain open. Ordinary follow-up context is working; it is not completion of the planned Weekly Check-in feature.

## Demonstration and boundaries

Use the isolated fictional workflow at `http://127.0.0.1:62608` when available; inspect its current state because the proof ends on approved v2 with 2/5 reported. The local application entry is `http://127.0.0.1:62607`, GOAT is on 62606, and Ollama is on 11434. Readiness was observed during the implementation session, not promised for every later meeting. Follow the [speaker script](Week4-Speaker-Script.md) and [local instructions](../../docs/LOCAL_RUN.md); archived screenshots are a clearly labeled fallback if the model is unavailable.

The public Vercel site remains the frozen earlier recording and does not show these dynamic features. This work makes no cloud/public backend deployment, licence or invitation change, or GOAT-source change. It establishes neither production readiness, green CI, nor Ain/expert approval. The earlier PPT and raw transcript remain historical/user-owned artifacts. The new PPT and final quality notes are maintained by the main owner.

## Source register

Repository-relative sources: `eir/models.py`, `eir/personas.py`, `eir/coaching.py`, `eir/prompts/coach.txt`, `eir/feature_models.py`, `eir/feature_store.py`, `eir/planning.py`, `eir/feature_routes.py`, `eir/web/workspace.js`, `eir/web/index.html`, `tests/test_personas.py`, `tests/test_workspace.py`, `scripts/verify-week4-eir.mjs`, `scripts/verify-week4-personas.py`. Raw outputs and screenshots: `var/week4-proof/workflow-real.json`, `persona-real.json`, `profile.png`, `draft.png`, `progress.png`, `followup.png`, `mobile.png`, plus preserved failures named above. Curated copies of fictional outputs and screenshots are bundled in deliverables/2026-10-16/evidence; local databases remain ignored. Tracking: [implementation checklist](../../docs/IMPLEMENTATION_CHECKLIST.md), [roadmap](../../docs/ROADMAP.md), [dated archive](../../docs/archive/2026-10-16-week4-foundation.md).
