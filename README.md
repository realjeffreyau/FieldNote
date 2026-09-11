# FieldNote

[![FieldNote checks](https://github.com/realjeffreyau/FieldNote/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/realjeffreyau/FieldNote/actions/workflows/ci.yml)
[![CodeQL](https://github.com/realjeffreyau/FieldNote/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/realjeffreyau/FieldNote/actions/workflows/codeql.yml)

FieldNote is a local prototype for EMS documentation. It gives providers a
place to capture a call in their own words, organize it into I-CHEATED order,
and review a source-linked draft. A separate Clinical Scribe workspace can
turn a reviewed, synthetic transcript into an editable encounter-note
proposal.

This repository is a public demonstration of a private synthetic-test build.
It is not a medical record system, an ePCR, or a clinical decision tool. Use
fictional or properly de-identified examples only. Do not enter live PHI.

## Run it

Requirements: Node.js 20 or newer.

```bash
npm ci
npm start
```

Open the address printed by `npm start`. This is a local-only development
server; the repository does not provide a hosted demo URL, login, public API,
or uptime promise. The default loopback bind is intentional and the app shows
the private-test boundary in the interface.

Run the local release checks with:

```bash
npm run release:private
npm audit --omit=dev --audit-level=moderate
```

The same checks run in GitHub Actions on pushes to `main` and on pull
requests. They cover syntax, isolated startup, the no-model path,
source-preserving AI contracts, security headers and request limits,
agency-boundary contracts, and the current readiness register. The agency
register is expected to remain blocked for this prototype.

## Optional local Ollama

The browser does not call Ollama directly. When enabled, the loopback FieldNote
server sends notes only to Ollama on the same machine.

```bash
ollama pull qwen3:4b
npm run ai:build-model
OLLAMA_MODEL=fieldnote-qwen3:4b npm start
```

With the server running, set `FIELDNOTE_URL` to the address printed in the
terminal. Synthetic live evaluation is then available through:

```bash
AI_EVAL_URL="$FIELDNOTE_URL" npm run ai:eval:live
```

The local model is optional. Without it, the browser keeps the deterministic
rules-based proposal path available and reports that the model is unavailable.
The model is instructed to copy supplied facts into a structured draft; it is
not trained on customer data and must not be used with patient data.

## What is included

- Capture mode for freeform provider notes.
- Guided prompts for missing I-CHEATED details.
- Grammar Assist that preserves the original before accepting a rewrite.
- Source-linked organization and review gates before copy or download.
- Clinical Scribe with manual transcript segments and local-only digest
  proposals.
- Browser, AI-contract, security, and agency-boundary regression checks.

The most useful starting points are [Private Synthetic Testing](docs/PRIVATE_TESTING.md),
[the local AI model card](docs/AI_MODEL_CARD.md), and
[Release Scope](docs/RELEASE_SCOPE.md).

## Deliberate limits

This prototype has no accounts, tenant isolation, persistent server database,
cloud AI provider, ePCR write-back, production audit store, or agency approval.
It does not diagnose, triage, recommend treatment, calculate risk, make billing
decisions, or sign a report. The agency preparation documents describe future
requirements; they do not mean those controls are implemented here.

Before any real deployment, the project needs independent clinical, privacy,
security, accessibility, legal, and operational review, along with an approved
agency architecture and vendor agreements.

The GitHub repository contains source code and tests only. Running `npm start`
creates a server on the tester's own machine; it does not deploy FieldNote or
make the application reachable by other people. Browser-tab drafts are not a
secure records system, and the loopback Ollama route is not a production AI
integration.

This source is published for review and demonstration. No license is granted
yet.

For contribution guidance, see [CONTRIBUTING.md](CONTRIBUTING.md). For
security reports, see [SECURITY.md](SECURITY.md). Do not include PHI,
credentials, or other sensitive data in issues or pull requests.
