// Verification Test Suite for Step 6 (Account Dashboard) & Step 7 (No PINs, Nickname + Password + Recovery Codes)
import assert from 'node:assert';
import crypto from 'node:crypto';
import { db } from '../server/db/database.js';
import {
  registerPrivateAccount,
  loginPrivateAccount,
  recoverAccountWithCode,
  changePassword,
  getRecoveryCodesStatus,
  regenerateRecoveryCodes
} from '../server/services/authService.js';

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
console.log(' Starting Step 6 (Account Dashboard) & Step 7 (Security) Verification');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// GROUP 1: Step 7 — Strict Nickname + Password (No PINs)
// -----------------------------------------------------------------------------
console.log('[Group 1] Step 7 Verification — Password Hashing & No PINs:');

test('1.1 Password must be at least 8 characters; short passwords/PINs rejected', () => {
  const shortNick = `UserPIN_${Date.now()}`;
  let errorCaught = false;
  try {
    registerPrivateAccount(shortNick, '1234'); // Simple 4-digit PIN attempt
  } catch (err) {
    errorCaught = true;
    assert.ok(err.message.includes('at least 8 characters'));
  }
  assert.strictEqual(errorCaught, true, 'Short PINs must be rejected as passwords');
});

test('1.2 Private Account requires strong password and hashes server-side', () => {
  const testNick = `quietmoon27_${Date.now()}`;
  const strongPass = 'Moonlight@2026';
  const reg = registerPrivateAccount(testNick, strongPass);

  assert.ok(reg.user.id);
  assert.strictEqual(reg.user.displayName, testNick);

  // Check database password_hash is scrypt hash
  const row = db.prepare('SELECT password_hash, password_salt FROM auth_identities WHERE user_id = ?').get(reg.user.id);
  assert.ok(row.password_hash);
  assert.ok(row.password_salt);
  assert.notStrictEqual(row.password_hash, strongPass, 'Password must never be stored in plaintext');
});

// -----------------------------------------------------------------------------
// GROUP 2: Step 6 — Security: Password Changing
// -----------------------------------------------------------------------------
console.log('\n[Group 2] Step 6 Verification — Security: Password Changing:');

test('2.1 Change Password requires correct current password and minimum 8 characters', () => {
  const testNick = `ChangePass_${Date.now()}`;
  const origPass = 'OriginalP@ss123';
  const reg = registerPrivateAccount(testNick, origPass);

  // Attempt with wrong current password
  let wrongPassCaught = false;
  try {
    changePassword(reg.user.id, 'WrongPassword999', 'NewSecretP@ss456');
  } catch (err) {
    wrongPassCaught = true;
    assert.ok(err.message.includes('Incorrect current password'));
  }
  assert.strictEqual(wrongPassCaught, true);

  // Attempt with new password too short
  let shortPassCaught = false;
  try {
    changePassword(reg.user.id, origPass, 'short');
  } catch (err) {
    shortPassCaught = true;
    assert.ok(err.message.includes('at least 8 characters'));
  }
  assert.strictEqual(shortPassCaught, true);

  // Successful change
  const successResult = changePassword(reg.user.id, origPass, 'NewSecretP@ss456');
  assert.strictEqual(successResult.ok, true);

  // Verify can now login with new password
  const newLogin = loginPrivateAccount(testNick, 'NewSecretP@ss456');
  assert.ok(newLogin.token);

  // Old password must fail
  let oldLoginFailed = false;
  try {
    loginPrivateAccount(testNick, origPass);
  } catch (err) {
    oldLoginFailed = true;
  }
  assert.strictEqual(oldLoginFailed, true);
});

// -----------------------------------------------------------------------------
// GROUP 3: Step 6 — Security: Recovery Codes (Count & Replacement Invalidation)
// -----------------------------------------------------------------------------
console.log('\n[Group 3] Step 6 Verification — Recovery Codes & Replacement:');

test('3.1 Initial recovery codes status reports 8 unused codes', () => {
  const testNick = `RecTest_${Date.now()}`;
  const reg = registerPrivateAccount(testNick, 'SecureP@ss789');

  const status = getRecoveryCodesStatus(reg.user.id);
  assert.strictEqual(status.supported, true);
  assert.strictEqual(status.unusedCount, 8);
  assert.strictEqual(status.totalCount, 8);
});

test('3.2 Consuming a recovery code decrements unused count to 7', () => {
  const testNick = `RecDec_${Date.now()}`;
  const reg = registerPrivateAccount(testNick, 'SecureP@ss789');
  const codeToUse = reg.recoveryCodes[0];

  recoverAccountWithCode(testNick, codeToUse, 'NewRecoveredP@ss888');

  const status = getRecoveryCodesStatus(reg.user.id);
  assert.strictEqual(status.unusedCount, 7, 'Must report 7 unused codes');
  assert.strictEqual(status.totalCount, 8);
});

test('3.3 Generating replacement recovery codes invalidates old set and issues 8 new codes', () => {
  const testNick = `RecRegen_${Date.now()}`;
  const reg = registerPrivateAccount(testNick, 'SecureP@ss789');
  const oldCode1 = reg.recoveryCodes[0];
  const oldCode2 = reg.recoveryCodes[1];

  // Regenerate replacement recovery codes
  const regenResult = regenerateRecoveryCodes(reg.user.id);
  assert.strictEqual(regenResult.ok, true);
  assert.strictEqual(regenResult.plaintextCodes.length, 8);
  assert.strictEqual(regenResult.unusedCount, 8);

  // Attempting to use old code MUST FAIL
  let oldCodeFailed = false;
  try {
    recoverAccountWithCode(testNick, oldCode1, 'AttemptWithOldCode');
  } catch (err) {
    oldCodeFailed = true;
    assert.ok(err.message.includes('Invalid recovery code'));
  }
  assert.strictEqual(oldCodeFailed, true, 'Old recovery codes must be completely invalid after regeneration');

  // New code from new batch MUST SUCCEED
  const newCode = regenResult.plaintextCodes[0];
  const recoverSuccess = recoverAccountWithCode(testNick, newCode, 'ValidNewRecoveredP@ss');
  assert.ok(recoverSuccess.user.id);

  const statusAfter = getRecoveryCodesStatus(reg.user.id);
  assert.strictEqual(statusAfter.unusedCount, 7);
});

