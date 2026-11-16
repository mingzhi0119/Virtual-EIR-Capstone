# Friday presentation: technical readiness

Prepared November 16, 2026 for the planned Friday afternoon, November 20 Ain presentation. Liza confirms the exact meeting time. Implementation lead: Mingzhi Hu. All demonstration and evaluation cases are fictional.

**The scoped technical readiness work is complete, and the protected demonstration is deployed and verified. Coaching-quality acceptance remains open.** This report supersedes November 5 test counts for the work checked here; the older delivery remains a dated historical record.

## Obstacles removed

| Problem | Delivered behavior | Verification |
| --- | --- | --- |
| An isolated/OpenAI rehearsal could contaminate the normal launcher's provider or browser port. | Local startup explicitly selects GOAT/Ollama, port 62607 and this checkout's database. Child-service overrides are restored in the caller on success or failure. Empty model lists, incorrect browser origin and a different running provider produce a clear failure. Unrelated processes are preserved. | Five launcher boundary groups; actual local startup, dependency readiness and origin/model discovery. |
| Local requests needed stronger protection against hostile Host/origin combinations. | Local HTTP boundaries validate the expected address and browser origin for reads and writes. | Updated backend boundary tests. This does not add hosted per-user authorization. |
| A stalled request or response body could leave the interface busy indefinitely; a lost write response could invite duplicate submission. | Reads and ordinary writes have a 30-second deadline; model generation has 210 seconds. Uncertain writes retain drafts and block conflicting navigation/submissions. Recover saved state reads saved results without automatically repeating the write; a later retry requires explicit review. | Ten request-recovery groups, including a committed chat with a lost response, a JSON 500 after a committed write, disconnected processing and conflicting later drafts. |
| Coaching could mistake intake capacity for saved progress or describe omitted context as no activity. | Selected saved counts are supplied explicitly; legacy profile activity remains separate from approved plans. Missing numeric details in partial context are identified as unavailable. The existing 8,000-character context guard remains. | Deterministic tests plus eight fresh Persona outputs and three real-model workflows. The remaining free-form defects are disclosed below. |
| Recovery checks were outside routine project checks. | Launcher and intercepted browser recovery checks are included in the root prototype workflow. | Current workflow configuration. A new remote CI run is not claimed by a local pass. |

The existing R26–R32 workflows remain available: versioned Goal & Plan, Weekly Check-in, Experiment Designer, Evidence Board, Decision Lab, Pitch Practice, provisional Step Readiness and reviewed Mentor Brief export. Task activity remains separate from market validation; simulated practice remains separate from real observations.

## Current validation

| Check | Final result | Scope and limits |
| --- | --- | --- |
| EIR deterministic suite | **191 passed, 1 skipped** | The optional live PostgreSQL test remains skipped; local deterministic checks are not comprehensive production-database proof. |
| Reused GOAT backend regression selection | **540 passed, 8 skipped, 10 subtests passed** | Reported selection, not a claim that every GOAT platform gate ran. |
| GOAT frontend regression suite | **217 tests passed across 50 files** | The first run hit a one-second lazy-loading assertion timeout. The focused rerun and subsequent complete rerun passed; the initial failure is retained. |
| Actual EIR browser/API acceptance | **12 groups passed**, no page errors | Isolated fictional app; validation, learning revisions, source links, draft preservation, exact-count export, stale-profile protection and replanning. [Receipt](evidence/browser.json). |
| Existing workspace edge regression | **10 groups passed** | Intercepted fixtures; does not exercise live inference. |
| Request recovery | **10 groups passed**, no page errors | All requests intercepted; no live database or model calls. [Receipt](evidence/request-recovery.json). |
| Launcher boundaries | **5 groups passed** | Temporary fixtures and mocked service boundaries; actual local service startup checked separately. |
| Real local-model Persona comparison | **8 outputs completed** | Four backgrounds, initial/follow-up phases, `gemma4:26b`, temperature 0.2, thinking disabled. [Actual outputs](evidence/personas-final.json), [quality review](Persona-Review.md). |
| Real local-model integrated workflows | **3 cases completed**, no recorded failures or contract retries | Idea-stage Campus dinner, prototype Music practice and growth-stage Window repair. All generated/approved a plan and four learning artifacts, saved observations/check-in, opened a fresh consultation and exported a brief. [Complete outputs](evidence/workflows.json). |
| Candidate packaging | **31 allowlisted files**, CLI dry inspection passed | Fresh source and rebuilt appearance assets; no credentials, databases or old hosting bundle. The local project-link control is excluded from the upload list. |
| Protected hosted UI | **8 read-only groups passed**, no page errors | Existing invitation and anonymous denial, retained records, business interface, persistent appearance and 390px layout. |
| Actual hosted generation | **1 paid call completed**, reply persisted once | `gpt-5.6-luna`, 5.471 seconds, in a new named fictional venture/session; legacy profile counts and new chat, not every cloud workspace generation path. |

