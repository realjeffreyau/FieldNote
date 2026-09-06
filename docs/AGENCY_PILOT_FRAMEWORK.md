# Agency Pilot Preparation Framework

This is an execution framework for preparing FieldNote for a controlled agency pilot. It is not legal advice, a HIPAA certification, a NEMSIS certification, or permission to process live patient information. The current application remains a synthetic-data public demonstration.

The machine-readable control register is [`agency-controls.json`](agency-controls.json), the observable implementation requirements are in [`AGENCY_PILOT_ACCEPTANCE.md`](AGENCY_PILOT_ACCEPTANCE.md), and the current AI boundaries are defined by [`ai-organize-contract.json`](ai-organize-contract.json) and [`ai-compose-document-contract.json`](ai-compose-document-contract.json). The agency deployment profile and content-free audit event boundaries are defined by [`agency-deployment-contract.json`](agency-deployment-contract.json), [`agency-deployment-profiles.json`](agency-deployment-profiles.json), and [`agency-audit-event-contract.json`](agency-audit-event-contract.json). Run `npm run agency:contract` to validate those invariants, then `npm run agency:readiness` to validate the register and print its current blockers. Run `npm run agency:readiness:strict` when an agency go/no-go gate should fail until every required control is verified.

## Release tracks

| Track | Allowed data | Identity | Storage | AI | Status |
| --- | --- | --- | --- | --- | --- |
| Public demonstration | Fictional or approved de-identified cases only | None | Browser-tab draft state; no agency store | Rules organizer or opt-in loopback Ollama | Available for workflow evaluation |
| Controlled technical pilot | Synthetic data until formal approval | Named agency accounts, MFA, RBAC | Agency-approved encrypted store | Agency-hosted or contractually approved provider | Not implemented |
| Limited PHI pilot | Only the approved agency cohort and minimum necessary data | Agency identity lifecycle and audited support access | Encrypted, tenant-isolated agency store with retention controls | Approved model/provider with contract and data-use controls | Blocked pending register closure |

Do not turn the public demo into the agency service by enabling a network bind, adding a database, or pointing it at a remote model. Build and review the agency deployment as a separate environment and service boundary.

## Foundation contracts

The deployment profile is a planning contract, not a secret-bearing runtime file. It makes the separation executable: the public demo stays loopback-only, synthetic/de-identified, non-persistent, and without agency identity; technical and PHI profiles require managed TLS, named identity, MFA/RBAC, tenant isolation, governed persistence, immutable audit, approved providers, and human review. The profile does not claim that any of those agency controls are implemented.

The audit event contract is intentionally closed and content-free. It permits opaque IDs, timestamps, action/resource enums, outcomes, and a fixed content policy, but no narrative, source text, prompt, patient identifier, free-form message, or change payload. Append-only storage, access control, retention, and tamper resistance remain separate implementation and evidence requirements.

## Target data flow

```text
EMS provider browser
  -> TLS + agency identity provider
  -> FieldNote agency API (tenant and role authorization)
  -> encrypted tenant data store (only if storage is approved)
  -> model adapter (agency-hosted or approved contracted provider)
  -> source-grounded draft + questions
  -> clinician review, correction, and approval
  -> approved export-only ePCR/NEMSIS mapping
```

Required properties of the target flow:

- The browser never calls a model provider directly.
- The API derives tenant and user identity from the authenticated session; it never trusts a client-supplied tenant ID for authorization.
- Raw notes, structured clinical fields, drafts, source spans, and exports are classified before a storage or telemetry decision is made.
- Model requests carry only the minimum necessary content for the approved task and never include hidden instructions from an untrusted note as executable policy.
- A model response is a draft. Unsupported assertions, malformed output, missing source evidence, and policy violations are rejected before display.
- Logs, metrics, traces, support tickets, screenshots, and crash reports contain opaque IDs and event metadata, never narrative text or identifiers.
- Export is explicit, auditable, versioned, and reversible where the receiving ePCR supports safe retry. There is no silent write-back or auto-signing.

## Data inventory baseline

This table is the starting inventory. The agency must confirm classification, purpose, owner, location, retention, and access before any PHI flow.

| Data element | Likely classification | Purpose | Target owner/access | Current demo handling |
| --- | --- | --- | --- | --- |
| Raw freeform call notes | Potential PHI when identifying context is present | Capture and source preservation | Assigned provider, reviewer, authorized service | In browser tab; optional loopback Ollama only after explicit consent |
| Structured times, vitals, medications, procedures | Potential PHI | Completeness and narrative drafting | Provider and permitted reviewer | Browser tab only |
| Draft I-CHEATED sections and source spans | Potential PHI | Editable clinician draft | Provider, reviewer, export service | Browser tab only |
| Follow-up questions and unfiled details | Potential PHI | Documentation gap review | Provider and reviewer | Browser tab only |
| User identity, agency, role, session, tenant | Workforce/account data | Authentication and authorization | Identity, agency admin, security staff | No accounts in demo |
| Audit event metadata | Sensitive operational data; may become PHI-linked | Accountability and investigation | Security/privacy roles | Browser audit display only; not an agency audit store |
| Model/prompt/schema/evaluation versions | Product and safety metadata | Reproducibility and change control | Product safety and engineering | Not persisted by the demo server |
| Export package and ePCR response | Potential PHI | Approved handoff | Provider/reviewer and receiving ePCR | No ePCR connection |