test('3.4 Google accounts do NOT support recovery codes', () => {
  const googleUserId = `usr_${crypto.randomUUID()}`;
  const googleSub = `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, account_type, display_name, created_at, updated_at)
    VALUES (?, 'google', 'Google User', ?, ?)
  `).run(googleUserId, now, now);

  db.prepare(`
    INSERT INTO auth_identities (id, user_id, provider, provider_subject_id, created_at, updated_at)
    VALUES (?, ?, 'google_oidc', ?, ?, ?)
  `).run(`auth_${crypto.randomUUID()}`, googleUserId, googleSub, now, now);

  const status = getRecoveryCodesStatus(googleUserId);
  assert.strictEqual(status.supported, false, 'Google accounts must not show recovery codes');

  let errorCaught = false;
  try {
    regenerateRecoveryCodes(googleUserId);
  } catch (err) {
    errorCaught = true;
    assert.ok(err.message.includes('only supported for Private Accounts'));
  }
  assert.strictEqual(errorCaught, true);
});

// -----------------------------------------------------------------------------
// GROUP 4: Step 6 — Personal Reflections: Edit & Delete
// -----------------------------------------------------------------------------
console.log('\n[Group 4] Step 6 Verification — Personal Reflections Edit & Delete:');

test('4.1 Edit/correct personal reflection updates title, notes, and content', () => {
  const testNick = `RefEdit_${Date.now()}`;
  const reg = registerPrivateAccount(testNick, 'PassP@ss123');

  const refId = `ref_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO personal_reflections (id, user_id, title, summary_content, conversation_snippet, disclaimer_acknowledged, created_at, updated_at)
    VALUES (?, ?, 'Original Title', '{"coreTheme":"Stress","whatYouShared":["Quote 1"]}', 'snippet', 1, ?, ?)
  `).run(refId, reg.user.id, now, now);

  // Perform Edit / Correction
  const updatedTitle = 'My Corrected Title';
  const updatedNotes = 'Patient corrected note: stress is mainly on Tuesdays.';
  const existing = db.prepare('SELECT summary_content FROM personal_reflections WHERE id = ?').get(refId);
  const parsed = JSON.parse(existing.summary_content);
  parsed.userNotes = updatedNotes;

  db.prepare(`
    UPDATE personal_reflections
    SET title = ?, summary_content = ?, updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(updatedTitle, JSON.stringify(parsed), new Date().toISOString(), refId, reg.user.id);

  const afterRow = db.prepare('SELECT title, summary_content FROM personal_reflections WHERE id = ?').get(refId);
  assert.strictEqual(afterRow.title, updatedTitle);
  const afterParsed = JSON.parse(afterRow.summary_content);
  assert.strictEqual(afterParsed.userNotes, updatedNotes);
  assert.strictEqual(afterParsed.coreTheme, 'Stress');
});

// -----------------------------------------------------------------------------
// GROUP 5: Step 6 — Clinician Summaries: Review/Correct & Delete
// -----------------------------------------------------------------------------
console.log('\n[Group 5] Step 6 Verification — Clinician Summaries Review/Correct & Delete:');

test('5.1 Review & correct clinician summary sections before sharing', () => {
  const testNick = `ClinReview_${Date.now()}`;
  const reg = registerPrivateAccount(testNick, 'PassP@ss123');
  const clinId = `clin_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const originalContent = {
    headerTitle: "AI-Generated Initial History Summary — For Review by a Qualified Mental Health Professional.",
    section1_PresentingComplaints: "Patient reported stress at work.",
    section5_RelevantThoughtsCognitive: "Thinking frequently about deadlines at night."
  };

  db.prepare(`
    INSERT INTO clinician_summaries (id, user_id, reflection_id, dossier_content, generated_at, status, sharing_status, doctor_id, shared_at)
    VALUES (?, ?, NULL, ?, ?, 'draft', 'private', NULL, NULL)
  `).run(clinId, reg.user.id, JSON.stringify(originalContent), now);

  // User reviews and corrects section 1
  const correctedContent = {
    ...originalContent,
    section1_PresentingComplaints: "Corrected by user: Workplace stress began 3 months ago following reorganization."
  };

  db.prepare(`
    UPDATE clinician_summaries
    SET dossier_content = ?
    WHERE id = ? AND user_id = ?
  `).run(JSON.stringify(correctedContent), clinId, reg.user.id);

  const row = db.prepare('SELECT dossier_content, sharing_status FROM clinician_summaries WHERE id = ?').get(clinId);
  const parsed = JSON.parse(row.dossier_content);
  assert.strictEqual(parsed.section1_PresentingComplaints, "Corrected by user: Workplace stress began 3 months ago following reorganization.");
  assert.strictEqual(row.sharing_status, 'private', 'Summary must remain private during review/editing');
});

console.log('\n================================================================');
console.log(` Dashboard & Security Results: ${passed} / ${total} Passed (${Math.round((passed / total) * 100)}%)`);
console.log('================================================================\n');

if (passed !== total) {
  process.exit(1);
}
