const rawNotes = document.querySelector('#rawNotes');
const analyzeButton = document.querySelector('#analyzeButton');
const modeButtons = document.querySelectorAll('.mode');
const captureMode = document.querySelector('#captureMode');
const guidedMode = document.querySelector('#guidedMode');
const grammarMode = document.querySelector('#grammarMode');
const scribeSegmentList = document.querySelector('#scribeSegmentList');
const scribeEmpty = document.querySelector('#scribeEmpty');
const scribeSessionLabel = document.querySelector('#scribeSessionLabel');
const scribeStatus = document.querySelector('#scribeStatus');
const scribeSegmentCount = document.querySelector('#scribeSegmentCount');
const scribeReviewButton = document.querySelector('#scribeReviewButton');
const scribeAiStatus = document.querySelector('#scribeAiStatus');
const scribeLocalAiConsent = document.querySelector('#scribeLocalAiConsent');
const scribeGenerateDigest = document.querySelector('#scribeGenerateDigest');
const scribeDigestStatus = document.querySelector('#scribeDigestStatus');
const scribeDigestOutline = document.querySelector('#scribeDigestOutline');
const scribeDigestProposal = document.querySelector('#scribeDigestProposal');
const scribeDigestSections = document.querySelector('#scribeDigestSections');
const scribeDigestQuestions = document.querySelector('#scribeDigestQuestions');
const scribeDigestQuestionList = document.querySelector('#scribeDigestQuestionList');
const scribeDigestReviewStatus = document.querySelector('#scribeDigestReviewStatus');
const scribeDigestReviewButton = document.querySelector('#scribeDigestReviewButton');
const scribeDigestCopy = document.querySelector('#scribeDigestCopy');
const scribeDigestDownload = document.querySelector('#scribeDigestDownload');
const scribePrivacyAlert = document.querySelector('#scribePrivacyAlert');
const progressBar = document.querySelector('#progressBar');
const progressText = document.querySelector('#progressText');
const wordCount = document.querySelector('#wordCount');
const toast = document.querySelector('#toast');
const questionsList = document.querySelector('#questionsList');
const missingCount = document.querySelector('#missingCount');
const mobileNeeds = document.querySelector('#mobileNeeds');
const mobileTabs = document.querySelectorAll('.mobile-tabs button');
const privacyAlert = document.querySelector('#privacyAlert');
const evidenceDialog = document.querySelector('#evidenceDialog');
const demoGate = document.querySelector('#demoGate');
const aiQuestionsList = document.querySelector('#aiQuestionsList');
const localAiConsent = document.querySelector('#localAiConsent');
const themeButton = document.querySelector('#themeButton');
const themeIcon = document.querySelector('#themeIcon');
const utilityMenu = document.querySelector('#utilitiesMenu');
const sectionOrder = ['introduction', 'complaint', 'history', 'exam', 'assessment', 'treatment', 'evaluation', 'disposition'];
const sectionNames = { introduction: 'Introduction', complaint: 'Chief complaint', history: 'History', exam: 'Exam', assessment: 'Assessment', treatment: 'Treatment', evaluation: 'Evaluation', disposition: 'Disposition' };
const maxNotesCharacters = 24000;
const evidenceSources = Object.fromEntries(sectionOrder.map(key => [key, '']));
const auditEvents = [];
const auditVocabulary = ['demo.acknowledged', 'notes.organized', 'organize.proposed', 'organize.accepted', 'grammar.proposed', 'grammar.accepted', 'grammar.discarded', 'grammar.ordered.accepted', 'grammar.ordered.discarded', 'scribe.segment.added', 'scribe.segment.edited', 'scribe.segment.removed', 'scribe.reviewed', 'scribe.digest.generated', 'scribe.digest.reviewed', 'scribe.source.viewed', 'scribe.exported', 'scribe.cleared', 'section.edited', 'section.cleared', 'evidence.viewed', 'narrative.copied', 'guided.answered', 'review.opened', 'review.attested', 'export.generated', 'page.viewed', 'identifier.flagged', 'vitals.recorded', 'times.recorded', 'medication.recorded', 'procedure.recorded', 'calltype.changed', 'refusal.documented', 'abbreviation.flagged', 'draft.restored'];
const routes = { workspace: 'Narrative Writer', scribe: 'Clinical Scribe', cases: 'Work queue', review: 'Review', audit: 'Audit', trust: 'Trust', admin: 'Admin' };
const defaultText = {
  introduction: 'Add unit, crew, response, dispatch, and arrival.', complaint: 'Add the chief complaint and presentation.',
  history: 'Add history, medications, allergies, and pertinent negatives.', exam: 'Add exam findings and vital trends.',
  assessment: 'Add clinical impression and medical necessity.', treatment: 'Add interventions performed.',
  evaluation: 'Add response, reassessment, repeat vitals, and en route condition.', disposition: 'Add destination, priority, transfer of care, and final status.'
};
const narrativeValues = Object.fromEntries(Object.keys(defaultText).map(key => [key, '']));
const committedNarrativeValues = { ...narrativeValues };
const followUpQuestions = {
  introduction: 'What were the unit, crew, response mode, dispatch information, and arrival details?', complaint: 'What did the patient or caller say was wrong?',
  history: 'What history or pertinent negatives did you learn?', exam: 'What did you see and measure?',
  assessment: 'What was your clinical impression?', treatment: 'What interventions did you perform?',
  evaluation: 'How did the patient respond to each intervention, what did repeat vitals and reassessment show, and what was their condition en route?', disposition: 'What were the transport destination and priority, and how was care transferred?'
};
const sample = 'Dispatched emergent for a 67 year old male with chest pain at a private residence. Arrived to find patient seated upright on couch, alert and speaking full sentences. Patient stated, "It feels like an elephant on my chest," with pressure beginning approximately 45 minutes prior while he was watching television. Denies shortness of breath, nausea, vomiting, or recent illness. Patient reports history of hypertension and high cholesterol. Allergic to penicillin. Skin warm and dry. Initial 12-lead obtained and transmitted. Aspirin 324 mg PO administered; patient reported pain improved from 7/10 to 4/10. Transported non-emergent to Memorial Hospital, condition unchanged. Care transferred to ED RN with verbal report.';
const scribeSampleSegments = [
  { timestamp: '00:00', speaker: 'Clinician', text: 'Good morning. I am going to ask a few questions about what brought you to the emergency department.' },
  { timestamp: '00:08', speaker: 'Patient', text: 'I started feeling dizzy after breakfast, and it has happened twice today.' },
  { timestamp: '00:18', speaker: 'Clinician', text: 'Did you lose consciousness, have chest discomfort, or have trouble breathing?' },
  { timestamp: '00:24', speaker: 'Patient', text: 'No loss of consciousness. I felt my heart racing for a few minutes, but I can breathe normally now.' }
];

function setTheme(theme, persist = false) {
  const night = theme === 'night';
  document.body.toggleAttribute('data-theme', night);
  if (night) document.body.dataset.theme = 'night';
  themeButton.setAttribute('aria-pressed', String(night));
  themeButton.setAttribute('aria-label', night ? 'Use day mode' : 'Use night mode');
  themeButton.title = night ? 'Use day mode' : 'Use night mode';
  themeIcon.setAttribute('href', night ? '#ic-sun' : '#ic-moon');
  if (persist) {
    try { localStorage.setItem('fieldnote.theme', night ? 'night' : 'day'); } catch { /* preference storage is optional */ }
  }
}

let initialTheme = '';
try { initialTheme = localStorage.getItem('fieldnote.theme') || ''; } catch { initialTheme = ''; }
if (!initialTheme) initialTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
setTheme(initialTheme);

function showToast(message) { toast.textContent = message; toast.classList.add('show'); window.setTimeout(() => toast.classList.remove('show'), 2600); }
function openDialog(dialog) { if (!dialog.open) dialog.showModal(); }
function closeDialog(dialog) { if (dialog.open) dialog.close(); }
function formatTime(ts) { return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(ts); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }

function logEvent(event, detail) {
  auditEvents.push({ ts: new Date(), actor: 'JA · Field provider', event, detail });
  renderAudit();
}

function renderAudit() {
  const filter = document.querySelector('#auditFilter');
  const selected = filter.value;
  const rows = auditEvents.filter(item => !selected || item.event === selected);
  document.querySelector('#auditCount').textContent = `${auditEvents.length} event${auditEvents.length === 1 ? '' : 's'}`;
  document.querySelector('#auditTableBody').innerHTML = rows.length
    ? rows.map(item => `<tr><td class="mono">${formatTime(item.ts)}</td><td>${escapeHtml(item.actor)}</td><td><span class="chip chip-status">${escapeHtml(item.event)}</span></td><td>${escapeHtml(item.detail)}</td></tr>`).join('')
    : `<tr><td colspan="4" class="audit-empty">${auditEvents.length ? 'No events match this filter.' : 'No activity has been recorded in this browser session yet.'}</td></tr>`;
}

function narrativePlainText() {
  const narrative = formatIcheatedNarrative(sectionOrder.map(key => ({ key, original: narrativeValues[key] })).filter(section => section.original.trim()), 'original');
  const clinical = clinicalDetailPlainText();
  return clinical ? `${narrative}\n\n${clinical}` : narrative;
}

function showEvidence(key) {
  const section = document.querySelector(`[data-narrative="${key}"]`);
  document.querySelector('#evidenceSectionName').textContent = section.querySelector('.narrative-label').textContent.trim();
  document.querySelector('#evidenceQuote').textContent = evidenceSources[key] || 'No source excerpt is available for this manually entered section.';
  logEvent('evidence.viewed', `Viewed source evidence for ${section.querySelector('.narrative-label').textContent.trim()}.`);
  openDialog(evidenceDialog);
}

function renderReview() {
  const sections = [...document.querySelectorAll('.narrative-section')];
  const withContent = sections.filter(section => sectionState(section.dataset.narrative) !== 'needed').length;
  const open = sections.filter(section => sectionState(section.dataset.narrative) !== 'covered').length;
  document.querySelector('#reviewProgress').textContent = `Sections with content — ${withContent} of 8`;
  document.querySelector('#reviewMissing').textContent = `${open} open section${open === 1 ? '' : 's'}`;
  document.querySelector('#reviewRawNotes').textContent = rawNotes.value.trim() || 'No raw notes have been entered.';
  const reviewSections = document.querySelector('#reviewSections');
  reviewSections.replaceChildren(...sections.map(section => {
    const key = section.dataset.narrative;
    const row = document.createElement('article');
    row.className = 'review-section';
    const heading = document.createElement('div');
    const label = document.createElement('h3');
    label.textContent = section.querySelector('.narrative-label').textContent.trim();
    const status = document.createElement('span');
    const state = sectionState(key);
    status.className = `chip chip-status ${state === 'covered' ? '' : state === 'started' ? 'started' : 'needs-detail'}`;
    status.textContent = state === 'covered' ? 'Covered' : state === 'started' ? 'Started' : 'Needs detail';
    heading.append(label, status);
    const text = document.createElement('p');
    text.textContent = state === 'needed' ? followUpQuestions[key] : narrativeValues[key];
    if (state !== 'covered') text.className = 'open-question';
    const source = document.createElement('button');
    source.type = 'button'; source.className = 'source-link'; source.dataset.reviewSource = key; source.textContent = 'View source';
    row.append(heading, text, source);
    return row;
  }));
  renderReviewClinical();
  updateReviewExports();
}

function updateReviewExports() {
  const ready = [...document.querySelectorAll('[data-review-check]')].every(check => check.checked);
  ['#reviewCopy', '#reviewDownload', '#reviewPrint'].forEach(selector => { document.querySelector(selector).disabled = !ready; });
  document.querySelector('#exportReason').hidden = ready;
}

function sectionState(key) {
  const length = narrativeValues[key].trim().length;
  return length === 0 ? 'needed' : length < 15 ? 'started' : 'covered';
}

function setNarrative(key, value, { origin, source = '' } = {}) {
  if (!sectionOrder.includes(key) || (origin !== 'user' && origin !== 'accepted')) return false;
  const el = document.querySelector(`#${key}Text`);
  const section = document.querySelector(`[data-narrative="${key}"]`);
  const normalized = String(value || '').trim();
  el.textContent = normalized || defaultText[key];
  section.dataset.placeholder = String(!normalized);
  narrativeValues[key] = normalized;
  committedNarrativeValues[key] = normalized;
  if (normalized && source) evidenceSources[key] = source;
  else if (origin === 'user' || !normalized) evidenceSources[key] = '';
  section.querySelector('.source-link')?.remove();
  if (evidenceSources[key] && !section.querySelector('.source-link')) {
    el.insertAdjacentHTML('afterend', '<button class="source-link" type="button"><svg class="ic" aria-hidden="true"><use href="#ic-source"></use></svg><span>View source</span></button>');
  }
  return true;
}

