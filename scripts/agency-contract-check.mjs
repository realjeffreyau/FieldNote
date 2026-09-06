import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const auditPath = join(root, 'docs', 'agency-audit-event-contract.json');
const deploymentPath = join(root, 'docs', 'agency-deployment-contract.json');
const profilesPath = join(root, 'docs', 'agency-deployment-profiles.json');

function fail(message) {
  throw new Error(`FAIL: ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function load(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${path} is not valid JSON (${error.message})`);
  }
}

function assertKeys(value, expected, label) {
  const actual = Object.keys(value || {}).sort();
  const missing = expected.filter(key => !actual.includes(key));
  if (missing.length) fail(`${label} is missing ${missing.join(', ')}`);
}

function validateAuditContract(contract) {
  assert(contract.$id === 'fieldnote.agency-audit-event.v1', 'audit contract id must be stable');
  assert(contract.type === 'object' && contract.additionalProperties === false, 'audit events must be closed objects');
  const required = ['schemaVersion', 'eventId', 'occurredAt', 'requestId', 'tenantId', 'actorId', 'actorType', 'action', 'resourceType', 'resourceId', 'outcome', 'contentPolicy'];
  assertKeys(contract.properties, required, 'audit properties');
  required.forEach(key => assert(contract.required.includes(key), `audit required list must include ${key}`));
  const forbidden = /^(?:text|notes|narrative|prompt|source|patient|name|email|dob|medical|identifier|content|message|stack|changes|details)$/i;
  const unsafeProperties = Object.keys(contract.properties).filter(key => forbidden.test(key));
  assert(unsafeProperties.length === 0, `audit contract exposes content-like properties: ${unsafeProperties.join(', ')}`);
  const policy = contract.properties.contentPolicy;
  assert(policy.type === 'object' && policy.additionalProperties === false, 'audit contentPolicy must be closed');
  const policyKeys = ['narrativeContent', 'sourceText', 'promptContent', 'identifierContent'];
  assertKeys(policy.properties, policyKeys, 'audit contentPolicy');
  policyKeys.forEach(key => assert(policy.properties[key].const === false, `audit ${key} must be permanently false`));
  assert(contract.properties.eventId.pattern.includes('4'), 'audit event IDs must use opaque UUID-shaped identifiers');
  assert(contract.properties.requestId.pattern.includes('4'), 'audit request IDs must use opaque UUID-shaped identifiers');
}

function validateDeploymentContract(contract) {
  assert(contract.$id === 'fieldnote.agency-deployment.v1', 'deployment contract id must be stable');
  assert(contract.type === 'object' && contract.additionalProperties === false, 'deployment contract must be a closed object');
  assert(contract.properties?.version?.const === 'fieldnote.agency-deployment.v1', 'deployment version must be fixed');
  const environments = contract.properties?.environments?.properties || {};
  assertKeys(environments, ['public_demo', 'technical_pilot', 'phi_pilot'], 'deployment environments');
  for (const [name, schema] of Object.entries(environments)) {
    assert(schema.$ref === '#/$defs/environment', `${name} must use the shared environment definition`);
  }
  assert(contract.$defs?.environment?.additionalProperties === false, 'environment schema must be closed');
  assert(!JSON.stringify(contract).includes('http://'), 'deployment contract must not use insecure HTTP references');
}

function validateProfiles(contract, profiles) {
  assert(profiles.$schema === contract.$id, 'profile manifest must point to the deployment contract');
  assert(profiles.version === contract.$id, 'profile manifest version must match the deployment contract');
  const environments = profiles.environments || {};
  assertKeys(environments, ['public_demo', 'technical_pilot', 'phi_pilot'], 'profile manifest');

  const publicDemo = environments.public_demo;
  assert(publicDemo.dataClass === 'synthetic_or_deidentified', 'public demo must remain synthetic/de-identified');
  assert(publicDemo.network.bindHost === '127.0.0.1', 'public demo must bind to loopback');
  assert(publicDemo.network.tlsRequired === false, 'public demo must remain local-only rather than pretending to be a TLS deployment');
  assert(publicDemo.network.remoteClientAllowed === false && publicDemo.network.remoteModelAllowed === false, 'public demo must reject remote clients and models');
  assert(publicDemo.identity.accountsRequired === false && publicDemo.tenantIsolationRequired === false, 'public demo must not imply agency identity or tenancy');
  assert(publicDemo.storage.persistenceAllowed === false, 'public demo must not persist agency records');
  assert(publicDemo.provider.mode === 'loopback_local' && publicDemo.provider.agreementRequired === false, 'public demo provider must stay loopback-only');

  for (const name of ['technical_pilot', 'phi_pilot']) {
    const environment = environments[name];
    assert(environment.network.tlsRequired === true, `${name} requires managed TLS`);
    assert(environment.network.remoteClientAllowed === true, `${name} requires an authenticated remote-client boundary`);
    assert(environment.identity.accountsRequired === true && environment.identity.mfaRequired === true && environment.identity.rbacRequired === true && environment.identity.sessionControlsRequired === true, `${name} requires named identity, MFA, RBAC, and session controls`);
    assert(environment.tenantIsolationRequired === true, `${name} requires tenant isolation`);
    assert(environment.storage.persistenceAllowed === true && environment.storage.encryptionAtRestRequired === true && environment.storage.retentionPolicyRequired === true && environment.storage.legalHoldRequired === true && environment.storage.backupRequired === true, `${name} requires governed encrypted persistence and recovery`);
    assert(environment.audit.serverSideRequired === true && environment.audit.immutableRequired === true && environment.audit.contentFreeRequired === true, `${name} requires immutable content-free server audit events`);
    assert(environment.provider.mode === 'agency_approved' && environment.provider.agreementRequired === true && environment.provider.trainingOptOutRequired === true, `${name} requires an approved provider agreement and training opt-out`);
  }

  for (const [name, environment] of Object.entries(environments)) {
    assert(environment.telemetryContentAllowed === false, `${name} must prohibit content-bearing telemetry`);
    assert(environment.review.humanReviewRequired === true && environment.review.autoSignAllowed === false && environment.review.autoSubmitAllowed === false, `${name} must require human review and prohibit autonomous submission`);
    assert(environment.export.writeBackAllowed === false, `${name} must prohibit silent ePCR write-back`);
  }
}

try {
  const audit = load(auditPath);
  const deployment = load(deploymentPath);
  const profiles = load(profilesPath);
  validateAuditContract(audit);
  validateDeploymentContract(deployment);
  validateProfiles(deployment, profiles);
  console.log('Agency contract checks passed: content-free audit events, separated deployment profiles, loopback public demo, and agency safety invariants.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
