# Week 4 implementation context

Task: complete the selected Week 4 foundation in Virtual EIR and produce an English PPTX and report/speaker script, requested October 16, 2026 (America/New_York).

Outcome: implemented shared feature persistence, profile-adaptive Persona, a working Goal/Plan draft-confirm-track-replan vertical slice, deterministic and isolated UI tests plus real local-model English evidence, checked-off evidence archive, presentation and report, scoped Git sync.

Grounding: approved plans are `.omx/plans/2026-10-09-week4-persona.md` and `.omx/plans/2026-10-09-goal-plan-feature-roadmap.md`; current main baseline 6c380c9. Existing Profile is strict/bounded, store revisioned SQLite, chat loopback GOAT SSE. There are no implemented Persona/Goal/Plan features at intake. Existing user edits: old PPTX modified; raw October 9 transcript untracked. Preserve both.

Constraints: local single-user/fictional/English, GOAT styling and original personal IP, no paid API/download/repo invitation/license change/public deployment. New features persist separately from bounded Profile; explicit confirmation, revisions and history. 2/5 is task progress, not market validation. No model mutation of confirmed facts. Week 4 scope does not include all six later features or automatic outreach. Current date is Oct 16; report Week 4 milestone retrospectively, not backdate completion.

Verification: old deterministic regressions plus new Persona/workspace tests; isolated DB migration/restart/correction/project isolation; actual four Persona initial/follow-up outputs; model-generated plan draft and confirmation/progress/replan UI on isolated database; responsive themes and saved-state recovery; fresh independent architect review and scoped cleanup/retest; render/inspect deck. Leave public frozen recording unchanged.

Touchpoints: `eir/models.py`, `eir/personas.py`, `eir/coaching.py`, new feature models/store/service/routes, `eir/app.py`, `eir/web/index.html`, `app.js`, `style.css`, new workspace UI module, tests/scripts, docs, dated deliverables.

Delegation: backend executor owns new feature backend files/routes/tests; frontend executor owns only workspace UI module + HTML/CSS; main owns Persona/coaching/app.js integration, evidence and deliverables. Architect read-only final lane. Agent-tier reference file was searched in installed skill/docs paths and unavailable; use the tool's declared executor/architect roles, inherited models (tool instructions prohibit unsolicited model overrides). State MCP unavailable: file-backed context/ledger fallback.

Unknowns: local services/model readiness, artifact-session export support, model JSON reliability. Resolve with runtime checks, do not claim success from configured UI.
