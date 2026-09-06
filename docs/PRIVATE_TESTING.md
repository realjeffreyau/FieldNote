# FieldNote Private Synthetic Testing

This is a local private-test release candidate for workflow feedback. Use
fictional or properly de-identified training content only. Do not enter real
PHI, use the app during patient care, or connect it to an agency ePCR.

## Start and check

Requirements: Node.js 20 or newer.

```bash
npm ci
npm start
```

Open `http://127.0.0.1:4173`. In a second terminal, verify the running app:

```bash
curl -fsS http://127.0.0.1:4173/api/status
```

The response should report `localOnly: true`. The browser shows the persistent
`PRIVATE TEST` boundary, synthetic-only scope, and local AI state. The smallest
browserless release probe uses an isolated port and no Ollama:

```bash
npm run test:private
```

For the aggregate local release gate, run:

```bash
npm run release:private
```

This runs the syntax, isolated no-Ollama readiness, AI, security, agency
contract, and non-strict agency-register checks. Dependency audit and
`git diff --check` remain separate release evidence.

The probe starts and tears down its own loopback server, checks the home page,
security headers, `/api/status`, and fail-closed behavior when Ollama is not
available. It does not replace browser or clinician review.

## Synthetic workflow

1. Acknowledge the demo gate with fictional data only. Capture is the default
   workflow. Enter a detailed freeform call, then confirm the raw note remains
   unchanged after **Organize details**.
2. Review each organization proposal. Accept only source-grounded text, edit
   or discard suggestions, and use **View source** to inspect the excerpt.
3. Open the **Guided** mode and answer or skip several I-CHEATED prompts. Return
   to Capture and confirm the entered answer remains in the narrative.
4. Open **Grammar** and create a proposal. Compare original and rewrite, edit
   or discard a section, and accept only after review. The original is not
   replaced when the proposal is created.
5. Open **Review** from the case bar. Complete all four attestations only when
   the draft, source notes, and private-test boundary are understood. Copy,
   download, and print are export-only controls; they do not sign, submit, or
   write back to an ePCR.
6. Open **Utilities** for Work queue, Audit, Trust and the future Admin preview.
   These are supporting/demo surfaces, not agency controls.
7. For Scribe, load the synthetic sample or add manual transcript segments.
   Review the source, optionally enable **Use local AI**, and generate the
   digest only when a loopback model is available. Inspect source references,
   review the digest, then edit a transcript segment. The digest must reset to
   `NOT GENERATED`, the transcript to `Draft`, and digest export must disable.

## No-Ollama and local-Ollama paths

Without Ollama, Capture organization uses the browser rules fallback and raw
notes remain in the browser. Scribe digest generation is intentionally
disabled. This is the default path for private UI testing.

For optional local-model testing, install Ollama separately, pull a small
instruction model, and keep FieldNote bound to loopback:

```bash
ollama pull qwen3:4b
OLLAMA_MODEL=qwen3:4b npm start
AI_EVAL_URL=http://127.0.0.1:4173 npm run ai:eval:live
```

The checkbox is off by default. Enabling it is an explicit per-tab consent to
send the current synthetic notes or reviewed synthetic transcript to this
server and its configured local Ollama provider. Never set remote Ollama or
network binding options for PHI; they are development opt-ins only.

## Browser checks

With Google Chrome and an isolated CDP session available, run the browser smoke
against the server you started:

```bash
APP_URL=http://127.0.0.1:4173 \
CDP_ENDPOINT=http://127.0.0.1:9222 \
npm run test:browser
```

The smoke covers Capture, Guided, Grammar, Review, Scribe source/digest review
and invalidation, unavailable-model messaging, keyboard focus, labels, touch
targets, light/dark theme, console/network errors, and viewport checks at 375,
768, 1024, 1440, plus landscape. It writes named evidence images under the
operating system's temporary directory as `fieldnote-*`. A screenshot inspection is current visual evidence,
not a formal pixel-regression PASS because this repository has no committed
visual baseline. Live Scribe checks are conditional on an installed local
Ollama model; record that branch as skipped when unavailable.

## Stop conditions and limitations

Stop immediately and clear the tab if real names, dates of birth, phone
numbers, medical record numbers, addresses, or other identifiers are entered.
The identifier guard is incomplete and is not de-identification. Stop if a
provider state, source reference, review gate, or transcript invalidation does
not match the expected workflow above. Do not use the output for diagnosis,
triage, treatment, transport decisions, billing, signing, submission, or
patient care.

This candidate has no authentication, accounts, MFA/RBAC, tenant isolation,
TLS termination, encrypted persistence, immutable server audit store,
retention/legal hold, BAA, incident-response program, ePCR integration, audio
recording/upload, or clinical decision support. Browser session storage is a
synthetic-demo convenience, not a PHI security control. No HIPAA, NEMSIS,
WCAG, agency, clinical, legal, or production-readiness claim is made.

## Feedback template

```text
Date / browser / viewport:
Scenario: Capture | Guided | Grammar | Review | Scribe | Other
Synthetic fixture used:
Expected result:
Observed result:
Evidence screenshot or console detail:
Did any source fact disappear or change without acceptance?:
Did any safety boundary or model state seem unclear?:
Suggested change:
```

Public release work remains separate: choose a license, create a clean commit,
review the public file list, and verify remote CI only after the private
synthetic-testing gate and independent clinical, legal, privacy, security, and
accessibility reviews are complete.