function updateProgress() {
  const withContent = sectionOrder.filter(key => sectionState(key) !== 'needed').length;
  const open = sectionOrder.filter(key => sectionState(key) !== 'covered').length;
  progressBar.dataset.count = withContent; progressText.textContent = `Sections with content — ${withContent} of 8`;
  missingCount.textContent = `${open} open section${open === 1 ? '' : 's'}`; mobileNeeds.textContent = open;
  document.querySelector('#reviewBadge').textContent = open;
  document.querySelectorAll('.section').forEach(btn => {
    const state = sectionState(btn.dataset.section);
    btn.classList.toggle('covered', state === 'covered'); btn.classList.toggle('started', state === 'started');
    btn.querySelector('em').dataset.status = state; btn.querySelector('em').textContent = state === 'covered' ? 'Covered' : state === 'started' ? 'Started' : 'Needs detail';
  });
  document.querySelectorAll('.narrative-section').forEach(section => {
    const state = sectionState(section.dataset.narrative); const node = section.querySelector('.spine-node');
    const name = section.querySelector('.narrative-label').textContent.trim().toLowerCase().replace(/\b\w/g, char => char.toUpperCase()).replace(/\s+/g, ' ');
    section.classList.toggle('filled', state !== 'needed'); section.classList.toggle('covered', state === 'covered'); section.classList.toggle('started', state === 'started');
    node.classList.toggle('covered', state === 'covered'); node.classList.toggle('started', state === 'started');
    node.setAttribute('aria-label', `${name} - ${state === 'needed' ? 'needs detail' : state}`); section.dataset.status = state;
  });
  const pending = sectionOrder.filter(key => sectionState(key) !== 'covered');
  questionsList.innerHTML = pending.length ? pending.map(key => `<button class="question-link" data-question="${key}" data-status="${sectionState(key)}"><b>${sectionNames[key]} · ${sectionState(key) === 'started' ? 'Started' : 'Needs detail'}</b><span>${followUpQuestions[key]}</span></button>`).join('') : '<p class="questions-complete">All eight sections have detail. Review before export.</p>';
}

