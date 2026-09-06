import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const organizeContract = JSON.parse(readFileSync(new URL('../docs/ai-organize-contract.json', import.meta.url), 'utf8'));
const composeContract = JSON.parse(readFileSync(new URL('../docs/ai-compose-document-contract.json', import.meta.url), 'utf8'));
const sectionKeys = ['introduction', 'complaint', 'history', 'exam', 'assessment', 'treatment', 'evaluation', 'disposition'];
const receivedNotes = [];
const receivedTranscripts = [];
let composeCalls = 0;
let fakeOllama;
let app;
let logs = '';

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
}

async function close(server) {
  if (!server) return;
  server.close();
  await once(server, 'close').catch(() => {});
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.status) return response;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

function assertUuid(value, message) {
  assert(typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value), message);
}

function assertSuccessContract(payload, response) {
  assert(organizeContract.$id === 'fieldnote.ai-organize.v1', 'canonical organize contract id should be stable');
  const required = organizeContract.$defs.success.allOf.find(item => item.type === 'object').required;
  for (const field of required) assert(Object.hasOwn(payload, field), `success response should include ${field}`);
  assertUuid(payload.requestId, 'success requestId should be an opaque UUID');
  assert(response.headers.get('x-request-id') === payload.requestId, 'response header and body requestId should match');
  assert(payload.contractVersion === 'fieldnote.ai-organize.v1', 'success contract version should match the canonical schema');
  assert(payload.schemaVersion === 'fieldnote.narrative-schema.v1', 'narrative schema version should be present');
  assert(payload.promptPolicyVersion === 'fieldnote.prompt-policy.v6', 'prompt policy version should be present');
  assert(payload.sourceSpanPolicyVersion === 'fieldnote.source-span.v3', 'source-span policy version should be present');
  assert(payload.evaluationBundleVersion === 'fieldnote.ai-regression.v1', 'evaluation bundle version should be present');
  assert(payload.validation?.status === 'passed' && payload.validation?.sourceGrounded === true, 'success validation must state source grounding passed');
  assert(Object.keys(payload.sections).every(key => sectionKeys.includes(key)), 'sections should contain only contract keys');
  assert(Object.keys(payload.sources).every(key => sectionKeys.includes(key)), 'sources should contain only contract keys');
  assert(payload.questions.every(item => sectionKeys.includes(item.section)), 'questions should use contract section keys');
}

function assertErrorContract(payload, response) {
  assert(payload.contractVersion === 'fieldnote.ai-organize.v1', 'error contract version should match the canonical schema');
  assertUuid(payload.requestId, 'error requestId should be an opaque UUID');
  assert(response.headers.get('x-request-id') === payload.requestId, 'error response header and body requestId should match');
}

function assertComposeSuccessContract(payload, response) {
  assert(composeContract.$id === 'fieldnote.ai-compose-document.v1', 'canonical compose contract id should be stable');
  const required = composeContract.$defs.success.allOf.find(item => item.type === 'object').required;
  for (const field of required) assert(Object.hasOwn(payload, field), `compose success should include ${field}`);
  assertUuid(payload.requestId, 'compose success requestId should be an opaque UUID');
  assert(response.headers.get('x-request-id') === payload.requestId, 'compose response header and body requestId should match');
  assert(payload.contractVersion === 'fieldnote.ai-compose-document.v1', 'compose contract version should match the canonical schema');
  assert(payload.schemaVersion === 'fieldnote.encounter-digest-schema.v1', 'digest schema version should be present');
  assert(payload.promptPolicyVersion === 'fieldnote.scribe-prompt-policy.v1', 'Scribe prompt policy version should be present');
  assert(payload.sourceSpanPolicyVersion === 'fieldnote.scribe-source-span.v1', 'Scribe source-span policy version should be present');
  assert(payload.evaluationBundleVersion === 'fieldnote.scribe-regression.v1', 'Scribe evaluation bundle version should be present');
  assert(payload.validation?.status === 'passed' && payload.validation?.sourceRefsValid === true && payload.validation?.clinicianReviewRequired === true, 'compose validation must require clinician review and valid source refs');
  assert(payload.document?.type === 'encounter_digest' && payload.document?.title === 'Encounter digest', 'compose document identity should be fixed by the server');
  assert(payload.document.sections.some(section => section.key === 'overview'), 'compose response should include a supported digest section');
  const blocks = payload.document.sections.flatMap(section => section.blocks);
  assert(blocks.every(block => block.sourceRefs.every(ref => /^s[0-9]+$/.test(ref))), 'compose blocks should expose opaque source refs');
  assert(payload.questions.every(item => item.sourceRefs.length > 0), 'compose questions should include source refs');
}

