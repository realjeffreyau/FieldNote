# Acceptance Brief: Controlled Agency Pilot

**Status:** Draft
**Revision:** 1
**Prepared for:** FieldNote product, engineering, agency clinical leadership, privacy/security leadership, and counsel
**Approval required before risky work:** Yes - no live PHI, network exposure, or production persistence is authorized by this brief.

## Goal

An agency can run a time-limited, synthetic-data pilot in a separately deployed FieldNote service with named access, tenant isolation, auditable clinical-draft workflows, approved model boundaries, recovery procedures, and an explicit go/no-go record.

## Scope

**In scope**

- Separate agency deployment and environment configuration
- Named identity, MFA, RBAC, session lifecycle, and tenant isolation
- Classification, retention, deletion, backup, restore, and incident procedures
- Source-grounded AI drafting with model/prompt/schema/evaluation versions
- Human review, correction, approval, audit, and export-only ePCR/NEMSIS mapping
- Synthetic-case clinical validation, usability review, security testing, and pilot sign-off

**Out of scope**

- Converting the public demo into a PHI service
- Diagnosis, triage, treatment recommendation, risk scoring, billing, or autonomous clinical action
- Auto-signing or silent ePCR write-back
- Selecting a vendor, state, ePCR, retention period, SLA, or legal position without agency approval
- Claiming HIPAA, NEMSIS, or agency-production compliance from automated checks alone

## Context

**Discovered facts**

- The current server has no accounts, database, tenant model, or server-side agency audit store.
- The public demo defaults to loopback binding and loopback Ollama, keeps AI opt-in, preserves raw notes, and rejects model output whose source evidence is not found in the submitted notes.
- Existing automated checks cover syntax, AI source/error behavior, strict security headers, no-CORS/traversal denial, non-echoing errors, malformed requests, request limits, review gating, and browser workflow/accessibility smoke when a browser runner is available. These checks are evidence for the synthetic public demo only; they do not replace agency authentication, tenant, audit, clinical, legal, or operational verification.
- Contract checks now validate the separate deployment profiles and content-free audit-event boundary. They are architecture evidence only; they do not implement persistence, authentication, authorization, or immutable storage.
- Current browser draft recovery is a public-demo convenience, not an acceptable PHI persistence control.

**Product/business constraints**

- No agency, state, ePCR vendor, medical director, retention rule, identity provider, or vendor contract has been supplied yet.
- The agency and counsel must decide whether the product is a business associate and which agreements are required before any PHI flow.

**Assumptions**

- The first technical pilot uses synthetic cases and is isolated from the public demo.
- Export-only is the default integration posture until an agency approves a versioned ePCR contract.
- Human clinical review remains mandatory for every generated draft.

## Risk review

| Risk area | Applies? | Required handling |
| --- | --- | --- |
| Security/privacy | Yes | Authenticated minimum-necessary access, tenant isolation, TLS, encryption, no-PHI telemetry, audit, incident response, and vendor review |
| Persistent data/migration | Yes | Versioned schema, retention/deletion/legal hold, encrypted backup, restore test, and rollback plan |
| External provider/cost | Yes | Approved model/provider, contract/data-use review, bounded requests, and synthetic test environment |
| Compatibility/API | Yes | Versioned AI envelope and ePCR/NEMSIS export mapping with malformed/partial/duplicate tests |
| Clinical safety | Yes | Medical director and EMS reviewer validation; no unsupported assertions or clinical recommendations |
| UX/accessibility | Yes | Capture-first workflow, source preservation, keyboard/touch/screen-reader review, and failure recovery |

## Acceptance criteria

### AC-001: Public and agency deployments remain separate

- **Scenario:** A developer starts the repository with default configuration.
- **Action:** Run the public-demo checks and inspect deployment configuration.
- **Expected:** The public demo binds to loopback, accepts synthetic/de-identified data only, and has no agency persistence, accounts, ePCR write-back, or remote model route by default.
- **Must not:** Treat `ALLOW_NETWORK` or `ALLOW_REMOTE_OLLAMA` as production security controls.
- **Verification:** `npm run agency:contract`, `npm run agency:readiness`, configuration review, and deployment smoke test.
- **Environment/safety:** Local repository and synthetic data only.
- **Priority:** Required

### AC-002: Data inventory and flow are approved

