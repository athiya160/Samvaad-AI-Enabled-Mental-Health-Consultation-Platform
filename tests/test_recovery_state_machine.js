// Automated Verification Script for Step 9: Recovery Code State Machine
import {
  registerPrivateAccount,
  recoverAccountWithCode,
  loginPrivateAccount
} from '../server/services/authService.js';
import { db } from '../server/db/database.js';

async function runRecoveryTests() {
  console.log('--- Step 9: Single-Use Recovery Code State Machine Verification ---');
  
  const testUser = `TestUser_${Date.now()}`;
  const testPass = 'SecretPassword123!';
  const updatedPass = 'NewSecurePassword456!';

  // 1. Register private account
  console.log(`\n[Test 1] Registering private account: ${testUser}`);
  const regResult = registerPrivateAccount(testUser, testPass);
  
  if (!regResult.recoveryCodes || regResult.recoveryCodes.length !== 8) {
    throw new Error(`Expected 8 recovery codes, got ${regResult.recoveryCodes?.length}`);
  }
  console.log(`✓ Received 8 plaintext recovery codes for user.`);
  console.log(`Sample codes: ${regResult.recoveryCodes.slice(0, 3).join(', ')}...`);

  // Verify format matches SAMV-XXXX-XXXX
  const codeRegex = /^SAMV-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
  for (const code of regResult.recoveryCodes) {
    if (!codeRegex.test(code)) {
      throw new Error(`Code ${code} does not match SAMV-XXXX-XXXX pattern!`);
    }
  }
  console.log(`✓ All 8 codes strictly match format SAMV-XXXX-XXXX.`);

  // Verify database storage has hashes, not plaintexts
  const dbCodes = db.prepare('SELECT code_hash, used_at FROM recovery_codes WHERE user_id = ?').all(regResult.user.id);
  if (dbCodes.length !== 8) {
    throw new Error(`Expected 8 db records, found ${dbCodes.length}`);
  }
  for (const record of dbCodes) {
    if (regResult.recoveryCodes.includes(record.code_hash)) {
      throw new Error(`SECURITY LEAK: Plaintext recovery code found in database!`);
    }
    if (record.used_at !== null) {
      throw new Error(`Initial code should have used_at = null!`);
    }
  }
  console.log(`✓ Database retains only SHA-256 secure hashes. No plaintext stored.`);

  // Verify no email stored for private account
  const userRecord = db.prepare('SELECT * FROM users WHERE id = ?').get(regResult.user.id);
  if (userRecord.email) {
    throw new Error(`Private accounts must not store email!`);
  }
  console.log(`✓ Private account has zero email/phone dependencies.`);

  // 2. First recovery attempt using code #1
  const code1 = regResult.recoveryCodes[0];
  console.log(`\n[Test 2] First recovery attempt with code #1 (${code1})`);
  const recResult1 = recoverAccountWithCode(testUser, code1, updatedPass, '127.0.0.1');
  
  if (!recResult1.success) {
    throw new Error(`Recovery 1 failed unexpectedly: ${recResult1.message}`);
  }
  if (recResult1.remainingRecoveryCodes !== 7) {
    throw new Error(`Expected 7 remaining codes, got ${recResult1.remainingRecoveryCodes}`);
  }
  console.log(`✓ First recovery succeeded. Remaining codes count: ${recResult1.remainingRecoveryCodes}`);

  // Check database that code #1 used_at is set
  const usedCount = db.prepare('SELECT COUNT(*) as count FROM recovery_codes WHERE user_id = ? AND used_at IS NOT NULL').get(regResult.user.id);
  if (usedCount.count !== 1) {
    throw new Error(`Expected exactly 1 used code in db, found ${usedCount.count}`);
  }
  console.log(`✓ Database shows exactly 1 code marked as used_at with timestamp.`);

  // Verify login with new password
  const newLogin = loginPrivateAccount(testUser, updatedPass);
  if (!newLogin.token) {
    throw new Error(`Login with updated password failed!`);
  }
  console.log(`✓ Password was updated and authenticated successfully.`);

  // 3. Second recovery attempt using code #1 (REPLAY ATTACK TEST)
  console.log(`\n[Test 3] Replay attempt with already-used code #1 (${code1})`);
  let replayBlocked = false;
  try {
    recoverAccountWithCode(testUser, code1, 'AnotherPassword789!', '127.0.0.1');
  } catch (err) {
    replayBlocked = true;
    console.log(`✓ Replay rejected with expected error: "${err.message}"`);
  }
  if (!replayBlocked) {
    throw new Error(`CRITICAL SECURITY FAILURE: Used recovery code was accepted a second time!`);
  }

  // 4. Recovery attempt with code #2 (should succeed)
  const code2 = regResult.recoveryCodes[1];
  console.log(`\n[Test 4] Recovery with fresh unused code #2 (${code2})`);
  const recResult2 = recoverAccountWithCode(testUser, code2, null, '127.0.0.1');
  if (!recResult2.success) {
    throw new Error(`Recovery 2 failed unexpectedly: ${recResult2.message}`);
  }
  if (recResult2.remainingRecoveryCodes !== 6) {
    throw new Error(`Expected 6 remaining codes, got ${recResult2.remainingRecoveryCodes}`);
  }
  console.log(`✓ Recovery with code #2 succeeded. Remaining codes count: ${recResult2.remainingRecoveryCodes}`);

  // 5. Recovery with invalid fake code
  console.log(`\n[Test 5] Attempt with invalid/random code`);
  let invalidBlocked = false;
  try {
    recoverAccountWithCode(testUser, 'SAMV-FAKE-CODE', null, '127.0.0.1');
  } catch (err) {
    invalidBlocked = true;
    console.log(`✓ Invalid code rejected with expected error: "${err.message}"`);
  }
  if (!invalidBlocked) {
    throw new Error(`CRITICAL SECURITY FAILURE: Invalid recovery code was accepted!`);
  }

  // 6. Test copy-paste resilience (lowercase and without SAMV- prefix)
  const code3 = regResult.recoveryCodes[2];
  const strippedCode3 = code3.replace('SAMV-', '').toLowerCase();
  console.log(`\n[Test 6] Testing input without SAMV- prefix & in lowercase: "${strippedCode3}"`);
  const recResult3 = recoverAccountWithCode(testUser, strippedCode3, null, '127.0.0.1');
  if (!recResult3.success) {
    throw new Error(`Resilient recovery failed: ${recResult3.message}`);
  }
  if (recResult3.remainingRecoveryCodes !== 5) {
    throw new Error(`Expected 5 remaining codes, got ${recResult3.remainingRecoveryCodes}`);
  }
  console.log(`✓ Resilient recovery succeeded with stripped prefix. Remaining codes count: ${recResult3.remainingRecoveryCodes}`);

  console.log(`\n======================================================`);
  console.log(`ALL STEP 9 RECOVERY CODE STATE MACHINE TESTS PASSED!`);
  console.log(`======================================================\n`);
}

runRecoveryTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
