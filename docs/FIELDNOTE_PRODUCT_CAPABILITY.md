# FieldNote Product Capability Contract

Status: Phase 2 implementation slices complete; Scribe source-grounded proposal flow implemented, clinical evaluation remains a later gate

## Capability

FieldNote provides two related but separate documentation workspaces:

- **Narrative Writer** helps EMS professionals capture a call in their natural freeform style, automatically improve sentence structure, and organize the result into an editable I-CHEATED narrative.
- **Clinical Scribe** gives emergency-room staff a transcript-first workspace for capturing a patient conversation and turning it into a generic encounter digest with bullets, tables, source references, and open questions.

Both workspaces preserve the original source. Automatic rewriting means that FieldNote proposes a rewritten version for review; it never silently replaces the source or creates a signed medical record.

## Users and Jobs

| User | Repeated job | First useful outcome |
| --- | --- | --- |
| EMS field provider | Spew out call details quickly, then make the narrative readable and complete | A source-linked I-CHEATED draft with missing-detail prompts |
| ED scribe | Capture a conversation without losing speaker, timing, or patient wording | A study-note-style encounter digest that is easy to scan and verify |
| Clinical reviewer | Compare generated text with the original record | A side-by-side review with source spans and explicit warnings |

## Fixed Constraints and Invariants

### Source and clinical safety

- Raw EMS notes and raw transcript segments are immutable source material within a draft lifecycle.
- Automatic rewriting may correct grammar, sentence structure, punctuation, and organization only when the supplied meaning remains unchanged.
- Numbers, units, times, durations, doses, routes, patient quotes, negatives, speaker attribution, and stated response must be preserved exactly unless the clinician explicitly edits them.
- The system must never infer a diagnosis, treatment, capacity, medical necessity, disposition, or clinical plan.
- A clinician can compare the original and generated text before accepting, copying, downloading, or exporting it.
- Questions and warnings are visibly separate from facts.

### Workspace separation

- Narrative Writer and Clinical Scribe have separate routes, draft state, audit events, and clear actions.
- A scribe transcript must not silently become an EMS narrative.
- The current `#/workspace` route remains a compatibility alias for Narrative Writer while the new navigation is introduced.
- Each workspace keeps one uninterrupted encounter flow. Separation is at the workspace level, not by fragmenting one encounter across multiple internal tabs.

### Privacy and legal boundary

- The current public demo accepts synthetic or properly de-identified data only.
- Transcript-first is the initial Scribe implementation. Audio recording is a later opt-in capability that requires consent, jurisdiction review, hospital policy approval, and a retention decision.
- No patient data, audio, transcript, or generated document may appear in URLs, logs, analytics, crash reports, screenshots, or client-visible error messages.
- Browser storage is acceptable only for the current synthetic demo. Production PHI requires authenticated server-side storage with encryption, authorization, retention, deletion, and audit controls.
- A local Ollama process is not by itself a HIPAA control. Any cloud speech or AI provider requires vendor and BAA review before PHI is sent.

## Workspace Contract

### Narrative Writer

Lifecycle:

```text
capture -> rewrite proposal -> clinician review -> accepted draft -> export/review
```

Inputs:

- Freeform raw call notes
- Guided answers
- Provider-entered vitals, call times, medications, procedures, refusal details

Outputs:

- I-CHEATED sections
- Automatic grammar and sentence-structure proposal
- Source references and missing-detail questions
- Clinician-reviewed copy/download/print output

Current Grammar Assist behavior:

- The Grammar mode reads only accepted/current I-CHEATED sections in the browser.
- The demo pass normalizes spacing and punctuation and capitalizes sentence starts; it does not paraphrase, add facts, or send text to Ollama.
- Each changed section shows the original and an editable rewrite side by side.
- The proposal also renders one complete narrative in canonical I-CHEATED order (`I → C → H → E → A → T → E → D`) so the provider can review the final structure as a document, not only as separate cards.
- Accepting the ordered draft applies the reviewed section rewrites in that order; discarding it leaves the current narrative unchanged. Structured clinical detail is retained with the draft and is shown separately when present.
- Accepting or discarding is explicit per section or for the complete proposal. The original remains unchanged until acceptance, and the action is recorded in the demo audit log.
- The future `POST /api/rewrite` boundary must preserve this same proposal contract, include source spans, and fail closed on unsupported or mismatched output.

### Clinical Scribe

Lifecycle:

```text
session setup -> transcript capture -> transcript review -> digest proposal -> clinician review -> export/clear
```

Initial transcript inputs:

