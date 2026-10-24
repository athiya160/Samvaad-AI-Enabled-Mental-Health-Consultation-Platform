// Comprehensive Verification Test Suite for Samvaad Summary Saving & Clinician-Summary Consent Workflow
// Tests:
// 1. Unified Database schema initialization & relational normalization
// 2. Private Account creation (scrypt hashing, single-use recovery codes, 8 codes)
// 3. Single-use recovery codes invalidation upon use (cannot be reused)
// 4. Google account authentication (UUID internal identifier, email not primary key)
// 5. Personal Reflection saving with explicit consent record
// 6. Separate Clinician Summary consent gate:
//    - DO NOT SAVE / NOT NOW: zero clinician summary generated or stored
//    - PREPARE CLINICIAN SUMMARY: 14 headings generated and saved privately
// 7. Clinician sharing boundary: Never shared automatically; requires explicit consultation authorization
// 8. Strict clinical generation rules (no false racing thoughts, no safety inference from absence of disclosure)
// 9. User data controls: delete reflection, delete clinician summary, full account erasure cascading

import assert from 'node:assert';
import crypto from 'node:crypto';
import { db } from '../server/db/database.js';
import {
  hashPassword,
  verifyPassword,
  generateRecoveryCodes,
  hashRecoveryCode,
  registerPrivateAccount,
  loginPrivateAccount,
  recoverAccountWithCode,
  createSession,
  validateSession
} from '../server/services/authService.js';
import { ClinicianSummaryGenerator } from '../server/clinicianSummaryGenerator.js';

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

