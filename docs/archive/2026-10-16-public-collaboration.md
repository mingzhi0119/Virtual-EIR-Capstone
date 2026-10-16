# Public collaboration preparation

Date: October 16, 2026. Scope: make `mingzhi0119/Virtual-EIR-Capstone` the English-first canonical upstream, support personal forks/PRs, and publish source under a noncommercial license following the maintainer's explicit request.

## Completed preparation

- [x] Rewrite the root README, contributor guide, GitHub guide and local run guide in English.
- [x] Add a current English documentation index, architecture guide, team roadmap, IP/reuse notice and security reporting guide.
- [x] Replace the PR template with English task, verification, data and license checks.
- [x] Add the unmodified official PolyForm Noncommercial License 1.0.0 and separate attribution/scope notice. Preserve third-party terms and pre-existing GOAT provenance; do not change the separate GOAT upstream repository.
- [x] Validate 12 English documents and 74 local links; compare license text against the official PolyForm source.
- [x] Rerun the local deterministic suite: **79 passed**.
- [x] Scan all reachable Git history with checksum-verified Gitleaks v8.30.1: 20 commits, approximately 6.27 MB. Review both findings: each is a 64-character hexadecimal `secret_sha256` fixture in credential-registry unit tests, not a plaintext credential. No unresolved credential findings in this scan; this is not proof that no secret can exist.
- [x] Check historical paths for runtime databases, private-key files, actual `.env` files, dependency environments and raw meeting transcript filenames; no flagged paths found. `.env.example` and the desktop loopback-port configuration are not credentials.
- [x] Keep raw meeting transcripts, local databases and agent state outside Git; add explicit transcript/state ignore rules.
- [x] Exclude the pre-existing local modification to the October 8 PPT from this task's commit.

## Publication

- [ ] Push only the reviewed documentation/licensing changes to canonical upstream.
- [ ] Change visibility to Public and verify metadata and anonymous access.
- [ ] Verify English repository description, fork permission and remote commit alignment.

No application behavior, GOAT source, paid API configuration, collaborator invitations, Vercel deployment or runtime data is changed. Forks include tracked GOAT code. Public forks and downloaded copies cannot be recalled by later making upstream private. Public GitHub source is not a public running backend.

## Limits and references

Automated secret scanning and path review do not establish ownership clearance, compliance with institutional agreements or production security. New client/private materials still need publication clearance. Existing dependency findings and coaching-quality failures remain open. Historical archives intentionally retain their dates and earlier statements; today's status is in the English team roadmap and latest report.

- [Official license text](https://github.com/polyformproject/polyform-licenses/blob/1.0.0/PolyForm-Noncommercial-1.0.0.md).
- [GitHub fork visibility rules](https://docs.github.com/en/pull-requests/reference/forks).
- [GitHub visibility-change consequences](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility).

The license permits noncommercial purposes and specified organizational uses, including educational/charitable institutions regardless of funding source. Other uses require separate authorization; it is source-available rather than OSI open source. See [license scope](../IP_AND_REUSE.md).
