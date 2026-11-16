# Vercel release record

November 5, 2026. The user explicitly authorized deploying the completed release to the existing protected `virtual-eir-demo` project.

**Status: deployed and verified.** [Release deployment](https://vercel.com/mingzhi0119s-projects/virtual-eir-demo/FGsNPgUetixvG76McSbGnE5DMe9F) is READY, and the existing [protected demo](https://virtual-eir-demo.vercel.app) now serves this release. The existing invitation still works. Anonymous visitors cannot read records; no invitation token is included in this package. Build completed at 18:46 UTC; live checks completed at approximately 18:50 UTC.

Vercel reported “Build delays and degraded Vercel Dashboard performance” at 18:25 UTC on November 5. The candidate waited in its system queue before building successfully. See [Vercel status](https://www.vercel-status.com/). This external delay is distinct from the earlier application packaging failures below.

## Source and configuration

- Candidate deployment: `dpl_FGsNPgUetixvG76McSbGnE5DMe9F`.
- Previous successful production deployment: `dpl_FwasSNy6MPGR9XYagtDpASaq4Fi2`.
- Source branch: local `codex/pre-week8-workflows`, based on `08db877242c4c578afb2063708dfaf00da677c76`. The release includes uncommitted source changes; no GitHub push or CI run for this revision is claimed. Synchronize approved source before the next `main` Git deployment so an older checkout does not replace it.
- The source package contains **31 allowlisted application files**, including explicit Python dependencies and the `main:app` entrypoint. Credentials, `.vercel` controls, local databases, student documents and video inputs are excluded.
- The hosted bundle contains prebuilt browser assets and a small explicit build command. Removed the legacy `functions.main.py` pattern, which was rejected before runtime construction. The framework now owns entrypoint discovery and its default function settings.
- The project remains FastAPI with `rootDirectory: hosting` and protection for **all** deployments. A temporary flat-root diagnostic was reverted. Environment variables and invitation settings were not changed.

## Checks completed before the platform delay

- Seven existing ventures and their complete workspaces match the pre-release hash snapshot, checked twice after the failed attempts.
- The full application suite passed 168 tests, with one optional live-database test skipped.
- The source bundle and interface build succeed. Hosting dependency declarations agree. Lint/type checks pass.
- Local Vercel build now reaches Python environment setup instead of the unmatched-function error. It cannot complete on this machine because the selected `python3.12` executable is unavailable. This is **not** a successful local Vercel build.

## Failed attempts retained

Initial CLI upload requests suffered connection resets; their deployment results were inspected before retrying. Several attempted source layouts failed with `unused_function` for `main.py`; one flat-source attempt failed because the project still required the `hosting` directory. A superseded build was canceled. None of those attempts replaced the stable demo alias. These failures do not count as successful releases.

## Completed live checks

1. Candidate reached READY. Protected health returns `ok` / `shared-fictional-demo`, and deployed learning JavaScript matches the source exactly. The stable alias was assigned after these checks.
2. The existing invitation admits access, while anonymous requests cannot read venture records. All-deployment protection remains enabled.
3. All original fields in seven ventures and complete workspaces match the pre-release snapshot. New schema defaults change the full JSON hash; the previous deployment's API independently reproduces the original hash, confirming no content loss.
4. One new **Week 8 cloud acceptance — fictional** case completes actual `gpt-5.6-luna` plan generation, approval and two-of-five progress. A second actual generation produces an experiment draft, retains founder inputs/capacity, and leaves plan progress unchanged. Explicit confirmation succeeds.
5. The reviewed brief preserves 5 planned / 2 completed / 3 remaining and profile revision. Its print popup works. The 390px workspace fits and keeps its close control visible. No browser page errors were recorded; screenshots were visually reviewed.
6. Original seven complete workspaces remain unchanged after cloud testing. Only the new fictional acceptance case was added.

Evidence: [six cloud check groups and actual model output](evidence/cloud-check.json), [deployment receipt](evidence/deployment.json), [desktop](evidence/cloud-desktop.png), [phone](evidence/cloud-mobile.png), [print view](evidence/cloud-print.png), [source hashes](evidence/Source-Manifest.json), [allowlist](evidence/bundle.json). **Two paid hosted model-generation calls** were made. The verifier is retained under ignored `var/pre-week8-release/cloud-check.mjs`; it reads the private invitation without printing it. Successful live PostgreSQL reads/writes do not replace the skipped optional comprehensive PostgreSQL test.

New defaults include learning artifacts; task milestone, owner, date, effort, completion and expected-evidence criteria; and evidence experiment, stance and origin metadata. The comparison checks every original field, then checks complete new-schema snapshots for changes during testing.

This remains a protected shared fictional classroom pilot. Independent expert quality approval, confidential-founder isolation and history/capacity policy remain open. If a later release fails, restore the stable alias to the prior successful deployment and verify protected health and records. Do not delete the database or regenerate invitations as a routine rollback step.