- **Scenario:** The agency proposes a pilot workflow.
- **Action:** Complete the data inventory, data-flow diagram, processing purpose, owner, retention, and access fields for every data element.
- **Expected:** The privacy lead and agency owner can identify where raw notes, structured fields, drafts, source spans, audit metadata, model requests, and exports move and who can access them.
- **Must not:** Leave a model, support, analytics, browser-storage, or backup path undocumented.
- **Verification:** Signed inventory and architecture review against `docs/AGENCY_PILOT_FRAMEWORK.md`.
- **Environment/safety:** Synthetic data; no vendor transmission.
- **Priority:** Required

### AC-003: Named access is enforced

- **Scenario:** A user attempts to open the agency service without a valid session or after deactivation.
- **Action:** Request a protected route and a sensitive action.
- **Expected:** The service returns a generic unauthorized response, creates no clinical side effect, and records an opaque security event.
- **Must not:** Accept shared accounts, client-supplied identity, or tokens in browser storage accessible to scripts.
- **Verification:** Authentication, session-expiry, deactivation, MFA, and reauthentication tests.
- **Environment/safety:** Staging identity provider with synthetic accounts.
- **Priority:** Required

### AC-004: Tenant and role boundaries hold

- **Scenario:** A provider, reviewer, admin, and support operator attempt reads, edits, exports, and administrative actions across allowed and disallowed scopes.
- **Action:** Exercise each permission with valid and altered tenant/resource identifiers.
- **Expected:** Only the minimum-necessary allowed action succeeds; every cross-tenant or role-inappropriate action is denied without disclosing the other tenant's content.
- **Must not:** Trust a tenant ID, role, resource ID, or export target supplied only by the client.
- **Verification:** Automated authorization matrix, cross-tenant denial suite, and independent security review.
- **Environment/safety:** Isolated staging database with synthetic records.
- **Priority:** Required

### AC-005: PHI storage and transport are protected

- **Scenario:** An approved pilot stores a draft and backup.
- **Action:** Inspect transport, database, backup, key, rotation, and restore configuration.
- **Expected:** Traffic uses managed TLS; stored data and backups use approved encryption; keys are separated from data and rotation is tested.
- **Must not:** Put credentials in source, images, client bundles, URLs, or logs.
- **Verification:** Infrastructure review, TLS scan, secret scan, key-rotation test, and restore exercise.
- **Environment/safety:** Staging infrastructure; no live PHI.
- **Priority:** Required

### AC-006: Audit events are complete and content-safe

- **Scenario:** An authorized user reads, edits, organizes, reviews, exports, or an admin changes policy.
- **Action:** Perform the action and inspect the audit record.
- **Expected:** An immutable event contains actor, tenant, action, opaque resource ID, timestamp, result, and correlation ID; the narrative, identifiers, prompts, and source text are absent.
- **Must not:** Allow normal users or support tooling to alter or delete audit history.
- **Verification:** `docs/agency-audit-event-contract.json`, `npm run agency:contract`, audit schema tests, append-only policy tests, redaction tests, and review procedure.
- **Environment/safety:** Staging with synthetic cases.
- **Priority:** Required

### AC-007: Retention, deletion, legal hold, and recovery are deterministic

- **Scenario:** An agency administrator applies retention, deletion, legal hold, export, or restore procedures.
- **Action:** Execute each operation on synthetic records in each lifecycle state.
- **Expected:** Records are retained or deleted according to the approved policy, legal hold prevents deletion, exports are auditable, and restore does not bypass authorization or retention rules.
- **Must not:** Rely on browser session storage or an undocumented manual database operation.
- **Verification:** Lifecycle integration tests, deletion evidence, legal-hold test, backup restore test, and agency approval.
- **Environment/safety:** Disposable staging data only.
- **Priority:** Required

### AC-008: AI output is versioned and source-grounded

- **Scenario:** The model returns valid, invalid, incomplete, adversarial, or unavailable output.
- **Action:** Submit the request through the agency API.
- **Expected:** The canonical `docs/ai-organize-contract.json` envelope records an opaque request ID, model/prompt/policy/schema/evaluation versions, and validation status; unsupported assertions and source mismatches are rejected; the raw capture remains intact; fallback is explicit.
- **Must not:** Present a failed or unvalidated model response as a completed patient-care record.
- **Verification:** AI contract tests, prompt-injection suite, source-span tests, timeout/failure tests, and human-review observation.
- **Environment/safety:** Synthetic evaluation set; no cloud provider without approval.
- **Priority:** Required

