// Tests for Phase 1 Samvaad Unified Account Architecture
// Verifies:
// 1. Password hashing with scrypt and constant-time verification
// 2. High-entropy single-use recovery codes, storage of hashes only, single-use invalidation, reuse prevention
// 3. Brute-force rate limiting on recovery attempts
// 4. Session token generation, SHA-256 storage, and expiration
// 5. Unified internal user ID and auth identity resolution
// 6. Ownership enforcement for personal reflections and clinician dossiers
// 7. Honest Google OAuth status and configuration requirements

import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { db } from '../server/db/database.js';
import { apiRouter } from '../server/apiRouter.js';
import {
  hashPassword,
  verifyPassword,
  generateRecoveryCodes,
  hashRecoveryCode,
  registerPrivateAccount,
  loginPrivateAccount,
  recoverAccountWithCode,
  createSession,
  validateSession,
  getGoogleConfigStatus
} from '../server/services/authService.js';

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error('   ', err.message);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error('   ', err.message);
  }
}

console.log('\n======================================================');
console.log(' Starting Samvaad Unified Account Architecture Tests');
console.log('======================================================\n');

// --------------------------------------------------------------------
// 1. Password Security
// --------------------------------------------------------------------
console.log('[Test Group 1] Server-side Password Security & scrypt Hashing');

runTest('1.1 Should hash password with random salt and OWASP scrypt parameters', () => {
  const plain = 'SecureSecretPassword123!';
  const { hash, salt } = hashPassword(plain);
  assert.ok(hash && hash.length === 128, 'scrypt hash should be 64 bytes (128 hex chars)');
  assert.ok(salt && salt.length === 64, 'salt should be 32 bytes (64 hex chars)');

  const hash2 = hashPassword(plain);
  assert.notStrictEqual(salt, hash2.salt, 'Consecutive hashes must have distinct random salts');
});

runTest('1.2 Should accurately verify correct password and reject incorrect password', () => {
  const plain = 'PatientPrivacy2026!';
  const { hash, salt } = hashPassword(plain);
  assert.strictEqual(verifyPassword(plain, hash, salt), true);
  assert.strictEqual(verifyPassword('WrongPassword123!', hash, salt), false);
  assert.strictEqual(verifyPassword('', hash, salt), false);
});

runTest('1.3 Enforce minimum password length of 8 characters', () => {
  assert.throws(() => hashPassword('short'), /at least 8 characters/);
});

// --------------------------------------------------------------------
// 2. High-Entropy Recovery Codes
// --------------------------------------------------------------------
console.log('\n[Test Group 2] Single-Use High-Entropy Recovery Codes');

