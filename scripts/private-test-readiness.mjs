import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';

const root = new URL('..', import.meta.url);
let app;

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

async function freePort() {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  probe.close();
  await once(probe, 'close');
  return port;
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.status) return response;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function assertHeaders(response, label) {
  assert(response.headers.get('content-security-policy')?.includes("default-src 'self'"), `${label} should use a self-only CSP`);
  assert(response.headers.get('x-content-type-options') === 'nosniff', `${label} should set nosniff`);
  assert(response.headers.get('x-frame-options') === 'DENY', `${label} should deny framing`);
  assert(response.headers.get('referrer-policy') === 'no-referrer', `${label} should suppress referrers`);
  assert(response.headers.get('permissions-policy') === 'camera=(), geolocation=(), microphone=()', `${label} should disable unused permissions`);
}

try {
  const port = await freePort();
  app = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('.', root),
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(port),
      OLLAMA_BASE_URL: 'http://127.0.0.1:1',
      OLLAMA_MODEL: 'fieldnote-private-test-unavailable',
      ALLOW_NETWORK: 'false',
      ALLOW_REMOTE_OLLAMA: 'false'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const baseUrl = `http://127.0.0.1:${port}`;
  const home = await waitFor(`${baseUrl}/`);
  const homeText = await home.text();
  assert(home.status === 200, 'home should respond successfully');
  assertHeaders(home, 'home');
  assert(homeText.includes('FieldNote') && homeText.includes('PRIVATE TEST') && homeText.includes('Synthetic data only'), 'home should expose the private synthetic boundary');

  const status = await waitFor(`${baseUrl}/api/status`);
  const statusBody = await status.json();
  assert(status.status === 200, 'status should respond successfully without Ollama');
  assertHeaders(status, 'status');
  assert(statusBody.localOnly === true, 'status should remain loopback-only by default');
  assert(statusBody.configured === true && statusBody.available === false && statusBody.hasModel === false, 'status should accurately report an unavailable local model');
  assert(typeof statusBody.requestId === 'string' && status.headers.get('x-request-id') === statusBody.requestId, 'status should expose a correlated opaque request id');

  const organize = await fetch(`${baseUrl}/api/organize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: 'Synthetic crew arrived and documented the call.' })
  });
  const organizeBody = await organize.json();
  assertHeaders(organize, 'organize fallback');
  assert(organize.status === 502 && organizeBody.error === 'ollama_request_failed', 'unavailable Ollama should fail closed with an opaque error');
  assert(!JSON.stringify(organizeBody).includes('Synthetic crew'), 'provider errors must not echo submitted notes');

  console.log(JSON.stringify({
    result: 'PASS',
    baseUrl,
    home: home.status,
    status: { available: statusBody.available, localOnly: statusBody.localOnly, hasModel: statusBody.hasModel },
    noOllamaOrganize: organize.status
  }));
} finally {
  if (app && !app.killed) {
    app.kill('SIGTERM');
    await once(app, 'exit').catch(() => {});
  }
}
