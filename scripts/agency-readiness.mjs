import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const strict = process.argv.includes('--strict');
const jsonOutput = process.argv.includes('--json');
const registerPath = join(root, 'docs', 'agency-controls.json');
const requiredFiles = [
  'docs/AGENCY_READINESS.md',
  'docs/AGENCY_PILOT_FRAMEWORK.md',
  'docs/AGENCY_PILOT_ACCEPTANCE.md',
  'docs/ai-organize-contract.json',
  'docs/ai-compose-document-contract.json',
  'docs/agency-audit-event-contract.json',
  'docs/agency-deployment-contract.json',
  'docs/agency-deployment-profiles.json',
  'docs/RELEASE_SCOPE.md',
  'docs/PUBLIC_DEMO_RELEASE_CHECKLIST.md',
  'docs/agency-controls.json',
  'scripts/security-regression.mjs',
  'scripts/agency-contract-check.mjs',
  'scripts/cdp-smoke.mjs',
  'package.json',
  '.env.example'
];
const validStatuses = new Set(['not_started', 'in_progress', 'verified', 'blocked']);
const validPriorities = new Set(['required', 'important', 'optional']);

function fail(message) {
  throw new Error(message);
}

function loadRegister() {
  if (!existsSync(registerPath)) fail('missing docs/agency-controls.json');
  try {
    return JSON.parse(readFileSync(registerPath, 'utf8'));
  } catch {
    fail('docs/agency-controls.json is not valid JSON');
  }
}

function validateRegister(register) {
  if (!register || typeof register !== 'object' || Array.isArray(register)) fail('register must be an object');
  if (register.schemaVersion !== 1) fail('register schemaVersion must be 1');
  if (register.track !== 'agency-pilot') fail('register track must be agency-pilot');
  if (!Array.isArray(register.controls) || register.controls.length === 0) fail('register must contain controls');

  const ids = new Set();
  for (const control of register.controls) {
    if (!control || typeof control !== 'object') fail('every control must be an object');
    for (const field of ['id', 'domain', 'control', 'status', 'priority', 'owner', 'evidence', 'dependsOn', 'blocker']) {
      if (!(field in control)) fail(`${control.id || '<unknown>'} is missing ${field}`);
    }
    if (!/^[A-Z]{2,8}-[A-Z0-9]+-\d{3}$/.test(control.id)) fail(`invalid control id: ${control.id}`);
    if (ids.has(control.id)) fail(`duplicate control id: ${control.id}`);
    ids.add(control.id);
    if (!validStatuses.has(control.status)) fail(`${control.id} has invalid status: ${control.status}`);
    if (!validPriorities.has(control.priority)) fail(`${control.id} has invalid priority: ${control.priority}`);
    if (typeof control.owner !== 'string' || !control.owner.trim()) fail(`${control.id} needs an owner`);
    if (!Array.isArray(control.evidence) || control.evidence.length === 0) fail(`${control.id} needs evidence targets`);
    if (!Array.isArray(control.dependsOn)) fail(`${control.id} dependsOn must be an array`);
    if (typeof control.blocker !== 'boolean') fail(`${control.id} blocker must be boolean`);
  }

  for (const control of register.controls) {
    for (const dependency of control.dependsOn) {
      if (!ids.has(dependency)) fail(`${control.id} depends on unknown control ${dependency}`);
    }
  }
  return { ids };
}

