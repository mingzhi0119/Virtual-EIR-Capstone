# Role 1 demo readiness on October 19

## Latest interface: Ain Center venture coaching

The existing Vercel invitation now opens the Ain Center interface. Venture UUIDs, storage revisions, raw profile/task JSON and internal event dumps are removed from the visible workflow. Plan history explains changed actions, targets and reported results; prerequisites use action names. Draft actions can be added, removed and linked through form controls.

Appearance reuses GOAT's original theme assets, token engine and preference storage. Classic, Rochester and Tsinghua support Light, Dark and System, with accent colors, reading fonts, contrast and sidebar treatment. New browsers start with Rochester; saved preferences remain respected.

Verification: 134 EIR tests passed, one optional PostgreSQL test skipped; 10/10 browser edit-guard checks; 7/7 local and 8/8 cloud interface checks. TypeScript and Ruff passed. Browser checks confirmed unchanged saved ventures/workspaces, no visible UUID/debug data, system appearance changes, preferences after reload, 390px layout and invitation protection. Receipts and screenshots: ignored `var/eir-business-ui/`.

Deployment: `dpl_9pf736Rc4LTaeQ1C9HxqZvMRx19X`, production alias unchanged. An additional whole-tree run returned 850 passed, 9 skipped and two failures in untouched GOAT governance tests: existing document encoding and a date-sensitive credential rotation assertion. These are not counted as a clean full-repository run.

## Latest: evidence review and weekly check-in on Vercel

The current recording target is the cloud app through the existing private invitation. Dachen needs no local access or setup. The original local rehearsal below remains dated historical evidence; use [Recording-Script.md](Recording-Script.md) for the updated cloud sequence.

Production deployment `dpl_4iWWvPxEGC8GSBbKq3A6XeX2fjvT` adds two product workflows:

1. **Evidence review and goal closure:** observations carry source, date, sample and limitations. Each success criterion gets a linked-evidence judgment. Uncertain/negative reviews keep the goal open. Achievement requires resolved tasks, supported criteria and explicit founder confirmation. Reopening permits corrections without erasing evidence or earlier judgments; changed evidence flags an earlier review as stale.
2. **Weekly check-in:** save reporting period, actual results, learning, blockers, next priorities and next review date. Counts are snapshotted from saved tasks and are not changed by the check-in. Later consultations use bounded summaries of the latest check-in and goal review. Complete history remains available. The next date is displayed; there are no automatic reminders.

Verification on October 19:

- Repository EIR suite: **134 passed, 1 optional PostgreSQL test skipped**; Ruff passed.
- Browser workspace edge checks: **9/9**, including unsaved evidence/review/check-in preservation through closing, pause/resume, navigation guards and mobile layout.
- Full local and Vercel browser journeys: **9 checks each**, using actual GPT-5.6 Luna planning and consultation. The new-session response recalled the saved exam/recruitment blocker and next priorities. Both 2/5 and 5/5 counts alone left the goal active; explicit evidence review closed it. Reopening and correcting evidence preserved history and required reassessment.
- All ventures/workspaces existing before each run were compared and remained unchanged. The same invitation worked in a fresh browser context; ordinary unauthenticated access returned 302. No browser runtime errors; 390px layout passed.
- Receipts and screenshots: ignored `var/eir-review-proof/local/` and `var/eir-review-proof/hosted/`; repeatable driver: `scripts/verify-eir-reviews.mjs`.

These are implemented prototype workflows, not expert verification or AIN acceptance. Coaching-quality review, AIN workflow confirmation, task owners/milestones and successor maintenance handoff remain open.

## Earlier local rehearsal

**Ready for recording on the tested local machine.** The actual English journey, six recoverable scenes, inputs, narration and recording handoff are prepared. The selected run completed on October 19 at approximately 10:24 a.m. America/New_York. Final capture/audio checks and the exported clip are operator tasks.

## Version and environment

| Item | Observed setup |
| --- | --- |
| Application baseline | Git `62fedfac3491c1af87b8eb360d37f7399c4cc08a` |
| Working tree | Added Role 1 launcher, rehearsal, inputs and documentation; application behavior source unchanged in this preparation |
| Runtime | Windows; Python 3.14.4; Node.js 24.14.1; Ollama with installed `gemma4:26b` |
| Model allocation | First run local model log reported 20.4 GiB total runner memory; this is an observation on this machine, not a portable minimum requirement |
| Boundaries | Shared GOAT 62606 / Ollama 11434; dedicated EIR 62609 with new take DBs |
| Venture | Campus Dinner Discovery (fictional), Engineer background, explicit Business communication preference |
| Selected raw run | `var/role1-demo/runs/2026-10-19T14-24-09-462Z/` |
| Committed-style evidence | [rehearsal.json](evidence/rehearsal.json) includes actual responses, state, run date, baseline revision and input/script SHA-256 hashes. It is a local prepared artifact until committed separately |

No commit, push, external message, upload or submission is included in this preparation. The pre-existing modified October 8 presentation was preserved.

The recording now also has an independently verified OpenAI mode. See [OpenAI integration](OpenAI-Integration.md) for its 95-test result, actual API replies and timings. The original local-model measurements below remain dated historical evidence.

