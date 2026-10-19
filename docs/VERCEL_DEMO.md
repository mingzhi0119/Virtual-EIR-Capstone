# Hosted classroom demo

Updated October 19, 2026. This is the interactive classroom app, separate from the older static `virtual-eir-showcase` website. The local recording app on port 62609 remains available.

## Resources and access

- Vercel project: `virtual-eir-demo`, scope `mingzhi0119s-projects`, Washington / `iad1`.
- [Project dashboard](https://vercel.com/mingzhi0119s-projects/virtual-eir-demo).
- [Deployment protection](https://vercel.com/mingzhi0119s-projects/virtual-eir-demo/settings/deployment-protection): Vercel Authentication on **all deployments**, including production domains.
- Neon database: `virtual-eir-demo-db`, free plan, TLS, persistent PostgreSQL. Database credentials are supplied by the Vercel integration.
- Default model: `gpt-5.6-luna`. The model selector also offers `gpt-5.6-terra`, `gpt-5.6-sol`, and `gpt-4.1-mini`. Chat and AI plan generation both use the selected model. Refreshing starts with the configured default. Choices are allowlisted in server-side `EIR_OPENAI_MODELS`; arbitrary client-supplied models are rejected before reaching OpenAI.
- `OPENAI_API_KEY` remains an encrypted server-side environment variable. The browser calls this app's backend, which calls the official OpenAI Responses endpoint with `store: false`. The three GPT-5.6 models use `reasoning.effort=medium`; GPT-4.1 mini omits the reasoning setting. The output cap includes reasoning tokens.

The ordinary production address requires Vercel access. Distribute the complete link obtained from the deployment's **Share > Anyone with the link > Copy Link** controls. Recipients of that link do not need a Vercel account. Keep the complete access link out of Git, public documents and screenshots. Forwarding it grants access to the next recipient. Vercel Hobby currently allows one active shareable link per account; replacing one revokes the previous link.

The app deliberately shares fictional classroom records: every admitted visitor can view and edit every venture. Create a separately named fictional venture for each independent trial. Concurrent edits use revision checks; reload before retrying a conflict. Do not enter confidential founder information or personal interview transcripts.

## Usage limits and monitoring

All visitors share these limits, recorded in PostgreSQL so separate Vercel workers cannot reset them:

| Control | Behavior |
| --- | --- |
| Rolling minute | At most 6 AI request attempts in 60 seconds |
| Calendar day | At most 200 AI request attempts per UTC day |
| Concurrent generation | One AI request at a time across the demo |
| Abandoned worker | Reservation expires after 240 seconds; attempt still counts |
| Input body | Mutating request bodies capped at 65,536 bytes |
| Session history | Start a follow-up once saved turns exceed 16,000 characters |
| Output | At most 4,096 output tokens per AI request |
| Failure | No automatic OpenAI retries; unavailable quota storage prevents AI calls |

Chat and AI plan generation both consume quota; failed/invalid attempts also count. The request cap is not a dollar budget or a promise about the API account's total spending. It applies to this app, not other users of the teacher's key. Usage limits do not isolate records by visitor.

Use the project's **Logs** tab to inspect `openai_call` events. Successful calls record model, input/output token counts and elapsed milliseconds; failures record a generic failure event. The application does not log prompts, profiles or the API key. Vercel's own request logs may contain request metadata. This config does not create automated alert notifications. Check the teacher's OpenAI usage dashboard for authoritative API account usage.

To pause AI calls, set `EIR_DEMO_DISABLED=1` in Vercel production environment variables and redeploy; existing deployments do not receive changed environment variables automatically. To withdraw recipient access, use Share to change access back to **Only people with access**. API credentials and CLI automation bypass credentials are separate secrets and must not be put in a recipient URL.

## Repeatable deployment

1. Run `node scripts/build-eir-hosted.mjs` from the repository root. It builds UI assets, copies an explicit source allowlist to ignored `var/eir-hosted`, rejects unexpected files and scans the publishable files for likely API keys.
2. Keep `var/eir-hosted/.vercel/project.json` linked to `virtual-eir-demo`. Do not deploy the whole repository. The bundle excludes `.env*`, CLI controls, private documents, and local databases.
3. The optional `scripts/configure-eir-hosted.mjs` reads the existing root `.env.local`, verifies the project has protection on all deployments, and uploads only the OpenAI key, default model, model allowlist and protected-entrypoint flag. It uses the authenticated Vercel CLI and does not print the key. Current model settings are `EIR_OPENAI_MODEL=gpt-5.6-luna` and `EIR_OPENAI_MODELS=gpt-5.6-luna,gpt-5.6-terra,gpt-5.6-sol,gpt-4.1-mini`.
4. Deploy the bundle with the authenticated Vercel CLI to production. The entrypoint is `hosting/main.py`; only `hosting/requirements.txt` is installed. Local GOAT and its dependencies are excluded.
5. Verify an unauthenticated request to `/api/health` is blocked by Vercel. Verify the complete shareable link in a browser without a Vercel login, then check real chat, plan approval and saved progress after refresh. Keep any access token in ignored local handoff files only.

The local file `var/eir-hosted/.env.local` contains pulled cloud credentials. It is ignored and excluded from deployment. Never display, commit or distribute it. Changing or revoking the share link does not rotate the OpenAI API key.

## Classroom check

The Ain Center interface update is deployed as `dpl_9pf736Rc4LTaeQ1C9HxqZvMRx19X`. Internal IDs, raw JSON editors and event dumps are absent from the visible workflow; action prerequisites and plan changes use business descriptions. Appearance uses GOAT's original themes and preferences, with Rochester as the new-browser default. Run `node scripts/verify-eir-business-ui.mjs` locally or set `EIR_UI_TARGET=hosted` for the protected cloud check; receipts stay in ignored `var/eir-business-ui/`. The cloud check verifies the existing invitation and denies an unauthenticated visitor access to venture records.

Use the fictional Campus Dinner Discovery case in `deliverables/2026-10-22/demo-inputs.json`. Ask for an interview guide, generate and review a five-interview plan, approve it, report two interviews, and open a new follow-up session. The expected follow-up recalls five planned, two completed, three remaining, and distinguishes a two-person price observation from validated demand.

Repository-level EIR checks: `apps/goat/.venv/Scripts/python.exe -m pytest tests -q`. The optional PostgreSQL test uses `EIR_TEST_DATABASE_URL` to create a uniquely named disposable schema, verify persistence and revision conflicts, then remove only that schema. It does not reset the shared classroom tables.

Current testing and deployment receipts are retained locally in ignored `var/eir-hosted-proof`. The older vendored GOAT suite has separate existing governance failures involving English-only archived documents and date-sensitive credential rotation fixtures; these are not part of this hosted app's dependency bundle.

On October 19, the owner explicitly authorized replacing the account's previous shareable link. The latest deployment's share link was then generated and tested in an in-app browser without a Vercel login: the ordinary address first showed the Vercel login page, while the complete shareable link opened the app. That visitor created Follow-up 2, received a real `gpt-4.1-mini` reply in 2.31 seconds, and recovered the same conversation and 2/5 progress after refreshing. The complete link is retained only in ignored `var/eir-hosted-proof/share-link.txt`; copy it from there or the Vercel Share control for the intended classroom recipients.

Later on October 19, deployment `dpl_A9jrTbCiKyivZ9VAsank1EYJWEdv` added the four-model selector with Luna first. The teacher's existing key completed real consultations and strict-schema plan generation on all three GPT-5.6 models using medium reasoning. Cloud checks confirmed Terra and Sol chat, Luna draft generation, and retained 2/5 progress. The invitation-link visitor then created Follow-up 3 and received a real Luna reply in 4.524 seconds correctly distinguishing 5 planned, 2 completed, 3 remaining and the limited price observation. The original complete share link still grants access; ordinary unauthenticated access remains protected. Repository checks: 103 passed, 1 optional PostgreSQL test skipped. The local recording app resumed its same database; all prior venture, session and plan records were compared and retained. Receipts: `model-api-verification.json`, `model-hosted-verification.json`, `model-browser-verification.json`, and `model-upgrade.jpg` in ignored `var/eir-hosted-proof`.

## Recovery

October 19 deployment `dpl_4iWWvPxEGC8GSBbKq3A6XeX2fjvT` adds sourced evidence/criterion review, explicit founder-confirmed goal closure and structured weekly check-ins. The original invitation remains valid. Actual Luna planning and new-session coaching passed on Vercel; earlier ventures/workspaces were compared and retained. Repository checks: 134 passed, 1 optional PostgreSQL test skipped; browser edit-guard checks: 9/9. Local/cloud receipts and screenshots are in ignored `var/eir-review-proof/`. See the current [recording sequence](../deliverables/2026-10-22/Recording-Script.md) and [readiness evidence](../deliverables/2026-10-22/Readiness-Report.md). Goal reviews remain founder judgments; the next check-in date does not send automatic reminders.

- First visit may need a cold start while the free database wakes. Wait for a clear result before retrying.
- A 429 response means the shared request limit, another active generation, or the pause switch. It is not evidence that the key leaked.
- A 503 response can mean an unavailable database or OpenAI request. Inspect logs without sharing populated environment settings.
- If a classmate edits the same venture, reload and use their latest saved revision or create a separate fictional venture.
- If cloud access is unavailable during recording, use the already prepared local app and the Role 1 recovery instructions. Do not disable deployment protection to troubleshoot a shared link.
