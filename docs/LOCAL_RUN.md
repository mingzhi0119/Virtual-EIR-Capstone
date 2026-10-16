# Local setup and verification

Updated October 16, 2026. Run commands from the repository root. Older dated archives describe earlier snapshots, not today's feature acceptance.

## Prerequisites

- Windows, PowerShell, Git, Python 3.14 available through `py -3.14`, and Node.js 24/npm.
- Ollama running on `http://127.0.0.1:11434`, with a suitable model already installed.
- Recorded setup: `gemma4:26b` on an RTX 5090 with 32 GB VRAM. Other models/hardware need independent checks. Startup does not install Ollama or download models.
- Internet for first-time dependencies; existing `uv` is used when available.

Other operating systems are not validated by the supplied launcher. Root CI targets Windows and does not prove Linux/container parity.

## First start

```powershell
git clone https://github.com/mingzhi0119/Virtual-EIR-Capstone.git
Set-Location Virtual-EIR-Capstone
ollama list
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local.ps1 -Install
```

Contributors should clone their own fork instead; see [CONTRIBUTING.md](../CONTRIBUTING.md). Start Ollama separately if the local endpoint is unavailable.

`-Install` creates `apps/goat/.venv`, installs `apps/goat/requirements-ci.txt`, runs `npm ci` and builds GOAT's frontend. Every start builds EIR appearance assets from those dependencies. GOAT is vendored: no submodule update or second GOAT clone is needed.

| Service | Address |
| --- | --- |
| Virtual EIR | http://127.0.0.1:62607 |
| Original GOAT interface | http://127.0.0.1:62606 |
| Ollama | http://127.0.0.1:11434 |

A fresh clone has no saved venture/session database. Create a **new fictional venture** and choose an installed model. Health/readiness is not successful generation; send one message before demonstrating.

## Start, stop and diagnose

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/stop-local.ps1
```

Add `-Service eir` to stop only EIR. Scripts identify this checkout's processes; an unrelated occupied port is an error, not permission to kill it. Background windows are hidden. Logs: `var/goat-stdout.log`, `var/goat-stderr.log`, `var/eir-stdout.log`, `var/eir-stderr.log`.

Stopping preserves data and does not stop Ollama. Backend/prompt edits require restarting the relevant service, not just refreshing the browser. Startup sets the GOAT English prompt and disables sandbox/workbench features for this demo. English policy is not an infallible filter; historical Chinese conversations are not translated.

## Demonstrate the foundation

1. Create a fictional venture. Open **Venture profile**, enter background/preference, review and confirm the save.
2. Open Goal/Plan, enter objective, success criteria and constraints; generate a draft.
3. Review/edit and explicitly approve it. Generation must not overwrite confirmed state.
4. Report fictional actual progress. Five planned and two completed means three remaining, not market validation.
5. Start a follow-up session and review saved progress. This is not the dedicated future Weekly Check-in feature.
6. Use **Revise approved plan · retain reports** for a report-preserving new version. A fresh **Generate AI plan** proposes zero-count work instead; inspect the warning and history.

Profile actions and workspace tasks are separate, not automatically synchronized. Supported goal achievement remains blocked pending evidence review. See the [report](../deliverables/2026-10-16/Week4-Progress-Report.md) and [Persona review](../deliverables/2026-10-16/Persona-Review.md) for quality limitations.

## Deterministic checks

After installation, without live inference:

```powershell
apps/goat/.venv/Scripts/python.exe -m pytest tests -q
apps/goat/.venv/Scripts/python.exe -m ruff check eir tests scripts/verify-demo.py scripts/verify-english.py scripts/verify-week4-personas.py
apps/goat/.venv/Scripts/python.exe -m ruff format --check eir tests scripts/verify-demo.py scripts/verify-english.py scripts/verify-week4-personas.py
node apps/goat/frontend/node_modules/typescript/bin/tsc -p eir/frontend/tsconfig.json
node scripts/build-eir-ui.mjs
```

The [CI workflow](../.github/workflows/prototype-checks.yml) contains exact ESLint and GOAT regression commands. The mock-network browser edge suite requires installed Microsoft Edge and frontend Playwright:

```powershell
node scripts/verify-week4-workspace-edges.mjs
```

It intercepts requests rather than calling live databases/models, and writes generated evidence under ignored `var/week4-proof/`.

## Isolated real-model proof

Real-model/browser verifiers **mutate fictional records and regenerate evidence**. Preserve earlier outputs you need; do not run old live-demo verifiers against a preserved database.

The Week 4 workflow verifier targets **62608**, not live 62607. After GOAT/Ollama starts, use another terminal to start the isolated EIR server; first ensure 62608 is free:

```powershell
$env:EIR_DB_PATH = Join-Path (Get-Location).Path 'var\week4-proof\workflow.sqlite3'
$env:EIR_GOAT_BASE_URL = 'http://127.0.0.1:62606'
$env:EIR_HTTP_PORT = '62608'
apps/goat/.venv/Scripts/python.exe -m uvicorn eir.app:create_app --factory --host 127.0.0.1 --port 62608
```

From another terminal at the same root:

```powershell
node scripts/verify-week4-eir.mjs
apps/goat/.venv/Scripts/python.exe scripts/verify-week4-personas.py
```

Persona generation uses `var/week4-proof/personas.sqlite3`. Both use local GOAT/Ollama inference; the workflow requires the recorded model and Edge. Do not repoint verifiers to the live port to bypass setup. Stop the isolated foreground server with Ctrl+C.

Recorded October 16 delivery: 79 automated tests, 10 real-model groups, 21 legacy UI groups, and 8 mock-network edge groups passed. These are dated results, not current availability or universal quality guarantees. [Curated fictional evidence](../deliverables/2026-10-16/evidence/) is versioned; local databases are not.

## Data and backups

| Path | Contents |
| --- | --- |
| `var/eir/ventures.sqlite3` | Profiles, revisions, sessions, workspaces and workspace revisions |
| `var/goat/chat_logs.db` | GOAT chat/runtime metadata |
| `var/goat/data/`, `var/goat/logs/` | Local GOAT files and logs |
| `var/week4-proof/` | Isolated test databases and generated evidence |

Git does not synchronize these paths, `.venv`, `node_modules`, model weights, credentials or local configuration. Ollama stores models separately. To transfer state, stop project services, securely back up the required complete `var` tree, restore on an appropriately configured machine, then restart. Do not overwrite newer state with an old backup as a routine demo step. Full cross-device disaster recovery remains unvalidated.

## Safety and deployment

Only local, single-user, fictional demonstrations are supported. Project IDs prevent accidental association, not unauthorized multi-user access. No public/LAN binding, tunnel or real founder data. Existing dependency findings require separate remediation; no fresh clean security audit is claimed.

Public source is not a hosted application. The [Vercel showcase](https://virtual-eir-showcase.vercel.app) is an older read-only recording with no live model/write API. Portable runtime handoff needs its own deployment/security slice; Docker and hosted application delivery are not claimed.
