import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const endpoint = process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222';
const appHost = process.env.HOST || '127.0.0.1';
const appPort = process.env.PORT || '4173';
const appUrl = process.env.APP_URL || `http://${appHost}:${appPort}/`;
const appOrigin = new URL(appUrl).origin;
const pages = await fetch(`${endpoint}/json`).then(response => response.json());
const page = pages.find(item => item.type === 'page' && (item.url.startsWith(appOrigin) || item.url === 'about:blank'));
if (!page) throw new Error('FieldNote page was not found in the Chrome debugging session.');

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let commandId = 0;
const pending = new Map();
const consoleErrors = [];
const networkFailures = [];
let mockUnavailableStatus = false;

function send(method, params = {}) {
  commandId += 1;
  return new Promise((resolve, reject) => {
    pending.set(commandId, { resolve, reject });
    socket.send(JSON.stringify({ id: commandId, method, params }));
  });
}

socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(message.params.exceptionDetails?.text || 'Runtime exception');
  }
  if (message.method === 'Runtime.consoleAPICalled' && ['error', 'assert'].includes(message.params.type)) {
    consoleErrors.push(message.params.args?.map(arg => arg.value || arg.description || '').join(' ') || 'Console error');
  }
  if (message.method === 'Network.responseReceived' && message.params.response.status >= 400 && !message.params.response.url.includes('/api/status') && !message.params.response.url.endsWith('/favicon.ico')) {
    networkFailures.push({ status: message.params.response.status, url: message.params.response.url });
  }
  if (message.method === 'Network.loadingFailed' && message.params.type !== 'Other') {
    networkFailures.push({ error: message.params.errorText, url: message.params.url });
  }
  if (message.method === 'Fetch.requestPaused') {
    const requestUrl = message.params.request.url;
    if (mockUnavailableStatus && requestUrl.endsWith('/api/status')) {
      const body = Buffer.from(JSON.stringify({ provider: 'ollama', requestId: '00000000-0000-4000-8000-000000000001', available: false, configured: true, localOnly: true, model: 'fieldnote-private-test-unavailable', hasModel: false })).toString('base64');
      send('Fetch.fulfillRequest', {
        requestId: message.params.requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Cache-Control', value: 'no-store' }],
        body
      }).catch(error => consoleErrors.push(`Status mock failed: ${error.message}`));
    } else {
      send('Fetch.continueRequest', { requestId: message.params.requestId }).catch(error => consoleErrors.push(`Request resume failed: ${error.message}`));
    }
  }
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result?.value;
}

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForExpression(expression, timeout = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return true;
    await wait(100);
  }
  return false;
}

async function setViewport(width, height, mobile = false) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  await wait(150);
}

async function screenshot(name) {
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const path = join(tmpdir(), `fieldnote-${name}.png`);
  writeFileSync(path, Buffer.from(result.data, 'base64'));
  return path;
}

function viewportAudit() {
  return evaluate(`(() => {
    const visible = element => {
      if (!element || element.hidden) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const controls = [...document.querySelectorAll('button, a, input, textarea, select, summary, [contenteditable="true"]')].filter(visible);
    const name = element => (element.getAttribute('aria-label') || element.getAttribute('title') || element.labels?.[0]?.textContent || element.textContent || element.getAttribute('placeholder') || '').replace(/\\s+/g, ' ').trim();
    const unnamed = controls.filter(element => !name(element)).map(element => element.id || element.className || element.tagName);
    const touchViolations = controls.filter(element => {
      if (element.matches('input[type="checkbox"], input[type="radio"]')) return false;
      const rect = element.getBoundingClientRect();
      return rect.width < 44 || rect.height < 44;
    }).map(element => ({ id: element.id || element.className || element.tagName, width: Math.round(element.getBoundingClientRect().width), height: Math.round(element.getBoundingClientRect().height) }));
    const clipped = controls.filter(element => {
      if (element.closest('.table-wrap')) return false;
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > innerWidth + 1;
    }).map(element => element.id || element.className || element.tagName);
    const pageNav = document.querySelector('.page-nav');
    const primaryNavControls = pageNav ? [...pageNav.querySelectorAll(':scope > a, :scope > details > summary')].filter(visible) : [];
    const primaryNavOffscreen = primaryNavControls.filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > innerWidth + 1;
    }).map(element => element.textContent.replace(/\s+/g, ' ').trim());
    const pageNavOverflow = Boolean(pageNav && pageNav.scrollWidth > pageNav.clientWidth + 1);
    const gaps = [];
    const containers = document.querySelectorAll('.header-actions, .capture-actions, .clinical-actions, .scribe-panel-actions, .export-actions, .guided-actions > div, .utility-menu-panel');
    containers.forEach(container => {
      const items = [...container.children].filter(visible).map(item => item.getBoundingClientRect()).sort((a, b) => a.top - b.top || a.left - b.left);
      for (let i = 1; i < items.length; i += 1) {
        const prior = items[i - 1]; const current = items[i];
        const sameRow = Math.abs(prior.top - current.top) < 4 && current.left >= prior.right;
        const sameColumn = Math.abs(prior.left - current.left) < 4 && current.top >= prior.bottom;
        if ((sameRow && current.left - prior.right < 8) || (sameColumn && current.top - prior.bottom < 8)) gaps.push(container.className || container.id || container.tagName);
      }
    });
    const overflow = document.documentElement.scrollWidth > innerWidth + 1 || document.body.scrollWidth > innerWidth + 1;
    return { width: innerWidth, height: innerHeight, overflow, unnamed, touchViolations, clipped, gaps, primaryNavOffscreen, pageNavOverflow };
  })()`);
}