## Role and access baseline

The final matrix must be approved by the agency. This baseline is deliberately narrower than a generic administrator model.

| Role | Capture/edit own draft | Review assigned drafts | Export | Manage users/policy | View audit metadata | Support content |
| --- | --- | --- | --- | --- | --- | --- |
| Field provider | Yes | Per agency workflow | Per agency workflow | No | No | No by default |
| QA reviewer | Assigned scope | Yes | Per agency workflow | No | Limited | No by default |
| Agency administrator | Per agency policy | Per agency policy | Per agency policy | Yes | Yes | No clinical content by default |
| Medical director / clinical safety lead | No routine capture unless assigned | Clinical validation scope | No default | No | Validation scope | No by default |
| Privacy/security officer | No routine capture | No routine clinical access | No | Policy and investigation scope | Yes | Case-by-case, audited |
| Support operator | No | No | No | No | Operational metadata only | No PHI access by default |

Break-glass access, if the agency requires it, must be time-limited, justified, approved, and audited. A support role must not become an undocumented path to patient narratives.

## Pilot phases and exit gates

### Gate 0: product and legal scope

1. Agency use case, prohibited use, clinical owner, states, agency type, and pilot cohort are documented.
2. Counsel and privacy/security leadership decide whether FieldNote is acting as a business associate and which vendor agreements are required.
3. The agency chooses whether the product stores reports, processes transiently, or exports only.
4. The control register has an owner and evidence target for every required control.

### Gate 1: controlled technical pilot with synthetic data

1. Separate deployment, identity, tenant, storage, model, logging, and support boundaries exist.
2. Cross-tenant denial tests, authorization tests, PHI leak tests, recovery tests, and model regression tests pass.
3. EMS users complete representative Capture, Guided, review, failure, and export exercises without losing source details.
4. An incident tabletop and restore exercise are completed before expanding the cohort.

### Gate 2: limited PHI pilot

1. Contracts, BAAs/data-use terms, privacy notices, workforce training, and support procedures are approved.
2. Clinical validation covers representative call types and documents known failure modes.
3. The ePCR/NEMSIS mapping and export behavior are approved and tested against the selected version.
4. The agency signs a go/no-go record with explicit residual-risk ownership and rollback criteria.

## AI safety contract

Every generation in the agency service should carry these fields in an auditable envelope, separate from the clinician-facing text. The public demo now exposes the non-PHI correlation and version fields in the response contract; it still does not persist an agency audit record.

```text
request_id
tenant_id (opaque)
actor_id (opaque)
model_id and provider
prompt_policy_version
schema_version
source_span_policy_version
evaluation_bundle_version
generation_started_at / generation_completed_at
draft sections and source spans
unfiled source-grounded details
follow-up questions
validation outcome
human review and approval events
```

The model must not be the source of truth. The submitted notes and structured fields are the source; the clinician decides what belongs in the final record. A failed model request must leave the original capture intact and offer a deterministic or manual path without presenting an invented draft as successful.

Minimum evaluation bundle:

- Fabricated fact and unsupported assertion rate
- Omitted pertinent-negative rate
- Medication, dose, route, time, and response fidelity
- Patient-quote fidelity
- Timeline and reassessment preservation
- Correct I-CHEATED section placement
- Prompt-injection resistance in raw notes
- Follow-up question usefulness and non-leading wording
- Behavior across terse, verbose, dictated, structured, and mixed EMS documentation styles
- Failure behavior when the provider, model, network, or ePCR is unavailable

## Decisions required before architecture lock

These are business, legal, or agency decisions and cannot be inferred from this repository:

1. First state(s), agency type(s), medical director, and ePCR vendor/version.
2. Agency-hosted inference versus a vendor willing to sign the required agreement and contractually prohibit training/secondary use.
3. Transient processing versus stored drafts/reports, including retention, deletion, legal hold, and export requirements.
4. Identity provider, workforce lifecycle, support model, and emergency-access policy.
5. Required service levels, outage behavior, RTO/RPO, and pilot support coverage.
6. Whether the first pilot is export-only or includes an approved ePCR integration.

## Current blocker summary

The public demo has no named accounts, MFA/RBAC, tenant isolation, encrypted agency persistence, immutable server audit trail, configurable retention/deletion, vendor contracts, clinical validation, or ePCR mapping. Those are not defects to hide; they are explicit agency-pilot blockers tracked in [`agency-controls.json`](agency-controls.json). The demo should remain synthetic until the required owners accept evidence for those controls.
