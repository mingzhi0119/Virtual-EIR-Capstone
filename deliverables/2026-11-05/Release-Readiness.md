# Pre-launch quality review

November 5, 2026 — final local review following the pre-Week-8 implementation.

Later same-day update: [Week 8 evaluation](Week8/Week8-Report.md) includes fresh three-case workflows, eight Persona outputs and a recording. The [successful protected Vercel release and live checks](Week8/Deployment-Record.md) are tracked separately. The original review below describes its earlier cut-off.

**Decision: suitable for a protected, small-scale fictional classroom pilot, with the limitations below. No deployment was performed.** The independent code-review lane returned **APPROVE**; the architecture lane returned **WATCH** after its blocking finding was repaired. Their combined review verdict is **COMMENT**, not an unconditional production approval.

## Problems repaired

| Finding | Repair and evidence |
| --- | --- |
| A confirmed stage recommendation remained in new-chat context after its cited evidence changed or a new plan was approved. | Shared eligibility rules now exclude stale stage assessments and all earlier-plan learning artifacts from current advice and briefs. History remains readable. Tests cover evidence corrections, progress changes and each artifact kind across replanning. |
| A reviewed brief could still be exported after another visitor changed the founder profile. | Brief responses include separate workspace/profile versions. Download and print check both against saved state before export; changed previews are invalidated. Backend and actual-browser tests cover this. |
| Custom mentor questions disappeared after saving/confirming learning work or switching tools. | Mentor questions are preserved independently of learning drafts across mutations and tool selection. Browser regression confirms retention. Explicit discard still clears local edits. |
| Combined Persona, profile and learning context could exceed the 8,000-character guard. | Removed redundant policy wording while preserving evidence, capacity, language and confirmation requirements. Added ten full-workspace budget cases across five communication styles and chat/planning contracts. The initial failed real run is disclosed below; all three cases then completed. |
| Validation and service failures exposed technical JSON or an unreadable parsing error. | Field-level messages replace JSON/input dumps; network and non-JSON failures have readable recovery guidance. Drafts remain intact. Required learning fields, participant counts and list lengths are checked before submission. |
| Decision-form labels inherited checkbox layout, making text fields awkward on narrow screens. | Only checkbox labels use the horizontal layout. Text fields stack with consistent spacing; titles use single-line fields and participant counts use numeric fields. The optional third alternative is collapsed. |
| Long forms moved the close control and operation result off screen. | The workspace header/status remain visible while scrolling. Mobile learning controls use readable 16px text; checks cover close-button visibility and horizontal overflow. |
| Earlier-plan or stale draft cards still offered an unusable confirmation action. | Cards identify earlier plan versions. Old-plan/stale confirmations are removed; history remains readable and current-plan work can be revised. |
| Model follow-ups omitted remaining counts and sample limits. | Conversational instructions now explicitly begin with the saved focus counts and latest observation limits. All three final exploratory cases include 5/2/3 and the two-person small-sample caveat. This observed improvement is not a reliability guarantee. |

Learning generation also displays a waiting message, and a newly saved learning draft opens for review. Export remains explicitly reviewed; no message is sent automatically.

## Final checks

| Check | Result |
| --- | --- |
| Full Python suite | **168 passed, 1 skipped**. The skipped test requires an optional live PostgreSQL test database. |
| Actual browser/API workflow | **12 groups passed**, including validation, failed-service recovery, mentor-question preservation, stale-profile export protection and task replanning. |
| Existing workspace browser regression | **10/10 groups passed**. |
| Appearance | Three themes × light/dark × desktop/mobile; **12 combinations**, including 390px width, no horizontal overflow and a visible close control. Screenshots visually inspected. |
| Static checks | Ruff check/format, TypeScript, ESLint and `git diff --check` passed. |
| Hosted build preparation | Vercel/hosted bundle built successfully; 30 allowlisted files, including the new modules/assets. |
| Hosted generation boundary | New regression verifies that learning generation honors the pause switch and shared attempt limit, including invalid attempts; no paid API call is needed for this test. |
| Real local model | **3/3 refreshed follow-ups completed** using `gemma4:26b`. All retain 5 planned / 2 completed / 3 remaining, mention sample size 2 and generalization limits, and leave the workspace unchanged. |

The three refreshed model cases are Campus dinner (idea), Music practice (prototype), and Window repair (growth). The earlier eight Persona outputs remain evidence of the previous iteration; they were not regenerated after this final policy compression.

During this review, the first attempted model rerun completed Campus dinner but failed Music practice with HTTP 409 because selected context did not fit. That run was partial and does not count as success. After policy compression and the ten new budget tests, the full three-case rerun passed. The final output still uses possible sector-specific procurement criteria; these must remain hypotheses to test, not institutional facts. No expert coaching-quality acceptance is claimed.

## Scope of release readiness

The current product intentionally shares fictional classroom records among all admitted visitors. It is not a tenant-isolated product for confidential founder information. The architecture review also notes that full workspace snapshots/history grow without a retention limit; sustained use needs a capacity/archival design, not silent deletion of history.

Before a real-user production release, resolve user-level access isolation, capacity policy, expert coaching evaluation and approved institutional guidance. Blackboard integration and official Foundry materials remain external dependencies.

This review did not change production, spend against the teacher's API key, or run a live PostgreSQL migration. Production model compatibility and current cloud deployment protection must be checked during the actual release process. Keep the existing Vercel authentication/sharing protections and shared-use limits in place. After deployment, verify the deployed revision, access denial for unauthenticated visitors, retained records and the new interfaces using fictional data.

## Review artifacts

- [Final real-model follow-ups](release-check/followup-final.json)
- [Browser/API checks](release-check/browser.json)
- [Workspace regression checks](release-check/workspace-edges.json)
- [Hosted bundle allowlist](release-check/bundle.json)
- [Desktop workspace](release-check/desktop-learning.png)
- [390px dark workspace](release-check/mobile-urochester-dark.png)
- [Reviewed print view](release-check/mentor-brief-print.png)

Code remains on local branch `codex/pre-week8-workflows`. Existing unrelated presentation/documents are preserved. See the [implementation report](Pre-Week8-Implementation.md) for the delivered scope and [EIR review sheet](EIR-Review-Sheet.md) for future expert feedback.
