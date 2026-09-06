import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { createServer, request as httpRequest } from 'node:http';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
let fakeOllama;
let app;
let logs = '';

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

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

function assertSecurityHeaders(response, label) {
  const getHeader = name => typeof response.headers.get === 'function' ? response.headers.get(name) : response.headers[name];
  const csp = getHeader('content-security-policy') || '';
  assert(csp.includes("default-src 'self'"), `${label} should set a self-only CSP default`);
  assert(csp.includes("script-src 'self'") && !csp.includes("'unsafe-inline'"), `${label} should keep scripts strict`);
  assert(csp.includes("object-src 'none'") && csp.includes("frame-ancestors 'none'"), `${label} should block object embedding`);
  assert(getHeader('permissions-policy') === 'camera=(), geolocation=(), microphone=()', `${label} should disable unused device permissions`);
  assert(getHeader('referrer-policy') === 'no-referrer', `${label} should suppress referrer leakage`);
  assert(getHeader('x-content-type-options') === 'nosniff', `${label} should set nosniff`);
  assert(getHeader('x-frame-options') === 'DENY', `${label} should deny framing`);
  assert(getHeader('access-control-allow-origin') === null || getHeader('access-control-allow-origin') === undefined, `${label} must not opt into cross-origin access`);
}

async function request(baseUrl, path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual', ...init });
  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch { /* non-JSON static/error body */ }
  return { response, text, body };
}

async function rawGet(baseUrl, path) {
  const target = new URL(baseUrl);
  return new Promise((resolve, reject) => {
    const request = httpRequest({ hostname: target.hostname, port: target.port, method: 'GET', path }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ response, text: Buffer.concat(chunks).toString('utf8') }));
    });
    request.on('error', reject);
    request.end();
  });
}