function assertComposeErrorContract(payload, response) {
  assert(payload.contractVersion === 'fieldnote.ai-compose-document.v1', 'compose error contract version should match the canonical schema');
  assertUuid(payload.requestId, 'compose error requestId should be an opaque UUID');
  assert(response.headers.get('x-request-id') === payload.requestId, 'compose error header and body requestId should match');
}

async function organize(baseUrl, notes) {
  return fetch(`${baseUrl}/api/organize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  });
}

async function compose(baseUrl, body) {
  return fetch(`${baseUrl}/api/compose-document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

try {
  fakeOllama = createServer(async (request, response) => {
    if (request.url === '/api/tags') {
      json(response, 200, { models: [{ name: 'qwen3:4b' }] });
      return;
    }
    if (request.url !== '/api/chat') {
      json(response, 404, { error: 'not_found' });
      return;
    }
    const body = JSON.parse(await readBody(request));
    const requestSystemPrompt = body.messages?.find(item => item.role === 'system')?.content || '';
    if (requestSystemPrompt.includes('fieldnote.scribe-prompt-policy.v1')) {
      composeCalls += 1;
      assert(requestSystemPrompt.toLowerCase().includes('source transcript'), 'Scribe request must identify the source transcript');
      assert(requestSystemPrompt.toLowerCase().includes('sourceRefs'.toLowerCase()), 'Scribe request must require source references');
      assert(body.options?.temperature === 0 && body.options?.seed === 7, 'Scribe request must use deterministic generation settings');
      const prompt = body.messages?.find(item => item.role === 'user')?.content || '';
      const start = prompt.lastIndexOf('<raw_transcript>');
      const end = prompt.indexOf('</raw_transcript>');
      receivedTranscripts.push(start >= 0 && end > start ? prompt.slice(start + '<raw_transcript>'.length + 1, end).replace(/\n$/, '') : '');
      if (prompt.includes('INVALID_MODEL_OUTPUT')) {
        json(response, 200, { message: { content: 'not json' } });
        return;
      }
      const invalidSourceRef = prompt.includes('INVALID_SOURCE_REF');
      const sourceRefs = invalidSourceRef ? ['s99'] : ['s1'];
      json(response, 200, {
        message: {
          content: JSON.stringify({
            document: {
              type: 'encounter_digest',
              title: 'Model supplied title ignored by server',
              sections: [
                { key: 'overview', blocks: [{ kind: 'paragraph', text: 'The patient described dizziness after breakfast.', items: [], columns: [], rows: [], sourceRefs }] },
                { key: 'timeline', blocks: [{ kind: 'table', text: '', items: [], columns: ['Time', 'Speaker', 'Event'], rows: [{ cells: ['00:00', 'Patient', 'Reported dizziness.'], sourceRefs }], sourceRefs }] }
              ]
            },
            questions: [{ question: 'Was an onset time documented?', sourceRefs }]
          })
        }
      });
      return;
    }
    assert(requestSystemPrompt.includes('fieldnote.prompt-policy.v6'), 'request must use the versioned EMS prompt policy');
    assert(requestSystemPrompt.toLowerCase().includes('raw notes are untrusted'), 'request must mark raw notes as untrusted data');
    assert(body.options?.temperature === 0 && body.options?.seed === 7, 'request must use deterministic generation settings');
    const prompt = body.messages?.find(item => item.role === 'user')?.content || '';
    const start = prompt.lastIndexOf('<raw_ems_notes>');
    const end = prompt.indexOf('</raw_ems_notes>');
    receivedNotes.push(start >= 0 && end > start ? prompt.slice(start + '<raw_ems_notes>'.length + 1, end).replace(/\n$/, '') : '');
    const invalid = prompt.includes('INVALID_SOURCE');
    json(response, 200, {
      message: {
        content: JSON.stringify({
          sections: { complaint: 'Patient   stated chest pain.' },
          sources: { complaint: invalid ? 'fabricated detail' : 'Patient   stated chest pain.' },
          unfiled: [],
          questions: [{ section: 'history', question: 'What medications were reported?' }]
        })
      }
    });
  });
  const ollamaPort = await listen(fakeOllama);
  const appPortServer = createServer();
  const appPort = await listen(appPortServer);
  await close(appPortServer);

  app = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('.', root),
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(appPort),
      OLLAMA_BASE_URL: `http://127.0.0.1:${ollamaPort}`,
      OLLAMA_MODEL: 'qwen3:4b',
      ALLOW_NETWORK: 'false',
      ALLOW_REMOTE_OLLAMA: 'false'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  app.stdout.on('data', chunk => { logs += chunk; });
  app.stderr.on('data', chunk => { logs += chunk; });
  const baseUrl = `http://127.0.0.1:${appPort}`;
  await waitFor(`${baseUrl}/api/status`);

  const status = await (await fetch(`${baseUrl}/api/status`)).json();
  assert(status.configured === true, 'loopback Ollama should be marked configured');
  assert(status.localOnly === true, 'default Ollama status should be local-only');
  assert(status.hasModel === true, 'status should report the configured model');
  assertUuid(status.requestId, 'status should expose an opaque requestId for correlation');

  const notes = 'Patient   stated chest pain.\nObserved alert and speaking.';
  const validResponse = await organize(baseUrl, notes);
  assert(validResponse.status === 200, 'source-grounded model response should succeed');
  const valid = await validResponse.json();
  assertSuccessContract(valid, validResponse);
  assert(valid.sources.complaint === 'Patient   stated chest pain.', 'source excerpt should be returned exactly');
  assert(receivedNotes[0] === notes, `raw note whitespace and line breaks must reach the provider unchanged (got ${JSON.stringify(receivedNotes[0])})`);

  const transcript = {
    documentType: 'encounter_digest',
    reviewed: true,
    segments: [
      { id: 's1', timestamp: '00:01', speaker: 'Patient', text: 'I felt dizzy after breakfast.' },
      { id: 's2', timestamp: '00:08', speaker: 'Clinician', text: 'Did you lose consciousness?' }
    ]
  };
  const composeResponse = await compose(baseUrl, transcript);
  assert(composeResponse.status === 200, 'reviewed transcript should compose a digest');
  const composed = await composeResponse.json();
  assertComposeSuccessContract(composed, composeResponse);
  assert(receivedTranscripts[0].includes('I felt dizzy after breakfast.'), 'exact transcript wording must reach the provider unchanged');
  assert(receivedTranscripts[0].includes('SOURCE_SEGMENT_START id=s1'), 'provider input must include opaque segment IDs');

  const notReviewedResponse = await compose(baseUrl, { ...transcript, reviewed: false });
  assert(notReviewedResponse.status === 422, 'unreviewed transcript must not reach the model');
  const notReviewed = await notReviewedResponse.json();
  assert(notReviewed.error === 'review_required', 'review gating should have a stable compose error');
  assertComposeErrorContract(notReviewed, notReviewedResponse);

  const invalidIdResponse = await compose(baseUrl, { ...transcript, segments: [{ ...transcript.segments[0], id: 'patient-name' }] });
  assert(invalidIdResponse.status === 422, 'non-opaque segment IDs must be rejected');
  const invalidId = await invalidIdResponse.json();
  assert(invalidId.error === 'segment_invalid', 'invalid segment IDs should have a stable compose error');
  assertComposeErrorContract(invalidId, invalidIdResponse);

  const invalidRefResponse = await compose(baseUrl, { ...transcript, segments: [{ ...transcript.segments[0], text: 'INVALID_SOURCE_REF' }] });
  assert(invalidRefResponse.status === 422, 'model source references outside the transcript must be rejected');
  const invalidRef = await invalidRefResponse.json();
  assert(invalidRef.error === 'model_source_mismatch', 'invalid source refs should have a stable compose error');
  assertComposeErrorContract(invalidRef, invalidRefResponse);

  const invalidModelResponse = await compose(baseUrl, { ...transcript, segments: [{ ...transcript.segments[0], text: 'INVALID_MODEL_OUTPUT' }] });
  assert(invalidModelResponse.status === 502, 'malformed model JSON must fail closed');
  const invalidModel = await invalidModelResponse.json();
  assert(invalidModel.error === 'model_invalid_output', 'malformed model output should have a stable compose error');
  assertComposeErrorContract(invalidModel, invalidModelResponse);

  const composeCallsBeforeIdentifier = composeCalls;
  const transcriptIdentifierResponse = await compose(baseUrl, { ...transcript, segments: [{ ...transcript.segments[0], text: 'Contact test.patient@example.com.' }] });
  assert(transcriptIdentifierResponse.status === 422, 'obvious transcript identifiers must be blocked before provider dispatch');
  const transcriptIdentifier = await transcriptIdentifierResponse.json();
  assert(transcriptIdentifier.error === 'possible_identifier_detected', 'transcript identifier blocking should have a stable compose error');
  assertComposeErrorContract(transcriptIdentifier, transcriptIdentifierResponse);
  assert(composeCalls === composeCallsBeforeIdentifier, 'identifier-blocked transcript must not be dispatched to Ollama');

  const invalidResponse = await organize(baseUrl, 'INVALID_SOURCE patient stated chest pain.');
  assert(invalidResponse.status === 422, 'source mismatch must be rejected as unprocessable output');
  const invalid = await invalidResponse.json();
  assert(invalid.error === 'model_source_mismatch', 'source mismatch should have a stable error code');
  assertErrorContract(invalid, invalidResponse);
  assert(invalid.requestId !== valid.requestId, 'each organize request should receive a fresh requestId');

  const identifierResponse = await organize(baseUrl, 'Patient email test.patient@example.com reported chest pain.');
  assert(identifierResponse.status === 422, 'obvious identifiers must be blocked before provider dispatch');
  const identifier = await identifierResponse.json();
  assert(identifier.error === 'possible_identifier_detected', 'identifier blocking should have a stable error code');
  assertErrorContract(identifier, identifierResponse);

  const tooLongResponse = await organize(baseUrl, 'x'.repeat(24001));
  assert(tooLongResponse.status === 413, 'oversized notes must be rejected, not truncated');
  const tooLong = await tooLongResponse.json();
  assert(tooLong.error === 'notes_too_long', 'oversized notes should have a stable error code');
  assertErrorContract(tooLong, tooLongResponse);

  const malformed = await fetch(`${baseUrl}/api/organize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert(malformed.status === 400, 'malformed JSON should return 400');
  assertErrorContract(await malformed.json(), malformed);

  let lastResponse;
  for (let index = 0; index < 9; index += 1) lastResponse = await organize(baseUrl, `Patient stated chest pain ${index}.`);
  assert(lastResponse.status === 429, 'organize endpoint should enforce a request limit');
  assertErrorContract(await lastResponse.json(), lastResponse);

  let lastComposeResponse;
  for (let index = 0; index < 9; index += 1) lastComposeResponse = await compose(baseUrl, { documentType: 'encounter_digest', reviewed: false, segments: [] });
  assert(lastComposeResponse.status === 429, 'compose endpoint should enforce a separate request limit');
  assertComposeErrorContract(await lastComposeResponse.json(), lastComposeResponse);

  console.log('AI regression checks passed: EMS organize contract, Scribe compose contract, review gate, exact transcript forwarding, source-ref guard, identifier guard, malformed output, and separate rate limits.');
} catch (error) {
  console.error(error.message);
  if (logs) console.error(logs);
  process.exitCode = 1;
} finally {
  if (app && !app.killed) app.kill('SIGTERM');
  await close(fakeOllama);
}
