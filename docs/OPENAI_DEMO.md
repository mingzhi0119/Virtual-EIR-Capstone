# OpenAI demo setup

The EIR backend now supports the official OpenAI Responses API for both coaching and plan generation. The browser and SQLite records remain on this machine. Requests send the selected fictional profile, approved planning context and conversation to OpenAI. The API key stays in the backend.

## Private configuration

On Mingzhi's machine the supplied key was imported once from root `Team3_API.txt` into root `.env.local`. Both files are ignored by Git. The runtime reads `.env.local`, not the original text file. For a replacement key, edit `.env.local` privately and restart the server. Do not put the key in a browser, prompt, screenshot, command argument, or shared document.

The private file has these three settings, with the real key supplied locally:

```dotenv
OPENAI_API_KEY=YOUR_PRIVATE_KEY
EIR_OPENAI_MODEL=gpt-5.6-luna
EIR_OPENAI_MODELS=gpt-5.6-luna,gpt-5.6-terra,gpt-5.6-sol,gpt-4.1-mini
```

The local config parser accepts only these three names and does not execute shell expressions. The launcher explicitly selects this file and clears any unrelated inherited key for its child process. Other EIR launches keep the default GOAT provider unless explicitly configured.

## Start the prepared recording

From the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-role1-demo.ps1 -Provider openai -Scene ready
```

Open **http://127.0.0.1:62609**. Select **Campus Dinner Discovery (fictional)**. The model selector defaults to **GPT-5.6 Luna**, with Terra, Sol and GPT-4.1 mini available. The original ready checkpoint contains a saved GPT-4.1 mini consultation and confirmed Engineer/Business profile, before any goal is approved; selecting another model affects new calls only. Follow the [recording script](../deliverables/2026-10-22/Recording-Script.md).

This mode does not require Ollama, GOAT inference, a local GPU, or the shared EIR server on 62607. It requires an internet connection, a usable API key with model access/quota, and the already-installed Python/frontend runtime. API requests incur usage charges. A model-list check proves authentication/access; only generation proves the whole inference path.

Every start creates a new take from a checkpoint. OpenAI checkpoints are in `var/role1-demo/snapshots-openai/`; local-model checkpoints remain in `var/role1-demo/snapshots/`. Existing takes are retained. Reusing a checkpoint displays saved replies; generating a plan or sending a new message makes a real API request.

```powershell
# Recover a segment, then reload the page:
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-role1-demo.ps1 -Provider openai -Scene progress
# Stop the dedicated recording instance; retain all records:
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-role1-demo.ps1 -Stop
```

Available scenes: ready, draft, approved, progress, followup and final. Change the model in the private config, or pass `-Model MODEL_ID`, then rebuild the rehearsal before claiming that model passed. A different model may have different output-format or token-budget requirements.

To apply new private model settings while retaining the current take's saved records, run `powershell -File scripts/start-role1-demo.ps1 -Resume -Port 62609`, then refresh the browser. This does not replace the take with a checkpoint. With the October 19 model upgrade, Luna, Terra and Sol each completed a real consultation and strict-schema plan generation using medium reasoning; older recording checkpoints retain their original output provenance.

## Rebuild and verify

The rehearsal makes three real generation requests and writes fictional records to a new isolated take. It refuses an existing nonempty take.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-role1-demo.ps1 -Provider openai -Scene empty
node scripts/prepare-role1-demo.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-role1-demo.ps1 -Provider openai -Scene ready
```

For a fresh machine, install the project Python dependencies into `apps/goat/.venv`, run `npm ci` in `apps/goat/frontend`, and run `node scripts/build-eir-ui.mjs` from the root. The key and scene databases are private local files and are not delivered by Git. Preparing an empty scene and running the rehearsal creates that machine's checkpoints.

## Failures and data handling

| Symptom | Action |
| --- | --- |
| HTTP 401 | Replace/check the private key, then restart |
| HTTP 403 or 404 | Check project permission and configured model |
| HTTP 429 | Check API billing, quota and rate limits before retrying |
| Network timeout or HTTP 5xx | Check connectivity/service availability; retain the take and retry deliberately |
| Invalid plan | No proposal is saved; inspect the request/model before retrying |
| Key changed but behavior unchanged | Restart the backend; refreshing the page does not reload its config |

Failures do not save partial chat turns or approve plans. There are no automatic paid retries or silent fallback to Ollama. Plan generation requests a strict JSON schema and still passes through the existing local validation and explicit approval rules. The API adapter does not follow redirects or accept an arbitrary remote base URL.

Requests use `store: false` and rebuild context from local records. This disables Responses application-state storage; it is not a claim of zero data retention across all OpenAI systems. See the official [Responses guide](https://developers.openai.com/api/docs/guides/migrate-to-responses) and [structured output guide](https://developers.openai.com/api/docs/guides/structured-outputs). Recorded validation and actual replies are in the [OpenAI integration report](../deliverables/2026-10-22/OpenAI-Integration.md).
