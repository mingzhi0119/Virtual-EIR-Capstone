# OpenAI demo integration

The October 19 OpenAI rehearsal passed the complete Role 1 UI journey using `gpt-4.1-mini`. The recording server on port 62609 was then restarted from its OpenAI ready checkpoint. Use the [OpenAI setup guide](../../docs/OPENAI_DEMO.md); the older local-model evidence remains separate.

## Verified behavior

| Check | Result |
| --- | --- |
| Automated backend checks | 95 tests passed, including provider selection, request/auth boundary, transcript context, plan approval and failure persistence |
| Actual UI journey | Six workflow checks passed with no browser runtime errors |
| Initial consultation | 1.560 seconds; saved Business preference supplied; interviewee questions explicitly labeled |
| Plan generation | 2.465 seconds; one actual proposed task; founder reviewed and explicitly approved |
| Saved progress | Founder report stored as 2/5 with an n=2 limitation |
| New session | 2.175 seconds; actual response stated planned 5, completed 2 and remaining 3, discussed price versus speed and proposed a past-behavior question |
| Plan revision | v2 retained 2/5; v1 and its history remained unchanged |

Times are one observed run, not a service guarantee. Raw replies, state and preparation-file hashes are in [rehearsal.json](evidence-openai/rehearsal.json). The local run was `2026-10-19T15-04-10-879Z`; its baseline Git revision is recorded alongside uncommitted-file hashes. The current source includes the adapter and launcher. This receipt describes the earlier run against an uncommitted working tree, not a fresh execution of the latest interface.

## Recording evidence

- [Profile and preference](evidence-openai/persona.png)
- [Goal](evidence-openai/goal.png)
- [Raw proposal](evidence-openai/raw-ai-draft.png) and [founder-reviewed draft](evidence-openai/draft.png)
- [Confirmed report](evidence-openai/progress.png)
- [Actual follow-up](evidence-openai/followup.png)
- [Approved v2 history](evidence-openai/final.png)

The original Ollama artifacts in `evidence/` still describe `gemma4:26b`. Do not present those replies or their timings as OpenAI output. The recording sequence and narration remain applicable; select the OpenAI model and use the API timings/actual response for evaluation.

## Resolved integration obstacles

The original application could only call GOAT/Ollama. A backend Responses adapter now shares the same policy, Persona and bounded saved context, with an explicit provider setting. The key is in ignored local config and is never sent to the browser.

One rehearsal stopped because an automated UI label had been corrupted during a file edit. A second attempt received an invalid plan and correctly saved no workspace proposal. The script encoding was repaired, and plan calls now request a strict JSON schema before the existing semantic validation. The subsequent complete run passed; failed receipts remain in the local run folders.

The actual follow-up correctly gives 5/2/3 but describes a "small sample of 5" after mentioning two completed interviews. During narration, call the observed sample **n=2**, with five only the planned interview target. This response is a review sample, not proof of generally reliable coaching or AIN acceptance. Julian's reply-quality review, the microphone test and final video review still apply.
