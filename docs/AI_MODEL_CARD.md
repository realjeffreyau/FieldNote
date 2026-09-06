# FieldNote Local AI Model Card

## Scope

`fieldnote-qwen3:4b` is a local Ollama instruction profile for the public FieldNote prototype. It organizes freeform EMS notes into an I-CHEATED-shaped draft while preserving the clinician's original evidence. It is not a diagnostic model, treatment advisor, protocol engine, ePCR submission service, or compliance certification.

The profile is built from `qwen3:4b` with `ollama/Modelfile`. This is prompt and runtime configuration, not fine-tuning: the base model weights are unchanged. The detailed EMS request policy is versioned in `ollama/fieldnote-system-prompt.v6.txt`; the separate Scribe policy is `ollama/fieldnote-scribe-system-prompt.v1.txt`. The FieldNote server loads the applicable policy for every request.

## Context layers

1. The local model profile supplies a stable EMS documentation role and a compact I-CHEATED section map.
2. The server supplies the versioned request policy, JSON schema, deterministic settings, and the untrusted-note boundary.
3. The clinician's raw notes are passed as data between `<raw_ems_notes>` tags. They are never treated as instructions.
4. Server code rejects obvious identifiers before provider dispatch, validates the response shape, and rejects any section whose text is not exactly the same as a source span present in the submitted notes.
5. The clinician remains the reviewer. The deterministic browser fallback remains available when local AI is unavailable or not consented to.

The Scribe compose route uses the same local model boundary but a separate contract. The browser requires an explicit local-AI opt-in and a reviewed transcript, the server rejects obvious identifiers before provider dispatch, and every generated digest block and question must reference an opaque transcript segment ID. Source references identify supporting material; they do not make the generated summary clinically correct or final. A second clinician review is required before copy/download.

## What the model is allowed to know

The model knows documentation organization rules: the meaning of the eight I-CHEATED sections, the need to preserve exact evidence, and the difference between a clinician-stated assessment and a model-generated diagnosis. It is deliberately not given medication recommendations, local protocols, normal ranges, billing rules, or agency policy. Those materials require an agency-approved, versioned retrieval boundary and clinical governance before they can be used.

## Privacy and use boundary

- Use fictional or properly de-identified notes for this public demo and for evaluation.
- Do not put PHI, credentials, or customer records into model training, prompts, logs, screenshots, or issue reports.
- Local inference does not by itself make a workflow HIPAA compliant. The current loopback server still lacks agency authentication, authorization, tenant isolation, durable audit controls, retention enforcement, incident response, and legal review.
- Never enable `ALLOW_NETWORK=true` or `ALLOW_REMOTE_OLLAMA=true` for PHI without a separate agency architecture and approval.

## Reproducible improvement loop

“Learning” in this demo means a controlled, reviewable cycle:

1. Add a synthetic or approved de-identified fixture that represents a documentation failure.
2. Adjust the versioned prompt or model profile; do not silently change production behavior.
3. Run `npm run check`, `npm run test:ai`, and `npm run ai:eval:live` against the local model.
4. Have EMS reviewers inspect source preservation, omissions, questions, and unsafe additions.
5. Record the change, bump the prompt policy version, and retain the evaluation result.

Do not create an automatic feedback loop from clinician drafts. Real agency data must never become training material without documented authorization, de-identification, data governance, security review, and a held-out evaluation set.

## Build and evaluate

```bash
npm run ai:build-model
OLLAMA_MODEL=fieldnote-qwen3:4b npm start
AI_EVAL_URL=http://127.0.0.1:4173 npm run ai:eval:live
```

The live evaluation uses only synthetic notes. A passing run is evidence for this prototype, not evidence of clinical safety or agency readiness.

See [AI Context Changelog](AI_CONTEXT_CHANGELOG.md) for the reviewed prompt iterations and the synthetic failures that informed the current profile.
