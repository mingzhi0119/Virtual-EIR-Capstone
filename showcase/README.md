# Virtual EIR read-only showcase

Live showcase: https://virtual-eir-showcase.vercel.app

Deployed October 9, 2026. Anonymous access to the production domain is verified. The site does not require the author's computer or Ollama to stay online.

This separate static site reuses the existing GOAT appearance system and EIR styles. It contains the actual October 8, 2026 English model outputs for one fictional venture, with the confirmed five-interview plan and two-interview results. Responses are preserved verbatim; presentation uses the existing Markdown renderer.

It has no model endpoint, backend, authentication service, writable venture store, or paid API calls. Sending messages and creating ventures are unavailable. Session navigation, read-only profile snapshots, responsive layout, and local browser appearance preferences remain available. The public page identifies the material as recorded and fictional, and notes the coaching-quality limitation.

## Build and deploy

From the repository root, after local frontend dependencies are installed:

```powershell
node scripts/build-eir-showcase.mjs
npx --yes vercel@63.1.0 link --cwd var/eir-showcase --yes --project virtual-eir-showcase --scope mingzhi0119s-projects
npx --yes vercel@63.1.0 deploy --cwd var/eir-showcase --yes --prod --scope mingzhi0119s-projects
```

Deploy **only** the generated `var/eir-showcase` directory to a separate Vercel project named `virtual-eir-showcase`. Do not deploy the repository root or connect the entire Capstone repository. Confirm the selected project before deployment; do not overwrite the existing GOAT deployment.

The build uses an explicit field/file allowlist. It does not publish original GOAT source files, local databases, system prompts, private repository links, machine addresses, meeting records, source maps, or credentials. The browser necessarily receives the compiled appearance/Markdown code and the approved fictional content; this is not a claim that frontend assets are confidential.

Robots directives discourage indexing; they are **not access control**. A publicly accessible production link can be forwarded. Real founder data must not be added. Repository permissions and GOAT licensing are unchanged.

## Verification

```powershell
node scripts/verify-eir-showcase.mjs
node scripts/verify-eir-showcase.mjs https://virtual-eir-showcase.vercel.app
```

The verifier serves only the generated static directory, checks both sessions and profile snapshots, disabled write controls, themes, reload/deep links, mobile overflow, network requests, browser errors, raw-response fidelity, and bundle exclusions. It does not run the live prototype's write-producing demo scripts. Verification artifacts are kept under ignored `var/eir-showcase-proof`.