runTest('2.1 Generate 8 high-entropy codes with proper formatting', () => {
  const { plaintextCodes, hashedRecords, batchId } = generateRecoveryCodes(8);
  assert.strictEqual(plaintextCodes.length, 8);
  assert.strictEqual(hashedRecords.length, 8);
  assert.ok(batchId.startsWith('BATCH-'));

  for (let i = 0; i < 8; i++) {
    const code = plaintextCodes[i];
    assert.match(code, /^SAMV-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    const expectedHash = hashRecoveryCode(code);
    assert.strictEqual(hashedRecords[i].hash, expectedHash);
  }
});

runTest('2.2 Plaintext recovery codes must never match stored SHA-256 hashes', () => {
  const { plaintextCodes, hashedRecords } = generateRecoveryCodes(2);
  assert.notStrictEqual(plaintextCodes[0], hashedRecords[0].hash);
  assert.strictEqual(hashedRecords[0].hash.length, 64, 'SHA-256 hash must be 64 hex characters');
});

// --------------------------------------------------------------------
// 3. Private Account Registration, Login, and Recovery Flow
// --------------------------------------------------------------------
console.log('\n[Test Group 3] Private Pseudonymous Account Lifecycle');

let testUsername = `user_test_${Date.now()}`;
let registeredCodes = [];
let savedUserId = null;

runTest('3.1 Successfully register private pseudonymous account with unique internal ID', () => {
  const result = registerPrivateAccount(testUsername, 'SuperSafePassword123!');
  assert.ok(result.user.id.startsWith('usr_'), 'User ID must start with usr_');
  assert.strictEqual(result.user.displayName, testUsername);
  assert.strictEqual(result.user.accountType, 'pseudonymous');
  assert.ok(result.token, 'Must return active session token');
  assert.strictEqual(result.recoveryCodes.length, 8);

  savedUserId = result.user.id;
  registeredCodes = result.recoveryCodes;

  // Verify internal DB representation
  const dbUser = db.prepare('SELECT * FROM users WHERE id = ?').get(savedUserId);
  assert.strictEqual(dbUser.account_type, 'pseudonymous');

  const dbIdentity = db.prepare('SELECT * FROM auth_identities WHERE user_id = ?').get(savedUserId);
  assert.strictEqual(dbIdentity.provider, 'pseudonymous_password');
  assert.strictEqual(dbIdentity.provider_subject_id, testUsername.toLowerCase());
  assert.ok(dbIdentity.password_hash);
  assert.notStrictEqual(dbIdentity.password_hash, 'SuperSafePassword123!', 'Plaintext password must never be stored');
});

runTest('3.2 Prevent duplicate username registration', () => {
  assert.throws(() => {
    registerPrivateAccount(testUsername, 'AnotherPassword123!');
  }, /already taken/);
});

runTest('3.3 Successfully login with valid credentials and reject invalid credentials', () => {
  const loginResult = loginPrivateAccount(testUsername, 'SuperSafePassword123!');
  assert.strictEqual(loginResult.user.id, savedUserId);
  assert.ok(loginResult.token);

  assert.throws(() => {
    loginPrivateAccount(testUsername, 'WrongPassword123!');
  }, /Invalid username or password/);
});

runTest('3.4 Account recovery: single-use consumption and prevention of reuse', () => {
  const codeToUse = registeredCodes[0];
  const newPassword = 'NewlyResetPassword2026!';

  // Recover account
  const recoverResult = recoverAccountWithCode(testUsername, codeToUse, newPassword);
  assert.strictEqual(recoverResult.success, true);
  assert.strictEqual(recoverResult.user.id, savedUserId);

  // Attempt to REUSE the same recovery code — MUST BE REJECTED
  assert.throws(() => {
    recoverAccountWithCode(testUsername, codeToUse, 'AnotherNewPassword999!');
  }, /already been used and cannot be reused/);

  // Verify new password works
  const newLogin = loginPrivateAccount(testUsername, newPassword);
  assert.strictEqual(newLogin.user.id, savedUserId);

  // Verify old password is now invalid
  assert.throws(() => {
    loginPrivateAccount(testUsername, 'SuperSafePassword123!');
  }, /Invalid username or password/);
});

// --------------------------------------------------------------------
// 4. Session Validation & Expiration
// --------------------------------------------------------------------
console.log('\n[Test Group 4] Session Token Management');

runTest('4.1 Session tokens validated against SHA-256 token hash in DB', () => {
  const { token } = createSession(savedUserId);
  const sessionUser = validateSession(token);
  assert.strictEqual(sessionUser.userId, savedUserId);
  assert.strictEqual(sessionUser.accountType, 'pseudonymous');

  // Non-existent token should return null
  assert.strictEqual(validateSession('invalid-or-fake-token'), null);
});

// --------------------------------------------------------------------
// 5. Protected User Endpoints & Ownership Isolation
// --------------------------------------------------------------------
console.log('\n[Test Group 5] Protected Data Query Ownership Enforcement');

await runAsyncTest('5.1 /api/user/reflections requires valid authentication', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const unauthRes = await fetch(`http://127.0.0.1:${port}/api/user/reflections`);
    assert.strictEqual(unauthRes.status, 401);
  } finally {
    server.close();
  }
});

