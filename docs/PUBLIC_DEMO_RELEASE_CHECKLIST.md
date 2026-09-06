# Private Synthetic-Test Release Checklist

This checklist covers the local private-testing candidate only. It is not a
HIPAA, NEMSIS, WCAG, security, clinical, or agency-production certification.
Do not use it as approval to enter live patient information.

## Release boundary

- [x] Repository is labeled as a private synthetic test and contains no real patient data, credentials, or customer exports. The candidate remains uncommitted.
- [x] The demo gate, Trust page, README, and release scope all say synthetic/de-identified data only.
- [x] The server remains loopback by default: `HOST=127.0.0.1`, `ALLOW_NETWORK=false`, and `ALLOW_REMOTE_OLLAMA=false`.
- [x] No cloud AI, analytics, session replay, database, ePCR write-back, audio recording, or account system is enabled in this demo.
- [x] Any Ollama testing uses a local model on the same development machine and an explicit in-session consent toggle.

## Automated evidence

Run from a clean checkout with Node.js 20 or newer:

```bash
npm ci
npm run release:private
npm audit --omit=dev --audit-level=moderate
git diff --check
```

`release:private` runs `check`, the isolated no-Ollama readiness probe, the AI
and security regressions, agency contract validation, and the non-strict agency
register check. The audit and worktree whitespace checks remain explicit.

The private readiness probe starts an isolated loopback server with no Ollama,
checks the home/status contract, strict headers, and opaque provider errors. The
security suite starts additional temporary loopback services and synthetic
fixtures. It checks strict headers, no-CORS behavior, encoded traversal denial,
opaque/non-echoing errors, request limits, review gating, and the
source-referenced provider boundary.

When a Chrome debugging session and the configured loopback Ollama model are available, run the workflow and accessibility smoke:

```bash
APP_URL=http://127.0.0.1:4173 \
CDP_ENDPOINT=http://127.0.0.1:9222 \
npm run test:browser
```

This verifies Capture/manual entry and organization acceptance, Guided,
Grammar/I-CHEATED acceptance, Review gating, Scribe source jump-back and
transcript-edit digest invalidation, unavailable-model messaging, light/dark
mode, keyboard focus, labels, touch targets, console/network failures, and
375/768/1024/1440 plus landscape responsive bounds. The Scribe live path
requires a running local model; if it is unavailable, record that conditional
branch as skipped rather than claiming live browser verification.

For optional model-specific evidence, run the synthetic live evaluation against the same loopback server:

```bash
AI_EVAL_URL=http://127.0.0.1:4173 npm run ai:eval:live
```

## Manual review

- [x] Inspect the final 1440px day/night, 1024px, 768px, 375px day/night, 844x500 landscape, 375px Utilities-open, and 1440px degraded-state screenshots. `view_image` review on 2026-09-02 found no document overflow, clipped primary navigation, incoherent overlap, or unreadable required control. This is current visual evidence, not a formal pixel-regression PASS because there is no committed baseline.
- [x] Confirm **Use local AI** is off by default and the UI accurately reports whether Ollama is available. Browser smoke observed consent off before opt-in, `Ollama - fieldnote-qwen3:4b` in Scribe, and restored capture status `Ollama · fieldnote-qwen3:4b · off` after the degraded-state screenshot.
- [x] Confirm a source edit invalidates the Scribe digest and disables digest export until a new digest is reviewed. The browser smoke now asserts `NOT GENERATED`, `Needs review`, disabled export, and transcript `Draft` immediately after the edit.
- [x] Confirm generated blocks link back to transcript segments and the transcript remains visibly authoritative. The smoke observed 15 source references and a highlighted transcript source before export.
- [x] Confirm the 375px primary navigation exposes Narrative, Scribe, Review, and More without horizontal scrolling, and that Utilities-open exposes all four supporting routes.
- [x] Confirm the 844x500 landscape view begins the raw editor above the fixed mode bar: `rawTop=413`, `bottomNavTop=439`, `bottomNavHeight=61`, `viewportHeight=500`.
- [x] Confirm dictation and clipboard features are optional browser capabilities, not silent uploads. Code review found user-triggered Web Speech/clipboard actions, no `MediaRecorder`/`getUserMedia` upload path, and no third-party analytics or cloud endpoint.
- [x] Confirm no generated text is auto-signed, auto-submitted, or presented as a clinical decision. The review gate, copy/download controls, UI copy, and public scope all keep the output as an unsigned clinician-review proposal.

## Release record

Record the commit, date, reviewer, commands, browser result, and known limitations in the release notes or change record:

| Field | Value |
| --- | --- |
| Commit | `62db47b` baseline plus uncommitted working-tree changes; not a publishable release commit |
| Date | 2026-09-02 correction-pass-1 final verification |
| Reviewer | Codex local automated and visual review; no independent clinical, legal, privacy, security, or accessibility sign-off |
| `npm ci` | PASS; lockfile has zero dependencies, 1 package audited, 0 vulnerabilities |
| `npm run release:private` | PASS; check, isolated no-Ollama readiness, AI regression, security regression, agency contract, and non-strict agency register |
| `npm audit --omit=dev --audit-level=moderate` | PASS; 0 vulnerabilities |
| `git diff --check` | PASS |
| `AI_EVAL_URL=http://127.0.0.1:4173 npm run ai:eval:live` | PASS; 4/4 synthetic EMS cases against `fieldnote-qwen3:4b` |
| `npm run agency:readiness -- --json` | PASS; public boundary PASS; agency pilot BLOCKED; 0/20 required controls verified |
| Browser smoke | PASS on isolated CDP 9333; live Scribe, degraded status, restored live status, Utilities-open, 375/768/1024/1440, and 844x500 landscape; console/network failures empty |
| Known limitations | Synthetic private test only; agency pilot blocked; tree uncommitted; no remote; no license selected; no formal pixel baseline; no independent clinical, legal, privacy, security, accessibility, WCAG, or penetration assessment |

The evidence above is a release-candidate record, not permission to process live patient information. Re-run the gates from the final clean commit and obtain the appropriate human reviews before any public publishing.

## Final publishing handoff

- [ ] Select the repository license and add the corresponding `LICENSE` file; do not infer legal terms from this prototype.
- [ ] Review the final public file list, commit the intended release tree, and rerun this checklist from that clean commit.
- [ ] Confirm CI passes on the public repository before announcing or hosting the demo.

## Do not promote this build to agency use

The agency track still requires named accounts, MFA/RBAC, tenant isolation, TLS, encrypted persistence, immutable audit records, retention/deletion and legal-hold controls, incident response, approved model/vendor contracts, clinical validation, and approved ePCR mapping. Track those items in [`agency-controls.json`](agency-controls.json) and require the formal go/no-go record before any PHI flow.
