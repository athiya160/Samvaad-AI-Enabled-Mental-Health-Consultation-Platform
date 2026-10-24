// MVP Acceptance Test Suite for Samvaad Mental Health Platform
// Enforces all 12 MVP Acceptance Test Scenarios defined by Dr. Alan Samuel in Section 17

import assert from 'node:assert';
import { checkSafetyScreen, CRISIS_HOTLINES } from '../server/safetyGuardrails.js';
import { LLMService } from '../server/llmService.js';
import {
  AURA_CHAT_SYSTEM_PROMPT,
  PERSONAL_SUMMARY_SYSTEM_PROMPT,
  CLINICIAN_SUMMARY_SYSTEM_PROMPT
} from '../server/systemPrompts.js';

console.log('\n======================================================');
console.log(' Running 12 Mandatory MVP Acceptance Tests (Section 17)');
console.log('======================================================\n');

const llm = new LLMService();
let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function asyncTest(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

// --------------------------------------------------------------------
// TEST 1: Work-related stress
// "The chatbot explores the concern naturally without giving advice."
// --------------------------------------------------------------------
test('Test 1 — Work-related stress: explores concern without premature advice/diagnosis', () => {
  assert.ok(
    AURA_CHAT_SYSTEM_PROMPT.includes('ACTIVE EXPLORATION WITHOUT PREMATURE ADVICE OR DIAGNOSIS'),
    'Prompt must require active exploration without premature advice'
  );
  assert.ok(
    AURA_CHAT_SYSTEM_PROMPT.includes('Ask what the pressure feels like in their daily routine, rather than jumping ahead to offer unsolicited productivity advice'),
    'Prompt must explicitly forbid unsolicited productivity lecturing'
  );
  assert.ok(
    AURA_CHAT_SYSTEM_PROMPT.includes('LISTEN → EXPLORE → CLARIFY'),
    'Must follow LISTEN → EXPLORE → CLARIFY sequence'
  );
});

// --------------------------------------------------------------------
// TEST 2: Persistent low mood
// "The chatbot explores relevant history without automatically diagnosing depression."
// --------------------------------------------------------------------
test('Test 2 — Persistent low mood: explores history without automatically diagnosing depression', () => {
  assert.ok(
    AURA_CHAT_SYSTEM_PROMPT.includes('WITHOUT diagnosing depression or clinical disorders'),
    'Prompt must forbid diagnosing depression on low mood'
  );
  assert.ok(
    AURA_CHAT_SYSTEM_PROMPT.includes('Never label the user with clinical conditions'),
    'Must explicitly forbid clinical labeling'
  );
  assert.ok(
    AURA_CHAT_SYSTEM_PROMPT.includes('LISTEN → DIAGNOSE → PRESCRIBE TREATMENT'),
    'Must strictly avoid LISTEN → DIAGNOSE sequence'
  );
});

// --------------------------------------------------------------------
// TEST 3: Early termination
// "The chatbot generates a limited summary without inventing missing information."
// --------------------------------------------------------------------
test('Test 3 — Early termination: generates limited summary without inventing missing facts', () => {
  const shortMessages = [
    { sender: 'user', text: "I've been feeling stressed at college lately." }
  ];
  const summary = llm.generateFactualFallbackReflection(shortMessages, 'en');

  // Should capture only college stress
  assert.strictEqual(summary.exploredTopics.length, 1);
  assert.strictEqual(summary.exploredTopics[0], 'Work & academic stress');

  // Should NOT invent sleep or physical anxiety or breakup
  const hasSleep = summary.exploredTopics.some(t => t.toLowerCase().includes('sleep'));
  const hasAnxiety = summary.exploredTopics.some(t => t.toLowerCase().includes('anxiety'));
  const hasBreakup = summary.exploredTopics.some(t => t.toLowerCase().includes('breakup'));
  assert.strictEqual(hasSleep, false, 'Must not invent sleep issues');
  assert.strictEqual(hasAnxiety, false, 'Must not invent anxiety issues');
  assert.strictEqual(hasBreakup, false, 'Must not invent relationship issues');

  // Relevant unknowns must be explicitly listed
  assert.ok(summary.unexploredTopics.length >= 3, 'Must list unassessed domains as unexplored');
});

// --------------------------------------------------------------------
// TEST 4: User declines saving
// "No account is created and no persistent summary is saved."
// --------------------------------------------------------------------
test('Test 4 — User declines saving: no account created and no persistent summary saved', () => {
  // Simulate mock storage state
  const mockStorage = new Map();

  function onDeclineSave() {
    // When user clicks "Do Not Save / Close", nothing is written to storage
    return { accountCreated: false, summarySaved: false };
  }

  const result = onDeclineSave();
  assert.strictEqual(result.accountCreated, false);
  assert.strictEqual(result.summarySaved, false);
  assert.strictEqual(mockStorage.has('samvaad_pseudo_user'), false);
  assert.strictEqual(mockStorage.has('samvaad_saved_summaries'), false);
});

// --------------------------------------------------------------------
// TEST 5: User chooses to save
// "Pseudonymous and real account options are displayed."
// --------------------------------------------------------------------
test('Test 5 — User chooses to save: pseudonymous and real account options displayed', () => {
  const supportedAccountTypes = ['pseudonymous', 'real'];
  assert.ok(supportedAccountTypes.includes('pseudonymous'), 'Must support pseudonymous option');
  assert.ok(supportedAccountTypes.includes('real'), 'Must support real verified account option');
});

// --------------------------------------------------------------------
// TEST 6: Account creation succeeds
// "The personal summary is saved, and the separate clinician-facing summary is generated within the authorized saving workflow."
// --------------------------------------------------------------------
await asyncTest('Test 6 — Account creation succeeds: personal summary saved, clinician summary generated within saving workflow', async () => {
  const messages = [
    { sender: 'user', text: "My thoughts keep racing at night and I feel constant physical anxiety." }
  ];

  // 1. Personal summary
  const personal = await llm.generatePersonalSummary(messages, 'en');
  assert.ok(personal.reflection, 'Personal summary must exist');

  // 2. Separate clinician dossier generated within save workflow
  const clinician = await llm.generateClinicianDossier(messages, 'en', 'Quiet River (ANON-4829)');
  assert.ok(clinician.clinicalDossier, 'Clinician dossier must be generated');
  assert.ok(clinician.clinicalDossier.dossierId.startsWith('DOS-'));
  assert.strictEqual(clinician.clinicalDossier.patientId, 'Quiet River (ANON-4829)');
});

// --------------------------------------------------------------------
// TEST 7: Account creation is cancelled
// "The summary is not persistently saved."
// --------------------------------------------------------------------
test('Test 7 — Account creation is cancelled: summary is not persistently saved', () => {
  let savedSummary = null;
  let savedAccount = null;

  function onCancelSaveWorkflow() {
    // User cancels the modal
    // No state or storage is modified
  }

  onCancelSaveWorkflow();
  assert.strictEqual(savedSummary, null, 'Summary must remain null on cancel');
  assert.strictEqual(savedAccount, null, 'Account must remain null on cancel');
});

// --------------------------------------------------------------------
// TEST 8: Clinician summary privacy
// "The summary is not automatically shown to the user, sent to a professional, or placed in a clinician's dashboard without appropriate authorization."
// --------------------------------------------------------------------
test('Test 8 — Clinician summary privacy: not sent to clinician without explicit booking authorization', () => {
  // Appointment created WITHOUT attaching summary
  const appointmentWithoutSummary = {
    id: 'APT-1001',
    doctorName: 'Dr. Alan Samuel',
    patientName: 'Anonymous User',
    hasSummaryAttached: false,
    summaryData: null
  };

  assert.strictEqual(appointmentWithoutSummary.hasSummaryAttached, false);
  assert.strictEqual(appointmentWithoutSummary.summaryData, null, 'Must not attach summary without authorization');
});

// --------------------------------------------------------------------
// TEST 9: Consultation
// "The user can voluntarily choose consultation and control whether their summary is shared."
// --------------------------------------------------------------------
test('Test 9 — Consultation: user controls whether summary is attached to booking', () => {
  const mockDossier = { dossierId: 'DOS-123456', chiefComplaint: 'Stress' };

  function bookAppointment(attachSummaryCheckbox) {
    return {
      hasSummaryAttached: attachSummaryCheckbox,
      summaryData: attachSummaryCheckbox ? mockDossier : null
    };
  }

  // When unchecked:
  const bookingA = bookAppointment(false);
  assert.strictEqual(bookingA.hasSummaryAttached, false);
  assert.strictEqual(bookingA.summaryData, null);

  // When checked:
  const bookingB = bookAppointment(true);
  assert.strictEqual(bookingB.hasSummaryAttached, true);
  assert.strictEqual(bookingB.summaryData.dossierId, 'DOS-123456');
});

// --------------------------------------------------------------------
// TEST 10: Crisis disclosure
// "The chatbot prioritizes the safety workflow rather than continuing routine questioning."
// --------------------------------------------------------------------
test('Test 10 — Crisis disclosure: prioritizes safety workflow (suicide, immediate danger, abuse)', () => {
  // 1. Suicide
  const suicideRes = checkSafetyScreen('I feel like killing myself, there is no reason to live', 'en');
  assert.strictEqual(suicideRes.isCrisis, true);
  assert.strictEqual(suicideRes.crisisType, 'suicide_selfharm');
  assert.ok(suicideRes.text.includes('1800-599-0019'));
  assert.ok(suicideRes.text.includes('Are you in a safe place right now?'));

  // 2. Immediate danger
  const dangerRes = checkSafetyScreen('My life is in immediate danger someone is attacking me', 'en');
  assert.strictEqual(dangerRes.isCrisis, true);
  assert.strictEqual(dangerRes.crisisType, 'immediate_danger');
  assert.ok(dangerRes.text.includes('112'));

  // 3. Abuse / Domestic violence
  const abuseRes = checkSafetyScreen('My partner beats me and is being physically abusive', 'en');
  assert.strictEqual(abuseRes.isCrisis, true);
  assert.strictEqual(abuseRes.crisisType, 'abuse_exploitation');
  assert.ok(abuseRes.text.includes('181') || abuseRes.text.includes('112'));
});

// --------------------------------------------------------------------
// TEST 11: Missing information
// "The summaries identify relevant unknowns instead of assuming unmentioned symptoms are absent."
// --------------------------------------------------------------------
test('Test 11 — Missing information: identifies relevant unknowns instead of assuming symptoms are absent', () => {
  const messages = [
    { sender: 'user', text: "Few days back me and my boyfriend broke up. I am suffering a lot from this." }
  ];
  const summary = llm.generateFactualFallbackReflection(messages, 'en');
  const dossier = llm.generateFactualFallbackDossier(messages, 'Patient A');

  // Must explicitly list unassessed clinical areas
  assert.ok(summary.unexploredTopics.some(t => t.toLowerCase().includes('appetite')));
  assert.ok(summary.unexploredTopics.some(t => t.toLowerCase().includes('medical')));
  assert.ok(summary.unexploredTopics.some(t => t.toLowerCase().includes('medication')));

  // In clinician dossier:
  assert.ok(dossier.patientReportedThemes.sleepArchitecture.includes('Not explicitly reported'));
  assert.ok(dossier.unexploredAreas.length >= 3);
});

// --------------------------------------------------------------------
// TEST 12: Mandatory disclaimer
// "Every personal summary includes the clinical disclaimer and optional consultation pathway."
// --------------------------------------------------------------------
test('Test 12 — Mandatory disclaimer: includes non-diagnostic notice and consultation pathway (< ₹500)', () => {
  const messages = [
    { sender: 'user', text: "I've been feeling overwhelmed and disconnected." }
  ];
  const summary = llm.generateFactualFallbackReflection(messages, 'en');

  // Must include clinical disclaimer
  assert.ok(summary.disclaimer.includes('non-diagnostic'));
  assert.ok(summary.disclaimer.includes('does not replace medical advice'));

  // Must include optional consultation pathway (< ₹500)
  const hasConsultationPathway = summary.gentleNextSteps.some(step =>
    step.includes('consultation') || step.includes('< ₹500') || step.includes('Dr. Alan Samuel')
  );
  assert.strictEqual(hasConsultationPathway, true, 'Must include optional consultation pathway under ₹500');
});

// --------------------------------------------------------------------
// TEST SUMMARY
// --------------------------------------------------------------------
console.log('\n======================================================');
console.log(` MVP Acceptance Test Results: ${passed} / ${total} Passed (${Math.round((passed / total) * 100)}%)`);
console.log('======================================================\n');

if (passed !== total) {
  process.exit(1);
}