## Verified results

| Check | Actual result |
| --- | --- |
| Existing deterministic suite | **79 passed**, 7.44 seconds on this run |
| Shared runtime | GOAT readiness returned true for settings, SQLite and Ollama |
| Actual UI and model journey | Six workflow checkpoints passed: preference save, initial reply, draft/review, 2/5 report, new-session reply and report-preserving v2; no browser runtime errors |
| Draft boundary | Raw AI proposed one task at zero progress; founder adjusted wording/rationale and saved review; no confirmed goal before approval |
| Progress authority | profile.actions remained empty; workspace report held target 5, completed 2 and small-sample observation |
| New-session continuity | Actual reply began “You have 5 interviews planned, 2 completed, and 3 remaining.” It discussed reported price versus untested speed, sample limits and a past-behavior question |
| No automatic state changes | Both actual consultation calls left profile and workspace state unchanged |
| Preference persistence | Saved Business preference remained after reload and separate-process recovery; UI directly showed Engineer and Business |
| Revision integrity | Approved v2 retained 2/5; v1 stayed unchanged; visible history included Compared with v1 |
| Scene data | ready/draft/approved/progress/followup/final all passed SQLite integrity checks and expected session/state assertions |
| Restart | Restarted the dedicated server from ready into a new take; one consultation recovered and no goal was stored; application and saved preference inspected in the in-app browser |
| Helper checks | JavaScript syntax and PowerShell parse passed; safe reset exercised through Windows venv parent/child processes |

The automated reply checks verify selected counts, English character screening, evidence-limit wording and unchanged saved state. They do not establish overall coaching quality or reliable preference adaptation across founders. Manual reading confirmed that the selected initial guide clearly labels questions for student interviewees and the selected follow-up keeps its conclusions cautious.

## Observed generation time

| Call | First run | Selected warm run |
| --- | --- | --- |
| Initial consultation | 27.109 seconds | 7.521 seconds |
| Plan generation | 12.657 seconds | 9.250 seconds |
| New-session follow-up | 21.101 seconds | 8.508 seconds |

The first run included model loading; the second also may benefit from reused context. These are two observed runs, not a latency benchmark or guarantee. Record actual waiting; disclose any shortening in the video. The selected initial and follow-up replies contained 122 and 115 whitespace-separated words, respectively, within their requested 130-word bounds.

## Obstacles resolved for this recording

- **Services were off:** started installed Ollama and the existing local services; verified readiness and actual generation.
- **Mixed sources of progress:** used only workspace task reports. No profile-action counters were prepared or silently synchronized.
- **Uncontrolled AI task count:** constrained the discovery request to one task; preserved raw proposal, then made a disclosed founder review. The advanced editor remains the fallback if a later model run proposes multiple tasks.
- **Initial question framing:** the first rehearsal's initial reply left the interviewee/founder audience ambiguous. Kept that actual sample in [initial-ambiguity.json](evidence/initial-ambiguity.json), revised the scenario input to request quoted interview questions under an explicit student heading, then reran the whole journey successfully. This improves this recording input; it does not close the general founder/customer confusion issue in R25.
- **Windows restart ownership:** the venv launcher PID differs from the interpreter owning the socket. The dedicated launcher now validates the command and direct parent relationship before stopping its own instance. It does not kill an unrelated listener.
- **Repeat takes:** each restart uses a new DB copy; all earlier runs and take directories remain available. Scene copies contain no assumed browser scroll/theme state.
- **Overstated scope:** script explicitly distinguishes activity, saved report, model suggestion and pending evidence review. Dedicated Weekly Check-in, full goal closure and portable runnable handoff remain open.

One attempted preparation after the original reset guard refused to stop its process was rejected because the take was nonempty. No venture was cleared. Its failed receipt remains locally under `var/role1-demo/runs/2026-10-19T14-23-43-280Z/`. The guard was repaired and the subsequent clean-take full run passed.

## Evidence screens

- [Saved profile and explicit preference](evidence/persona.png).
- [Goal and constraints](evidence/goal.png).
- [Unedited AI draft](evidence/raw-ai-draft.png) and [founder-reviewed draft](evidence/draft.png).
- [Confirmed 2/5 task report](evidence/progress.png).
- [Actual new-session response](evidence/followup.png).
- [Approved v2 and version history](evidence/final.png).

These are October 19 recorded screens. A fallback presentation must label them as such. They are not the older online showcase.

## Remaining recording gates and owners

| Gate | Owner | When / completion evidence |
| --- | --- | --- |
| 10-second capture, microphone and playback test | Dachen, with Mingzhi operating if needed | Immediately before recording; playable sound and readable UI |
| Actual final 2–4 minute recording and edit | Dachen | For October 20 individual delivery/integration; playable export with honest cut captions |
| Final clip technical accuracy review | Mingzhi | After export, before Wednesday package; check all seven required story points |
| Workflow question brief | Precious | October 20; own one-page artifact |
| Rubric and scored actual reply | Julian | October 20; own scores/rationale on an identified response |
| Integration and submission coordination | Dachen | October 21; reviewed package and submission confirmation |

The preparation cannot verify the operator's microphone, final video duration, independently runnable installation or AIN acceptance. No such completion is claimed.
