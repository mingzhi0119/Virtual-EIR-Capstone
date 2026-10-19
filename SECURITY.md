# Security and private reporting

The default app is a local, single-user research prototype using fictional venture data. It has no application-level user accounts or per-user ownership. Do not expose the local EIR or GOAT server through a public interface/tunnel or enter confidential founder data.

The optional [hosted classroom demo](docs/VERCEL_DEMO.md) uses Vercel protection on every deployment, a revocable shareable link, server-side OpenAI credentials, and durable shared PostgreSQL storage. Link holders can view and edit all fictional ventures; forwarding the link forwards access. This setup supports a small classroom demonstration and does not establish confidential multi-tenant isolation or absolute security.

## Report sensitive issues privately

Do **not** open a public issue containing credentials, founder records, raw transcripts or sensitive deployment details. Contact the maintainer through an agreed private channel. Use GitHub private vulnerability reporting if available/enabled; this document does not claim it has been configured. Do not post a secret to ask how to report it.

Public issues should use nonsensitive fictional reproductions with version, steps and redacted details. Do not attach databases, `.env` files or complete logs without review.

## Verification limits

Publication and passed tests are not a security certification. The publication review scans reachable Git history for likely secrets and checks artifact scope; heuristics can miss secrets and do not prove confidentiality or ownership clearance. Existing dependency findings remain open until separately remediated.

Fork PR code is untrusted. Keep credentials unavailable and do not run unreviewed fork code in privileged workflows. Mutating verifiers need isolated fictional databases. Generated coaching is fallible and is not legal, financial or investment advice.
