# FieldNote

[![FieldNote checks](https://github.com/realjeffreyau/FieldNote/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/realjeffreyau/FieldNote/actions/workflows/ci.yml)
[![CodeQL](https://github.com/realjeffreyau/FieldNote/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/realjeffreyau/FieldNote/actions/workflows/codeql.yml)

FieldNote is a small local app for writing EMS call notes. You can start by
typing the call in your own words, then use the app to sort the details into
I-CHEATED sections and review what it came up with. It also has a separate
Scribe area for turning a reviewed, made-up transcript into a note draft.

This is a demo and a work in progress. Use fictional or properly de-identified
examples only. Do not put real patient information into it. It is not an ePCR,
medical-record system, or clinical decision tool.

## Try it locally

You need Node.js 20 or newer.

```bash
npm ci
npm start
```

Open the address printed in the terminal. This runs on your own computer.
There is no hosted demo, login, public API, or online service behind this
repository.

To run the checks yourself:

```bash
npm run release:private
npm audit --omit=dev --audit-level=moderate
```

The same checks run on GitHub when code is pushed to `main` or a pull request
is opened. They cover the app, the no-model path, the local AI contracts,
security headers and request limits, and the project's current
agency-readiness checklist. The agency checklist is supposed to stay blocked
for this demo.

## Optional local AI

The app works without Ollama. Without it, it uses the built-in rules-based path
in the browser.

If you want to try the optional local model:

```bash
ollama pull qwen3:4b
npm run ai:build-model
OLLAMA_MODEL=fieldnote-qwen3:4b npm start
```

Set `FIELDNOTE_URL` to the address printed by `npm start`, then run:

```bash
AI_EVAL_URL="$FIELDNOTE_URL" npm run ai:eval:live
```

The browser talks to the local FieldNote server. The server talks to Ollama on
the same computer. No cloud AI service is configured. The local model is
optional, and it must not be used with patient data.

## What you can try

- Type a call in freeform Capture mode.
- Use Guided prompts if you missed an I-CHEATED detail.
- Keep the original notes visible while reviewing a rewrite.
- Check the source links before copying or downloading anything.
- Try the Scribe workspace with a made-up transcript.
- Run the browser, AI, security, and agency-boundary checks.

Start with [Private Synthetic Testing](docs/PRIVATE_TESTING.md), [the local AI
model card](docs/AI_MODEL_CARD.md), or [Release Scope](docs/RELEASE_SCOPE.md).

## What this does not do

This demo has no accounts, shared database, cloud AI, ePCR write-back,
production audit system, or agency approval. It does not diagnose, triage,
recommend treatment, calculate risk, make billing decisions, or sign reports.

The agency documents describe work that would be needed later. They do not mean
those controls are already built.

Running `npm start` starts the app on your computer. It does not deploy the app
or make it available to other people. Browser-tab drafts are not a secure
records system, and the local Ollama route is not a production AI integration.

Before real deployment, this would need independent clinical, privacy, security,
accessibility, legal, and operational review, plus an approved agency design
and vendor agreements.

This source is published for review and demonstration. No license is granted
yet.

For contribution guidance, see [CONTRIBUTING.md](CONTRIBUTING.md). For security
reports, see [SECURITY.md](SECURITY.md). Do not include patient information,
credentials, or other sensitive data in issues or pull requests.
