# AI Context Changelog

This is a human-reviewed change record for the local FieldNote profile. It is intentionally based on synthetic evaluation cases, not patient records or automatic draft feedback.

## v6 - current

- Added whole-quote preservation guidance, including the speaker lead-in and punctuation.
- Instructed the model to prefer one short exact span per section and keep additional details in `unfiled`.
- Enforced a literal-evidence contract: `sections[key]` must equal `sources[key]` character for character, and each source must be a literal substring of the submitted notes (`fieldnote.source-span.v3`).
- Synthetic live evaluation passed: detail preservation, refusal and witness facts, prompt-injection-as-data, and negative findings.

## v5

- Added the exact-evidence rule and strengthened the server gate to reject paraphrased section text.
- Added `fieldnote.source-span.v2` so this behavioral change is visible in the response contract.

## v4

- Added flat-schema and character-by-character source-copy instructions after a synthetic run exposed nested output and an altered source span.

## Governance rule

Prompt changes are versioned and evaluated before use. A clinician draft is never silently used as training data. Any future agency-specific knowledge must be approved, versioned, scoped, and evaluated separately from the general documentation organizer.
