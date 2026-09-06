# Agency Readiness

This document is a product and engineering planning aid, not legal advice or a certification checklist. Healthcare privacy counsel, EMS clinical leadership, and each pilot agency must approve the final data flow and operating model.

The executable agency workstream is tracked in [`AGENCY_PILOT_FRAMEWORK.md`](AGENCY_PILOT_FRAMEWORK.md) and [`agency-controls.json`](agency-controls.json). The register is intentionally allowed to report blockers; a valid register is not the same as an agency-ready deployment.

## Intended use

FieldNote organizes facts supplied by authorized EMS personnel, preserves source details, identifies documentation gaps, and produces an editable narrative draft.

FieldNote must not diagnose, triage, recommend treatment or destination, invent clinical facts, independently code or bill, sign a patient-care report, or replace clinician judgment.

## Phase 1: public demonstration

- Accept only fictional or properly de-identified data.
- Keep drafts scoped to a single browser tab. In rules-only mode, narrative text stays in the browser; when the session-only Ollama consent toggle is enabled, raw notes are sent to this local server and the configured provider. The public demo accepts only the loopback provider by default. Clear them when the tab closes or the user chooses Clear draft.
- Do not connect analytics, session replay, cloud AI, persistence, or an ePCR.
- Display the demo boundary before entry and throughout the workspace.
- Collect product feedback without collecting narrative text.

Exit criteria: EMS users can complete representative synthetic calls, understand the AI/human boundary, and identify workflow problems.

## Phase 2: controlled technical pilot

- Create a data inventory and end-to-end data-flow diagram.
- Establish agency tenants and prevent cross-tenant access.
- Add named user accounts, MFA, role-based access, timeout, and account lifecycle controls.
- Encrypt transport and storage with separated key management.
- Create immutable logs for access, generation, edits, export, and approval.
- Add configurable retention, deletion, legal hold, backup, and recovery behavior.
- Keep PHI out of logs, telemetry, support systems, test fixtures, and developer environments.
- Complete threat modeling, dependency scanning, penetration testing, and documented risk analysis.
- Run with synthetic data until contracts and controls are approved.

Exit criteria: the agency and counsel approve architecture, risk treatment, policies, vendors, and pilot protocol.

## Phase 3: limited PHI pilot

- Execute a BAA with the agency.
- Execute applicable BAAs and data-processing terms with every relevant subprocessor.
- Prohibit model training and secondary use of agency data by contract and configuration.
- Establish security/privacy officials, workforce training, incident response, and breach notification procedures.
- Validate export or integration behavior against the agency's ePCR workflow.
- Restrict access to a named pilot group and monitor all access.
- Provide user support and a documented clinical escalation path.

Exit criteria: documented privacy/security review, clinical validation, successful incident exercise, recovery test, and agency sign-off.

## AI safety contract

Every model response should use a versioned schema containing the fields below. The current public-demo response contracts are [`ai-organize-contract.json`](ai-organize-contract.json) for EMS organization and [`ai-compose-document-contract.json`](ai-compose-document-contract.json) for reviewed Scribe digest proposals; an agency implementation must extend them with authenticated actor/tenant context and a durable audit record:

- Draft text by I-CHEATED section
- Source spans supporting each draft statement
- Missing fields expressed as questions
- Explicit `not_found` values
- Model, prompt, and policy versions
- Generation timestamp and request audit identifier

The application should reject malformed output and unsupported assertions. The public demo currently rejects model sections without a source excerpt found in the submitted notes, rejects obvious identifier patterns before provider dispatch, and falls back to deterministic rules. Generated text remains a draft until an authorized clinician reviews it.

Minimum evaluation categories:

- Fabricated fact rate
- Omitted pertinent-negative rate
- Medication, dose, route, and timing accuracy
- Patient-quote fidelity
- Timeline preservation
- Incorrect section placement
- Overconfident or leading follow-up questions
- Performance across EMS documentation styles

Model and prompt changes require regression testing and an approved release record.

## Documents agencies will request

- Architecture and data-flow diagrams
- Security whitepaper
- Risk analysis and remediation register
- BAA and service agreement
- Privacy policy and acceptable-use policy
- Subprocessor list
- Retention and deletion policy
- Incident-response and breach-notification plan
- Business continuity and disaster-recovery plan
- Access-control and audit-log descriptions
- Vulnerability and penetration-test summaries
- AI intended-use statement, limitations, and evaluation report
- Cyber insurance evidence where required

## Decisions the founder must make

1. Agency-hosted local inference or BAA-covered hosted inference.
2. Whether FieldNote stores reports or only processes and returns drafts.
3. Initial ePCR integration target and whether export is manual or automated.
4. States and agency types for the first pilot.
5. Retention, deletion, support-access, and breach-notification responsibilities.
6. Who serves as security officer, privacy lead, clinical safety lead, and incident commander.