### AC-009: AI evaluation meets the agency threshold

- **Scenario:** A model, prompt, schema, or policy version changes.
- **Action:** Run the registered evaluation bundle.
- **Expected:** Fabrication, omission, timing/dose/route, quote, timeline, section-placement, injection, follow-up, and failure metrics are reported against approved thresholds; a failed critical gate blocks release.
- **Must not:** Treat a generic language-quality score as clinical validation.
- **Verification:** Versioned evaluation report with clinical and QA sign-off.
- **Environment/safety:** Synthetic or agency-approved de-identified cases with access controls.
- **Priority:** Required

### AC-010: Clinical workflow is validated by EMS leadership

- **Scenario:** Representative EMS users document varied call types in Capture, Guided, review, correction, and failure states.
- **Action:** Complete the protocol and inspect source preservation, questions, narrative detail, and review gates.
- **Expected:** Users can capture information in their natural flow, no facts are silently discarded, follow-ups are non-leading, and the clinician controls final wording.
- **Must not:** Let the system diagnose, recommend treatment, or auto-sign.
- **Verification:** Medical director and EMS reviewer sign-off with an issue disposition log.
- **Environment/safety:** Synthetic cases; no live patient-care use.
- **Priority:** Required

### AC-011: ePCR/NEMSIS export is versioned and reversible

- **Scenario:** A reviewed draft is exported to the selected ePCR/NEMSIS version.
- **Action:** Export valid, incomplete, duplicate, and malformed cases.
- **Expected:** The mapping is explicit, validation errors are actionable without leaking content, duplicate/retry behavior is defined, and no export occurs without an authorized human action.
- **Must not:** Claim I-CHEATED section headings alone constitute NEMSIS compliance.
- **Verification:** Mapping review, conformance tests, negative tests, and agency ePCR owner approval.
- **Environment/safety:** Vendor sandbox or file-based test harness only.
- **Priority:** Required

### AC-012: Incident and continuity exercises pass

- **Scenario:** The service experiences suspected disclosure, model failure, database outage, identity outage, or restore need.
- **Action:** Follow the incident and continuity runbooks.
- **Expected:** The team can contain, preserve evidence, assess notification duties, communicate with the agency, restore within approved objectives, and disable AI or export without losing source capture.
- **Must not:** Improvise support access or use production PHI to rehearse the procedure.
- **Verification:** Tabletop report, recovery exercise, and agency operations sign-off.
- **Environment/safety:** Staging and synthetic records.
- **Priority:** Required

### AC-013: Pilot go/no-go is explicit

- **Scenario:** All required controls have evidence and open risks remain.
- **Action:** Convene the agency go/no-go review.
- **Expected:** The executive sponsor signs the cohort, dates, approved data, residual risks, rollback criteria, support contacts, and stop conditions.
- **Must not:** Infer approval from passing software tests or a completed checklist.
- **Verification:** Signed go/no-go record linked to the control register.
- **Environment/safety:** No PHI before approval is recorded.
- **Priority:** Required

## Blocking decisions

- [ ] First agency, state(s), and medical director
- [ ] Selected ePCR vendor/version and export-only versus integration scope
- [ ] Transient processing versus stored drafts/reports
- [ ] Agency identity provider and workforce lifecycle owner
- [ ] Model hosting/provider and agreement/data-use posture
- [ ] Retention, legal hold, deletion, RTO/RPO, and support-access policy

## Verification plan

| Criterion | Evidence | Status |
| --- | --- | --- |
| AC-001 | `npm run check`, `npm run test:ai`, `npm run test:security`, `npm run agency:contract`, `npm run agency:readiness`, config review | In progress |
| AC-002 | Approved data inventory and flow | Pending agency input |
| AC-003-AC-007 | Auth, tenant, crypto, audit, lifecycle suites | Not started |
| AC-008-AC-009 | `docs/ai-organize-contract.json`, AI contract tests, and evaluation reports | In progress for public demo; agency version pending |
| AC-010 | EMS/medical director validation | Not started |
| AC-011 | ePCR/NEMSIS mapping and sandbox tests | Pending vendor selection |
| AC-012 | Tabletop and restore exercise | Not started |
| AC-013 | Signed pilot go/no-go record | Not started |
