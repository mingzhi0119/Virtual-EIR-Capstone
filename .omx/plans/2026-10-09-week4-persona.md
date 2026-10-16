# Week 4 roadmap addition: profile-adaptive coaching Persona

Historical baseline: the October 9 text and its original checklist below describe the planning-only turn. For implementation status, use the appended **October 16 current status** section; the original requirements and date context are retained.

Updated: October 9, 2026 (America/New_York). Week 4 is the course-week label explicitly confirmed by Mingzhi. The current work-week window remains October 5–11; this does not establish a new faculty deadline. Earlier Week 1/Week 2 files remain historical artifacts, not the basis for the current course-week label.

## Requirement and source

Mingzhi reports that Professor Mohr explicitly requested adapting the coaching Persona to the founder's profile: engineer → technical; artist → emotional/experiential; scientist → academic; business professional → business-oriented. This four-profile instruction is supplied in the current conversation, not presented as a verbatim passage from the partial meeting transcript or as approval by Ain.

The founder's background informs the coach's communication, examples, and analytical emphasis. This is not merely AI role-play as different professions. English output, evidence standards, founder confirmation, and accurate planned/completed counts remain consistent across Personas.

## Proposed adaptation matrix

| Founder profile | Coaching emphasis | Presentation style | Standard retained |
| --- | --- | --- | --- |
| Engineer | Technical feasibility, constraints, implementation trade-offs, measurable experiments | Structured reasoning, technical analogies, clear test criteria | Connect technical choices to customer evidence; do not encourage unnecessary building before validation |
| Artist | Emotional experience, creative intent, audience perception, user stories | Empathetic language, experience-based analogies, narrative framing | Emotional observations are not verified demand; still propose a measurable validation action |
| Scientist | Hypotheses, evidence quality, research methods, uncertainty | Academic structure, explicit assumptions and limitations, reproducible tests | Do not invent studies, references, statistical significance, or stronger evidence than the sample supports |
| Business professional | Customer segments, value proposition, revenue/cost assumptions, market tests | Concise business framing, decision trade-offs, business-model examples | Do not invent market size, forecasts, sales, or completed interviews |

These are configurable starting styles, not claims about everyone in a profession. Explicit communication preference overrides the default suggested by background. Mixed, missing, or declined background uses general coaching until the founder confirms a preference.

## Verified baseline

- `eir/models.py:30`: `Profile` contains venture facts, assumptions, evidence, and actions, but no structured founder-background or communication-preference fields. Unknown fields are forbidden (`eir/models.py:10`), so a JSON-only workaround is not an implemented feature.
- `eir/coaching.py:52`: the request combines one shared policy with founder-confirmed venture state. A profile-aware style layer needs to be added here; the existing policy comes from `eir/prompts/coach.txt` (`eir/coaching.py:15`).
- `eir/web/app.js:41`, `eir/app.py:91`, and `eir/store.py:103`: the editor, confirmation endpoint, and revisioned updates provide the integration points for explicit preference editing and saving.
- `showcase/README.md`: the Vercel showcase is a frozen recording, not an implementation of adaptive Persona.

## Week 4 checklist and steps

- [x] P0 — Record the requirement and four-profile mapping. Evidence: this plan, `docs/ROADMAP.md` section 3.1, and `docs/archive/2026-10-09-week4-persona-roadmap.md`. Only planning is complete.
- [ ] P1 — Add minimal founder background and explicit communication preference to the confirmed profile. Touchpoints: `eir/models.py:30`, `eir/web/index.html`, `eir/web/app.js:41`, `eir/app.py:91`, `eir/store.py:103`. Proposed fields: optional `founder_background` and bounded `communication_preference`, with a general default. Existing stored profiles must load without new mandatory fields; edits require confirmation/revision checks. Deliverable: schema/editor change and persistence/compatibility tests.
- [ ] P2 — Define four EIR-specific styles and the profile-to-Persona selection rule. Touchpoints: `eir/coaching.py:52`, `eir/prompts/coach.txt`; proposed `eir/personas.py` and `eir/prompts/personas/`. Profile text is untrusted data, not executable instructions. Keep common coaching policy authoritative. Deliverable: mappings and tests for general default, explicit override, mixed profiles, and injection attempts. No multi-agent layer, fine-tuning, or original GOAT refactoring is required.
- [ ] P3 — Verify continuity, corrections, and isolation. Touchpoints: `tests/test_eir.py`, `tests/test_english_demo.py`, and proposed `tests/test_personas.py`. A confirmed preference must carry into a new session and survive restart; correction changes the next call's style without rewriting old turns or altering facts/actions. Check engineer and artist profiles in separate ventures for leakage. Deliverable: automated evidence and a correction before/after example.
- [ ] P4 — Evaluate and archive English examples. Use one fictional venture with the same question, model, facts, and action capacity; vary only the four profile/preferences. Record an initial consultation and follow-up per profile (eight responses). Review style fit, unchanged factual state, useful next action, evidence discipline, and English consistency. Deliverable: four-profile comparison, raw inputs/outputs, failures, and a short demonstration. Do not mark implementation verified without evidence or republish the Vercel recording in this planning task.