function assertApiError(result, expectedStatus, expectedCode, label) {
  assert(result.response.status === expectedStatus, `${label} should return ${expectedStatus}`);
  assertSecurityHeaders(result.response, label);
  assert(result.body?.error === expectedCode, `${label} should use the stable ${expectedCode} error`);
  assert(typeof result.body?.requestId === 'string' && result.response.headers.get('x-request-id') === result.body.requestId, `${label} should correlate the opaque request ID`);
  assert(!result.text.includes('at '), `${label} must not expose a stack trace`);
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

    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const system = body.messages?.find(item => item.role === 'system')?.content || '';
    const user = body.messages?.find(item => item.role === 'user')?.content || '';
    assert(system.includes('fieldnote.'), 'provider request should carry a versioned FieldNote policy');
    assert(user.includes('untrusted documentation data') || user.includes('untrusted documentation'), 'provider request should frame source text as untrusted data');

    if (system.includes('scribe-prompt-policy')) {
      json(response, 200, {
        message: {
          content: JSON.stringify({
            document: {
              type: 'encounter_digest',
              title: 'ignored',
              sections: [{
                key: 'overview',
                blocks: [{ kind: 'paragraph', text: 'Synthetic patient reported dizziness.', items: [], columns: [], rows: [], sourceRefs: ['s1'] }]
              }]
            },
            questions: [{ question: 'Was onset documented?', sourceRefs: ['s1'] }]
          })
        }
      });
      return;
    }
    json(response, 200, {
      message: {
        content: JSON.stringify({
          sections: { complaint: 'Synthetic patient reported dizziness.' },
          sources: { complaint: 'Synthetic patient reported dizziness.' },
          unfiled: [],
          questions: []
        })
      }
    });
  });
  const ollamaPort = await listen(fakeOllama);
  const portProbe = createServer();
  const appPort = await listen(portProbe);
  await close(portProbe);

  app = spawn(process.execPath, ['server.mjs'], {
    cwd: root,
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

  const home = await request(baseUrl, '/');
  assert(home.response.status === 200, 'home page should load');
  assertSecurityHeaders(home.response, 'home page');
  assert(home.response.headers.get('cache-control') === 'no-store', 'home page should not be cached by shared intermediaries');
  assert(home.text.includes('FieldNote'), 'home page should contain the app shell');

  const status = await request(baseUrl, '/api/status');
  assert(status.response.status === 200, 'status endpoint should load');
  assertSecurityHeaders(status.response, 'status endpoint');
  assert(typeof status.body?.requestId === 'string' && status.response.headers.get('x-request-id') === status.body.requestId, 'status should expose an opaque request ID');
  assert(status.body?.localOnly === true, 'default test provider should remain local-only');
  assert(!status.text.includes('OLLAMA_BASE_URL'), 'status should not expose provider configuration names');

  const unknownApi = await request(baseUrl, '/api/not-a-real-route');
  assert(unknownApi.response.status === 404, 'unknown API routes should return 404');
  assertSecurityHeaders(unknownApi.response, 'unknown API route');
  assert(!unknownApi.text.includes('server.mjs') && !unknownApi.text.includes('stack'), 'unknown API routes should not disclose implementation details');

  const traversal = await rawGet(baseUrl, '/%2e%2e/server.mjs');
  assert(traversal.response.statusCode === 403, 'encoded path traversal should be denied');
  assertSecurityHeaders(traversal.response, 'path traversal response');
  assert(!traversal.text.includes('import ') && !traversal.text.includes('FieldNote demo running'), 'path traversal must not return source code');

  const email = 'synthetic.patient@example.com';
  const identifier = await request(baseUrl, '/api/organize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: `Synthetic patient email ${email} reported dizziness.` })
  });
  assertApiError(identifier, 422, 'possible_identifier_detected', 'organize identifier guard');
  assert(!identifier.text.includes(email), 'organize identifier errors must not echo the submitted identifier');

  const composeIdentifier = await request(baseUrl, '/api/compose-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentType: 'encounter_digest',
      reviewed: true,
      segments: [{ id: 's1', timestamp: '00:01', speaker: 'Patient', text: `Email ${email}` }]
    })
  });
  assertApiError(composeIdentifier, 422, 'possible_identifier_detected', 'Scribe identifier guard');
  assert(!composeIdentifier.text.includes(email), 'Scribe identifier errors must not echo the submitted identifier');

  const malformed = await request(baseUrl, '/api/organize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"notes":'
  });
  assertApiError(malformed, 400, 'invalid_json', 'malformed JSON');
  assert(!malformed.text.includes('{"notes"'), 'malformed JSON errors must not echo request bodies');

  const oversized = await request(baseUrl, '/api/organize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: 'x'.repeat(50 * 1024) })
  });
  assertApiError(oversized, 413, 'request_too_large', 'oversized request');
  assert(!oversized.text.includes('xxxxx'), 'oversized request errors must not echo request content');

  const validOrganize = await request(baseUrl, '/api/organize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: 'Synthetic patient reported dizziness.' })
  });
  assert(validOrganize.response.status === 200, 'synthetic organize request should still work after rejected requests');
  assertSecurityHeaders(validOrganize.response, 'valid organize response');

  const unreviewed = await request(baseUrl, '/api/compose-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentType: 'encounter_digest', reviewed: false, segments: [] })
  });
  assertApiError(unreviewed, 422, 'review_required', 'Scribe review gate');

  const validCompose = await request(baseUrl, '/api/compose-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentType: 'encounter_digest',
      reviewed: true,
      segments: [
        { id: 's1', timestamp: '00:01', speaker: 'Patient', text: 'Synthetic patient reported dizziness.' },
        { id: 's2', timestamp: '00:08', speaker: 'Clinician', text: 'Synthetic clinician asked about onset.' }
      ]
    })
  });
  assert(validCompose.response.status === 200, 'reviewed synthetic Scribe request should still work');
  assertSecurityHeaders(validCompose.response, 'valid Scribe response');
  assert(validCompose.body?.validation?.sourceRefsValid === true && validCompose.body?.validation?.clinicianReviewRequired === true, 'valid Scribe response should retain human-review metadata');

  console.log('Security regression checks passed: strict headers, no CORS opt-in, traversal denial, opaque errors, identifier non-echo, size limits, review gating, and synthetic provider boundaries.');
} catch (error) {
  console.error(error.message);
  if (logs) console.error(logs);
  process.exitCode = 1;
} finally {
  if (app && !app.killed) app.kill('SIGTERM');
  await close(fakeOllama);
}