await send('Runtime.enable');
await send('Page.enable');
await send('Network.enable');
await send('Log.enable');
await send('Page.navigate', { url: appUrl });
await wait(600);
await evaluate(`sessionStorage.clear(); localStorage.removeItem('fieldnote.theme'); location.hash = '#/workspace';`);
await send('Page.reload', { ignoreCache: true });
await wait(700);
await evaluate(`document.querySelector('#demoAgreement').click(); document.querySelector('#enterDemo').click(); setTheme('day');`);

const defaultState = await evaluate(`({
  route: location.hash,
  captureVisible: !document.querySelector('#captureMode').classList.contains('hidden'),
  consentOff: !document.querySelector('#localAiConsent').checked,
  boundary: document.querySelector('.demo-boundary').textContent.replace(/\\s+/g, ' ').trim()
})`);
assert(defaultState.route === '#/workspace' && defaultState.captureVisible && defaultState.consentOff, 'Capture should be the default, consent should be off, and workspace should be open');
assert(/PRIVATE TEST/i.test(defaultState.boundary) && /synthetic data only/i.test(defaultState.boundary) && /no ePCR or production/i.test(defaultState.boundary), 'persistent private-test boundary should be visible');

const utilityState = await evaluate(`(() => {
  const menu = document.querySelector('#utilitiesMenu'); const summary = menu.querySelector('summary');
  summary.focus(); const focused = document.activeElement === summary; summary.click();
  const open = menu.open && menu.querySelectorAll('[data-route]').length === 4 && !menu.querySelector('[role="menu"], [role="menuitem"]');
  menu.querySelector('[data-route="trust"]').click();
  return { focused, open, path: location.hash, closed: !menu.open };
})()`);
assert(utilityState.focused && utilityState.open && utilityState.path === '#/trust' && utilityState.closed, `Utilities disclosure should be keyboard reachable and close after selection: ${JSON.stringify(utilityState)}`);
await evaluate(`location.hash = '#/workspace'`);
await wait(200);

await setViewport(375, 812, true);
const utilityOpenState = await evaluate(`(() => { const menu = document.querySelector('#utilitiesMenu'); menu.open = true; return { open: menu.open, summary: menu.querySelector('summary').textContent.replace(/\s+/g, ' ').trim(), links: [...menu.querySelectorAll('[data-route]')].map(link => link.textContent.replace(/\s+/g, ' ').trim()) }; })()`);
const utilityOpenAudit = await viewportAudit();
assert(utilityOpenState.open && utilityOpenState.links.length === 4 && !utilityOpenAudit.overflow && !utilityOpenAudit.primaryNavOffscreen.length && !utilityOpenAudit.pageNavOverflow && !utilityOpenAudit.clipped.length && !utilityOpenAudit.touchViolations.length && !utilityOpenAudit.gaps.length, `375 Utilities-open audit failed: ${JSON.stringify(utilityOpenAudit)}`);
const utilityOpenScreenshot = await screenshot('final-375-utilities-open');
await evaluate(`document.querySelector('#utilitiesMenu').open = false; window.scrollTo(0, 0);`);
await setViewport(1440, 1000, false);