function containsPossibleIdentifier(text) {
  const patterns = [/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/, /\b\d{3}-\d{2}-\d{4}\b/, /\b(?:mrn|medical record|incident number|case number)\s*[:#]?\s*[a-z0-9-]{4,}\b/i, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, /\b(?:dob|date of birth)\s*[:#]?\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/i];
  return patterns.some(pattern => pattern.test(text));
}
let identifierVisible = false;
function checkIdentifier(text, source) {
  const flagged = containsPossibleIdentifier(text);
  if (flagged && !identifierVisible) logEvent('identifier.flagged', `Possible identifier detected in ${source}.`);
  identifierVisible = flagged;
  return flagged;
}

const organizeKeywords = {
  introduction: { 'unit ': 2, crew: 2, dispatched: 2, dispatch: 1, called: 1, 'response mode': 2, arrived: 1, arrival: 1, scene: 1 },
  complaint: { 'chief complaint': 3, complaint: 2, stated: 1, 'reports pain': 2, 'reported pain': 2, 'chest pain': 1, 'abdominal pain': 1, 'feels like': 1 },
  history: { history: 3, allerg: 3, medication: 3, 'home med': 3, 'takes ': 2, denies: 2, denied: 2, prior: 2, illness: 1 },
  exam: { alert: 2, skin: 2, vital: 3, exam: 2, 'blood pressure': 3, pulse: 2, respir: 2, '12-lead': 2, speaking: 1 },
  assessment: { impression: 3, 'consistent with': 3, 'concern for': 3, assessment: 2, 'medical necessity': 3 },
  treatment: { administered: 3, treated: 2, 'iv ': 2, aspirin: 2, oxygen: 2, intervention: 2, procedure: 2 },
  evaluation: { 'response to': 3, responded: 3, improved: 2, 'repeat vital': 3, reassess: 3, 'en route': 2, 'condition changed': 3, 'condition unchanged': 3 },
  disposition: { transported: 2, destination: 3, hospital: 2, priority: 3, 'non-emergent': 2, 'emergent transport': 2, transferred: 3, 'care transferred': 3, turnover: 3, 'receiving rn': 3, 'ed rn': 3 }
};
let currentProposal = null;
let grammarProposal = null;
let scribeSegments = [];
let scribeSeq = 0;
let scribeReviewed = false;
let scribeDigest = null;
let scribeDigestReviewed = false;
let scribeDigestGenerating = false;
let scribeIdentifierVisible = false;
let liveAiAvailable = false;
let liveAiModel = '';

function setAiStatus(state, message) {
  const status = document.querySelector('#aiStatus');
  status.dataset.state = state;
  status.textContent = message;
  status.title = state === 'live'
    ? `Ollama is connected with ${liveAiModel}. Notes are ${localAiConsent.checked ? 'sent to' : 'not sent to'} this server and its configured provider when you organize.`
    : state === 'guarded'
      ? 'The model response failed source validation. The deterministic browser organizer was used instead.'
      : 'The browser-side rules organizer is active. No notes are sent to a model.';
}

function updateScribeAiState() {
  if (!scribeAiStatus || !scribeLocalAiConsent) return;
  scribeLocalAiConsent.disabled = !liveAiAvailable;
  if (liveAiAvailable) {
    scribeAiStatus.textContent = `Ollama - ${liveAiModel}`;
    scribeAiStatus.dataset.state = scribeLocalAiConsent.checked ? 'enabled' : 'off';
    scribeAiStatus.title = scribeLocalAiConsent.checked ? 'The reviewed transcript may be sent to the loopback Ollama provider when you generate a digest.' : 'Local AI is available but off. Enable the checkbox before generating a digest.';
  } else {
    scribeAiStatus.textContent = 'Local Ollama unavailable - digest disabled';
    scribeAiStatus.dataset.state = 'unavailable';
    scribeAiStatus.title = 'Start the local Ollama service and refresh the demo to enable Scribe digest generation.';
  }
}

async function checkLocalAi() {
  try {
    const response = await fetch('/api/status', { cache: 'no-store' });
    const status = await response.json();
    liveAiAvailable = Boolean(status.available && status.hasModel);
    liveAiModel = status.model || '';
    if (liveAiAvailable) setAiStatus('live', `Ollama · ${liveAiModel}${localAiConsent.checked ? '' : ' · off'}`);
    else if (status.available) setAiStatus('fallback', `Ollama running · pull ${liveAiModel}`);
    else setAiStatus('fallback', 'Rules fallback · start Ollama');
  } catch {
    liveAiAvailable = false;
    setAiStatus('fallback', 'Rules fallback · start Ollama');
  }
  updateScribeAiState();
  if (typeof updateScribeState === 'function') updateScribeState();
}

function renderProposal() {
  const panel = document.querySelector('#organizeProposal');
  const container = document.querySelector('#proposalSections');
  container.replaceChildren();
  sectionOrder.forEach(key => {
    const proposal = currentProposal.sections[key];
    if (!proposal) return;
    const item = document.createElement('article'); item.className = 'proposal-section'; item.dataset.proposal = key;
    const heading = document.createElement('div'); heading.className = 'proposal-section-heading';
    const title = document.createElement('h3'); title.textContent = sectionNames[key];
    const state = document.createElement('span'); state.className = 'proposal-state'; state.textContent = 'Proposed';
    heading.append(title, state);
    const text = document.createElement('textarea'); text.value = proposal.text; text.readOnly = true; text.setAttribute('aria-label', `Proposed ${sectionNames[key]} text`);
    const actions = document.createElement('div'); actions.className = 'proposal-actions';
    ['Accept', 'Edit', 'Discard'].forEach(action => { const button = document.createElement('button'); button.type = 'button'; button.dataset.proposalAction = action.toLowerCase(); button.textContent = action; actions.append(button); });
    item.append(heading, text, actions); container.append(item);
  });
  const unfiled = document.querySelector('#unfiledDetails');
  const unfiledList = document.querySelector('#unfiledList');
  unfiledList.replaceChildren(...currentProposal.unfiled.map(sentence => { const item = document.createElement('li'); item.textContent = sentence; return item; }));
  unfiled.hidden = currentProposal.unfiled.length === 0;
  const followUp = document.querySelector('#aiFollowUpDetails');
  aiQuestionsList.replaceChildren(...(currentProposal.questions || []).map(item => {
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'proposal-question';
    button.dataset.question = item.section;
    const heading = document.createElement('b'); heading.textContent = sectionNames[item.section] || 'Documentation';
    const question = document.createElement('span'); question.textContent = item.question;
    button.append(heading, question); row.append(button); return row;
  }));
  followUp.hidden = !(currentProposal.questions || []).length;
  panel.hidden = false;
}

// Grammar Assist stays deliberately conservative until the source-grounded
// model contract is added. It changes punctuation, spacing, and sentence-start
// capitalization only; facts remain in the clinician's original wording.
function rewriteForClarity(value) {
  let rewritten = String(value || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\s*\n+\s*/g, ' ').trim();
  rewritten = rewritten.replace(/\s+([,.;!?])/g, '$1');
  rewritten = rewritten.replace(/([.!?])([A-Za-z])/g, '$1 $2');
  rewritten = rewritten.replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
  if (/[A-Za-z0-9)]$/.test(rewritten)) rewritten += '.';
  return rewritten;
}

function formatIcheatedNarrative(entries, valueKey = 'original') {
  return entries.map(entry => {
    const value = valueKey === 'rewritten' && entry.status !== 'discarded' ? entry.rewritten : entry.original;
    return `${sectionNames[entry.key].toUpperCase()}\n${String(value || '').trim()}`;
  }).join('\n\n');
}

function grammarOrderedText(valueKey) {
  const narrative = formatIcheatedNarrative(grammarProposal?.entries || [], valueKey);
  const clinical = clinicalDetailPlainText();
  return clinical ? `${narrative}\n\n${clinical}` : narrative;
}

function grammarPendingCount() {
  return grammarProposal?.sections.filter(section => section.status === 'pending').length || 0;
}

function updateGrammarOrderPreview() {
  const entries = grammarProposal?.entries || [];
  const original = document.querySelector('#grammarOrderOriginal');
  const rewrite = document.querySelector('#grammarOrderRewrite');
  const state = document.querySelector('#grammarOrderState');
  const accept = document.querySelector('#grammarAcceptOrdered');
  original.value = grammarOrderedText('original');
  rewrite.value = grammarOrderedText('rewritten');
  const orderStatus = grammarProposal?.orderStatus || 'pending';
  state.textContent = orderStatus === 'accepted' ? 'Accepted' : orderStatus === 'discarded' ? 'Discarded' : 'Pending review';
  state.dataset.state = orderStatus;
  accept.disabled = !entries.length || orderStatus !== 'pending';
}

function updateGrammarControls() {
  const entries = grammarProposal?.entries || [];
  const pending = grammarPendingCount();
  document.querySelector('#grammarCount').textContent = `${entries.length} section${entries.length === 1 ? '' : 's'}`;
  document.querySelector('#grammarAcceptAll').disabled = pending === 0;
  document.querySelector('#grammarDiscardAll').disabled = pending === 0 && grammarProposal?.orderStatus !== 'pending';
  updateGrammarOrderPreview();
}

function renderGrammarProposal() {
  const panel = document.querySelector('#grammarProposal');
  const container = document.querySelector('#grammarProposalSections');
  container.replaceChildren();
  const entries = grammarProposal?.entries || [];
  const sections = grammarProposal?.sections || [];
  sections.forEach(section => {
    const item = document.createElement('article');
    item.className = 'grammar-section';
    item.dataset.grammarSection = section.key;
    if (section.status !== 'pending') item.classList.add(section.status);

    const heading = document.createElement('div');
    heading.className = 'grammar-section-heading';
    const title = document.createElement('h3');
    title.textContent = sectionNames[section.key];
    const state = document.createElement('span');
    state.className = 'grammar-state';
    state.textContent = section.status === 'pending' ? 'Pending review' : section.status === 'accepted' ? 'Accepted' : 'Discarded';
    heading.append(title, state);

    const compare = document.createElement('div');
    compare.className = 'grammar-compare';
    const originalLabel = document.createElement('label');
    originalLabel.textContent = 'Original';
    const original = document.createElement('textarea');
    original.value = section.original;
    original.readOnly = true;
    original.setAttribute('aria-label', `Original ${sectionNames[section.key]} narrative`);
    originalLabel.append(original);
    const rewriteLabel = document.createElement('label');
    rewriteLabel.textContent = 'Rewrite';
    const rewrite = document.createElement('textarea');
    rewrite.value = section.rewritten;
    rewrite.readOnly = section.status !== 'pending';
    rewrite.dataset.grammarRewrite = 'true';
    rewrite.setAttribute('aria-label', `Rewritten ${sectionNames[section.key]} narrative`);
    rewriteLabel.append(rewrite);
    compare.append(originalLabel, rewriteLabel);

    const actions = document.createElement('div');
    actions.className = 'grammar-actions';
    const accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'primary-action';
    accept.dataset.grammarAction = 'accept';
    accept.textContent = 'Accept rewrite';
    const discard = document.createElement('button');
    discard.type = 'button';
    discard.className = 'secondary-action';
    discard.dataset.grammarAction = 'discard';
    discard.textContent = 'Discard';
    [accept, discard].forEach(button => { button.disabled = section.status !== 'pending'; actions.append(button); });

    item.append(heading, compare, actions);
    container.append(item);
  });
  panel.hidden = entries.length === 0;
  updateGrammarControls();
}

function setGrammarStatus(message) {
  document.querySelector('#grammarStatus').textContent = message;
}

function createGrammarProposal() {
  syncLiveDraftState();
  const entries = sectionOrder
    .map(key => ({ key, original: narrativeValues[key].trim() }))
    .filter(section => section.original)
    .map(section => {
      const rewritten = rewriteForClarity(section.original);
      return { ...section, rewritten, status: rewritten === section.original ? 'unchanged' : 'pending' };
    });
  const sections = entries.filter(section => section.status === 'pending');

  grammarProposal = { entries, sections, orderStatus: 'pending' };
  renderGrammarProposal();
  if (!entries.length) {
    setGrammarStatus('Add narrative details before creating an I-CHEATED rewrite.');
    showToast('Add narrative details before rewriting.');
    return;
  }
  logEvent('grammar.proposed', `Created an I-CHEATED order proposal for ${entries.length} section${entries.length === 1 ? '' : 's'}; ${sections.length} need wording review.`);
  if (!sections.length) {
    setGrammarStatus('The narrative already passes this conservative grammar check. Review the ordered draft before accepting it.');
    showToast('I-CHEATED draft ready for review.');
    return;
  }
  setGrammarStatus(`I-CHEATED draft ready for ${entries.length} section${entries.length === 1 ? '' : 's'}. Review the ordered draft and wording changes before accepting.`);
  showToast('I-CHEATED rewrite ready. Review before accepting.');
}

function acceptGrammarSection(item, section) {
  const rewrite = item.querySelector('[data-grammar-rewrite]').value.trim();
  if (!rewrite) { showToast('Add rewritten text or discard this section.'); return false; }
  section.rewritten = rewrite;
  setNarrative(section.key, rewrite, { origin: 'accepted', source: evidenceSources[section.key] });
  section.status = 'accepted';
  item.classList.remove('pending');
  item.classList.add('accepted');
  item.querySelector('.grammar-state').textContent = 'Accepted';
  item.querySelector('[data-grammar-rewrite]').readOnly = true;
  item.querySelectorAll('button').forEach(button => { button.disabled = true; });
  logEvent('grammar.accepted', `Accepted the ${sectionNames[section.key]} clarity rewrite.`);
  updateGrammarOrderPreview();
  return true;
}

function discardGrammarSection(item, section) {
  section.status = 'discarded';
  item.classList.remove('pending');
  item.classList.add('discarded');
  item.querySelector('.grammar-state').textContent = 'Discarded';
  item.querySelector('[data-grammar-rewrite]').readOnly = true;
  item.querySelectorAll('button').forEach(button => { button.disabled = true; });
  logEvent('grammar.discarded', `Discarded the ${sectionNames[section.key]} clarity rewrite.`);
  updateGrammarOrderPreview();
}

function acceptOrderedGrammarDraft() {
  if (!grammarProposal || grammarProposal.orderStatus !== 'pending') return;
  grammarProposal.sections.forEach(section => {
    if (section.status !== 'pending') return;
    const item = document.querySelector(`[data-grammar-section="${section.key}"]`);
    if (item) acceptGrammarSection(item, section);
  });
  grammarProposal.orderStatus = 'accepted';
  updateGrammarControls();
  updateProgress();
  saveDraft();
  logEvent('grammar.ordered.accepted', `Accepted the I-CHEATED ordered draft for ${grammarProposal.entries.length} section${grammarProposal.entries.length === 1 ? '' : 's'}.`);
  setGrammarStatus('The I-CHEATED ordered draft was accepted. The source snapshot remains available above.');
  showToast('I-CHEATED draft accepted.');
}

function discardOrderedGrammarDraft() {
  if (!grammarProposal || grammarProposal.orderStatus !== 'pending') return;
  const acceptedBeforeDiscard = grammarProposal.sections.filter(section => section.status === 'accepted').length;
  grammarProposal.sections.forEach(section => {
    if (section.status !== 'pending') return;
    const item = document.querySelector(`[data-grammar-section="${section.key}"]`);
    if (item) discardGrammarSection(item, section);
  });
  grammarProposal.orderStatus = 'discarded';
  updateGrammarControls();
  logEvent('grammar.ordered.discarded', `Discarded the I-CHEATED ordered draft for ${grammarProposal.entries.length} section${grammarProposal.entries.length === 1 ? '' : 's'}.`);
  const message = acceptedBeforeDiscard ? 'The remaining ordered proposal was discarded. Previously accepted section edits remain.' : 'The ordered proposal was discarded. The current narrative remains unchanged.';
  setGrammarStatus(message);
  showToast(acceptedBeforeDiscard ? 'Remaining I-CHEATED proposal discarded.' : 'I-CHEATED proposal discarded.');
}

function organizeLocally(text) {
  const supplied = text.replace(/\s+/g, ' ').trim();
  if (!supplied) { showToast('Add raw notes before organizing.'); return; }
  const sentences = supplied.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [supplied];
  const assigned = Object.fromEntries(sectionOrder.map(key => [key, []]));
  const unfiled = [];
  sentences.forEach(sentence => {
    const normalized = sentence.toLowerCase();
    let bestKey = ''; let bestScore = 0;
    sectionOrder.forEach(key => {
      const score = Object.entries(organizeKeywords[key]).reduce((total, [term, weight]) => total + (normalized.includes(term) ? weight : 0), 0);
      if (score > bestScore) { bestKey = key; bestScore = score; }
    });
    if (bestKey) assigned[bestKey].push(sentence.trim());
    else unfiled.push(sentence.trim());
  });
  currentProposal = { sections: {}, unfiled, questions: [] };
  sectionOrder.forEach(key => {
    if (assigned[key].length) currentProposal.sections[key] = { text: assigned[key].join(' '), source: assigned[key].join(' ') };
  });
  renderProposal();
  const proposed = Object.keys(currentProposal.sections).length;
  logEvent('notes.organized', `Created a local proposal from ${sentences.length} supplied sentence${sentences.length === 1 ? '' : 's'}.`);
  logEvent('organize.proposed', `Proposed ${proposed} section${proposed === 1 ? '' : 's'}; ${unfiled.length} detail${unfiled.length === 1 ? '' : 's'} unfiled.`);
  showToast('Organization proposal ready. Accept only the text you approve.');
}

async function organizeWithLocalAi(text) {
  const supplied = typeof text === 'string' ? text.trim() : '';
  if (!supplied) { showToast('Add raw notes before organizing.'); return; }
  if (supplied.length > maxNotesCharacters) { showToast(`Shorten raw notes to ${maxNotesCharacters.toLocaleString()} characters before organizing.`); return; }
  if (containsPossibleIdentifier(supplied)) {
    setAiStatus('guarded', 'Rules fallback · possible identifier blocked');
    showToast('Possible identifier detected. Local AI was blocked; a rules proposal was created instead.');
    organizeLocally(supplied);
    return;
  }
  analyzeButton.disabled = true;
  analyzeButton.classList.add('busy');
  analyzeButton.querySelector('span').textContent = '…';
  setAiStatus('busy', `Ollama · organizing with ${liveAiModel}`);
  try {
    const response = await fetch('/api/organize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: supplied })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(result.error || 'ollama_request_failed');
      error.code = result.error;
      throw error;
    }
    currentProposal = { sections: {}, unfiled: result.unfiled || [], questions: result.questions || [], provider: result.provider, model: result.model };
    sectionOrder.forEach(key => {
      const proposalText = String(result.sections?.[key] || '').trim();
      if (proposalText) currentProposal.sections[key] = { text: proposalText, source: String(result.sources?.[key] || '').trim() };
    });
    renderProposal();
    const proposed = Object.keys(currentProposal.sections).length;
    logEvent('notes.organized', `Ollama ${result.model || liveAiModel} proposed ${proposed} section${proposed === 1 ? '' : 's'}.`);
    logEvent('organize.proposed', `Ollama proposed ${proposed} section${proposed === 1 ? '' : 's'}; ${(result.unfiled || []).length} detail${(result.unfiled || []).length === 1 ? '' : 's'} unfiled.`);
    showToast(`Ollama proposal ready. Review ${proposed} source-grounded sections.`);
    setAiStatus('live', `Ollama · ${result.model || liveAiModel}`);
  } catch (error) {
    if (error.code === 'model_source_mismatch') {
      setAiStatus('guarded', 'Rules fallback · source check blocked model output');
      showToast('Ollama output failed source validation. A rules proposal was created instead.');
    } else if (error.code === 'possible_identifier_detected') {
      setAiStatus('guarded', 'Rules fallback · possible identifier blocked');
      showToast('Possible identifier detected. Local AI was blocked; a rules proposal was created instead.');
    } else {
      liveAiAvailable = false;
      setAiStatus('fallback', 'Rules fallback · Ollama unavailable');
      showToast('Ollama was unavailable. A local rules proposal was created instead.');
    }
    organizeLocally(supplied);
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.classList.remove('busy');
    analyzeButton.querySelector('span').textContent = '→';
  }
}

async function organize(text) {
  if (liveAiAvailable && localAiConsent.checked) return organizeWithLocalAi(text);
  return organizeLocally(text);
}

// ---- Round 2: structured clinical capture. Every value here is transcribed
// verbatim from the provider; nothing here validates, scores, or suggests a
// drug, dose, route, destination, or acuity. Blank stays blank.

const abbreviationGuard = [
  { pattern: /\bIU\b/, message: '"IU" can be misread as "IV" or "10" — consider writing "international units."' },
  { pattern: /\bQOD\b/i, message: '"QOD" can be misread as "QD" or "QID" — consider writing "every other day."' },
  { pattern: /\bQD\b/i, message: '"QD" can be misread as "QID" — consider writing "daily."' },
  { pattern: /\bMSO4\b/i, message: '"MSO4" can be confused with magnesium sulfate — consider writing "morphine sulfate."' },
  { pattern: /\bMgSO4\b/i, message: '"MgSO4" can be confused with morphine sulfate — consider writing "magnesium sulfate."' },
  { pattern: /\bMS\b/, message: '"MS" can mean morphine sulfate or magnesium sulfate — consider writing the full drug name.' },
  { pattern: /\b\d+\.0\b/, message: 'A trailing zero (e.g., "1.0") can be misread if the decimal point is missed — consider writing "1" instead.' },
  { pattern: /(?<!\d)\.\d+\b/, message: 'A decimal without a leading zero (e.g., ".5") can be misread — consider writing "0.5" instead.' },
  { pattern: /\b\d+\s?[uU](?=\s|$)/, message: '"U" for units can be misread as a zero or a four — consider writing "units."' }
];
function checkAbbreviationText(text, source) {
  const notice = document.querySelector('#abbreviationNotice');
  const rule = abbreviationGuard.find(item => item.pattern.test(text));
  if (rule) {
    document.querySelector('#abbreviationMessage').textContent = rule.message;
    notice.classList.remove('hidden');
    logEvent('abbreviation.flagged', `Flagged a documentation abbreviation in ${source}.`);
  } else {
    notice.classList.add('hidden');
  }
}

const vitalsFields = [['time', 'Time', 'time'], ['bp', 'BP', 'text'], ['hr', 'HR', 'text'], ['rr', 'RR', 'text'], ['spo2', 'SpO2', 'text'], ['etco2', 'ETCO2', 'text'], ['temp', 'Temp', 'text'], ['bgl', 'BGL', 'text'], ['gcs', 'GCS', 'text'], ['pain', 'Pain', 'text']];
let vitalsSeq = 0; let vitalsSets = [];
function renderVitalsRows() {
  document.querySelector('#vitalsRows').innerHTML = vitalsSets.length ? vitalsSets.map(row => `<div class="clinical-row" data-row-id="${row.id}">${vitalsFields.map(([key, label, type]) => `<label>${label}<input type="${type}" data-field="${key}" value="${escapeHtml(row[key])}" /></label>`).join('')}<button type="button" class="row-remove" data-remove-row="${row.id}" aria-label="Remove this vitals set">Remove</button></div>`).join('') : '<p class="clinical-empty">No vitals sets recorded yet.</p>';
}
function vitalsSummaryText() {
  return vitalsSets.map(row => {
    const parts = vitalsFields.filter(([key]) => key !== 'time' && row[key].trim()).map(([key, label]) => `${label} ${row[key].trim()}`);
    if (!parts.length) return '';
    return `${row.time ? `${row.time} — ` : ''}${parts.join(', ')}`;
  }).filter(Boolean).join('; ');
}
document.querySelector('#addVitals').addEventListener('click', () => { vitalsSets.push({ id: `v${++vitalsSeq}`, time: '', bp: '', hr: '', rr: '', spo2: '', etco2: '', temp: '', bgl: '', gcs: '', pain: '' }); renderVitalsRows(); });
document.querySelector('#vitalsRows').addEventListener('input', event => { const field = event.target.dataset.field; if (!field) return; const row = vitalsSets.find(r => r.id === event.target.closest('[data-row-id]').dataset.rowId); if (row) row[field] = event.target.value; });
document.querySelector('#vitalsRows').addEventListener('click', event => { const button = event.target.closest('[data-remove-row]'); if (!button) return; vitalsSets = vitalsSets.filter(r => r.id !== button.dataset.removeRow); renderVitalsRows(); saveDraft(); });
document.querySelector('#insertVitals').addEventListener('click', () => {
  const target = document.querySelector('#vitalsTarget').value;
  if (!target) { showToast('Choose a section to insert vitals into.'); return; }
  const summary = vitalsSummaryText();
  if (!summary) { showToast('Record at least one vitals value first.'); return; }
  const existing = narrativeValues[target];
  const combined = existing ? `${existing} Vitals: ${summary}.` : `Vitals: ${summary}.`;
  setNarrative(target, combined, { origin: 'user', source: summary });
  updateProgress();
  saveDraft();
  logEvent('vitals.recorded', `Inserted vitals into ${sectionNames[target]}.`);
  showToast(`Vitals added to ${sectionNames[target]}.`);
});

const callTimes = {};
document.querySelectorAll('#callTimes input[data-field]').forEach(input => { input.addEventListener('change', () => { callTimes[input.dataset.field] = input.value; if (input.value) logEvent('times.recorded', `Recorded ${input.dataset.field.toLowerCase()} time.`); }); });

let medicationSeq = 0; let medications = [];
function renderMedicationRows() {
  document.querySelector('#medicationRows').innerHTML = medications.length ? medications.map(row => `<div class="clinical-row medication-row" data-row-id="${row.id}"><label>Drug<input type="text" data-field="drug" value="${escapeHtml(row.drug)}" /></label><label>Dose<input type="text" data-field="dose" value="${escapeHtml(row.dose)}" /></label><label>Units<input type="text" data-field="units" value="${escapeHtml(row.units)}" /></label><label>Route<input type="text" data-field="route" value="${escapeHtml(row.route)}" /></label><label>Time<input type="time" data-field="time" value="${escapeHtml(row.time)}" /></label><label>Administered by<input type="text" data-field="by" value="${escapeHtml(row.by)}" /></label><label>Response<input type="text" data-field="response" value="${escapeHtml(row.response)}" /></label><label class="controlled-toggle"><input type="checkbox" data-field="controlled" ${row.controlled ? 'checked' : ''} /> Controlled substance</label><div class="controlled-fields" ${row.controlled ? '' : 'hidden'}><label>Waste amount<input type="text" data-field="waste" value="${escapeHtml(row.waste)}" /></label><label>Witness<input type="text" data-field="witness" value="${escapeHtml(row.witness)}" /></label></div><button type="button" class="row-remove" data-remove-row="${row.id}" aria-label="Remove this medication">Remove</button></div>`).join('') : '<p class="clinical-empty">No medications recorded yet.</p>';
}
document.querySelector('#addMedication').addEventListener('click', () => { medications.push({ id: `m${++medicationSeq}`, drug: '', dose: '', units: '', route: '', time: '', by: '', response: '', controlled: false, waste: '', witness: '' }); renderMedicationRows(); });
document.querySelector('#medicationRows').addEventListener('input', event => { const field = event.target.dataset.field; if (!field || field === 'controlled') return; const row = medications.find(r => r.id === event.target.closest('[data-row-id]').dataset.rowId); if (row) row[field] = event.target.value; });
document.querySelector('#medicationRows').addEventListener('change', event => { if (event.target.dataset.field !== 'controlled') return; const row = medications.find(r => r.id === event.target.closest('[data-row-id]').dataset.rowId); if (row) { row.controlled = event.target.checked; renderMedicationRows(); } });
document.querySelector('#medicationRows').addEventListener('click', event => { const button = event.target.closest('[data-remove-row]'); if (!button) return; medications = medications.filter(r => r.id !== button.dataset.removeRow); renderMedicationRows(); saveDraft(); });
document.querySelector('#medicationRows').addEventListener('blur', event => { if (event.target.dataset.field !== 'drug' || !event.target.value.trim()) return; logEvent('medication.recorded', `Recorded medication: ${event.target.value.trim()}.`); }, true);

let procedureSeq = 0; let procedures = [];
function renderProcedureRows() {
  document.querySelector('#procedureRows').innerHTML = procedures.length ? procedures.map(row => `<div class="clinical-row" data-row-id="${row.id}"><label>Procedure<input type="text" data-field="procedure" value="${escapeHtml(row.procedure)}" /></label><label>Time<input type="time" data-field="time" value="${escapeHtml(row.time)}" /></label><label>Attempts<input type="text" data-field="attempts" value="${escapeHtml(row.attempts)}" /></label><label>Outcome<select data-field="success"><option value="" ${row.success === '' ? 'selected' : ''}>Not recorded</option><option value="Successful" ${row.success === 'Successful' ? 'selected' : ''}>Successful</option><option value="Unsuccessful" ${row.success === 'Unsuccessful' ? 'selected' : ''}>Unsuccessful</option></select></label><label>Performed by<input type="text" data-field="by" value="${escapeHtml(row.by)}" /></label><button type="button" class="row-remove" data-remove-row="${row.id}" aria-label="Remove this procedure">Remove</button></div>`).join('') : '<p class="clinical-empty">No procedures recorded yet.</p>';
}
document.querySelector('#addProcedure').addEventListener('click', () => { procedures.push({ id: `p${++procedureSeq}`, procedure: '', time: '', attempts: '', success: '', by: '' }); renderProcedureRows(); });
document.querySelector('#procedureRows').addEventListener('input', event => { const field = event.target.dataset.field; if (!field) return; const row = procedures.find(r => r.id === event.target.closest('[data-row-id]').dataset.rowId); if (row) row[field] = event.target.value; });
document.querySelector('#procedureRows').addEventListener('change', event => { if (event.target.dataset.field !== 'success') return; const row = procedures.find(r => r.id === event.target.closest('[data-row-id]').dataset.rowId); if (row) row.success = event.target.value; });
document.querySelector('#procedureRows').addEventListener('click', event => { const button = event.target.closest('[data-remove-row]'); if (!button) return; procedures = procedures.filter(r => r.id !== button.dataset.removeRow); renderProcedureRows(); saveDraft(); });
document.querySelector('#procedureRows').addEventListener('blur', event => { if (event.target.dataset.field !== 'procedure' || !event.target.value.trim()) return; logEvent('procedure.recorded', `Recorded procedure: ${event.target.value.trim()}.`); }, true);

const dispositionPromptsByCallType = {
  '': 'What were the transport destination and priority, and how was care transferred?',
  Transport: 'What were the transport destination and priority, and how was care transferred?',
  'Refusal/AMA': "How was the refusal documented, and what was the patient's condition when the crew cleared?",
  'No patient found': 'What efforts were made to locate the patient, and how did the crew clear?',
  'Cancelled en route': 'When and by whom was the call cancelled, and what was the unit status on clearing?',
  'Lift assist': "What was accomplished, and what was the patient's status when the crew cleared?",
  Standby: 'What was the standby assignment, and how did it conclude?',
  'Treat and release': 'What treatment was provided, and what release instructions were given?',
  'TOR/DOA': 'What time was termination of resuscitation or death determined, and by whom?'
};
const refusalFields = {};
document.querySelectorAll('.refusal-fields textarea[data-field]').forEach(textarea => { textarea.addEventListener('blur', () => { refusalFields[textarea.dataset.field] = textarea.value.trim(); saveDraft(); if (textarea.value.trim()) logEvent('refusal.documented', `Documented ${textarea.dataset.field.toLowerCase()}.`); }); });
document.querySelector('#callType').addEventListener('change', event => {
  const value = event.target.value;
  document.querySelector('#refusalBlock').hidden = value !== 'Refusal/AMA';
  followUpQuestions.disposition = dispositionPromptsByCallType[value] || dispositionPromptsByCallType[''];
  updateProgress();
  logEvent('calltype.changed', `Call type set to ${value || 'unspecified'}.`);
});

function clinicalDetailPlainText() {
  const blocks = [];
  const vitals = vitalsSummaryText();
  if (vitals) blocks.push(`VITALS\n${vitals}`);
  const timeEntries = Object.entries(callTimes).filter(([, value]) => value);
  if (timeEntries.length) blocks.push(`CALL TIMES\n${timeEntries.map(([key, value]) => `${key}: ${value}`).join('\n')}`);
  const medLines = medications.filter(row => row.drug.trim()).map(row => `${row.drug}${row.dose ? ` ${row.dose}${row.units}` : ''}${row.route ? ` ${row.route}` : ''} at ${row.time || 'time not recorded'} by ${row.by || 'not recorded'}${row.response ? ` — response: ${row.response}` : ''}${row.controlled ? ` (controlled substance — waste ${row.waste || 'not recorded'}, witness ${row.witness || 'not recorded'})` : ''}`);
  if (medLines.length) blocks.push(`MEDICATIONS\n${medLines.join('\n')}`);
  const procLines = procedures.filter(row => row.procedure.trim()).map(row => `${row.procedure} at ${row.time || 'time not recorded'}${row.attempts ? `, ${row.attempts} attempt(s)` : ''}${row.success ? `, ${row.success.toLowerCase()}` : ''} by ${row.by || 'not recorded'}`);
  if (procLines.length) blocks.push(`PROCEDURES\n${procLines.join('\n')}`);
  const refusalEntries = Object.entries(refusalFields).filter(([, value]) => value);
  if (refusalEntries.length) blocks.push(`REFUSAL/AMA DOCUMENTATION\n${refusalEntries.map(([key, value]) => `${key}: ${value}`).join('\n')}`);
  return blocks.join('\n\n');
}
function renderReviewClinical() {
  const text = clinicalDetailPlainText();
  document.querySelector('#reviewClinical').innerHTML = text ? `<h3>Clinical detail</h3><pre>${escapeHtml(text)}</pre>` : '<p class="clinical-empty">No structured clinical detail recorded yet.</p>';
}

// Clinical Scribe capture is source-only in this phase. Segments are rendered
// with DOM text/value properties so transcript content never becomes markup.
const scribeStorageKey = 'fieldnote-scribe-v1';
const maxScribeSegments = 200;
function scribeWordCount() {
  return scribeSegments.reduce((total, segment) => total + (segment.text.trim() ? segment.text.trim().split(/\s+/).length : 0), 0);
}
function scribePayloadHasContent(payload) {
  return Boolean(String(payload?.sessionLabel || '').trim() || (Array.isArray(payload?.segments) && payload.segments.some(segment => segment && Object.values(segment).some(value => typeof value === 'string' && value.trim()))));
}
function scribeHasContent() {
  return scribePayloadHasContent({ sessionLabel: scribeSessionLabel.value, segments: scribeSegments });
}
function normalizeScribeSegments(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(segment => segment && typeof segment === 'object').map((segment, index) => ({
    id: typeof segment.id === 'string' && segment.id ? segment.id : `s${index + 1}`,
    timestamp: typeof segment.timestamp === 'string' ? segment.timestamp : '',
    speaker: typeof segment.speaker === 'string' ? segment.speaker : '',
    text: typeof segment.text === 'string' ? segment.text : ''
  }));
}
function scribeSeqFromIds(segments) {
  return segments.reduce((max, segment) => Math.max(max, Number(String(segment.id).slice(1)) || 0), 0);
}
function scribePlainText() {
  const title = scribeSessionLabel.value.trim() || 'Synthetic encounter transcript';
  const lines = scribeSegments.map(segment => {
    const prefix = [segment.timestamp.trim(), segment.speaker.trim()].filter(Boolean).join(' · ');
    return prefix ? `[${prefix}] ${segment.text.trim()}` : segment.text.trim();
  }).filter(Boolean);
  return lines.length ? `${title}\n\n${lines.join('\n')}` : title;
}

const digestSectionNames = {
  overview: 'Overview', timeline: 'Timeline', patient_statements: 'Patient statements', history: 'Relevant history',
  observations: 'Observations', tests: 'Tests and results', interventions: 'Interventions', response: 'Response and reassessment', disposition: 'Disposition'
};
function normalizeScribeDigest(value) {
  if (!value || value.document?.type !== 'encounter_digest' || !Array.isArray(value.document.sections)) return null;
  const sections = value.document.sections.filter(section => section && digestSectionNames[section.key] && Array.isArray(section.blocks)).slice(0, 9).map(section => ({
    key: section.key,
    blocks: section.blocks.filter(block => block && ['paragraph', 'bullets', 'table', 'quote'].includes(block.kind)).slice(0, 20).map(block => ({
      kind: block.kind,
      text: typeof block.text === 'string' ? block.text : '',
      items: Array.isArray(block.items) ? block.items.filter(item => item && typeof item.text === 'string').slice(0, 20).map(item => ({ text: item.text, sourceRefs: Array.isArray(item.sourceRefs) ? item.sourceRefs.filter(ref => typeof ref === 'string').slice(0, 20) : [] })) : [],
      columns: Array.isArray(block.columns) ? block.columns.filter(column => typeof column === 'string').slice(0, 8) : [],
      rows: Array.isArray(block.rows) ? block.rows.filter(row => row && Array.isArray(row.cells)).slice(0, 20).map(row => ({ cells: row.cells.filter(cell => typeof cell === 'string').slice(0, 8), sourceRefs: Array.isArray(row.sourceRefs) ? row.sourceRefs.filter(ref => typeof ref === 'string').slice(0, 20) : [] })) : [],
      sourceRefs: Array.isArray(block.sourceRefs) ? block.sourceRefs.filter(ref => typeof ref === 'string').slice(0, 20) : []
    }))
  })).filter(section => section.blocks.length);
  const questions = Array.isArray(value.questions) ? value.questions.filter(item => item && typeof item.question === 'string').slice(0, 8).map(item => ({ question: item.question, sourceRefs: Array.isArray(item.sourceRefs) ? item.sourceRefs.filter(ref => typeof ref === 'string').slice(0, 20) : [] })) : [];
  if (!sections.length && !questions.length) return null;
  return { document: { type: 'encounter_digest', title: 'Encounter digest', sections }, questions };
}
function renderScribeSourceRefs(parent, refs) {
  const validRefs = Array.isArray(refs) ? refs.filter(ref => typeof ref === 'string' && /^s[0-9]{1,4}$/.test(ref)) : [];
  if (!validRefs.length) return;
  const wrap = document.createElement('div');
  wrap.className = 'scribe-source-refs';
  const label = document.createElement('span');
  label.textContent = 'Sources';
  wrap.append(label);
  validRefs.forEach(ref => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scribe-source-ref';
    button.dataset.scribeSource = ref;
    button.textContent = ref;
    button.title = `View transcript segment ${ref}`;
    wrap.append(button);
  });
  parent.append(wrap);
}
function renderScribeDigest() {
  const hasDigest = Boolean(scribeDigest);
  scribeDigestOutline.hidden = hasDigest;
  scribeDigestProposal.hidden = !hasDigest;
  scribeDigestStatus.textContent = hasDigest ? 'PROPOSAL READY' : 'NOT GENERATED';
  scribeDigestStatus.className = `status-label ${hasDigest ? 'implemented' : 'required'}`;
  scribeDigestSections.replaceChildren();
  scribeDigestQuestionList.replaceChildren();
  scribeDigestQuestions.hidden = true;
  if (!hasDigest) {
    scribeDigestReviewStatus.textContent = 'Needs review';
    scribeDigestReviewButton.disabled = true;
    scribeDigestCopy.disabled = true;
    scribeDigestDownload.disabled = true;
    return;
  }
  scribeDigest.document.sections.forEach(section => {
    const article = document.createElement('article');
    article.className = 'scribe-digest-section';
    const heading = document.createElement('h3');
    heading.textContent = digestSectionNames[section.key];
    article.append(heading);
    section.blocks.forEach(block => {
      const blockElement = document.createElement('div');
      blockElement.className = `scribe-digest-block scribe-digest-${block.kind}`;
      if (block.kind === 'paragraph' || block.kind === 'quote') {
        const text = document.createElement(block.kind === 'quote' ? 'blockquote' : 'p');
        text.textContent = block.text;
        blockElement.append(text);
        renderScribeSourceRefs(blockElement, block.sourceRefs);
      } else if (block.kind === 'bullets') {
        const list = document.createElement('ul');
        block.items.forEach(item => {
          const row = document.createElement('li');
          const text = document.createElement('span');
          text.textContent = item.text;
          row.append(text);
          renderScribeSourceRefs(row, item.sourceRefs);
          list.append(row);
        });
        blockElement.append(list);
        renderScribeSourceRefs(blockElement, block.sourceRefs);
      } else if (block.kind === 'table') {
        const table = document.createElement('table');
        table.className = 'scribe-digest-table';
        const head = document.createElement('thead');
        const headRow = document.createElement('tr');
        block.columns.forEach(column => { const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = column; headRow.append(cell); });
        const sourceHeading = document.createElement('th'); sourceHeading.scope = 'col'; sourceHeading.textContent = 'Sources'; headRow.append(sourceHeading);
        head.append(headRow);
        const body = document.createElement('tbody');
        block.rows.forEach(row => {
          const tableRow = document.createElement('tr');
          row.cells.forEach(cell => { const tableCell = document.createElement('td'); tableCell.textContent = cell; tableRow.append(tableCell); });
          const sourceCell = document.createElement('td'); sourceCell.className = 'scribe-table-source'; sourceCell.colSpan = Math.max(1, block.columns.length); renderScribeSourceRefs(sourceCell, row.sourceRefs); tableRow.append(sourceCell);
          body.append(tableRow);
        });
        table.append(head, body);
        blockElement.append(table);
        renderScribeSourceRefs(blockElement, block.sourceRefs);
      }
      article.append(blockElement);
    });
    scribeDigestSections.append(article);
  });
  if (scribeDigest.questions.length) {
    scribeDigest.questions.forEach(item => {
      const row = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = item.question;
      row.append(text);
      renderScribeSourceRefs(row, item.sourceRefs);
      scribeDigestQuestionList.append(row);
    });
    scribeDigestQuestions.hidden = false;
  }
  scribeDigestReviewStatus.textContent = scribeDigestReviewed ? 'Reviewed' : 'Needs review';
  scribeDigestReviewStatus.dataset.state = scribeDigestReviewed ? 'reviewed' : 'needs-review';
  scribeDigestReviewButton.disabled = scribeDigestReviewed;
  scribeDigestReviewButton.textContent = scribeDigestReviewed ? 'Digest reviewed' : 'Mark digest reviewed';
  scribeDigestCopy.disabled = !scribeDigestReviewed;
  scribeDigestDownload.disabled = !scribeDigestReviewed;
}
function scribeDigestPlainText() {
  if (!scribeDigest) return '';
  const lines = ['ENCOUNTER DIGEST', 'DRAFT - CLINICIAN REVIEW REQUIRED', ''];
  scribeDigest.document.sections.forEach(section => {
    lines.push(digestSectionNames[section.key].toUpperCase());
    section.blocks.forEach(block => {
      const refs = refs => refs?.length ? ` [Sources: ${refs.join(', ')}]` : '';
      if (block.kind === 'paragraph' || block.kind === 'quote') lines.push(`${block.kind === 'quote' ? '"' : ''}${block.text}${block.kind === 'quote' ? '"' : ''}${refs(block.sourceRefs)}`);
      if (block.kind === 'bullets') block.items.forEach(item => lines.push(`- ${item.text}${refs(item.sourceRefs)}`));
      if (block.kind === 'table') { lines.push(block.columns.join(' | ')); block.rows.forEach(row => lines.push(`${row.cells.join(' | ')}${refs(row.sourceRefs)}`)); }
    });
    lines.push('');
  });
  if (scribeDigest.questions.length) {
    lines.push('OPEN DETAILS');
    scribeDigest.questions.forEach(item => lines.push(`- ${item.question}${item.sourceRefs.length ? ` [Sources: ${item.sourceRefs.join(', ')}]` : ''}`));
  }
  return lines.join('\n').trim();
}
function invalidateScribeDigest() {
  if (!scribeDigest && !scribeDigestReviewed) return;
  scribeDigest = null;
  scribeDigestReviewed = false;
  renderScribeDigest();
}
async function generateScribeDigest() {
  updateScribeState();
  if (!liveAiAvailable) { showToast('Local Ollama is unavailable. Start it and refresh before generating a digest.'); return; }
  if (!scribeLocalAiConsent.checked) { showToast('Enable Use local AI before generating a digest.'); return; }
  if (!scribeReviewed) { showToast('Mark the transcript reviewed before generating a digest.'); return; }
  if (scribeIdentifierVisible) { showToast('Possible identifier detected. Replace it with synthetic text before sending.'); return; }
  scribeDigestGenerating = true;
  updateScribeState();
  try {
    const response = await fetch('/api/compose-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ documentType: 'encounter_digest', reviewed: true, segments: scribeSegments })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const messages = {
        possible_identifier_detected: 'Possible identifier detected. The transcript was not sent to Ollama.',
        model_source_mismatch: 'Ollama returned invalid source references. The transcript remains unchanged.',
        model_invalid_output: 'Ollama returned an unusable digest. The transcript remains unchanged.',
        ollama_unavailable: 'Local Ollama is unavailable. The transcript remains unchanged.',
        rate_limit_exceeded: 'Digest requests are temporarily limited. Try again shortly.'
      };
      showToast(messages[payload.error] || 'Digest generation failed. The transcript remains unchanged.');
      return;
    }
    if (payload.validation?.sourceRefsValid !== true || payload.validation?.clinicianReviewRequired !== true) throw new Error('invalid_digest_validation');
    const normalized = normalizeScribeDigest(payload);
    if (!normalized) throw new Error('invalid_digest_payload');
    scribeDigest = normalized;
    scribeDigestReviewed = false;
    renderScribeDigest();
    saveScribeDraft();
    logEvent('scribe.digest.generated', 'Generated a source-referenced encounter digest proposal.');
    showToast('Digest proposal ready. Review it against the transcript.');
  } catch {
    showToast('Digest generation failed. The transcript remains unchanged.');
  } finally {
    scribeDigestGenerating = false;
    updateScribeState();
  }
}
function updateScribePrivacy() {
  const combined = [scribeSessionLabel.value, ...scribeSegments.flatMap(segment => [segment.speaker, segment.text])].join('\n');
  const flagged = containsPossibleIdentifier(combined);
  if (flagged && !scribeIdentifierVisible) logEvent('identifier.flagged', 'Possible identifier detected in the Scribe transcript.');
  scribeIdentifierVisible = flagged;
  scribePrivacyAlert.hidden = !flagged;
}
function updateScribeState() {
  const count = scribeSegments.length;
  const words = scribeWordCount();
  scribeSegmentCount.textContent = `${count} segment${count === 1 ? '' : 's'} · ${words} word${words === 1 ? '' : 's'}`;
  scribeStatus.textContent = scribeReviewed ? 'Reviewed' : count ? 'Draft' : 'Empty';
  scribeStatus.dataset.state = scribeReviewed ? 'reviewed' : count ? 'draft' : 'empty';
  scribeReviewButton.textContent = scribeReviewed ? 'Mark as needs review' : 'Mark transcript reviewed';
  scribeReviewButton.setAttribute('aria-pressed', String(scribeReviewed));
  updateScribePrivacy();
  updateScribeAiState();
  scribeGenerateDigest.disabled = scribeDigestGenerating || !liveAiAvailable || !scribeLocalAiConsent.checked || !scribeReviewed || !scribeSegments.some(segment => segment.text.trim()) || scribeIdentifierVisible;
  scribeGenerateDigest.textContent = scribeDigestGenerating ? 'Generating...' : 'Generate digest';
}
function renderScribeSegments(focusId = '') {
  scribeSegmentList.replaceChildren();
  scribeSegments.forEach((segment, index) => {
    const item = document.createElement('article');
    item.className = 'scribe-segment';
    item.dataset.scribeSegment = segment.id;
    item.setAttribute('role', 'listitem');

    const heading = document.createElement('div');
    heading.className = 'scribe-segment-heading';
    const number = document.createElement('span');
    number.className = 'scribe-segment-number';
    number.textContent = String(index + 1).padStart(2, '0');
    const state = document.createElement('span');
    state.className = 'scribe-segment-state';
    state.textContent = segment.text.trim() ? 'Source captured' : 'Needs wording';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'scribe-remove';
    remove.dataset.removeScribeSegment = segment.id;
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove transcript segment ${index + 1}`);
    heading.append(number, state, remove);

    const metadata = document.createElement('div');
    metadata.className = 'scribe-segment-meta';
    const timeLabel = document.createElement('label');
    timeLabel.textContent = 'Timestamp';
    const time = document.createElement('input');
    time.type = 'text'; time.inputMode = 'numeric'; time.placeholder = 'mm:ss'; time.value = segment.timestamp;
    time.dataset.scribeField = 'timestamp'; time.setAttribute('aria-label', `Timestamp for transcript segment ${index + 1}`);
    timeLabel.append(time);
    const speakerLabel = document.createElement('label');
    speakerLabel.textContent = 'Speaker';
    const speaker = document.createElement('input');
    speaker.type = 'text'; speaker.placeholder = 'Patient, clinician, or other'; speaker.value = segment.speaker;
    speaker.dataset.scribeField = 'speaker'; speaker.setAttribute('aria-label', `Speaker for transcript segment ${index + 1}`);
    speakerLabel.append(speaker);
    metadata.append(timeLabel, speakerLabel);

    const textLabel = document.createElement('label');
    textLabel.className = 'scribe-segment-text';
    textLabel.textContent = 'Exact wording';
    const text = document.createElement('textarea');
    text.placeholder = 'Enter the speaker\'s words. Do not summarize this source segment.';
    text.value = segment.text;
    text.dataset.scribeField = 'text'; text.setAttribute('aria-label', `Exact wording for transcript segment ${index + 1}`);
    textLabel.append(text);
    item.append(heading, metadata, textLabel);
    scribeSegmentList.append(item);
  });
  scribeEmpty.hidden = scribeSegments.length > 0;
  updateScribeState();
  if (focusId) window.requestAnimationFrame(() => document.querySelector(`[data-scribe-segment="${focusId}"] [data-scribe-field="text"]`)?.focus());
}
function saveScribeDraft() {
  try {
    const payload = { sessionLabel: scribeSessionLabel.value, segments: scribeSegments, reviewed: scribeReviewed, digest: scribeDigest, digestReviewed: scribeDigestReviewed };
    if (scribePayloadHasContent(payload)) sessionStorage.setItem(scribeStorageKey, JSON.stringify(payload));
    else sessionStorage.removeItem(scribeStorageKey);
  } catch { /* storage is optional; the source remains in the live tab */ }
}
function clearScribeDraft() {
  try { sessionStorage.removeItem(scribeStorageKey); } catch { /* nothing to clear */ }
}
function restoreScribeDraft() {
  let draft;
  try {
    const raw = sessionStorage.getItem(scribeStorageKey);
    if (!raw) return;
    draft = JSON.parse(raw);
  } catch { return; }
  if (!scribePayloadHasContent(draft)) return;
  scribeSessionLabel.value = typeof draft.sessionLabel === 'string' ? draft.sessionLabel : '';
  scribeSegments = normalizeScribeSegments(draft.segments);
  scribeSeq = scribeSeqFromIds(scribeSegments);
  scribeReviewed = draft.reviewed === true;
  scribeDigest = normalizeScribeDigest(draft.digest);
  scribeDigestReviewed = scribeDigest ? draft.digestReviewed === true : false;
  renderScribeSegments();
  renderScribeDigest();
  showToast('Scribe transcript restored from this browser tab.');
}
function loadScribeSample() {
  if (scribeHasContent() && !window.confirm('Replace this Scribe session with the synthetic sample?')) return;
  scribeSessionLabel.value = 'Synthetic ED conversation';
  scribeSeq = 0;
  scribeSegments = scribeSampleSegments.map(segment => ({ ...segment, id: `s${++scribeSeq}` }));
  scribeReviewed = false;
  invalidateScribeDigest();
  renderScribeSegments();
  saveScribeDraft();
  logEvent('scribe.segment.added', `Loaded a synthetic transcript with ${scribeSegments.length} segments.`);
  showToast('Synthetic transcript loaded. Review each source segment.');
}
scribeSegmentList.addEventListener('input', event => {
  const field = event.target.dataset.scribeField;
  const item = event.target.closest('[data-scribe-segment]');
  if (!field || !item) return;
  const segment = scribeSegments.find(candidate => candidate.id === item.dataset.scribeSegment);
  if (!segment) return;
  segment[field] = event.target.value;
  scribeReviewed = false;
  invalidateScribeDigest();
  updateScribeState();
  saveScribeDraft();
});
scribeSegmentList.addEventListener('blur', event => {
  if (!event.target.dataset.scribeField) return;
  logEvent('scribe.segment.edited', 'Edited a transcript segment source field.');
}, true);
scribeSegmentList.addEventListener('click', event => {
  const button = event.target.closest('[data-remove-scribe-segment]');
  if (!button) return;
  const removed = scribeSegments.find(segment => segment.id === button.dataset.removeScribeSegment);
  scribeSegments = scribeSegments.filter(segment => segment.id !== button.dataset.removeScribeSegment);
  scribeReviewed = false;
  invalidateScribeDigest();
  renderScribeSegments();
  saveScribeDraft();
  logEvent('scribe.segment.removed', `Removed transcript segment ${removed ? 'source' : ''}.`);
});
document.querySelector('#scribeAddSegment').addEventListener('click', () => {
  if (scribeSegments.length >= maxScribeSegments) { showToast(`This demo supports up to ${maxScribeSegments} transcript segments.`); return; }
  const id = `s${++scribeSeq}`;
  scribeSegments.push({ id, timestamp: '', speaker: '', text: '' });
  scribeReviewed = false;
  invalidateScribeDigest();
  renderScribeSegments(id);
  saveScribeDraft();
  logEvent('scribe.segment.added', 'Added a blank transcript segment.');
});
document.querySelector('#scribeLoadSample').addEventListener('click', loadScribeSample);
scribeSessionLabel.addEventListener('input', () => { saveScribeDraft(); updateScribeState(); });
scribeLocalAiConsent.addEventListener('change', () => { updateScribeAiState(); updateScribeState(); saveScribeDraft(); });
scribeReviewButton.addEventListener('click', () => {
  if (!scribeSegments.length || !scribeSegments.some(segment => segment.text.trim())) { showToast('Add transcript wording before marking the source reviewed.'); return; }
  scribeReviewed = !scribeReviewed;
  if (!scribeReviewed) invalidateScribeDigest();
  updateScribeState();
  saveScribeDraft();
  logEvent('scribe.reviewed', scribeReviewed ? 'Marked the transcript reviewed.' : 'Returned the transcript to draft review.');
  showToast(scribeReviewed ? 'Transcript marked reviewed.' : 'Transcript returned to draft review.');
});
document.querySelector('#scribeCopy').addEventListener('click', async () => {
  if (!scribeSegments.some(segment => segment.text.trim())) { showToast('Add transcript wording before copying.'); return; }
  try { await navigator.clipboard.writeText(scribePlainText()); logEvent('scribe.exported', 'Copied the transcript for review.'); showToast('Transcript copied to clipboard.'); } catch { showToast('Clipboard access is unavailable in this browser.'); }
});
document.querySelector('#scribeDownload').addEventListener('click', () => {
  if (!scribeSegments.some(segment => segment.text.trim())) { showToast('Add transcript wording before downloading.'); return; }
  const url = URL.createObjectURL(new Blob([scribePlainText()], { type: 'text/plain' }));
  const link = document.createElement('a'); link.href = url; link.download = 'fieldnote-scribe-transcript.txt'; link.click(); URL.revokeObjectURL(url);
  logEvent('scribe.exported', 'Downloaded the transcript for review.');
});
scribeGenerateDigest.addEventListener('click', generateScribeDigest);
scribeDigestSections.addEventListener('click', event => {
  const button = event.target.closest('[data-scribe-source]');
  if (!button) return;
  const segment = document.querySelector(`[data-scribe-segment="${button.dataset.scribeSource}"]`);
  if (!segment) { showToast('The referenced transcript segment is not available.'); return; }
  segment.scrollIntoView({ behavior: 'smooth', block: 'center' });
  segment.classList.add('source-highlight');
  window.setTimeout(() => segment.classList.remove('source-highlight'), 1400);
  segment.querySelector('[data-scribe-field="text"]')?.focus({ preventScroll: true });
  logEvent('scribe.source.viewed', `Viewed transcript source ${button.dataset.scribeSource}.`);
});
scribeDigestQuestionList.addEventListener('click', event => {
  const button = event.target.closest('[data-scribe-source]');
  if (!button) return;
  const segment = document.querySelector(`[data-scribe-segment="${button.dataset.scribeSource}"]`);
  if (!segment) return;
  segment.scrollIntoView({ behavior: 'smooth', block: 'center' });
  segment.classList.add('source-highlight');
  window.setTimeout(() => segment.classList.remove('source-highlight'), 1400);
  logEvent('scribe.source.viewed', `Viewed transcript source ${button.dataset.scribeSource}.`);
});
scribeDigestReviewButton.addEventListener('click', () => {
  if (!scribeDigest) return;
  scribeDigestReviewed = true;
  renderScribeDigest();
  saveScribeDraft();
  logEvent('scribe.digest.reviewed', 'Marked the encounter digest reviewed.');
  showToast('Digest marked reviewed.');
});
scribeDigestCopy.addEventListener('click', async () => {
  if (!scribeDigestReviewed) { showToast('Review the digest before copying.'); return; }
  try { await navigator.clipboard.writeText(scribeDigestPlainText()); logEvent('scribe.exported', 'Copied the reviewed encounter digest.'); showToast('Digest copied to clipboard.'); } catch { showToast('Clipboard access is unavailable in this browser.'); }
});
scribeDigestDownload.addEventListener('click', () => {
  if (!scribeDigestReviewed) { showToast('Review the digest before downloading.'); return; }
  const url = URL.createObjectURL(new Blob([scribeDigestPlainText()], { type: 'text/plain' }));
  const link = document.createElement('a'); link.href = url; link.download = 'fieldnote-encounter-digest.txt'; link.click(); URL.revokeObjectURL(url);
  logEvent('scribe.exported', 'Downloaded the reviewed encounter digest.');
});
document.querySelector('#clearScribeButton').addEventListener('click', () => {
  if (scribeHasContent() && !window.confirm('Clear this Scribe session? The transcript will be removed from this browser tab. This cannot be undone.')) return;
  scribeSegments = []; scribeSeq = 0; scribeReviewed = false; scribeDigest = null; scribeDigestReviewed = false; scribeIdentifierVisible = false; scribeSessionLabel.value = '';
  clearScribeDraft(); renderScribeSegments(); renderScribeDigest(); logEvent('scribe.cleared', 'Cleared the Scribe transcript session.'); showToast('Scribe session cleared.');
});

const fixtures = [
  ['26-07129', 'Chest pain', 'M-12', '2026-07-30 10:14', 0, 'Draft'], ['26-07128', 'Fall', 'M-08', '2026-07-30 09:42', 100, 'Reviewed'], ['26-07127', 'Breathing concern', 'M-03', '2026-07-30 08:26', 100, 'Exported'], ['26-07126', 'Wellness check', 'M-11', '2026-07-30 07:11', 63, 'Draft'], ['26-07125', 'Motor vehicle collision', 'M-05', '2026-07-30 06:38', 100, 'Reviewed'], ['26-07124', 'Abdominal pain', 'M-09', '2026-07-30 05:57', 88, 'Draft']
].map(([incident, callType, unit, date, completeness, status]) => ({ incident, callType, unit, date, completeness, status }));
let caseStatus = 'all';
function renderCases() {
  const query = document.querySelector('#caseTextFilter').value.trim().toLowerCase();
  const rows = fixtures.filter(item => (caseStatus === 'all' || item.status === caseStatus) && `${item.incident} ${item.callType} ${item.unit}`.toLowerCase().includes(query));
  document.querySelector('#casesTableBody').innerHTML = rows.length ? rows.map(item => `<tr><td class="mono">${item.incident}</td><td>${item.callType}</td><td class="mono">${item.unit}</td><td class="mono">${item.date}</td><td><span class="meter"><progress value="${item.completeness}" max="100">${item.completeness}%</progress>${item.completeness}%</span></td><td><span class="chip chip-status ${item.status.toLowerCase()}">${item.status}</span></td><td>Synthetic</td><td><button class="table-action" data-open-case="${item.incident}">Open</button></td></tr>`).join('') : '<tr><td colspan="8" class="audit-empty">No synthetic work queue items match these filters.</td></tr>';
}
function openFixture(incident) {
  if (incident === '26-07129') { location.hash = '#/workspace'; return; }
  const fixture = fixtures.find(item => item.incident === incident); const panel = document.querySelector('#fixturePanel');
  panel.hidden = false; panel.innerHTML = `<h2>${fixture.incident} · ${fixture.callType}</h2><p>This is an illustrative fixture with no stored content. It does not contain a narrative or patient record.</p>`;
}

function route() {
  const requested = location.hash.replace(/^#\//, '');
  if (!routes[requested]) { if (location.hash !== '#/workspace') location.hash = '#/workspace'; return; }
  document.querySelectorAll('[data-page]').forEach(page => { page.hidden = page.dataset.page !== requested && !(requested === 'review' && page.dataset.page === 'workspace'); });
  document.querySelector('.workspace').hidden = requested !== 'workspace';
  document.querySelectorAll('.page-nav [data-route]').forEach(tab => { const active = tab.dataset.route === requested; tab.toggleAttribute('aria-current', active); });
  if (utilityMenu) utilityMenu.open = false;
  document.querySelector('.mobile-tabs').hidden = requested !== 'workspace';
  document.title = `FieldNote | ${routes[requested]}`;
  if (requested === 'review') renderReview();
  if (requested === 'scribe') updateScribeState();
  window.scrollTo(0, 0); document.querySelector(`[data-page="${requested}"] h1`)?.focus();
  if (route.lastViewed !== requested) {
    logEvent('page.viewed', `Viewed ${routes[requested]}.`);
    route.lastViewed = requested;
  }
}

rawNotes.addEventListener('input', () => { const words = rawNotes.value.trim() ? rawNotes.value.trim().split(/\s+/).length : 0; wordCount.textContent = `${words} word${words === 1 ? '' : 's'}`; privacyAlert.classList.toggle('hidden', !checkIdentifier(rawNotes.value, 'raw notes')); checkAbbreviationText(rawNotes.value, 'raw notes'); });
analyzeButton.addEventListener('click', () => organize(rawNotes.value));
localAiConsent.addEventListener('change', () => { if (liveAiAvailable) setAiStatus('live', `Ollama · ${liveAiModel}${localAiConsent.checked ? '' : ' · off'}`); showToast(localAiConsent.checked ? 'Local Ollama enabled for this tab.' : 'Local Ollama disabled; browser rules will organize notes.'); });
themeButton.addEventListener('click', () => { setTheme(document.body.dataset.theme === 'night' ? 'day' : 'night', true); });
document.querySelector('#loadExample').addEventListener('click', () => { rawNotes.value = sample; rawNotes.dispatchEvent(new Event('input')); organize(sample); });
document.querySelector('#proposalSections').addEventListener('click', event => {
  const button = event.target.closest('[data-proposal-action]');
  if (!button) return;
  const item = button.closest('[data-proposal]');
  const key = item.dataset.proposal;
  const text = item.querySelector('textarea');
  if (button.dataset.proposalAction === 'edit') {
    if (text.readOnly) {
      text.readOnly = false;
      button.textContent = 'Done editing';
      text.focus();
    } else {
      const editedText = text.value.trim();
      if (!editedText) { showToast('Add proposed text or discard this suggestion.'); return; }
      const proposal = currentProposal.sections[key];
      if (editedText !== proposal.text) {
        proposal.text = editedText;
        proposal.source = '';
        item.querySelector('.proposal-state').textContent = 'Edited · source review';
        logEvent('section.edited', `${sectionNames[key]} proposal edited; original source excerpt cleared.`);
      }
      text.value = editedText;
      text.readOnly = true;
      button.textContent = 'Edit';
    }
    return;
  }
  if (button.dataset.proposalAction === 'discard') {
    delete currentProposal.sections[key];
    item.remove();
    return;
  }
  const acceptedText = text.value.trim();
  if (!acceptedText) { showToast('Add proposed text or discard this suggestion.'); return; }
  setNarrative(key, acceptedText, { origin: 'accepted', source: currentProposal.sections[key].source });
  updateProgress();
  saveDraft();
  text.readOnly = true;
  item.classList.add('accepted');
  item.querySelector('.proposal-state').textContent = 'Accepted';
  item.querySelectorAll('button').forEach(action => { action.disabled = true; });
  logEvent('organize.accepted', `Accepted the ${sectionNames[key]} proposal.`);
  showToast(`${sectionNames[key]} added to the narrative.`);
});
document.querySelector('#grammarProposalSections').addEventListener('click', event => {
  const button = event.target.closest('[data-grammar-action]');
  if (!button || !grammarProposal) return;
  const item = button.closest('[data-grammar-section]');
  const section = grammarProposal.sections.find(candidate => candidate.key === item?.dataset.grammarSection);
  if (!item || !section || section.status !== 'pending') return;
  if (button.dataset.grammarAction === 'accept') {
    if (acceptGrammarSection(item, section)) {
      updateGrammarControls();
      updateProgress();
      saveDraft();
      setGrammarStatus(grammarPendingCount() ? `${grammarPendingCount()} rewrite${grammarPendingCount() === 1 ? '' : 's'} still need review.` : 'All proposed rewrites are resolved.');
      showToast(`${sectionNames[section.key]} rewrite accepted.`);
    }
  } else if (button.dataset.grammarAction === 'discard') {
    discardGrammarSection(item, section);
    updateGrammarControls();
    setGrammarStatus(grammarPendingCount() ? `${grammarPendingCount()} rewrite${grammarPendingCount() === 1 ? '' : 's'} still need review.` : 'All proposed rewrites are resolved.');
    showToast(`${sectionNames[section.key]} rewrite discarded.`);
  }
});
document.querySelector('#grammarProposalSections').addEventListener('input', event => {
  const rewrite = event.target.closest('[data-grammar-rewrite]');
  if (!rewrite || !grammarProposal) return;
  const item = rewrite.closest('[data-grammar-section]');
  const section = grammarProposal.sections.find(candidate => candidate.key === item?.dataset.grammarSection);
  if (!section || section.status !== 'pending') return;
  section.rewritten = rewrite.value;
  updateGrammarOrderPreview();
});
document.querySelector('#grammarRewriteButton').addEventListener('click', createGrammarProposal);
document.querySelector('#grammarAcceptAll').addEventListener('click', () => {
  if (!grammarProposal) return;
  grammarProposal.sections.forEach(section => {
    if (section.status === 'pending') {
      const item = document.querySelector(`[data-grammar-section="${section.key}"]`);
      if (item) acceptGrammarSection(item, section);
    }
  });
  updateGrammarControls();
  updateProgress();
  saveDraft();
  setGrammarStatus('All proposed rewrites were accepted.');
  showToast('All grammar rewrites accepted.');
});
document.querySelector('#grammarAcceptOrdered').addEventListener('click', acceptOrderedGrammarDraft);
document.querySelector('#grammarDiscardAll').addEventListener('click', discardOrderedGrammarDraft);
document.querySelectorAll('[data-insert]').forEach(button => button.addEventListener('click', () => { rawNotes.focus(); rawNotes.setRangeText(button.dataset.insert, rawNotes.selectionStart, rawNotes.selectionEnd, 'end'); rawNotes.dispatchEvent(new Event('input')); }));
let activePane = 'capture';
function setPane(pane) { activePane = pane; mobileTabs.forEach(button => button.classList.toggle('active', button.dataset.pane === pane)); document.querySelector('.left-rail').classList.toggle('phone-hidden', pane === 'narrative'); document.querySelector('.content').classList.toggle('phone-hidden', pane === 'narrative'); document.querySelector('.right-panel').classList.toggle('phone-hidden', pane !== 'narrative'); }
function setMode(mode) { modeButtons.forEach(button => { const selected = button.dataset.mode === mode; button.classList.toggle('active', selected); button.setAttribute('aria-selected', String(selected)); }); const guided = mode === 'guided'; const grammar = mode === 'grammar'; captureMode.classList.toggle('hidden', guided || grammar); guidedMode.classList.toggle('hidden', !guided); grammarMode.classList.toggle('hidden', !grammar); setPane(mode); }
modeButtons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
// ---- Round 3.5: dictation via the browser's Web Speech API. Depending on
// browser and vendor, recognition may use a remote speech service; nothing is
// sent to this app's server. Where the API is
// unavailable, the control is disabled with a stated reason rather than
// showing a toast that implies a capability that does not exist.
(() => {
  const micButton = document.querySelector('#micButton');
  const micLabel = micButton.querySelector('.mic-label');
  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionClass) {
    micButton.disabled = true;
    micButton.title = 'Dictation is not supported in this browser.';
    return;
  }
  const recognition = new SpeechRecognitionClass();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  let dictating = false;
  recognition.addEventListener('result', event => {
    let finalText = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
    }
    finalText = finalText.trim();
    if (!finalText) return;
    const needsLeadingSpace = rawNotes.value && !/\s$/.test(rawNotes.value);
    rawNotes.setRangeText(`${needsLeadingSpace ? ' ' : ''}${finalText} `, rawNotes.selectionStart, rawNotes.selectionEnd, 'end');
    rawNotes.dispatchEvent(new Event('input'));
  });
  recognition.addEventListener('end', () => { dictating = false; micButton.classList.remove('recording'); micLabel.textContent = 'Dictate'; });
  recognition.addEventListener('error', event => {
    dictating = false;
    micButton.classList.remove('recording');
    micLabel.textContent = 'Dictate';
    showToast(event.error === 'not-allowed' ? 'Microphone access was denied.' : 'Dictation stopped due to an error.');
  });
  micButton.addEventListener('click', () => {
    if (dictating) { recognition.stop(); return; }
    try {
      recognition.start();
      dictating = true;
      micButton.classList.add('recording');
      micLabel.textContent = 'Listening…';
      showToast('Listening — browser/vendor speech processing may be used. Use synthetic notes only.');
    } catch { showToast('Dictation could not start. Try again.'); }
  });
})();
document.querySelector('#copyButton').addEventListener('click', async () => { try { await navigator.clipboard.writeText(narrativePlainText()); logEvent('narrative.copied', 'Copied the current narrative to the clipboard.'); showToast('Demo narrative copied to clipboard'); } catch { showToast('Clipboard access is unavailable in this browser'); } });

const questions = [
  ['INTRODUCTION', 'How did the call begin?', 'Include unit, crew, response mode, dispatch information, and arrival.', 'introduction'],
  ['CHIEF COMPLAINT', 'What did the patient or caller say was wrong?', 'Include exact words when they matter.', 'complaint'],
  ['HISTORY', 'What history or pertinent negatives did you learn?', 'Include medications, allergies, events leading to the call, and denials.', 'history'],
  ['EXAM', 'What did you find on examination?', 'Include general impression, relevant findings, and vital-sign trends.', 'exam'],
  ['ASSESSMENT', 'What was your clinical impression?', 'Document only your own assessment and medical necessity.', 'assessment'],
  ['TREATMENT', 'What interventions did you perform?', 'Include procedures and interventions performed.', 'treatment'],
  ['EVALUATION', 'How did the patient respond and change?', 'Include response to each intervention, repeat vitals, reassessment findings, and condition en route.', 'evaluation'],
  ['DISPOSITION', 'How did transport and transfer of care conclude?', 'Include transport destination, priority, transfer of care, and final patient status.', 'disposition']
];
let current = 0; const answer = document.querySelector('#guidedAnswer');
function renderQuestion() { const q = questions[current]; document.querySelector('.guided-top .eyebrow').textContent = q[0]; document.querySelector('#questionTitle').textContent = q[1]; answer.placeholder = q[2]; document.querySelector('.prompt-index').textContent = String(current + 1).padStart(2, '0'); document.querySelector('#stepNum').textContent = current + 1; document.querySelector('#backButton').hidden = current === 0; document.querySelector('#questionDots').innerHTML = questions.map((_, i) => `<span class="${i === current ? 'active' : ''}"></span>`).join(''); }
function saveAndMove(skip = false) { const q = questions[current]; if (!skip && answer.value.trim()) { if (checkIdentifier(answer.value, 'guided answer')) showToast('Possible identifier detected. Use synthetic details only.'); setNarrative(q[3], answer.value.trim(), { origin: 'user', source: answer.value.trim() }); logEvent('guided.answered', `Answered ${q[0].toLowerCase()}.`); saveDraft(); } updateProgress(); if (current < questions.length - 1) { current++; answer.value = ''; renderQuestion(); } else showToast('Guided details added. Review the source and open questions.'); }
document.querySelector('#nextButton').addEventListener('click', () => saveAndMove()); document.querySelector('#skipButton').addEventListener('click', () => saveAndMove(true)); document.querySelector('#backButton').addEventListener('click', () => { if (current) { current--; answer.value = ''; renderQuestion(); } }); document.querySelectorAll('[data-answer]').forEach(b => b.addEventListener('click', () => { answer.focus(); answer.value += b.dataset.answer; }));
function scrollToSection(key, focus = false) { const section = document.querySelector(`[data-narrative="${key}"]`); section.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (focus) window.setTimeout(() => section.querySelector('p').focus(), 220); }
document.querySelectorAll('.section').forEach(btn => btn.addEventListener('click', () => scrollToSection(btn.dataset.section))); document.querySelectorAll('.spine-node').forEach(node => node.addEventListener('click', () => scrollToSection(node.closest('.narrative-section').dataset.narrative)));
document.querySelector('#narrativeScroll').addEventListener('focusin', event => { const paragraph = event.target.closest('.narrative-section p'); if (!paragraph) return; const section = paragraph.closest('.narrative-section'); const key = section.dataset.narrative; if (paragraph.textContent.trim() === defaultText[key]) { paragraph.textContent = ''; section.dataset.placeholder = 'false'; section.classList.remove('filled'); } });
document.querySelector('#narrativeScroll').addEventListener('paste', event => {
  if (!event.target.closest('.narrative-section p')) return;
  event.preventDefault();
  const text = (event.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, text);
});
document.querySelector('#narrativeScroll').addEventListener('focusout', event => { const paragraph = event.target.closest('.narrative-section p'); if (!paragraph) return; const section = paragraph.closest('.narrative-section'); const key = section.dataset.narrative; const value = paragraph.textContent.trim(); const prior = committedNarrativeValues[key]; if (value !== prior) { setNarrative(key, value || '', { origin: 'user' }); logEvent(value ? 'section.edited' : 'section.cleared', `${section.querySelector('.narrative-label').textContent.trim()} ${value ? 'edited.' : 'cleared.'}`); if (value) checkAbbreviationText(value, `the ${sectionNames[key].toLowerCase()} section`); saveDraft(); } else if (!value) { paragraph.textContent = defaultText[key]; section.dataset.placeholder = 'true'; } updateProgress(); });
questionsList.addEventListener('click', event => { const button = event.target.closest('[data-question]'); if (button) scrollToSection(button.dataset.question, true); });
aiQuestionsList.addEventListener('click', event => { const button = event.target.closest('[data-question]'); if (button) scrollToSection(button.dataset.question, true); });
mobileTabs.forEach(button => button.addEventListener('click', () => { if (location.hash !== '#/workspace') return; if (button.dataset.pane === 'narrative') setPane('narrative'); else setMode(button.dataset.pane); }));
document.querySelector('#narrativeScroll').addEventListener('click', event => { const button = event.target.closest('.source-link'); if (button) showEvidence(button.closest('.narrative-section').dataset.narrative); });
document.querySelector('#finishButton').addEventListener('click', () => { location.hash = '#/review'; logEvent('review.opened', 'Opened review for the current draft.'); });
document.querySelector('#boundaryDetails').addEventListener('click', () => { location.hash = '#/trust'; });
document.querySelectorAll('.utility-menu [data-route]').forEach(link => link.addEventListener('click', () => {
  if (utilityMenu) utilityMenu.open = false;
}));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeDialog(document.querySelector(`#${button.dataset.close}`)))); document.querySelectorAll('.modal').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog && dialog !== demoGate) closeDialog(dialog); }));
document.querySelector('#demoAgreement').addEventListener('change', event => { document.querySelector('#enterDemo').disabled = !event.target.checked; }); document.querySelector('#enterDemo').addEventListener('click', () => { closeDialog(demoGate); logEvent('demo.acknowledged', 'Acknowledged the synthetic-data demo boundary.'); });
document.querySelector('#auditFilter').addEventListener('change', renderAudit); document.querySelector('#downloadAudit').addEventListener('click', () => { const text = auditEvents.map(item => `${item.ts.toISOString()}\t${item.actor}\t${item.event}\t${item.detail}`).join('\n'); const url = URL.createObjectURL(new Blob([text || 'No activity recorded.\n'], { type: 'text/plain' })); const link = document.createElement('a'); link.href = url; link.download = 'fieldnote-audit-log.txt'; link.click(); URL.revokeObjectURL(url); });
document.querySelector('#reviewSections').addEventListener('click', event => { const button = event.target.closest('[data-review-source]'); if (button) showEvidence(button.dataset.reviewSource); });
document.querySelectorAll('[data-review-check]').forEach(check => check.addEventListener('change', () => { updateReviewExports(); logEvent('review.attested', `${check.nextElementSibling.textContent.trim()} ${check.checked ? 'confirmed' : 'cleared'}.`); }));
document.querySelector('#reviewCopy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(narrativePlainText()); logEvent('export.generated', 'Copied review plain text.'); showToast('Review plain text copied to clipboard'); } catch { showToast('Clipboard access is unavailable in this browser'); } });
document.querySelector('#reviewDownload').addEventListener('click', () => { const url = URL.createObjectURL(new Blob([narrativePlainText()], { type: 'text/plain' })); const link = document.createElement('a'); link.href = url; link.download = 'fieldnote-review.txt'; link.click(); URL.revokeObjectURL(url); logEvent('export.generated', 'Downloaded review plain text.'); });
document.querySelector('#reviewPrint').addEventListener('click', () => { logEvent('export.generated', 'Opened print view for review.'); window.print(); });
document.querySelector('#caseStatusFilters').addEventListener('click', event => { const button = event.target.closest('[data-case-status]'); if (!button) return; caseStatus = button.dataset.caseStatus; document.querySelectorAll('[data-case-status]').forEach(chip => chip.classList.toggle('active', chip === button)); renderCases(); }); document.querySelector('#caseTextFilter').addEventListener('input', renderCases); document.querySelector('#casesTableBody').addEventListener('click', event => { const button = event.target.closest('[data-open-case]'); if (button) openFixture(button.dataset.openCase); });
auditVocabulary.forEach(event => document.querySelector('#auditFilter').insertAdjacentHTML('beforeend', `<option value="${event}">${event}</option>`));

// ---- Round 3.3: draft safety. The draft lives in this tab's sessionStorage
// only. It survives an accidental refresh and clears when the tab closes or
// the user clears it. Live controls are synchronized before every snapshot so
// an edit does not depend on blur/focusout firing first.
const draftStorageKey = 'fieldnote-draft-v1';
function syncLiveDraftState() {
  document.querySelectorAll('.narrative-section').forEach(section => {
    const key = section.dataset.narrative;
    const paragraph = section.querySelector('p');
    if (!paragraph || !sectionOrder.includes(key)) return;
    if (!('placeholder' in section.dataset)) section.dataset.placeholder = String(paragraph.textContent.trim() === defaultText[key] && !narrativeValues[key]);
    narrativeValues[key] = section.dataset.placeholder === 'true' ? '' : paragraph.textContent.trim();
  });
  document.querySelectorAll('.refusal-fields textarea[data-field]').forEach(textarea => { refusalFields[textarea.dataset.field] = textarea.value; });
  document.querySelectorAll('#callTimes input[data-field]').forEach(input => { callTimes[input.dataset.field] = input.value; });
}
function serializeDraft() {
  syncLiveDraftState();
  return {
    rawNotes: rawNotes.value,
    narrativeValues: { ...narrativeValues },
    evidenceSources: { ...evidenceSources },
    vitalsSets, medications, procedures,
    callTimes: { ...callTimes },
    refusalFields: { ...refusalFields },
    callType: document.querySelector('#callType').value
  };
}
function saveDraft() { try { sessionStorage.setItem(draftStorageKey, JSON.stringify(serializeDraft())); } catch { /* storage unavailable; the draft simply will not survive a refresh */ } }
function clearDraft() { try { sessionStorage.removeItem(draftStorageKey); } catch { /* nothing to clear */ } }
function rowSeqFromIds(rows) { return rows.reduce((max, row) => Math.max(max, Number(row.id.slice(1)) || 0), 0); }
function normalizeDraftRows(value, fields, prefix) {
  if (!Array.isArray(value)) return [];
  return value.filter(row => row && typeof row === 'object').map((row, index) => {
    const normalized = { id: typeof row.id === 'string' && row.id ? row.id : `${prefix}${index + 1}` };
    fields.forEach(field => { normalized[field] = field === 'controlled' ? Boolean(row[field]) : typeof row[field] === 'string' ? row[field] : ''; });
    return normalized;
  });
}
function draftPayloadHasContent(draft) {
  const textContent = typeof draft?.rawNotes === 'string' && draft.rawNotes.trim()
    || Object.values(draft?.narrativeValues || {}).some(value => typeof value === 'string' && value.trim());
  const hasRows = (rows, fields) => Array.isArray(rows) && rows.some(row => row && fields.some(field => String(row[field] || '').trim()));
  const hasClinical = hasRows(draft?.vitalsSets, vitalsFields.map(([key]) => key))
    || hasRows(draft?.medications, ['drug', 'dose', 'units', 'route', 'time', 'by', 'response', 'waste', 'witness'])
    || hasRows(draft?.procedures, ['procedure', 'time', 'attempts', 'success', 'by'])
    || Object.values(draft?.callTimes || {}).some(value => String(value || '').trim())
    || Object.values(draft?.refusalFields || {}).some(value => String(value || '').trim())
    || Boolean(draft?.callType);
  return Boolean(textContent || hasClinical);
}
function restoreDraft() {
  let draft;
  try {
    const raw = sessionStorage.getItem(draftStorageKey);
    if (!raw) return;
    draft = JSON.parse(raw);
  } catch { return; }
  if (!draft) return;
  if (!draftPayloadHasContent(draft)) return;
  rawNotes.value = draft.rawNotes || '';
  rawNotes.dispatchEvent(new Event('input'));
  sectionOrder.forEach(key => { if (draft.narrativeValues?.[key]) setNarrative(key, draft.narrativeValues[key], { origin: 'user', source: draft.evidenceSources?.[key] || '' }); });
  vitalsSets = normalizeDraftRows(draft.vitalsSets, vitalsFields.map(([key]) => key), 'v'); vitalsSeq = rowSeqFromIds(vitalsSets);
  medications = normalizeDraftRows(draft.medications, ['drug', 'dose', 'units', 'route', 'time', 'by', 'response', 'controlled', 'waste', 'witness'], 'm'); medicationSeq = rowSeqFromIds(medications);
  procedures = normalizeDraftRows(draft.procedures, ['procedure', 'time', 'attempts', 'success', 'by'], 'p'); procedureSeq = rowSeqFromIds(procedures);
  Object.assign(callTimes, draft.callTimes || {});
  document.querySelectorAll('#callTimes input[data-field]').forEach(input => { if (callTimes[input.dataset.field]) input.value = callTimes[input.dataset.field]; });
  Object.assign(refusalFields, draft.refusalFields || {});
  document.querySelectorAll('.refusal-fields textarea[data-field]').forEach(textarea => { if (refusalFields[textarea.dataset.field]) textarea.value = refusalFields[textarea.dataset.field]; });
  if (draft.callType) {
    const select = document.querySelector('#callType');
    select.value = draft.callType;
    document.querySelector('#refusalBlock').hidden = draft.callType !== 'Refusal/AMA';
    followUpQuestions.disposition = dispositionPromptsByCallType[draft.callType] || dispositionPromptsByCallType[''];
  }
  logEvent('draft.restored', 'Restored a draft from this browser tab after a refresh.');
  showToast('Draft restored from this browser tab.');
}
function draftHasContent() {
  syncLiveDraftState();
  return draftPayloadHasContent(serializeDraft());
}
window.addEventListener('beforeunload', event => { if (draftHasContent() || scribeHasContent()) { event.preventDefault(); event.returnValue = ''; } });
document.querySelector('[data-page="workspace"]').addEventListener('input', saveDraft);
document.querySelector('[data-page="workspace"]').addEventListener('change', saveDraft);
document.querySelector('#clearDraftButton').addEventListener('click', () => {
  if (!window.confirm('Clear this draft? Raw notes, narrative, and structured details will be removed from this browser tab. This cannot be undone.')) return;
  clearDraft();
  location.reload();
});

renderQuestion(); setPane(activePane); restoreDraft(); restoreScribeDraft(); if (!scribeSegments.length) renderScribeSegments(); renderScribeDigest(); updateProgress(); renderCases(); renderAudit(); renderVitalsRows(); renderMedicationRows(); renderProcedureRows(); window.addEventListener('hashchange', route); route(); openDialog(demoGate); checkLocalAi();
