# Contributing to Virtual EIR

The canonical upstream is **[mingzhi0119/Virtual-EIR-Capstone](https://github.com/mingzhi0119/Virtual-EIR-Capstone)**. Use your own fork for development and submit pull requests here. Do not replace upstream with another member's repository.

Use English for new issues, PR descriptions, shared specifications, UI text and demo conversations. Historical Chinese records do not need rewriting for a focused contribution.

## Before starting

- Read the [current roadmap](docs/TEAM_ROADMAP.md), [architecture](docs/ARCHITECTURE.md), [license](LICENSE.md), and [reuse notice](docs/IP_AND_REUSE.md).
- Agree a bounded task, named owner, observable deliverable and acceptance checks. A suggestion is not an assignment or an Ain-approved requirement.
- Keep GOAT platform work separate from Capstone changes. Discuss changes to `apps/goat/` first and follow its own `AGENTS.md` and relevant upstream gates.
- Use your own Git identity. Preserve existing authorship and history; do not attribute inherited work to yourself.

Contribute only material you are authorized to share and license. Unless explicitly identified and agreed otherwise, contributions are proposed under the existing repository license. A PR is not a copyright assignment and does not resolve institutional ownership agreements.

## 1. Fork and clone

Use GitHub's **Fork** button on upstream, or:

```powershell
gh auth login
gh repo fork mingzhi0119/Virtual-EIR-Capstone --clone
Set-Location Virtual-EIR-Capstone
git remote -v
```

`origin` should point to **your fork** and `upstream` to `mingzhi0119/Virtual-EIR-Capstone`. If `upstream` is missing, add it once:

```powershell
git remote add upstream https://github.com/mingzhi0119/Virtual-EIR-Capstone.git
```

For manual setup, clone your fork's URL, not another teammate's repository. A fork copies all tracked source, including `apps/goat`; it does not conceal GOAT code. Never put confidential data or credentials in a fork.

Configure your own identity if needed:

```powershell
git config user.name "Your Name"
git config user.email "Your GitHub email or noreply address"
```

## 2. Synchronize and create a task branch

Start from a clean working tree; safely preserve your own changes first. Do not discard unrelated work.

```powershell
git status
git fetch upstream
git switch main
git merge --ff-only upstream/main
git push origin main
git switch -c docs/your-name-coaching-rubric
```

Other examples: `feat/your-name-check-in`, `fix/your-name-profile-correction`. Automation-created branches use `codex/`. If fast-forwarding fails, inspect the divergence rather than force-pushing. Do not develop on your fork's `main`.

## 3. Validate

After [local installation](docs/LOCAL_RUN.md), from the root:

```powershell
apps/goat/.venv/Scripts/python.exe -m pytest tests -q
```

For Python changes, run Ruff lint and format checks on touched files. For UI changes, run the EIR TypeScript/ESLint checks and appearance build in the [run guide](docs/LOCAL_RUN.md) and [CI workflow](.github/workflows/prototype-checks.yml). Upstream GOAT changes need the relevant upstream checks too.

For document-only changes, check local links, executable command paths, current status claims and English readability. Record actual checks; do not claim a test you did not run.

Model/browser verifiers may mutate fictional records, require Edge or a local model, and overwrite generated evidence. Use isolated databases, not the preserved live demo. CI has no live Ollama/GPU and is not an expert coaching review.

## 4. Commit and submit to upstream

Stage exact paths, not unrelated local files:

```powershell
git diff
git add docs/your-actual-file.md
git diff --cached
git commit -m "docs: add coaching evaluation rubric"
git push -u origin HEAD
gh pr create --repo mingzhi0119/Virtual-EIR-Capstone --base main
```

Replace the example file path with your actual change. If the CLI cannot infer your fork's head, select your fork/branch in GitHub's compare view. Confirm **base repository = mingzhi0119/Virtual-EIR-Capstone**, **base branch = main**.

Use the PR template to describe the task, actual checks, remaining gaps, data/license impact and decisions needed. Useful nontechnical deliverables include concrete user journeys, intake-field recommendations, worked coaching rubrics and focused Ain questions.

Maintainer review is expected before merging; do not assume enforced branch protection. Fork workflows may need approval. Never add secrets or privileged execution to make an untrusted fork job pass.

## 5. Continue on another device

Commit and push to your fork before leaving the first device. Clone your fork on the second device, then:

```powershell
git fetch origin
git switch --track origin/docs/your-name-coaching-rubric
```

If the branch already exists, switch to it and use `git pull --ff-only`. Git synchronizes pushed source/documents, **not** uncommitted work, ignored databases, model weights, dependencies or local configuration. See [data and backups](docs/LOCAL_RUN.md#data-and-backups).

## Data, ownership and scope

- Use fictional examples or materials explicitly cleared for public release. Keep raw meeting transcripts, founder/customer data, private correspondence, credentials and local databases out of Git and PR attachments.
- Preserve failures and sample limitations. Task progress is not business validation; model generation is not founder approval.
- Preserve notices and attribution; identify third-party code/assets and their terms.
- A public repository or fork does not grant commercial permission outside the license's permitted purposes.
- Do not change licenses/visibility, invite collaborators, expose backends or incur paid API costs as part of an unrelated feature PR.