function validatePublicDemoBoundary() {
  const missing = requiredFiles.filter(file => !existsSync(join(root, file)));
  if (missing.length) fail(`missing required framework file(s): ${missing.join(', ')}`);

  const env = readFileSync(join(root, '.env.example'), 'utf8');
  const server = readFileSync(join(root, 'server.mjs'), 'utf8');
  let packageManifest;
  try {
    packageManifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  } catch {
    fail('package.json is not valid JSON');
  }
  let contract;
  try {
    contract = JSON.parse(readFileSync(join(root, 'docs', 'ai-organize-contract.json'), 'utf8'));
  } catch {
    fail('docs/ai-organize-contract.json is not valid JSON');
  }
  if (contract.$id !== 'fieldnote.ai-organize.v1' || !contract.$defs?.success || !contract.$defs?.error) {
    fail('AI organize contract is missing its success/error definitions');
  }
  let composeContract;
  try {
    composeContract = JSON.parse(readFileSync(join(root, 'docs', 'ai-compose-document-contract.json'), 'utf8'));
  } catch {
    fail('docs/ai-compose-document-contract.json is not valid JSON');
  }
  if (composeContract.$id !== 'fieldnote.ai-compose-document.v1' || !composeContract.$defs?.success || !composeContract.$defs?.error) {
    fail('AI compose contract is missing its success/error definitions');
  }
  const requiredEnv = ['HOST=127.0.0.1', 'ALLOW_NETWORK=false', 'ALLOW_REMOTE_OLLAMA=false'];
  const missingEnv = requiredEnv.filter(value => !env.includes(value));
  if (missingEnv.length) fail(`public demo defaults changed: ${missingEnv.join(', ')}`);
  const requiredScripts = ['check', 'test:ai', 'test:security', 'test:browser', 'agency:contract', 'agency:readiness'];
  const missingScripts = requiredScripts.filter(name => typeof packageManifest.scripts?.[name] !== 'string');
  if (missingScripts.length) fail(`public demo verification script missing: ${missingScripts.join(', ')}`);
  const requiredServerGuards = ['allowNetwork', 'allowRemoteOllama', 'securityHeaders', 'model_source_mismatch', 'randomUUID', 'X-Request-Id', 'fieldnote.ai-organize.v1', 'fieldnote.ai-compose-document.v1', 'review_required', 'sourceRefsValid'];
  const missingGuards = requiredServerGuards.filter(value => !server.includes(value));
  if (missingGuards.length) fail(`server safety guard missing: ${missingGuards.join(', ')}`);
}

function summarize(register) {
  const counts = Object.fromEntries([...validStatuses].map(status => [status, 0]));
  const required = register.controls.filter(control => control.priority === 'required');
  const blockers = register.controls.filter(control => control.blocker && control.status !== 'verified');
  for (const control of register.controls) counts[control.status] += 1;
  return {
    total: register.controls.length,
    counts,
    requiredTotal: required.length,
    requiredVerified: required.filter(control => control.status === 'verified').length,
    blockers: blockers.map(control => ({ id: control.id, domain: control.domain, status: control.status, owner: control.owner }))
  };
}

try {
  const register = loadRegister();
  validateRegister(register);
  validatePublicDemoBoundary();
  const summary = summarize(register);
  const report = {
    register: 'valid',
    publicDemoBoundary: 'pass',
    agencyPilot: summary.blockers.length === 0 ? 'ready_for_go_no_go_review' : 'blocked',
    strict,
    ...summary
  };

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Agency preparation register: VALID (${report.total} controls)`);
    console.log(`Public-demo boundary checks: PASS`);
    console.log(`Status: ${Object.entries(summary.counts).map(([key, value]) => `${key}=${value}`).join(', ')}`);
    console.log(`Required controls verified: ${summary.requiredVerified}/${summary.requiredTotal}`);
    if (summary.blockers.length) {
      console.log(`Agency pilot verdict: BLOCKED (${summary.blockers.length} open blocker${summary.blockers.length === 1 ? '' : 's'})`);
      for (const blocker of summary.blockers) console.log(`- ${blocker.id} [${blocker.status}] ${blocker.domain} - owner: ${blocker.owner}`);
    } else {
      console.log('Agency pilot verdict: READY FOR FORMAL GO/NO-GO REVIEW');
    }
  }

  if (strict && summary.blockers.length) process.exitCode = 1;
} catch (error) {
  console.error(`Agency preparation register: FAIL - ${error.message}`);
  process.exitCode = 1;
}
