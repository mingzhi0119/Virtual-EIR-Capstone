# Architecture and extension boundaries

Updated October 19, 2026. This describes the implemented local prototype, not a proposed multi-agent production system.

## Request flow

1. The browser loads the EIR interface on port 62607 and calls EIR's FastAPI routes.
2. `eir/app.py` handles venture/session routes; `eir/feature_routes.py` installs workspace routes. The local boundary rejects non-loopback clients and unexpected browser origins.
3. `eir/store.py` loads confirmed profiles, revisions and session history. `eir/feature_store.py` manages separately revisioned planning records in the **same EIR SQLite database**.
4. `eir/coaching.py` composes common policy, Persona instructions, bounded saved context and messages. `eir/planning.py` validates structured proposals and applies explicit founder decisions.
5. `eir/runtime.py` selects the model provider. By default, `GoatClient` calls GOAT on 62606 and consumes SSE; GOAT calls local Ollama on 11434. With explicit OpenAI configuration, `eir/openai_client.py` calls the official Responses API directly, keeps the key in the backend, and supplies a strict JSON schema for planning. Both use the same bounded context and founder approval rules.
6. The browser receives the reply/proposal. Generation does not approve plans, alter confirmed facts or complete real-world work.

## Responsibilities

| Component | Owns | Does not establish |
| --- | --- | --- |
| `eir/web/`, `eir/frontend/` | Profile/workspace controls and inherited appearance | Automatic approval or factual reliability |
| `eir/personas.py` | Communication adaptation, override and general default | Independent finance/legal experts or autonomous agents |
| `eir/coaching.py` | Coaching policy, selected context and GOAT client | Unlimited memory or verified external facts |
| `eir/runtime.py`, `openai_client.py` | Explicit provider choice, private key loading and Responses transport | Offline cloud inference or automatic paid retries |
| `eir/planning.py`, `feature_models.py` | Proposals, validation, revision and progress rules | Automatic task execution or automatic success claims |
| `eir/reviews.py`, `web/reviews.js` | Sourced observations, immutable corrections, criterion review, explicit founder-confirmed achievement and weekly check-in history | Independent verification, AIN approval or automatic reminders |
| `eir/store.py`, `feature_store.py` | Persistent state and revision history | Multi-user authorization or automatic profile/workspace synchronization |
| `apps/goat/` | Pre-existing platform, original UI and reused inference API | New Capstone ownership or acceptance of every upstream feature |
| Ollama | Local model serving | Hosted handoff, unlimited GPU capacity or validated coaching quality |

## Persistence and context

`var/eir/ventures.sqlite3` holds EIR profiles, sessions and separate workspace/revision tables; the workspace is not a second live database. GOAT runtime metadata uses `var/goat/chat_logs.db`. Both are ignored by Git.

Profiles require confirmation and revision checks. Plans have draft/approval/rejection state, version lineage and report-preserving revisions. Progress uses absolute counts, with stale-write/dependency validation. Profile actions and workspace tasks are distinct, not automatically synchronized.

Workspace JSON now also stores evidence, goal reviews and check-ins; older rows load empty defaults without a destructive migration. Achievement requires all criteria supported by active evidence, resolved tasks and explicit founder confirmation in one revision-checked transaction. Reopen to correct a closed goal. Corrections preserve original observations/reviews and flag earlier judgments as stale. Weekly reports save server-read task snapshots without changing counts. The latest report and review enter bounded coaching context with explicit limitations; complete history remains in storage.

The legacy-profile admission limit is 5,500 serialized characters excluding separately bounded Persona fields. Selected workspace context is bounded to 1,600 characters. The combined 8,000-character system-context budget reserves policies and relevant workspace context; a large profile becomes an explicitly partial view with omission metadata. Full storage is retained. Remembering a record does not mean every detail is in every model call.

## Extension rules

- Extend `eir/` first; preserve GOAT's HTTP contract unless a separately reviewed upstream change is necessary.
- Keep proposals separate from confirmed state. Test corrections, stale writes, restart and project association.
- Follow [feature gates](TEAM_ROADMAP.md); ordinary chat is not all dedicated workflows.
- `EIR_GOAT_BASE_URL` configures a GOAT-compatible endpoint. An arbitrary model provider is **not** a drop-in configuration change; it needs an adapter, compatibility checks and evaluation. The explicit OpenAI adapter is now available; see [API setup and validation](OPENAI_DEMO.md).
- No current claim of EIR web search, knowledge ingestion, scheduling, specialist-agent orchestration or real-mentor response processing.
- Portable runnable handoff needs explicit resource/model/deployment choices and safeguards. Public source and the static showcase do not fulfill runtime handoff alone.

See [local instructions](LOCAL_RUN.md) and [IP/reuse boundaries](IP_AND_REUSE.md).
