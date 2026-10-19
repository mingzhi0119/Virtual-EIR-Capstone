# Virtual EIR Weekly Progress Record

Maintainer: Mingzhi Hu. Updated October 19, 2026, America/New_York.

Reporting periods: October 12–18 and October 19–25. This week's cut-off is October 19; later deliverables remain pending. These are calendar weeks; the earlier Week 4 label belongs to the course schedule.

The local coaching foundation is now available as a protected, interactive Vercel app. This week also adds evidence review, founder-confirmed goal closure and structured weekly check-ins. Independent coaching-quality review and Ain Center acceptance remain open.

## Last week October 12 to 18

1. **Delivered the Persona foundation on October 16.** Founders can save their background, confirm or override a communication preference and return with that preference retained. Four background-based styles and a general fallback are implemented. Eight real local-model responses were compared, with remaining quality problems recorded.
2. **Delivered the Goal and Plan foundation.** Founders can define an objective, success criteria and constraints; generate, edit, approve or reject an AI draft; report task states and counts; and revise an approved plan while retaining earlier versions and reported work.
3. **Verified continuity across consultations.** A new session recalled five interviews planned, two completed and three remaining. Confirmed venture state remains separate from AI suggestions; task completion is not presented as market validation.
4. **Completed the scoped foundation review.** The final record reports 79 automated tests, including 42 workspace tests; 10 real-model workflow groups; 21 legacy UI groups; and eight mock-network edge groups. All seven architecture findings were closed within that foundation review.
5. **Prepared the Week 4 presentation record.** Delivered the editable ten-slide presentation, English speaker script, progress report, Persona comparison and fictional evidence archive. This October 16 revision is distinct from the older October 8 slides.
6. **Recorded faculty direction and team ownership.** The October 16 meeting established a short recorded demonstration, example-based Ain questions, a worked evaluation rubric and eventual runnable handoff. Mingzhi owns the demo; Dachen owns recording and integration; Precious owns workflow questions; Julian owns evaluation.
7. **Clarified repository collaboration.** Documented the canonical repository, fork and pull-request workflow, publication boundaries and GOAT attribution. At the end of last week, the dynamic app still depended on local services; the older online showcase was a frozen recording.

