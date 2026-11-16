# Week 8 integrated demonstration

The [80-second English recording](Integrated-Workflow.mp4) shows real browser operations against the isolated local app. It has no narration. A fictional approved plan and two-of-five progress are seeded before recording; this is an automated acceptance walkthrough, not a recording of a real founder or live model generation. The temporary service error is deliberately injected to verify draft recovery. Model-generated workflows and Persona outputs are archived separately.

## Viewing sequence

1. Required fields, participant limits and failed-service recovery retain unsaved work.
2. Save and confirm an experiment. Link a contrary observation with source and sample limits.
3. Preserve mentor questions while switching tools. Save decision alternatives with unknown costs.
4. Save simulated pitch practice, revise it and retain the earlier version.
5. Confirm a provisional step-readiness record. Pause/resume without losing an unsaved draft.
6. Review the mentor brief, download it, and open the printable view. A profile change in another client invalidates the old export.
7. Add a task with milestone/owner fields, approve a new plan and retain two completed interviews.
8. Exercise three themes in light/dark modes at desktop and phone widths.

The printable view opens in a separate browser page; its [still image](evidence/mentor-brief-print.png) and [exported Markdown](evidence/Mentor-Brief.md) accompany the recording. An automated recording is fast: pause to inspect forms or use the still images. No video was published to the public showcase.

## Suggested spoken walkthrough

“This is a fictional teaching example. The founder planned five interviews and completed two. Three remain; completing interviews does not establish market demand.

“The experiment links a hypothesis to the current plan. We record contrary observations with their source, sample size and limits. The decision tool preserves alternatives and unknown costs. Pitch practice is explicitly simulated, so its feedback cannot become customer evidence.

“A step assessment is provisional and does not close the business goal or imply Ain approval. The founder reviews the mentor brief before exporting. If the underlying profile changes, the application requires a fresh review.

“Finally, revising the plan retains earlier reports. The interface supports desktop and phone screens. AI advice remains fallible: the comparison report includes an invented initial count and weak motive inference. These examples need mentor judgment, not automatic acceptance.”

## Reproduce locally

Run the existing isolated server on port 62618 with `EIR_DB_PATH` pointing to `var/pre-week8-proof/demo.sqlite3`, as described in the [implementation report](../Pre-Week8-Implementation.md). Then run:

```powershell
$env:EIR_UI_RECORD='1'
node scripts/verify-pre-week8-ui.mjs
Remove-Item Env:EIR_UI_RECORD
```

The verifier seeds only its fictional local case, writes a WebM recording under ignored `var/week8-proof/recordings/`, and produces the browser receipt. Microsoft Edge and the existing frontend Playwright installation are required. The MP4 delivery is a direct H.264 conversion, with no speed change or generated frames.