const manualCapture = await evaluate(`(() => {
  sessionStorage.removeItem('fieldnote-draft-v1');
  const notes = 'Synthetic crew arrived on scene. Patient stated chest discomfort. Denies shortness of breath. Aspirin was administered and pain improved.';
  rawNotes.value = notes; rawNotes.dispatchEvent(new Event('input')); analyzeButton.click();
  return { raw: rawNotes.value, wordCount: wordCount.textContent };
})()`);
assert(manualCapture.raw.includes('Synthetic crew') && /words/.test(manualCapture.wordCount), 'manual Capture entry should update the authoritative raw note and word count');
assert(await waitForExpression(`document.querySelectorAll('[data-proposal-action="accept"]').length > 0`), 'organize should render a clinician review proposal');
const proposalState = await evaluate(`(() => {
  const before = rawNotes.value; const count = document.querySelectorAll('[data-proposal-action="accept"]').length;
  document.querySelector('[data-proposal-action="accept"]')?.click();
  return { rawUnchanged: rawNotes.value === before, count, accepted: document.querySelector('.proposal-state')?.textContent || '' };
})()`);
assert(proposalState.rawUnchanged && proposalState.count > 0, 'accepting organization must not overwrite raw notes');

const guidedState = await evaluate(`(() => {
  document.querySelector('[data-mode="guided"]').click(); guidedAnswer.value = 'Synthetic unit M-12 arrived non-emergent at a training residence.'; nextButton.click();
  return { visible: !guidedMode.classList.contains('hidden'), step: stepNum.textContent, introduction: narrativeValues.introduction };
})()`);
assert(guidedState.visible && guidedState.step === '2' && guidedState.introduction.includes('Synthetic unit'), 'Guided should accept a provider answer and advance');

const grammarBeforeAccept = await evaluate(`(() => {
  setNarrative('introduction', 'patient   was alert', { origin: 'user' }); updateProgress(); document.querySelector('[data-mode="grammar"]').click(); grammarRewriteButton.click();
  const item = document.querySelector('[data-grammar-section="introduction"]');
  return { original: narrativeValues.introduction, compared: item?.querySelector('textarea[readonly]')?.value || '', rewrite: item?.querySelector('[data-grammar-rewrite]')?.value || '', proposal: !grammarProposal.hidden };
})()`);
assert(grammarBeforeAccept.original === 'patient   was alert' && grammarBeforeAccept.compared === 'patient   was alert' && grammarBeforeAccept.rewrite === 'Patient was alert.' && grammarBeforeAccept.proposal, 'Grammar should preserve the original until acceptance');
const grammarAfterAccept = await evaluate(`(() => {
  const item = document.querySelector('[data-grammar-section="introduction"]'); item.querySelector('[data-grammar-rewrite]').value = 'Patient was alert and speaking clearly.'; item.querySelector('[data-grammar-action="accept"]').click(); grammarAcceptOrdered.click();
  return { narrative: narrativeValues.introduction, state: item.querySelector('.grammar-state')?.textContent || '', order: document.querySelector('#grammarOrderState')?.textContent || '' };
})()`);
assert(grammarAfterAccept.narrative === 'Patient was alert and speaking clearly.' && grammarAfterAccept.state === 'Accepted' && grammarAfterAccept.order === 'Accepted', 'Grammar acceptance should require and apply explicit review');

await evaluate(`location.hash = '#/review'`);
await wait(250);
const reviewBefore = await evaluate(`({ path: location.hash, exportDisabled: document.querySelector('#reviewCopy').disabled, attestations: document.querySelectorAll('[data-review-check]').length })`);
assert(reviewBefore.path === '#/review' && reviewBefore.exportDisabled && reviewBefore.attestations === 4, 'Review export must remain gated by four attestations');
await evaluate(`[...document.querySelectorAll('[data-review-check]')].forEach(check => { check.checked = true; check.dispatchEvent(new Event('change', { bubbles: true })); })`);
const reviewAfter = await evaluate(`({ exportEnabled: document.querySelector('#reviewCopy').disabled === false, exportReasonHidden: document.querySelector('#exportReason').hidden })`);
assert(reviewAfter.exportEnabled && reviewAfter.exportReasonHidden, 'Review exports should enable only after all attestations');

