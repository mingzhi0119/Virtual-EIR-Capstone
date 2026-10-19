# Role 1 recording handoff to Dachen

Current recording uses Vercel and the existing private invitation link. Dachen needs no local access or setup. Follow [Recording-Script.md](Recording-Script.md) for the current sequence, including evidence review and weekly check-in. The local startup/snapshot instructions below are retained for Mingzhi's historical rehearsal and recovery only.

Mingzhi provides the runnable case, verified states and technical accuracy review. Dachen owns capture, narration/editing, integration and submission coordination. Precious owns workflow questions; Julian owns the rubric and scored actual reply. [Agreed responsibilities and dates](../../docs/TEAM_ASSIGNMENTS.md).

## Files to open

1. [Recording script](Recording-Script.md): exact scenes, complete English narration, timing and honest cut captions.
2. [Inputs](demo-inputs.json): canonical copy-ready case, questions, goal, report and revision.
3. [Readiness report](Readiness-Report.md): version, observed inference times, actual checks and remaining operator work.
4. [Evidence](evidence/): selected October 19 actual replies and screenshots. Local full run and DB snapshots are under ignored `var/role1-demo/`.

## Start and repeat a take

The current recording uses the official OpenAI API on Mingzhi's Windows machine. The key is already in private local config. From the repository root:

```powershell
# Open a NEW API recording take from the saved beginning:
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-role1-demo.ps1 -Provider openai -Scene ready
```

Open **http://127.0.0.1:62609**. Select **Campus Dinner Discovery (fictional)** if the browser remembers an old venture. Set Appearance to **University of Rochester / Light**, and choose `gpt-4.1-mini`. The **ready** scene contains one saved initial consultation and confirmed profile, with no Goal/Plan. A recording starts with the already-saved consultation and proceeds to a new plan.

Every launcher start stops only its identified demo process and uses a new copy of a snapshot. Previous takes remain in `var/role1-demo/takes/`. The live venture DB on 62607 and the earlier verifier on 62608 are never used for scene resets. The API mode runs independently of GOAT/Ollama. See [OpenAI setup](../../docs/OPENAI_DEMO.md) and [actual API validation](OpenAI-Integration.md). The previous local-model evidence remains dated separately.

```powershell
# Recover only the failed segment with an honest scene transition:
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-role1-demo.ps1 -Provider openai -Scene draft
# Other available scenes: approved, progress, followup, final
# Stop only the dedicated recording instance, keeping all takes:
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-role1-demo.ps1 -Stop
```

Reload the browser after each server restart. Closing a dialog does not save changes. Save each edited draft and each task report before changing session. A browser tab's local edits do not move into the next take.

## Scene checkpoints

| Scene | Saved starting state | Use |
| --- | --- | --- |
| ready | Confirmed Engineer/Business profile, one actual consultation, no goal | Full main take |
| draft | Actual AI generation plus disclosed founder simplification, one task target 5, no confirmed goal | Capture review and approval |
| approved | v1 active, 0/5 | Capture report confirmation |
| progress | v1 active, 2/5 and written n=2 report, one session | Capture genuinely new follow-up |
| followup | Two sessions, actual initial and return replies, v1 at 2/5 | Capture retained-report revision |
| final | Approved v2 at 2/5 and unchanged v1 history, two sessions | Scope ending and fallback |

Snapshots contain saved database state, not scroll position, open dialogs, theme or browser zoom. Select the venture after recovery. Screenshots document the intended framing.