P1–P4 are the added Week 4 workstream, not a guaranteed completion before October 11. Existing commitments remain: each teammate brings three feature ideas; the team prioritizes them; Roberto questions stay compact and example-led. Owners other than Mingzhi remain unassigned until agreed.

## Acceptance criteria

- Four mappings affect explanations, examples, and priorities; the selected style is observable in request-level tests without publishing internal prompts.
- Missing preference uses general coaching; explicit preference overrides background; mixed background is not forced into a stereotype.
- Old profile fixtures load without the new fields; saving still requires founder confirmation and rejects stale revisions.
- Preference persists across new sessions/restart; correction affects the next call; separate ventures do not share preferences.
- All eight evaluation responses are English. Record profile/context/model settings and whether the intended style is actually visible; prompt text alone is not proof of compliance.
- Every follow-up retains five planned / two completed / three remaining and the two-person sample limitation. No invented completed action or evidence is accepted; a violation remains unresolved.
- The report includes a concrete action for each initial consultation, limitations for each follow-up, and notes on all five review dimensions. Internal review is not Ain/expert endorsement.
- Experiments use a separate database; the clean live demo, its saved turns, and the existing public recording remain unchanged.

## Risks and verification

| Risk | Mitigation / verification |
| --- | --- |
| Profession becomes an inferred personality or stereotype | Optional self-described background and explicit preferred style; test unknown/mixed cases and preference override |
| Emotional/business wording weakens evidence standards | Preserve common policy; inspect all eight outputs for invented evidence and interview-count confusion |
| New fields break saved profiles | Backward-compatible defaults; old fixtures and revision/restart tests before touching live data |
| Profile text overrides instructions | Adversarial background tests; bounded style identifiers cannot replace common policy |
| One favorable response is mistaken for reliable improvement | Preserve failures and label results a small exploratory comparison |
| Scope expands into cloud deployment or private GOAT changes | Keep work in EIR; no paid API, permissions/license change, model switch, or public republishing |

After implementation: run existing deterministic tests and new Persona tests; exercise UI save/correction on an isolated database; capture the eight real local-model outputs; review failures before checking P1–P4 off and archive evidence per step. This turn edits roadmap documents only; no Persona behavior is implemented.

## October 16 current status — foundation delivered, final acceptance open

Implementation date: October 16, 2026 (America/New_York), not October 11. Week 4 remains the course label; the original October 5–11 window was a proposed kickoff. The checklist above is the October 9 baseline. Current delivery status is:

- [x] P1 — Implemented optional `founder_background` and explicit `communication_preference` with confirmed UI saves and old-profile defaults. `eir/models.py`, `eir/web/app.js`, `eir/web/index.html`, `tests/test_personas.py` provide the implementation/evidence. The legacy 5,500-character admission limit excludes the two new Persona fields; background is separately bounded to 200 characters and preference to an enum. This preserves old profiles at the original limit.
- [x] P2 — Implemented four mappings in `eir/personas.py`, explicit preference override, general fallback for mixed/unknown backgrounds, and request-level common-policy integration. Tests cover selection, override and untrusted background; policy also guards against assuming the founder is the customer. Generated responses still expose quality failures, so guard text is not proof of perfect compliance.
- [x] P3 — Initial deterministic evidence covers old-profile compatibility, correction, re-opening the store, session continuity and venture isolation without rewriting earlier turns. The isolated UI workflow confirms saved preference use. Post-repair combined regressions passed.
- [x] P4 — Recorded and reviewed eight real English outputs in `var/week4-proof/persona-real.json`: each initial asks two questions and proposes three interviews within capacity; each follow-up retains 5/2/3, small-sample/generalization limits and no invented completed work. Four styles are observable with overlap. This closes the recorded comparison, **not every coaching-quality criterion**. The main owner is archiving the detailed eight-by-five review table.
- [ ] R25 strict quality acceptance — Foundation implementation and exploratory evaluation are delivered; remaining response failures and final regression/review prevent a full acceptance claim.

Known failures: Engineer and Business initial replies still address the founder as a customer; the Engineer follow-up uses a hypothetical extra-payment question and overstates price-elasticity inference; the Artist follow-up has `e.le.`; some answers exceed 180 words. Use neutral recent-behavior questions and preserve these findings. No Ain/expert approval is claimed.

Final foundation verification: **79 automated tests passed, including 42 workspace tests; 10 real-model workflow groups, 21 legacy UI groups and 8 mock-network edge groups passed**. Independent architecture re-review **APPROVED** the foundation and closed all seven findings after the scoped cleanup. Full R26, the six future features and strict Persona coaching-quality acceptance remain open. No CI-green or expert-endorsement claim is made.

See [October 16 archive](../../docs/archive/2026-10-16-week4-foundation.md), [report](../../deliverables/2026-10-16/Week4-Progress-Report.md) and [speaker script](../../deliverables/2026-10-16/Week4-Speaker-Script.md). Experiments remain in isolated databases; the frozen Vercel recording, GOAT source, permissions/licensing and historical artifacts are unchanged. This documentation update makes no commit or external write. Further team owners/dates remain unassigned until agreed.