await evaluate(`location.hash = '#/scribe'`);
await wait(300);
await evaluate(`document.querySelector('#scribeLoadSample').click(); document.querySelector('#scribeReviewButton').click(); document.querySelector('#scribeLocalAiConsent').click();`);
const scribeGenerationReady = await evaluate(`({ enabled: document.querySelector('#scribeGenerateDigest')?.disabled === false, aiStatus: document.querySelector('#scribeAiStatus')?.textContent.trim() || '', transcriptStatus: document.querySelector('#scribeStatus')?.textContent.trim() || '' })`);
let scribeEvidence = { live: false, skipped: false };
if (scribeGenerationReady.enabled) {
  await evaluate(`document.querySelector('#scribeGenerateDigest').click()`);
  assert(await waitForExpression(`document.querySelector('#scribeDigestStatus')?.textContent.trim() === 'PROPOSAL READY'`, 120000), 'available local Ollama should produce a Scribe digest proposal');
  scribeEvidence = await evaluate(`(() => { document.querySelector('.scribe-source-ref')?.click(); document.querySelector('#scribeDigestReviewButton').click(); return { live: true, digest: document.querySelector('#scribeDigestStatus').textContent.trim(), sections: document.querySelectorAll('#scribeDigestSections .scribe-digest-section').length, refs: document.querySelectorAll('.scribe-source-ref').length, sourceOpen: Boolean(document.querySelector('.scribe-segment.source-highlight')) }; })()`);
  assert(scribeEvidence.sections > 0 && scribeEvidence.refs > 0 && scribeEvidence.sourceOpen, 'Scribe digest should expose source-linked blocks');
  const invalidation = await evaluate(`(() => { const first = document.querySelector('[data-scribe-segment="s1"] [data-scribe-field="text"]'); first.value += ' [edited synthetic source]'; first.dispatchEvent(new Event('input', { bubbles: true })); return { digest: document.querySelector('#scribeDigestStatus').textContent.trim(), review: document.querySelector('#scribeDigestReviewStatus').textContent.trim(), exportDisabled: document.querySelector('#scribeDigestCopy').disabled, transcript: document.querySelector('#scribeStatus').textContent.trim() }; })()`);
  assert(invalidation.digest === 'NOT GENERATED' && invalidation.review === 'Needs review' && invalidation.exportDisabled && invalidation.transcript === 'Draft', `Scribe edits must invalidate the digest: ${JSON.stringify(invalidation)}`);
} else {
  scribeEvidence.skipped = true;
}

mockUnavailableStatus = true;
await send('Fetch.enable', { patterns: [{ urlPattern: '*://*/api/status', requestStage: 'Request' }] });
await evaluate(`checkLocalAi()`);
assert(await waitForExpression(`document.querySelector('#aiStatus')?.textContent.includes('Rules fallback')`), 'unavailable-model branch should show a persistent rules fallback status');
const degraded = await evaluate(`({ captureStatus: document.querySelector('#aiStatus').textContent.trim(), scribeStatus: document.querySelector('#scribeAiStatus').textContent.trim(), digestDisabled: document.querySelector('#scribeGenerateDigest').disabled })`);
assert(degraded.digestDisabled && /unavailable|disabled/i.test(degraded.scribeStatus), `unavailable model state should remain visible and disable Scribe generation: ${JSON.stringify(degraded)}`);
await evaluate(`location.hash = '#/workspace'; setMode('capture'); setTheme('day'); window.scrollTo(0, 0);`);
await wait(200);
await evaluate(`document.querySelector('#toast')?.classList.remove('show');`);
const degradedScreenshot = await screenshot('final-degraded-1440');
mockUnavailableStatus = false;
await send('Fetch.disable');
await evaluate(`checkLocalAi()`);
assert(await waitForExpression(`document.querySelector('#aiStatus')?.textContent.includes('Ollama') && !document.querySelector('#aiStatus')?.textContent.includes('Rules fallback')`), 'live status should be restored after the unavailable-model screenshot');
const restored = await evaluate(`({ captureStatus: document.querySelector('#aiStatus').textContent.trim(), captureState: document.querySelector('#aiStatus').dataset.state, scribeStatus: document.querySelector('#scribeAiStatus').textContent.trim(), scribeState: document.querySelector('#scribeAiStatus').dataset.state })`);
assert(restored.captureState === 'live' && /Ollama/i.test(restored.captureStatus) && /Ollama/i.test(restored.scribeStatus), `live status restoration failed: ${JSON.stringify(restored)}`);

