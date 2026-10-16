# GitHub collaboration setup

Updated October 16, 2026. This repository is the canonical upstream for Virtual EIR.

| Setting | Value / policy |
| --- | --- |
| Repository | [mingzhi0119/Virtual-EIR-Capstone](https://github.com/mingzhi0119/Virtual-EIR-Capstone) |
| Maintainer | `mingzhi0119` (Mingzhi Hu) |
| Default branch | `main` |
| Visibility | **Public**, verified October 16, 2026 through GitHub metadata and anonymous access |
| Contribution path | Personal fork → task branch → PR here → review → merge |
| License | [PolyForm Noncommercial 1.0.0](../LICENSE.md), with [scope and provenance](IP_AND_REUSE.md) |

## Forks and permissions

Public repositories can be forked without a collaborator invitation. A fork does not grant upstream write/admin permissions; direct collaborator access is a separate maintainer decision. While a repository is private, a teammate needs access and the owner must permit forking. Account/organization policies can add restrictions.

Public forks are public. Making upstream private later does not recall previously shared copies. Read [GitHub's fork rules](https://docs.github.com/en/pull-requests/reference/forks) before sharing sensitive material. Forks include the tracked GOAT source; directory separation is not an access boundary.

## Review conventions

- Keep this repository as the canonical source; do not move the team to another personal repository without agreement.
- Submit task-specific PRs and actual validation in English. Preserve authorship and history.
- Maintainer review is expected; this document does not claim branch protection or required reviews are enabled.
- The [Windows prototype workflow](../.github/workflows/prototype-checks.yml) runs on upstream `main` pushes and PRs. Fork runs may need approval. It does not run live GPU/Ollama evaluations or replace expert review.
- Keep credentials unavailable to fork PRs and do not execute unreviewed fork code in privileged workflows.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for commands. This refresh does not invite collaborators, transfer the repository, change the separate GOAT repository, or assign teammate work.

Publication checks and their limits are recorded in the [dated receipt](archive/2026-10-16-public-collaboration.md). GitHub may display the nonstandard license as `Other` / `NOASSERTION`; the committed full license text, not that detection label, specifies the offered terms.