## Rebuild the rehearsal if the application or input changes

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-role1-demo.ps1 -Provider openai -Scene empty
node scripts/prepare-role1-demo.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-role1-demo.ps1 -Provider openai -Scene ready
```

The rehearsal refuses a nonempty take. It exercises actual UI actions and real inference, preserves raw model output and timings, backs up six scenes through SQLite, and writes a dated run folder. Earlier dated run folders remain. A failed run is marked failed; inspect its evidence before retrying. New actual replies require a fresh narration check and Julian's own review. Do not overwrite the committed selected response while continuing to cite its old run date.

## Capture and audio checklist

Before the final take, Dachen performs a 10-second capture with a short sentence and a scroll, plays it back, and confirms these items:

- Capture the application window, with no terminal, notifications, meeting chat or personal browser tabs in frame.
- Use a landscape 1080p export if the recorder supports it. The verified rehearsal viewport is 1600×1000; use its framing as a reference and test readability in the actual recording window. Keep zoom fixed after framing.
- Text, 2/5, n=2 and approval state remain readable at normal playback size. Scroll slowly and hold each evidence screen for at least 3 seconds.
- Narration is audible, not clipped or doubled; select one microphone and avoid capturing meeting audio twice. Microphone and system permissions remain with the operator.
- Keep model `gpt-4.1-mini` selected. Maintain internet access and usable API quota. Refresh the model list through Appearance if the model is absent.
- If a generation check is needed before capture, use a disposable take and then restart **ready**; the request uses paid API quota. Do not add rehearsal messages to the selected recording take.
- Record in short segments if useful; shorten only waiting/typing and label the cuts. Keep failed takes outside the final export.
- Export a playable MP4 when available, verify duration 2–4 minutes, watch the entire file once, and confirm audio plus UI readability. A screenshot, silent browser test or a video that has not been played is not this gate.

Mingzhi checks counts, preference, draft/approval distinction, new-session continuity, retained-report v2 and all scope labels in the final exported clip. Dachen places the reviewed clip in the integrated package and coordinates Wednesday submission. No external message or upload is performed by preparing this handoff.

## If Dachen cannot run the application

Capture on Mingzhi's already-tested machine, or use an agreed Zoom/application-sharing session and let Mingzhi operate while Dachen captures. Test text readability and captured narration before the real take. If remote sharing is blurry, transfer a locally captured video through the team's agreed private route. A recording handoff is different from independent runnable setup: the private API config, virtual environment, generated UI assets and local databases are not in Git. API mode removes the local model/GPU requirement but still needs its own setup and verification. See [local requirements](../../docs/LOCAL_RUN.md).

No public tunnel, hosted backend or new account is required. The older Vercel showcase does not contain the current Goal/Plan flow.

## Obstacle guide

| Symptom | Operator action | Stop/recovery point |
| --- | --- | --- |
| Connection refused | Restart the dedicated launcher with `-Provider openai`; check its take log | Do not continue over a dead service |
| Healthy page but generation fails | Check internet, API model access, billing/quota and take logs; see the OpenAI setup guide | At 45 seconds of waiting, stop speaking; capture the eventual result or use labeled saved evidence. At request error, diagnose once rather than repeated clicking |
| Invalid plan response | No workspace change should be saved; preserve error and use verified draft | Label it previously generated/reviewed; never call it a fresh successful generation |
| Several AI tasks | Review raw proposal; simplify to one interview task via advanced JSON | Do this as an explicit founder edit or use prepared draft |
| Navigation blocked | Read unsaved indicator; confirm appropriate edits/report | Discard only intentional local changes; close does not save |
| Revision conflict | Preserve local text, reload saved workspace and reapply against latest version | If source report changed, make a fresh retained-report revision |
| Count jumps or wrong session | Check selected venture and saved scene | Restart approved/progress into a new take; do not edit evidence to conceal mismatch |
| v2 resets to zero | Wrong path used: Generate AI plan creates fresh work | Recover followup; use Revise approved plan · retain reports |
| Reply overlong or inaccurate | Read actual output; use a short excerpt that preserves its meaning | Disclose weakness and give full reply to Julian; do not narrate an expected claim over contradictory text |
| Model unavailable during capture | Use selected actual screenshots/reply with date caption | This is recorded fallback, not a newly generated response |

## Questions tied to the screens

These are proposed prompts for Precious and Julian to adapt, not their submitted deliverables or AIN answers.

| Screen | Short AIN question | Decision informed | Owner |
| --- | --- | --- | --- |
| Founder profile | Which intake fields do you need before coaching, and which should be collected later? | Minimum profile versus progressive intake | Precious |
| Engineer / Business preference | Should founders choose this style, and when should the coach ask them to change it? | Preference UI and override policy | Precious |
| Learning goal / draft | Would this be a useful first discovery task, and what would you change? | Goal/plan coaching structure | Precious |
| 2/5 report and actual follow-up | Does this response handle the small sample appropriately and suggest a useful next question? | Coaching rubric and evidence limits | Julian |
| v2 and history | What should a returning founder and a human mentor see first? | Continuity and future handoff design | Precious, coordinate with Julian |

## Final delivery manifest for October 21

Dachen's package: reviewed 2–4 minute playable clip, concise scene-linked questions, Precious's brief, Julian's rubric with an actual scored response, scope/setup note and submission confirmation. Individual owner submissions are due October 20. Meeting logistics follow the actual October 22 invitation. No precise meeting time is assumed here.