await evaluate(`location.hash = '#/workspace'; setMode('capture'); setTheme('day'); window.scrollTo(0, 0); document.querySelector('#toast')?.classList.remove('show');`);
await wait(250);
const screenshots = [];
await setViewport(1440, 1000, false);
screenshots.push(await screenshot('final-1440-day'));
await evaluate(`themeButton.click()`);
screenshots.push(await screenshot('final-1440-night'));
await evaluate(`themeButton.click()`);
for (const viewport of [
  { name: '1024', width: 1024, height: 900, mobile: false },
  { name: '768', width: 768, height: 900, mobile: false },
  { name: '375-day', width: 375, height: 812, mobile: true },
  { name: 'landscape', width: 844, height: 500, mobile: true }
]) {
  await setViewport(viewport.width, viewport.height, viewport.mobile);
  await evaluate(`document.querySelector('#toast')?.classList.remove('show');`);
  screenshots.push(await screenshot(`final-${viewport.name}`));
  const audit = await viewportAudit();
  assert(!audit.overflow && !audit.unnamed.length && !audit.touchViolations.length && !audit.clipped.length && !audit.gaps.length && !audit.primaryNavOffscreen.length && !audit.pageNavOverflow, `${viewport.name} layout/accessibility audit failed: ${JSON.stringify(audit)}`);
  if (viewport.name === 'landscape') {
    const landscapeUsability = await evaluate(`(() => { const raw = document.querySelector('#rawNotes').getBoundingClientRect(); const tabs = document.querySelector('.mobile-tabs').getBoundingClientRect(); return { rawTop: Math.round(raw.top), bottomNavHeight: Math.round(tabs.height), bottomNavTop: Math.round(tabs.top), viewportHeight: innerHeight }; })()`);
    assert(landscapeUsability.rawTop < landscapeUsability.viewportHeight - landscapeUsability.bottomNavHeight, `landscape raw editor must begin above the fixed mode bar: ${JSON.stringify(landscapeUsability)}`);
    globalThis.landscapeUsability = landscapeUsability;
  }
}
await setViewport(375, 812, true);
await evaluate(`themeButton.click()`);
await evaluate(`document.querySelector('#toast')?.classList.remove('show');`);
screenshots.push(await screenshot('final-375-night'));
const nightAudit = await viewportAudit();
assert(!nightAudit.overflow && !nightAudit.touchViolations.length && !nightAudit.clipped.length && !nightAudit.primaryNavOffscreen.length && !nightAudit.pageNavOverflow, `375 night layout audit failed: ${JSON.stringify(nightAudit)}`);

await evaluate(`location.hash = '#/scribe'`);
await wait(250);
const scribeAccessibility = await evaluate(`(() => {
  const page = document.querySelector('[data-page="scribe"]');
  const visible = element => { if (!element || element.hidden) return false; const style = getComputedStyle(element); const rect = element.getBoundingClientRect(); return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0; };
  const name = element => (element.getAttribute('aria-label') || element.getAttribute('title') || element.labels?.[0]?.textContent || element.textContent || element.getAttribute('placeholder') || '').replace(/\\s+/g, ' ').trim();
  const controls = [...page.querySelectorAll('button, a, input, textarea, select, summary, [contenteditable="true"]')].filter(visible);
  const requiredIds = ['scribeSessionLabel', 'scribeLocalAiConsent', 'scribeReviewButton', 'scribeLoadSample', 'scribeAddSegment', 'scribeGenerateDigest', 'scribeDigestReviewButton', 'scribeDigestCopy', 'scribeDigestDownload', 'scribeCopy', 'scribeDownload', 'clearScribeButton'];
  const focusTarget = document.querySelector('#scribeAddSegment'); focusTarget.focus();
  return { unnamed: controls.filter(element => !name(element)).map(element => element.id || element.className || element.tagName), requiredNames: requiredIds.filter(id => !name(document.getElementById(id))), focusRetained: document.activeElement === focusTarget, transcriptLiveRegion: page.querySelector('#scribeSegmentList')?.getAttribute('aria-live') || '', privacyAlertRole: page.querySelector('#scribePrivacyAlert')?.getAttribute('role') || '' };
})()`);
assert(!scribeAccessibility.unnamed.length && !scribeAccessibility.requiredNames.length && scribeAccessibility.focusRetained && scribeAccessibility.transcriptLiveRegion === 'polite' && scribeAccessibility.privacyAlertRole === 'alert', `Scribe accessibility contract failed: ${JSON.stringify(scribeAccessibility)}`);

assert(!consoleErrors.length && !networkFailures.length, `browser emitted console/network failures: ${JSON.stringify({ consoleErrors, networkFailures })}`);
socket.close();
console.log(JSON.stringify({
  result: 'PASS',
  defaultState,
  utilityState,
  manualCapture,
  proposalState,
  guidedState,
  grammarBeforeAccept,
  grammarAfterAccept,
  reviewBefore,
  reviewAfter,
  scribeGenerationReady,
  scribeEvidence,
  degraded,
  degradedScreenshot,
  restored,
  utilityOpenScreenshot,
  screenshots,
  landscapeUsability: globalThis.landscapeUsability,
  scribeAccessibility,
  consoleErrors,
  networkFailures
}, null, 2));
