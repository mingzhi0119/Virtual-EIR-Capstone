# Week 4 Persona comparison: eight recorded responses

Reviewed October 16, 2026 by the implementation owner. Four founder backgrounds, two stages each; identical venture facts within each stage. Model: `gemma4:26b`, temperature 0.2, `think=false`. These are isolated fictional examples, not expert evaluation or a representative benchmark. Raw outputs: [persona-real.json](evidence/persona-real.json).

Initial: untested speed assumption, no completed action, capacity at most five interviews. Follow-up: five planned, two reported complete, three remaining; two convenience interviews favor price over speed. All responses were read, not merely checked for language.

| Case | Style adaptation | Factual fidelity | Action usefulness | Evidence discipline | English quality |
| --- | --- | --- | --- | --- | --- |
| Engineer / initial | Technical constraints, latency, metrics | No invented completed interviews; wrongly addresses founder as student customer | Three interviews within capacity; retrospective behavior probes | Hypothesis treated as untested | English; verbose |
| Engineer / follow-up | Requirements, cost/time trade-offs | Correct 5/2/3; price observation retained | Three remaining; hypothetical willingness-to-pay question needs replacement | Small-sample limit stated; claim to quantify price elasticity is unjustified | English; understandable |
| Artist / initial | Empathetic, narrative opening | No invented results; “peers” is an unsupported relationship assumption | Three interviews; recent dinner and actual spending | Requests actual behavior rather than liking the idea | English; clear |
| Artist / follow-up | Reflective, human-experience framing | Correct 5/2/3; price observation retained | One further interview within remaining three; stronger actual-purchase probes needed | Small convenience sample cannot prove demand | English; typo `e.le.` remains |
| Scientist / initial | Hypotheses, semi-structured method | Hypotheses distinguished from observations | Three interviews; recent dining and elapsed time | Explicit convenience-sample/generalization caveat | English; some unnecessary formality |
| Scientist / follow-up | Status, limitations, method | Correct 5/2/3; preliminary observation not market trend | One interview; price-threshold wording needs more retrospective specificity | No generalized demand claim | English; clear |
| Business / initial | Value proposition, segment, trade-offs | No invented completed work; wrongly asks founder about their own student routine | Three interviews; actual price and process records | Untested assumption remains a question | English; verbose |
| Business / follow-up | Cost/convenience and next action | Correct 5/2/3; price observation retained | Three interviews; hypothetical alternative-price question needs refinement | Biased convenience sample, not demand proof | English; clear |

## Disposition

- Implemented: editable background; automatic style selection with general fallback; explicit user preference override; bounded prompt guidance; shared factual and confirmation rules.
- Exploratory evidence: all eight outputs are English, all follow-ups preserve 5/2/3, and intended styles are observable with overlap. No automated claim of statistical significance was found in this final Persona set. Some answers exceed the requested 180 words.
- **Quality acceptance remains open.** Founder/customer perspective mistakes, hypothetical probing, inflated analytical claims and editing errors are not hidden by a single “pass” score. Background labels must not imply fixed personality, capability or emotion.
- Next evaluation: ask an EIR/faculty reviewer to assess neutral actual-behavior probes, founder/customer perspective, equivalent advice quality across styles, evidence limits and concision on more cases, including ambiguous backgrounds and user overrides. Reviewer and review date are not yet agreed.

## Preserved failure evidence

[Initial workflow output](evidence/workflow-initial-statistical-wording.json) used “statistically insignificant” without a statistical test. The policy was hardened and a later workflow was rerun, but future model compliance is not guaranteed. [Earlier Persona baseline](evidence/persona-baseline.json) and [pre-perspective-guard comparison](evidence/persona-pre-stereotype-guard.json) are retained for inspection. The final JSON above is one explicitly labeled comparison, not a selection presented as universally successful behavior.