Evidence: [October 16 report](../deliverables/2026-10-16/Week4-Progress-Report.md), [Persona review](../deliverables/2026-10-16/Persona-Review.md), [faculty actions](meetings/2026-10-16-faculty-actions.md). Foundation commit: [e8836b5](https://github.com/mingzhi0119/Virtual-EIR-Capstone/commit/e8836b5).

## This week product work completed by October 19

1. **Added sourced evidence and criterion review.** Observations record their source, date, sample and limitations. Founders link observations to success criteria and record supported, uncertain or negative judgments. Corrections retain earlier evidence and review history.
2. **Added explicit goal closure and reopening.** Completing two of five, or even five of five, interviews alone leaves the goal active. Closure requires resolved tasks, supported criteria and explicit founder confirmation. Reopening permits corrections; changed evidence flags earlier judgments for reassessment.
3. **Added a structured weekly check-in.** Founders save the period, results, learning, blockers, next priorities and next review date. Each entry retains a task-count snapshot. Later consultations use bounded summaries of the latest check-in and goal review; earlier entries remain available. Dates do not trigger reminders.
4. **Reworked the interface for Ain Center.** Removed venture UUIDs, storage revisions, raw JSON and technical event dumps from the visible workflow. Profile, goal, plan, evidence and progress screens use business descriptions. Draft actions can be added, removed and connected through form controls.
5. **Restored GOAT appearance controls.** Classic, Rochester and Tsinghua support Light, Dark and System. Accent, font, contrast and sidebar preferences persist after refresh. New browsers start with Rochester. Footer lines and starter-button size and styling were also corrected.
6. **Prepared the Role 1 recording handoff.** Completed the fictional Campus Dinner Discovery case, timed English narration, ordered recording sequence, reusable inputs, saved rehearsal scenes and recovery instructions. Dachen can record directly in Vercel without access to Mingzhi's computer. The final exported video remains pending.
7. **Verified the expanded workflow.** The scoped EIR suite reached 134 passed with one optional PostgreSQL test skipped. Real Luna planning and follow-up consultation passed locally and in Vercel. A new-session response recalled saved blockers and priorities without changing confirmed records.

Evidence: [recording script](../deliverables/2026-10-22/Recording-Script.md), [readiness report](../deliverables/2026-10-22/Readiness-Report.md), [current roadmap](TEAM_ROADMAP.md). Product commit: [64b148e](https://github.com/mingzhi0119/Virtual-EIR-Capstone/commit/64b148e).

## This week deployment from local services to Vercel

1. **Established the starting point.** The working app ran on Mingzhi's Windows machine using local Python, SQLite and GOAT/Ollama services. Recording depended on that machine. The older Vercel showcase did not provide the live backend.
2. **Connected the official OpenAI API.** Added server-side OpenAI consultation and structured plan generation. The cloud demo defaults to GPT-5.6 Luna, with GPT-5.6 Terra, GPT-5.6 Sol and GPT-4.1 mini also available in its selector. Actual calls were checked using the supplied classroom key.
3. **Deployed the interactive app to Vercel.** Created the protected `virtual-eir-demo` service in `iad1`. The interface and Python backend run in the cloud; invited teammates and faculty can use them while the local computer is offline.
4. **Moved cloud persistence to Neon PostgreSQL.** Profiles, conversations, plans, task reports, evidence and weekly entries survive refreshes and deployments. Local rehearsal copies remain separate and available. All three saved cloud ventures and workspaces were compared before and after the Git deployment and retained.
5. **Added access protection and server controls.** Vercel Authentication protects all deployment addresses. External recipients use the private invitation. Previously invited browsers remember authorization; a fresh visitor without an invitation is blocked. OpenAI and database credentials remain in Vercel server environment variables. Classroom records are shared among admitted visitors; there is no per-user record isolation.
6. **Added shared limits and monitoring.** PostgreSQL-backed limits allow six AI attempts per minute, 200 per UTC day and one active generation. Outputs are capped at 4,096 tokens; calls are not automatically retried. Model, token and timing events support monitoring without logging prompts or keys. These controls do not create an account-wide spending cap or automated alerts.
7. **Connected the owner's GitHub repository.** Linked `mingzhi0119/Virtual-EIR-Capstone`, production branch `main`, to the existing Vercel project after GitHub authorization. Pushes and merges to `main` trigger production builds; other branches are disabled for this classroom deployment.
8. **Verified the first Git deployment.** Commit [9184049](https://github.com/mingzhi0119/Virtual-EIR-Capstone/commit/9184049) triggered [a successful production build](https://vercel.com/mingzhi0119s-projects/virtual-eir-demo/6cSGXKiRNP2tJFPXRDHLE5up1rNK). The build prepared 27 allowlisted app files and generated appearance assets. The original invitation, saved records and stable production address remained valid.

Evidence: [deployment guide](VERCEL_DEMO.md), [OpenAI guide](OPENAI_DEMO.md), [build commit](https://github.com/mingzhi0119/Virtual-EIR-Capstone/commit/22e9fee). Private access links, keys, credentials and runtime databases are excluded from this record.

## Verification pending work and future entries

### Verification recorded on October 19

| Check | Recorded result |
| --- | --- |
| Scoped EIR tests | 134 passed; one optional PostgreSQL test skipped |
| Interface checks | Seven local and eight cloud checks passed; no browser errors |
| Editing edge cases | 10 passed, including unsaved drafts, revisions and mobile layout |
| Real-model evidence and weekly journey | Nine checks each locally and in Vercel using Luna |
| Git deployment | Production READY for 9184049; GitHub CI passed for that commit |
| Invitation behavior | Fresh ordinary visit blocked with 302; invitation admitted; clearing authorization cookies restored the block |

The broader local whole-tree run recorded 850 passed, nine skipped and two failures in unchanged GOAT governance tests. That run remains a failed run. Passing scoped checks and the later CI workflow do not constitute an Ain coaching-quality endorsement.

### Pending deliverables and owners

1. **Dachen, Role 2:** record and export the 2–4 minute cloud walkthrough, test audio and readability, and integrate the package. Individual material is due October 20; package assembly and submission coordination are due October 21.
2. **Precious, Role 3:** deliver the one-page workflow brief with five or six concrete questions and affected design decisions by October 20. Ain answers are pending the October 22 discussion.
3. **Julian, Role 4:** deliver the one-page rubric and score at least one actual prototype response with rationale by October 20. Strict coaching-quality acceptance remains open.
4. **Mingzhi, Role 1:** review the final exported clip for technical accuracy. Track Persona coaching corrections against actual examples, including founder/customer confusion, hypothetical payment questions, unsupported inference and verbosity.
5. **Product work to assign after feedback:** task owners and milestones; the full experiment and hypothesis graph; Decision Lab, Pitch Practice and Mentor Brief; broader evaluation; and independent successor deployment and maintenance. No new delivery dates are agreed here.

### Record maintenance

- Preserve this October 19 cut-off. Append a separately dated entry when the recording, submission or Ain feedback becomes available; do not rewrite pending work as completed.
- Each future entry should record the period, completed items, owner, source commit or deliverable, observed checks, unresolved issues and next agreed actions.
- [Team assignments](TEAM_ASSIGNMENTS.md) holds the agreed responsibilities. Local receipts remain under ignored `var/eir-hosted-proof/`, `var/eir-review-proof/` and `var/eir-business-ui/`; these are retained owner evidence rather than public files.
