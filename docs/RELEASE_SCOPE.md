# Release Scope

FieldNote has two deliberately separate release tracks. This candidate is a
private synthetic-testing workflow exercise. The agency pilot is a separate
security, clinical, legal, and operational product milestone.

## Private synthetic test

- Fictional or properly de-identified information only.
- No accounts, database, ePCR write-back, analytics, cloud AI, or PHI.
- Capture mode remains usable without AI.
- Optional Ollama testing is allowed only on the same Mac through the local development server.
- Draft recovery is browser-tab scoped and is not a security control for PHI.
- Clinical Scribe transcript capture is manual, transcript-first, and browser-tab scoped; audio recording is not active. Digest generation is local-only, explicitly opted in, source-referenced, and requires review before copy/download.
- The candidate must never claim HIPAA, NEMSIS, WCAG, or agency-production compliance.

Private-test release gates:

- Draft recovery passes refresh tests for every input type.
- No stale browser smoke selectors or untested release claims remain.
- AI provider, dictation, and network behavior are visible and accurately described; local AI is opt-in and obvious identifier patterns are blocked before provider dispatch.
- The local organize response uses a versioned contract with opaque request correlation and source-validation status; this is metadata for testing, not an agency audit trail.
- The local Scribe compose response uses a separate versioned contract with opaque segment references, review gating, and fail-closed model-output validation; this is metadata for testing, not an agency audit trail.
- Security headers, secret hygiene, and synthetic-data warnings are verified.
- `npm run check`, `npm run test:private`, `npm run test:ai`, and `npm run test:security` pass against synthetic fixtures; the private probe also starts an isolated server and verifies the no-Ollama health path.
- Browser smoke (`APP_URL=http://127.0.0.1:4173 CDP_ENDPOINT=http://127.0.0.1:9222 npm run test:browser`) verifies draft recovery, Scribe source links, review-before-export, mobile reflow, touch targets, accessible names, focus, live-region semantics, degraded model state, and the 375/768/1024/1440 plus landscape matrix when a Chrome debugging session is available.
- Browser visual smoke is reported separately when a browser runner is unavailable; passing these checks does not establish WCAG certification or agency readiness.

## Agency pilot

An agency pilot cannot use this local private-test server or its browser-only audit state. It requires named accounts, MFA/RBAC, tenant isolation, TLS, encryption, immutable audit records, retention/deletion controls, backups, incident response, documented risk analysis, vendor agreements, clinical validation, and approved ePCR mapping.

The pilot remains synthetic until the agency, privacy/security leadership, medical director, and counsel approve the data flow and operating protocol.

The private-test sign-off steps live in [`PRIVATE_TESTING.md`](PRIVATE_TESTING.md) and [`PUBLIC_DEMO_RELEASE_CHECKLIST.md`](PUBLIC_DEMO_RELEASE_CHECKLIST.md). The active preparation register and pilot acceptance framework live in [`AGENCY_PILOT_FRAMEWORK.md`](AGENCY_PILOT_FRAMEWORK.md), [`AGENCY_PILOT_ACCEPTANCE.md`](AGENCY_PILOT_ACCEPTANCE.md), and [`agency-controls.json`](agency-controls.json). A passing register-validation command only proves the framework is well-formed; it does not make the agency track ready.