The browser receipt covers three inherited themes in light/dark modes at desktop and 390px widths. Current screenshots: [desktop](evidence/desktop.png), [phone](evidence/phone.png), [print view](evidence/mentor-brief-print.png). The [sample brief](evidence/Mentor-Brief.md) preserves 5 planned / 2 completed / 3 remaining and source/simulation limits. These checks establish the recorded runs, not universal usability or model reliability.

## What the model evidence does and does not establish

All four final initial Persona replies say that no activity is confirmed; none turns the five-person capacity into saved remaining work. All four follow-ups contain 5 planned / 2 completed / 3 remaining and identify the two-person small, biased sample as unable to generalize. All eight are English, use 137–159 whitespace-separated words and ask no more than two questions.

Coaching quality still has material gaps. The Scientist follow-up proposes observing five people despite three remaining interviews. Artist wording still infers priorities from appearances. Some intake questions presuppose observations that were never supplied. The three integrated follow-ups retain exact counts, but Window repair omits an explicit non-generalization statement and Music practice attributes an unsupported assumption to the founder. The [detailed review](Persona-Review.md) also explains generic decision advice and test-fixture limitations. These are open quality findings, not passed assertions.

Earlier iterations are preserved as [iteration 1](evidence/personas-iteration1.json), [iteration 2](evidence/personas-iteration2.json) and [iteration 3](evidence/personas-iteration3.json). In particular, earlier Scientist/Business follow-ups combined “no activity” with saved progress; some proposals exceeded remaining capacity. The final source improves observed state reporting without eliminating free-form reasoning errors. No output was silently rewritten to create a successful example.

## Protected cloud release: deployed and verified

Read-only preflight verified the existing invitation, anonymous denial, all-deployment SSO protection, FastAPI and `rootDirectory: hosting`. The current baseline contains eight ventures, eight complete workspaces and thirteen sessions. Two complete reads matched SHA-256 `a0c20ddbaa4fdcc2ab1a4e2d682f9fdae449d5c69f7372896d7237e6c7fc7d33`. Complete baseline records remain in ignored local storage; they are not included in this report.

Release `dpl_6vooiBswWWNvCRrvRyhtJXtJnnHF` reached READY with source-manifest SHA-256 `e3a7bfdd25eb306c1206f5fc2056ae9df6746265e8636410896bdfbb1fac5671`. Candidate checks verified health, byte-matching `app.js` and `workspace.js`, anonymous denial and unchanged original records. The release was then successfully promoted to the [existing protected demonstration](https://virtual-eir-demo.vercel.app). A post-promotion read-only preflight confirmed the original invitation, protection and the same eight-venture/eight-workspace/thirteen-session hash. The previous stable deployment is `dpl_FGsNPgUetixvG76McSbGnE5DMe9F`.

Eight read-only hosted browser groups then passed with zero page errors. One actual `gpt-5.6-luna` request completed in 5.471 seconds in **Friday readiness — fictional cloud smoke (2026-11-16)**. Its saved reply preserves 5 planned / 2 completed / 3 remaining as legacy profile activity, identifies the hypothetical two-person sample as small/biased and unable to generalize, avoids inferring unrecorded motives and proposes the remaining three interviews about actual choices/prices/rejected alternatives. The reply contains 169 whitespace-separated words. Chat persisted once; confirmed profile/workspace remained unchanged.

This intentionally adds one fictional venture and one session: current totals are **nine ventures and fourteen sessions**. All original eight ventures, eight workspaces and thirteen sessions retain the baseline hash. The smoke test covers the hosted provider, legacy profile counts and persisted chat; it does not claim all cloud workspace-generation paths were re-exercised. The three isolated local-model cases cover the broader feature workflow. Exactly **one paid hosted model call** was used for this release check.

Receipts: [candidate verification](evidence/hosted-candidate.json), [post-promotion preflight](evidence/hosted-post-promotion.json), [hosted browser checks](evidence/hosted-browser.json), [actual hosted generation](evidence/hosted-generation.json) and [deployed source manifest](evidence/deployed-source-manifest.json). All final application source hashes match the deployed candidate. Source synchronization to the existing draft PR and its current remote CI rerun are pending; no merge to `main` is claimed. No invitation token, API credential, database connection or complete cloud baseline is published here.

## Presentation and remaining external work

Use the [Friday demonstration guide](Friday-Demo-Guide.md) for the six-minute sequence, warm-up and recovery. The normal local fallback is `http://127.0.0.1:62607`; send one fictional message before presenting. The [November 5 recording](../2026-11-05/Week8/Integrated-Workflow.mp4) is an earlier automated recording without narration or live generation, not a new recording of this release.

- Obtain actual Ain/EIR or faculty review using the [review sheet](../2026-11-05/EIR-Review-Sheet.md). Technical passes do not establish endorsement or real-founder usefulness.
- Obtain authorized official Foundry/24-step materials and agreed Blackboard access before institutional integration. Missing official criteria are not reconstructed.
- Conduct a real user study and independent successor-deployment exercise when participants and permissions are available.
- Keep this pilot to fictional classroom records. Admitted cloud visitors share records; confidential founder use still requires per-user isolation and an explicit history/capacity policy.

No new team assignments, external messages, institutional acceptance or production-security approval are claimed by this report.
