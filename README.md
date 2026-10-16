# Virtual EIR

A continuity-focused AI coaching prototype for early-stage entrepreneurs: understand the venture, propose a plan, record founder-confirmed progress, and continue the conversation next time.

**Canonical upstream:** [mingzhi0119/Virtual-EIR-Capstone](https://github.com/mingzhi0119/Virtual-EIR-Capstone). Fork this repository and submit pull requests here.

Updated October 16, 2026. Built for a University of Rochester MSAIB Capstone exploring the Ain Center use case. This is a proof of concept, not an Ain-approved production product.

## See the work

- [Week 4 presentation](deliverables/2026-10-16/Virtual-EIR-Week4.pptx): ten editable English slides.
- [Progress report](deliverables/2026-10-16/Week4-Progress-Report.md), [speaker script](deliverables/2026-10-16/Week4-Speaker-Script.md), and [Persona evaluation](deliverables/2026-10-16/Persona-Review.md).
- [Curated fictional test evidence](deliverables/2026-10-16/evidence/).
- [Read-only browser showcase](https://virtual-eir-showcase.vercel.app): an **older October 8 recording**, deployed October 9. No new replies, edits, local-model connection, or Week 4 Goal/Plan features. See [showcase notes](showcase/README.md).

All published venture examples and interview results are fictional. Recorded outputs demonstrate particular runs, not a live service or a guarantee of coaching quality.

## Next AIN meeting: October 22

The [October 16 faculty action summary](docs/meetings/2026-10-16-faculty-actions.md) and [confirmed team assignments](docs/TEAM_ASSIGNMENTS.md) guide the next feedback package: Mingzhi owns the working demo; Dachen owns recording/integration and submission coordination; Precious owns workflow/requirements questions; Julian owns the evaluation rubric and worked example. Everyone submits by October 20; assemble and send to Liza October 21; meet AIN October 22. These are team preparation commitments, not claims of completed work or AIN-approved scope.

## What works today

| Capability | Current boundary |
| --- | --- |
| English consultation and follow-up | Uses saved, founder-confirmed venture state through GOAT's existing chat API |
| Persistent profiles and sessions | SQLite storage, explicit corrections, revision checks, and restart recovery |
| Profile-adaptive Persona | Engineer, Artist, Scientist, and Business framing; explicit preference override and general default |
| Goal/Plan foundation | AI draft, founder edits and approval, progress reports, blockers, and versioned replanning |
| Progress integrity | Five planned / two completed / three remaining; task activity is **not** market validation |
| Shared appearance | Reuses GOAT themes, fonts, and appearance components |

The Week 4 delivery records 79 automated tests, 10 real-model workflow groups, 21 legacy UI groups, and 8 mock-network edge groups passing. The [CI run for the preceding baseline](https://github.com/mingzhi0119/Virtual-EIR-Capstone/actions/runs/38920734078) also passed; that is not proof of future changes. See the [report](deliverables/2026-10-16/Week4-Progress-Report.md) for scope and disclosed failures.

**Still open:** strict Persona coaching-quality acceptance; full Goal/Plan milestones, owners/dates, evidence-based criteria review and supported goal closure; all six dedicated feature workflows; Ain validation; production security and portable runnable handoff. Ordinary follow-up is not the planned Weekly Check-in feature. See the [current roadmap](docs/TEAM_ROADMAP.md).

## Run locally

Supported prototype setup: Windows + Python 3.14 + Node.js 24 + Ollama. The recorded model is `gemma4:26b`, tested on a 32 GB GPU. Different hardware/models need their own feasibility and quality checks. Startup does not download models or install Ollama.

```powershell
git clone https://github.com/mingzhi0119/Virtual-EIR-Capstone.git
Set-Location Virtual-EIR-Capstone
# Start Ollama and install a suitable model separately, then:
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local.ps1 -Install
```

For subsequent starts, omit `-Install`. Open [Virtual EIR](http://127.0.0.1:62607); the original [GOAT interface](http://127.0.0.1:62606) remains available locally. A fresh clone starts without the author's saved demo database. Read the [English local run guide](docs/LOCAL_RUN.md) before running mutating verifiers.

**Local single-user prototype only.** No multi-user authentication or authorization. Do not expose either backend to the Internet, use a public tunnel, or load real founder data. Public source code does not make the running application safe to publish.

## Architecture and provenance

Browser → Virtual EIR (`eir/`) → GOAT HTTP chat API (`apps/goat/`) → Ollama. The EIR layer owns confirmed venture state, Persona selection and the versioned planning workspace; GOAT supplies the reused platform/inference boundary.

| Directory | Purpose |
| --- | --- |
| `eir/` | Capstone-specific application, storage, coaching, planning and interface |
| `apps/goat/` | Vendored copy of Mingzhi Hu's **pre-existing GOAT AI**, not newly authored Capstone work |
| `tests/`, `scripts/` | Tests, startup, UI builds and isolated evidence workflows |
| `docs/`, `deliverables/` | Guides, plans, English reports/slides and fictional evidence |
| `showcase/` | Separate read-only recorded presentation |
| `var/` | Ignored local databases, logs, generated builds and test artifacts |

See [architecture](docs/ARCHITECTURE.md) and [IP/reuse](docs/IP_AND_REUSE.md). A fork copies the tracked GOAT source too; directory separation records provenance, **not** access isolation.

## Contribute through a fork

1. Read [CONTRIBUTING.md](CONTRIBUTING.md); agree a small task, owner, deliverable and acceptance checks.
2. Fork this repository to your account; keep this repository as `upstream`.
3. Work on a task branch, run relevant checks, and open a PR targeting this repository's `main`.
4. Include actual evidence, remaining gaps and introduced data/dependencies. A plan or interface alone is not an accepted feature.

English is the default for new shared documents, issues, PRs, UI text and demonstration conversations. Earlier Chinese plans and dated archives remain historical records; old pending/complete labels are not today's status. Current named preparation responsibilities are explicit in the assignment record; other work is not assigned by implication.

## Documentation

| Guide | Purpose |
| --- | --- |
| [Documentation index](docs/README.md) | Current English guides versus historical records |
| [Contributor guide](CONTRIBUTING.md) | Fork, synchronize, validate and submit a PR |
| [GitHub setup](docs/GITHUB_SETUP.md) | Canonical upstream, visibility and review conventions |
| [Local run guide](docs/LOCAL_RUN.md) | Install, start, stop, test and preserve local data |
| [Architecture](docs/ARCHITECTURE.md) | Request flow, storage and extension points |
| [Current team roadmap](docs/TEAM_ROADMAP.md) | Delivered scope and next gates |
| [Team assignments](docs/TEAM_ASSIGNMENTS.md) | Owners, October 20–22 milestones and completion evidence |
| [IP and reuse](docs/IP_AND_REUSE.md) | GOAT provenance, license scope and commercial permission |

## License

Original material made available by Mingzhi Hu here is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE.md), subject to [scope and third-party exceptions](docs/IP_AND_REUSE.md). This is **source-available, not OSI open source**. Permitted purposes include noncommercial use and organizational uses expressly allowed by the license; uses outside those permissions require separate authorization.

For commercial licensing, contact [Mingzhi Hu](https://github.com/mingzhi0119). This publication does not change the separate GOAT AI upstream repository's license, assign its ownership to the Capstone, or override applicable institutional agreements. Model weights, dependencies, third-party assets and trademarks keep their own terms.