- Manual transcript segments with speaker and timestamp fields
- Pasted or typed exact wording within each segment

Current capture behavior:

- The Scribe route has its own tab-scoped draft, clear action, review state, and audit events.
- Each segment keeps a separate timestamp, speaker, and exact-wording field; blank timestamps are not invented or auto-filled.
- Synthetic sample loading, source editing, source review, copy, and transcript download are available without audio or AI dispatch.
- Possible identifier warnings are visible in the Scribe workspace, but detection is incomplete and is not de-identification.
- The encounter digest starts explicitly not-generated. With local AI enabled, a reviewed transcript can produce a source-referenced proposal through `POST /api/compose-document`; every factual block and question carries valid opaque source references, and the digest remains unexportable until a second clinician review. The transcript remains authoritative and unchanged.

Future audio inputs, after legal and security review:

- Explicit recording consent state
- Start, pause, resume, and stop events
- Microphone permission state
- Audio retention and deletion state

## Generic Encounter Digest

The first Scribe output is a study-note-style document, not an official chart note. It may contain paragraphs, bullet lists, and tables.

Default sections:

1. Encounter overview
2. Chief concern / reason for visit
3. Timeline of events
4. Patient-reported symptoms and exact quotes
5. Relevant history, medications, and allergies when supplied
6. Observations and exam details when supplied
7. Tests or results when supplied
8. Interventions or care performed when supplied
9. Response and reassessment
10. Stated disposition or follow-up details
11. Missing details and follow-up questions

Formatting rules:

- Bullets are used for discrete facts and timeline items.
- Tables are used for repeated structured information such as time, speaker, event, vital, test, or response.
- Tables must not hide source evidence or imply that a blank field is normal.
- A generated section may be omitted when no supported source exists.
- The digest must distinguish patient statements, clinician observations, and actions performed.

## Data Model Implications

The implementation should use separate opaque draft/session identifiers and avoid patient identifiers in URLs.

```text
WriterDraft
  id, status, rawNotes, narrativeSections, rewriteProposals, sourceSpans, questions, warnings

ScribeSession
  id, status, transcriptSegments, sessionNotes, consentState, sourceSpans, questions, warnings

TranscriptSegment
  id, startTime, endTime, speaker, text, sourceType, edited, sourceOfTruth

DocumentProposal
  documentType, blocks, tables, sourceRefs, questions, warnings, modelMetadata, validation
```

`sourceRefs` must point to exact source text or stable segment identifiers. The frontend and provider must consume one versioned JSON Schema rather than maintaining independent response shapes.

## Future API Boundaries

These are planned boundaries, not implemented in Phase 1:

- `POST /api/rewrite` for source-preserving grammar and sentence-structure proposals.
- `POST /api/compose-document` for a generic ED encounter-digest proposal from reviewed transcript segments. Its current public-demo contract is [`ai-compose-document-contract.json`](ai-compose-document-contract.json); the browser calls it only after local-AI opt-in and transcript review.
- `GET /api/status` remains the provider health boundary.

Every AI boundary must define success, validation, unavailable, malformed-output, source-mismatch, rate-limit, and identifier-detected errors.

## Non-Goals

- No autonomous charting or background recording.
- No diagnostic, triage, treatment, dosage, risk-score, or disposition recommendations.
- No automatic medical coding or billing decisions.
- No automatic write-back to an ePCR or hospital EHR.
- No automatic learning from clinician drafts or patient conversations.
- No agency-specific protocol retrieval until the agency supplies approved, versioned material and governance.
- No claim that the public demo is HIPAA compliant or ready for live patient care.

## Open Decisions Before Production

- Which jurisdictions and hospital policies govern recording consent?
- Will production Scribe use encrypted audio storage, immediate transcription with audio deletion, or no audio persistence?
- Which users can view, edit, export, or delete another user's scribe session?
- What retention period applies to transcript drafts, audio, generated digests, and audit events?
- Which hospital document vocabulary should be configurable without mixing clinical policy into the base model?
- Which clinical reviewers approve the generic digest before any pilot with real PHI?

## Phase 1 Done Criteria

- The two personas and workspace boundary are explicit.
- Transcript-first is the initial Scribe scope.
- Automatic rewriting is defined as a reviewable proposal, not a silent mutation.
- The generic encounter digest sections and bullet/table rules are explicit.
- Future API and data boundaries are named without pretending they exist.
- Privacy, legal, and production blockers are recorded for the next phases.

Next handoff: evaluate the Scribe proposal against representative synthetic conversations, then harden agency authentication, retention, audit, and clinical validation controls before any PHI pilot.