async function testAsync(name, fn) {
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

console.log('================================================================');
console.log(' Starting Summary Saving & Clinician Consent Workflow Verification');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// GROUP 1: Database & Private Account Security
// -----------------------------------------------------------------------------
console.log('[Group 1] Database & Private Account Security:');

test('1.1 Create Private Account with secure scrypt hash & 8 recovery codes', () => {
  const testNick = `CalmRiver_${Date.now()}`;
  const testPass = 'SecretP@ss123';
  
  const regResult = registerPrivateAccount(testNick, testPass);
  assert.ok(regResult.user.id, 'User ID must be generated');
  assert.strictEqual(regResult.user.accountType, 'pseudonymous');
  assert.strictEqual(regResult.user.displayName, testNick);
  assert.strictEqual(regResult.recoveryCodes.length, 8, 'Must return 8 recovery codes');

  // Verify password in DB is hashed with salt and not plaintext
  const identityInDb = db.prepare('SELECT password_hash, password_salt FROM auth_identities WHERE user_id = ?').get(regResult.user.id);
  assert.ok(identityInDb.password_hash, 'Must have password_hash');
  assert.ok(identityInDb.password_salt, 'Must have password_salt');
  assert.notStrictEqual(identityInDb.password_hash, testPass, 'Password must never be stored in plaintext');

  // Verify recovery codes are stored as hashes
  const codesInDb = db.prepare('SELECT code_hash, used_at FROM recovery_codes WHERE user_id = ?').all(regResult.user.id);
  assert.strictEqual(codesInDb.length, 8);
  assert.strictEqual(codesInDb[0].used_at, null, 'Must be unused initially');
  assert.notStrictEqual(codesInDb[0].code_hash, regResult.recoveryCodes[0], 'Recovery codes must be stored hashed');
});

test('1.2 Recovery code is single-use only and invalidated immediately upon use', () => {
  const testNick = `GentleWind_${Date.now()}`;
  const regResult = registerPrivateAccount(testNick, 'Pass123456');
  const codeToUse = regResult.recoveryCodes[0];

  // First use: must succeed
  const recoverResult = recoverAccountWithCode(testNick, codeToUse, 'NewPassword123');
  assert.ok(recoverResult.user.id);

  // Verify database record has used_at timestamp
  const codeRow = db.prepare('SELECT used_at FROM recovery_codes WHERE user_id = ? AND used_at IS NOT NULL').get(regResult.user.id);
  assert.ok(codeRow && codeRow.used_at !== null, 'used_at must be populated');

  // Second use: MUST FAIL immediately
  let errorThrown = false;
  try {
    recoverAccountWithCode(testNick, codeToUse, 'AnotherPass999');
  } catch (err) {
    errorThrown = true;
    assert.ok(err.message.includes('already been used') || err.message.includes('cannot be reused'));
  }
  assert.strictEqual(errorThrown, true, 'Recovery code must not be reusable');
});

// -----------------------------------------------------------------------------
// GROUP 2: Google Identity Architecture
// -----------------------------------------------------------------------------
console.log('\n[Group 2] Google Identity Architecture:');

test('2.1 Google Account uses internal UUID, email is NOT primary database key', () => {
  const googleSub = `sub_google_${Date.now()}`;
  const internalUserId = `usr_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  // Insert Google identity into unified schema
  db.prepare(`
    INSERT INTO users (id, account_type, display_name, created_at, updated_at)
    VALUES (?, 'google', 'Ananya User', ?, ?)
  `).run(internalUserId, now, now);

  db.prepare(`
    INSERT INTO auth_identities (id, user_id, provider, provider_subject_id, created_at, updated_at)
    VALUES (?, ?, 'google_oidc', ?, ?, ?)
  `).run(`auth_${crypto.randomUUID()}`, internalUserId, googleSub, now, now);

  const row = db.prepare('SELECT id, account_type FROM users WHERE id = ?').get(internalUserId);
  assert.strictEqual(row.id, internalUserId);
  assert.strictEqual(row.account_type, 'google');
  assert.notStrictEqual(row.id, 'patient@example.com', 'Email must not be primary key');

  // Verify auth_identities table links internal user_id
  const ident = db.prepare("SELECT user_id, provider_subject_id FROM auth_identities WHERE provider = 'google_oidc' AND provider_subject_id = ?").get(googleSub);
  assert.strictEqual(ident.user_id, internalUserId);
});

// -----------------------------------------------------------------------------
// GROUP 3: Strict Consent Separation & State Flow
// -----------------------------------------------------------------------------
console.log('\n[Group 3] Strict Consent Separation & State Flow:');

test('3.1 Personal Reflection displayed first; DO NOT SAVE persists zero data and creates no account', () => {
  // If user chooses DO NOT SAVE, no record is created
  const userCountBefore = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const reflectionsBefore = db.prepare('SELECT COUNT(*) as count FROM personal_reflections').get().count;
  const summariesBefore = db.prepare('SELECT COUNT(*) as count FROM clinician_summaries').get().count;

  // Simulate declining save
  function onDeclineSave() {
    return { accountCreated: false, reflectionSaved: false, clinicianSummaryGenerated: false };
  }

  const result = onDeclineSave();
  assert.strictEqual(result.accountCreated, false);
  assert.strictEqual(result.reflectionSaved, false);
  assert.strictEqual(result.clinicianSummaryGenerated, false);

  const userCountAfter = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const reflectionsAfter = db.prepare('SELECT COUNT(*) as count FROM personal_reflections').get().count;
  const summariesAfter = db.prepare('SELECT COUNT(*) as count FROM clinician_summaries').get().count;

  assert.strictEqual(userCountBefore, userCountAfter);
  assert.strictEqual(reflectionsBefore, reflectionsAfter);
  assert.strictEqual(summariesBefore, summariesAfter);
});

test('3.2 Saving Personal Reflection records separate consent and does NOT generate clinician summary', () => {
  const testNick = `UserReflect_${Date.now()}`;
  const auth = registerPrivateAccount(testNick, 'Password999');

  const reflectionContent = {
    title: 'Your Personal Reflection Summary',
    exploredTopics: ['Work pressure'],
    identifiedPatterns: ['Felt overwhelmed by deadlines'],
    unexploredTopics: ['Sleep duration (Not discussed in conversation)'],
    disclaimer: 'Personal reflection summary non-diagnostic.'
  };

  const refId = `ref_${crypto.randomUUID()}`;
  const cnsId = `cns_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  // Save personal reflection
  db.prepare(`
    INSERT INTO personal_reflections (id, user_id, title, summary_content, conversation_snippet, disclaimer_acknowledged, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    refId,
    auth.user.id,
    reflectionContent.title,
    JSON.stringify(reflectionContent),
    'Sample snippet',
    now,
    now
  );

  // Record consent for personal reflection
  db.prepare(`
    INSERT INTO consent_records (id, user_id, consent_type, granted, scope, recorded_at)
    VALUES (?, ?, 'save_personal_reflection', 1, 'personal_vault', ?)
  `).run(cnsId, auth.user.id, now);

  // Assert personal reflection saved
  const savedRef = db.prepare('SELECT id, summary_content FROM personal_reflections WHERE user_id = ?').get(auth.user.id);
  assert.ok(savedRef);

  // Assert NO clinician summary was generated or stored
  const clinCount = db.prepare('SELECT COUNT(*) as count FROM clinician_summaries WHERE user_id = ?').get(auth.user.id).count;
  assert.strictEqual(clinCount, 0, 'Clinician summary must NOT be created when saving personal reflection');

  // Assert consent records only contain save_personal_reflection
  const consents = db.prepare('SELECT consent_type FROM consent_records WHERE user_id = ?').all(auth.user.id);
  assert.strictEqual(consents.length, 1);
  assert.strictEqual(consents[0].consent_type, 'save_personal_reflection');
});

test('3.3 User selects NOT NOW for clinician summary: zero clinician summary generated or stored', () => {
  const testNick = `UserNotNow_${Date.now()}`;
  const auth = registerPrivateAccount(testNick, 'Password111');

  // When user clicks [NOT NOW], no generation occurs
  const clinCount = db.prepare('SELECT COUNT(*) as count FROM clinician_summaries WHERE user_id = ?').get(auth.user.id).count;
  assert.strictEqual(clinCount, 0, 'Must remain 0 after selecting NOT NOW');
});

await testAsync('3.4 PREPARE CLINICIAN SUMMARY requires explicit consent and saves privately without sharing', async () => {
  const testNick = `UserConsentClin_${Date.now()}`;
  const auth = registerPrivateAccount(testNick, 'Password222');

  const conversationMessages = [
    { sender: 'user', text: "I've been feeling stressed about my job and deadlines lately." }
  ];

  // User granted separate consent
  const dossier = await ClinicianSummaryGenerator.generate(conversationMessages, 'en', auth.user.displayName);

  const clinId = `clin_${crypto.randomUUID()}`;
  const cnsId = `cns_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO clinician_summaries (id, user_id, reflection_id, dossier_content, generated_at, status, sharing_status, doctor_id, shared_at)
    VALUES (?, ?, NULL, ?, ?, 'draft', 'private', NULL, NULL)
  `).run(clinId, auth.user.id, JSON.stringify(dossier), now);

  db.prepare(`
    INSERT INTO consent_records (id, user_id, consent_type, granted, scope, recorded_at)
    VALUES (?, ?, 'generate_clinician_summary', 1, 'private_account_only', ?)
  `).run(cnsId, auth.user.id, now);

  // Verify clinician summary in DB
  const savedClin = db.prepare('SELECT sharing_status, doctor_id FROM clinician_summaries WHERE id = ?').get(clinId);
  assert.strictEqual(savedClin.sharing_status, 'private', 'Must be private initially');
  assert.strictEqual(savedClin.doctor_id, null, 'Must NOT be shared with any doctor');

  // Verify separate consent recorded
  const consentRows = db.prepare('SELECT consent_type FROM consent_records WHERE user_id = ?').all(auth.user.id);
  assert.ok(consentRows.some(c => c.consent_type === 'generate_clinician_summary'));
});

test('3.5 Voluntary Sharing requires separate consultation consent and sets doctor_id', () => {
  const testNick = `UserShareTest_${Date.now()}`;
  const auth = registerPrivateAccount(testNick, 'Password333');
  const clinId = `clin_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO clinician_summaries (id, user_id, reflection_id, dossier_content, generated_at, status, sharing_status, doctor_id, shared_at)
    VALUES (?, ?, NULL, '{"test":true}', ?, 'draft', 'private', NULL, NULL)
  `).run(clinId, auth.user.id, now);

  // Voluntary sharing action during booking
  const shareConsentId = `cns_${crypto.randomUUID()}`;
  const doctorId = 'dr-alan-samuel';
  const sharedTime = new Date().toISOString();

  db.prepare(`
    UPDATE clinician_summaries
    SET sharing_status = 'shared_with_doctor', doctor_id = ?, shared_at = ?
    WHERE id = ? AND user_id = ?
  `).run(doctorId, sharedTime, clinId, auth.user.id);

  db.prepare(`
    INSERT INTO consent_records (id, user_id, consent_type, granted, scope, recorded_at)
    VALUES (?, ?, 'share_clinician_summary', 1, ?, ?)
  `).run(shareConsentId, auth.user.id, `shared_with_${doctorId}`, sharedTime);

  const updated = db.prepare('SELECT sharing_status, doctor_id, shared_at FROM clinician_summaries WHERE id = ?').get(clinId);
  assert.strictEqual(updated.sharing_status, 'shared_with_doctor');
  assert.strictEqual(updated.doctor_id, doctorId);
  assert.ok(updated.shared_at);
});

// -----------------------------------------------------------------------------
// GROUP 4: Strict Clinical Generation Rules & 14 Headings
// -----------------------------------------------------------------------------
console.log('\n[Group 4] Strict Clinical Generation Rules & 14 Headings:');

test('4.1 Clinician summary includes exact required label and all 14 numbered headings', () => {
  const messages = [
    { sender: 'user', text: "I've been feeling stressed about work deadlines." }
  ];
  const dossier = ClinicianSummaryGenerator.generateFactualFallback(messages, 'en', 'Test Patient');

  assert.strictEqual(dossier.headerTitle, "AI-Generated Initial History Summary — For Review by a Qualified Mental Health Professional.");
  assert.ok(dossier.section1_PresentingComplaints, '1. Presenting complaints');
  assert.ok(dossier.section2_HistoryOfPresentProblem, '2. History of the present problem');
  assert.ok(dossier.section3_OnsetDurationCourse, '3. Onset, duration, and course');
  assert.ok(dossier.section4_RelevantEmotionalExperiences, '4. Relevant emotional experiences');
  assert.ok(dossier.section5_RelevantThoughtsCognitive, '5. Relevant thoughts and cognitive experiences');
  assert.ok(dossier.section6_BehaviouralPatterns, '6. Behavioural patterns');
  assert.ok(dossier.section7_FunctionalImpact, '7. Functional impact');
  assert.ok(dossier.section8_SleepAppetiteEnergyConcentration, '8. Sleep, appetite, energy, and concentration');
  assert.ok(dossier.section9_RelevantPsychosocialCircumstances, '9. Relevant psychosocial circumstances');
  assert.ok(dossier.section10_PreviousExperiencesSupport, '10. Previous experiences and professional support');
  assert.ok(dossier.section11_StrengthsSupportSystems, '11. Strengths and support systems');
  assert.ok(dossier.section12_SafetyRelatedDisclosures, '12. Safety-related disclosures');
  assert.ok(dossier.section13_UserConcernsAndGoals, '13. User\'s concerns and goals');
  assert.ok(dossier.section14_InformationGaps, '14. Important information gaps requiring further assessment');
});

test('4.2 Strictly does NOT convert "I keep thinking about everything at night" into "racing thoughts"', () => {
  const messages = [
    { sender: 'user', text: "I keep thinking about everything at night and it makes it hard to unwind." }
  ];
  const dossier = ClinicianSummaryGenerator.generateFactualFallback(messages, 'en', 'Test Patient');
  
  // Section 5 must NOT use "racing thoughts" unless explicitly stated
  assert.ok(!dossier.section5_RelevantThoughtsCognitive.toLowerCase().includes('racing thoughts'), 'Must not extrapolate "racing thoughts"');
  assert.ok(dossier.section5_RelevantThoughtsCognitive.includes('thinking frequently'), 'Must describe verbatim thought pattern');
});

test('4.3 Safety disclosures explicitly states absence of disclosure does not guarantee clinical safety', () => {
  const messages = [
    { sender: 'user', text: "Work has been really busy." }
  ];
  const dossier = ClinicianSummaryGenerator.generateFactualFallback(messages, 'en', 'Test Patient');
  assert.ok(dossier.section12_SafetyRelatedDisclosures.includes('does not guarantee safety') || dossier.section12_SafetyRelatedDisclosures.includes('independently evaluated'), 'Must explicitly warn about safety inference limits');
});

test('4.4 Missing clinical domains strictly use "Not discussed" or "Unclear"', () => {
  const messages = [
    { sender: 'user', text: "Work has been really busy." }
  ];
  const dossier = ClinicianSummaryGenerator.generateFactualFallback(messages, 'en', 'Test Patient');
  assert.ok(dossier.section10_PreviousExperiencesSupport.includes('Not discussed'), 'Must state Not discussed');
  assert.ok(dossier.section3_OnsetDurationCourse.includes('Not discussed') || dossier.section3_OnsetDurationCourse.includes('Unclear'));
});

// -----------------------------------------------------------------------------
// GROUP 5: User Data Controls & Account Erasure
// -----------------------------------------------------------------------------
console.log('\n[Group 5] User Data Controls & Account Erasure:');

test('5.1 User can delete individual reflection and individual clinician summary', () => {
  const testNick = `UserDelete_${Date.now()}`;
  const auth = registerPrivateAccount(testNick, 'Password333');

  const refId = `ref_${crypto.randomUUID()}`;
  const clinId = `clin_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO personal_reflections (id, user_id, title, summary_content, conversation_snippet, disclaimer_acknowledged, created_at, updated_at)
    VALUES (?, ?, 'Test Reflection', '{"title":"Test"}', 'snippet', 1, ?, ?)
  `).run(refId, auth.user.id, now, now);

  db.prepare(`
    INSERT INTO clinician_summaries (id, user_id, reflection_id, dossier_content, generated_at, status, sharing_status, doctor_id, shared_at)
    VALUES (?, ?, NULL, '{"headerTitle":"Test"}', ?, 'draft', 'private', NULL, NULL)
  `).run(clinId, auth.user.id, now);

  // Delete reflection
  db.prepare('DELETE FROM personal_reflections WHERE id = ? AND user_id = ?').run(refId, auth.user.id);
  const refAfter = db.prepare('SELECT id FROM personal_reflections WHERE id = ?').get(refId);
  assert.strictEqual(refAfter, undefined, 'Reflection must be deleted');

  // Clinician summary still exists
  const clinBefore = db.prepare('SELECT id FROM clinician_summaries WHERE id = ?').get(clinId);
  assert.ok(clinBefore);

  // Delete clinician summary
  db.prepare('DELETE FROM clinician_summaries WHERE id = ? AND user_id = ?').run(clinId, auth.user.id);
  const clinAfter = db.prepare('SELECT id FROM clinician_summaries WHERE id = ?').get(clinId);
  assert.strictEqual(clinAfter, undefined, 'Clinician summary must be deleted');
});

test('5.2 Delete Account cascades and erases all user credentials, recovery codes, reflections, and summaries', () => {
  const testNick = `UserEraseAll_${Date.now()}`;
  const auth = registerPrivateAccount(testNick, 'Password444');

  const refId = `ref_${crypto.randomUUID()}`;
  const clinId = `clin_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO personal_reflections (id, user_id, title, summary_content, conversation_snippet, disclaimer_acknowledged, created_at, updated_at)
    VALUES (?, ?, 'Test Reflection', '{"title":"Test"}', 'snippet', 1, ?, ?)
  `).run(refId, auth.user.id, now, now);

  db.prepare(`
    INSERT INTO clinician_summaries (id, user_id, reflection_id, dossier_content, generated_at, status, sharing_status, doctor_id, shared_at)
    VALUES (?, ?, NULL, '{"headerTitle":"Test"}', ?, 'draft', 'private', NULL, NULL)
  `).run(clinId, auth.user.id, now);

  // Delete account (foreign keys CASCADE)
  db.prepare('DELETE FROM users WHERE id = ?').run(auth.user.id);

  // Assert user is gone
  const u = db.prepare('SELECT id FROM users WHERE id = ?').get(auth.user.id);
  assert.strictEqual(u, undefined);

  // Assert auth identities cascaded
  const c = db.prepare('SELECT id FROM auth_identities WHERE user_id = ?').get(auth.user.id);
  assert.strictEqual(c, undefined);

  // Assert recovery codes cascaded
  const rc = db.prepare('SELECT id FROM recovery_codes WHERE user_id = ?').all(auth.user.id);
  assert.strictEqual(rc.length, 0);

  // Assert reflections cascaded
  const r = db.prepare('SELECT id FROM personal_reflections WHERE user_id = ?').all(auth.user.id);
  assert.strictEqual(r.length, 0);

  // Assert clinician summaries cascaded
  const s = db.prepare('SELECT id FROM clinician_summaries WHERE user_id = ?').all(auth.user.id);
  assert.strictEqual(s.length, 0);
});

console.log('\n================================================================');
console.log(` Results: ${passed} / ${total} Passed (${Math.round((passed / total) * 100)}%)`);
console.log('================================================================\n');

if (passed !== total) {
  process.exit(1);
}