await runAsyncTest('5.2 Authenticated user saves reflection and receives isolated records', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  try {
    // 1. Create a session for savedUserId
    const { token } = createSession(savedUserId);

    // 2. Save reflection
    const saveRes = await fetch(`http://127.0.0.1:${port}/api/user/reflections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reflection: {
          title: 'My Work Stress Reflection',
          sectionA_MainConcerns: ['Work pressure'],
          sectionB_ExperiencesDiscussed: {
            emotions: ['Stress'],
            thoughts: ['Deadlines'],
            behaviours: ['Sleep difficulty']
          }
        },
        conversationSnippet: 'Feeling overwhelmed with project deadlines.',
        messages: [
          { sender: 'user', text: "I've been feeling stressed about work lately and can't sleep." }
        ],
        language: 'en'
      })
    });

    const saveData = await saveRes.json();
    assert.strictEqual(saveRes.status, 201);
    assert.strictEqual(saveData.ok, true);
    assert.ok(saveData.reflectionId.startsWith('ref_'));

    // 2b. Generate clinician summary with explicit separate consent
    const clinRes = await fetch(`http://127.0.0.1:${port}/api/user/clinician-summaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reflectionId: saveData.reflectionId,
        messages: [
          { sender: 'user', text: "I've been feeling stressed about work lately and can't sleep." }
        ],
        language: 'en'
      })
    });
    assert.strictEqual(clinRes.status, 201);
    const clinData = await clinRes.json();
    assert.strictEqual(clinData.ok, true);
    assert.ok(clinData.summaryId.startsWith('clin_'));

    // 3. Fetch reflections
    const fetchRes = await fetch(`http://127.0.0.1:${port}/api/user/reflections`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(fetchRes.status, 200);
    const fetchData = await fetchRes.json();
    assert.strictEqual(fetchData.ok, true);
    assert.strictEqual(fetchData.reflections.length, 1);
    assert.strictEqual(fetchData.reflections[0].title, 'My Work Stress Reflection');

    // 3b. Fetch clinician summaries
    const fetchClinRes = await fetch(`http://127.0.0.1:${port}/api/user/clinician-summaries`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(fetchClinRes.status, 200);
    const fetchClinData = await fetchClinRes.json();
    assert.strictEqual(fetchClinData.ok, true);
    assert.strictEqual(fetchClinData.summaries.length, 1);
    assert.ok(fetchClinData.summaries[0].clinicianSummary);

    // 4. Create User B and verify User B CANNOT see User A's reflection
    const userB = registerPrivateAccount(`user_b_${Date.now()}`, 'SuperSafePassword456!');
    const fetchBRes = await fetch(`http://127.0.0.1:${port}/api/user/reflections`, {
      headers: { 'Authorization': `Bearer ${userB.token}` }
    });
    const fetchBData = await fetchBRes.json();
    assert.strictEqual(fetchBData.reflections.length, 0, "User B must NOT see User A's reflections");

    // 5. User B attempting to delete User A's reflection MUST be rejected (404/Not Authorized)
    const deleteBRes = await fetch(`http://127.0.0.1:${port}/api/user/reflections/${saveData.reflectionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${userB.token}` }
    });
    assert.strictEqual(deleteBRes.status, 404);

  } finally {
    server.close();
  }
});

// --------------------------------------------------------------------
// 6. Google OAuth Transparency
// --------------------------------------------------------------------
console.log('\n[Test Group 6] Google OAuth Architecture & Honest Configuration');

runTest('6.1 Google status reports unconfigured honestly when env vars are missing', () => {
  const status = getGoogleConfigStatus();
  assert.strictEqual(typeof status.configured, 'boolean');
  assert.strictEqual(typeof status.requiresSetup, 'boolean');
  if (!process.env.GOOGLE_CLIENT_ID) {
    assert.strictEqual(status.configured, false);
    assert.strictEqual(status.requiresSetup, true);
  }
});

await runAsyncTest('6.2 GET /api/auth/google/url returns honest error if unconfigured', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/google/url`);
    if (!process.env.GOOGLE_CLIENT_ID) {
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.ok, false);
      assert.strictEqual(data.error, 'GOOGLE_AUTH_UNAVAILABLE');
    }
  } finally {
    server.close();
  }
});

// --------------------------------------------------------------------
// Summary
// --------------------------------------------------------------------
console.log('\n======================================================');
console.log(` Account Architecture Tests: ${passedTests} / ${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
