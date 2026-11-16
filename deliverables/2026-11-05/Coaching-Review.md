# Coaching output review — November 5

Subsequent update: see the [pre-launch quality review](Release-Readiness.md) for the repaired context boundary and three final follow-ups that explicitly retain 5/2/3 and sample limitations. The outputs discussed below remain the earlier review snapshot.

This is an implementation-side reading of fictional `gemma4:26b` outputs, not an independent EIR evaluation. The archive retains unsuccessful outputs as well as final samples. Functional persistence and response quality are assessed separately.

## Final Persona comparison

The [final eight outputs](evidence/persona-real.json) use temperature 0.2, thinking disabled, four background selections and a new session for each initial/follow-up call. All eight are English; word counts range from 140 to 166. The four initial replies contain two intake questions and propose no more than five interviews. All four follow-ups preserve five planned and two completed, identify the remaining three directly or through the next action, and explain small-sample/generalization limits.

| Style | Observed behavior | Remaining concern |
| --- | --- | --- |
| Engineer | Constraints and observable process; 5/2/3 retained; suggests actual purchase trade-offs. | Technical vocabulary can be heavier than needed. Price-threshold language needs care to avoid hypothetical willingness-to-pay evidence. |
| Artist / practical experience | Third-person customer narratives; no attribution of hunger or emotional strain to the founder in the final sample; actual meals and alternatives. | Advice still says to “pivot” after two observations; an EIR should assess whether this overstates the appropriate change. |
| Scientist | Hypothesis/method/limitations structure; exact 40% task completion; no unsupported statistical-significance claim. | The vending-machine/cafe example must stay an example, not become an assumed observation. |
| Business professional | Customer choices and rejected alternatives; exact counts, trade-offs and sample limits. | Language about a “universal barrier” is too ambitious for the small qualitative sample, even though no universality is asserted. |

Earlier outputs attributed customer experiences to the Artist founder, added extra closing questions and described 2/5 as “halfway.” These are retained in [earlier evidence](evidence/persona-before-final-prompt.json) and [intermediate evidence](evidence/persona-before-style-fix.json). The experiential style now specifies third-person customer examples, and intake instructions prohibit a third closing question. Arithmetic and emotional-attribution defects were not observed in the final eight samples. This is sample-level evidence, not a general guarantee.

## Three workflows and refreshed follow-ups

All three [full workflows](evidence/real-model.json) generated and persisted a plan, experiment, decision analysis, pitch and provisional stage review. A stored observation contradicted the assumption that user and buyer are the same. Each saved a weekly check-in, preserved 5/2/3 and produced a source-labeled brief without changing the workspace during chat/export.

The original follow-ups were too long and used “not statistically significant” for two convenience interviews. They are retained unchanged. The [refreshed follow-ups](evidence/followup-final.json), generated after the final prompt/style changes, are shorter, avoid that statistical wording, distinguish user from buyer and leave the workspace unchanged. Material coaching limitations remain:

- **Campus dinner:** suggests a payment-authorization workflow too strongly before testing the buying path. This should be an option to investigate, not a technical requirement.
- **Music practice:** retains 2 of 5 but omits the explicit remaining-three count. It introduces possible administrator criteria with overly general language and should ask for actual purchase evidence.
- **Window repair:** challenges an unverified link between user satisfaction and purchase approval and asks about the approval process. It should label the role split and buying criteria as limited observations/hypotheses more consistently.
- **All three refreshed replies:** do not consistently restate the two-interview limitation, although the stored observation, workspace and brief retain it. Prompt instructions alone do not certify evidence discipline.

No model reply changed counts, evidence records, goal status or confirmed alternatives. Exact-count briefs come from stored state, not model reconstruction. Advice-only output contracts prevent the earlier defect where a proposed experiment acquired an invented execution status.

## Acceptance decision

Feature implementation and deterministic/browser verification are complete for the pre-Week-8 software scope. R25 strict coaching-quality acceptance and R33 independent evaluation remain open. Use the [EIR review sheet](EIR-Review-Sheet.md); do not describe the prototype as expert-approved or guaranteed to preserve every nuance in free-form advice.

Priority feedback: assess neutral tests, whether advice changes too strongly after a small sample, and which observations justify advancing an ordinary step. Actual reviewer findings and official materials are needed before claiming Foundry alignment.
