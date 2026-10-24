// Samvaad Platform Authentication & Cryptographic Security Service
// Enforces Section 7, Section 9, and Phase 1 unified account architecture.
// Provides scrypt password hashing, high-entropy single-use recovery codes,
// SHA-256 hashed sessions, and project-compatible Google OIDC integration.

import crypto from 'node:crypto';
import { db } from '../db/database.js';

// =========================================================================
// 1. Password Hashing (OWASP-recommended scrypt with random salt)
// =========================================================================

const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

export function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string' || plainPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const salt = crypto.randomBytes(32).toString('hex');
  const derivedKey = crypto.scryptSync(plainPassword, salt, SCRYPT_KEYLEN, SCRYPT_OPTIONS);
  const hash = derivedKey.toString('hex');

  return { hash, salt };
}

export function verifyPassword(plainPassword, storedHash, storedSalt) {
  if (!plainPassword || !storedHash || !storedSalt) return false;

  try {
    const derivedKey = crypto.scryptSync(plainPassword, storedSalt, SCRYPT_KEYLEN, SCRYPT_OPTIONS);
    const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
    const hashBuffer = Buffer.from(storedHash, 'hex');

    if (keyBuffer.length !== hashBuffer.length) return false;
    return crypto.timingSafeEqual(keyBuffer, hashBuffer);
  } catch (err) {
    return false;
  }
}

// =========================================================================
// 2. High-Entropy Single-Use Recovery Codes (Step 9 Specification)
// =========================================================================

// Formats unambiguous high-entropy recovery codes: "SAMV-XXXX-XXXX"
// Uses a 32-character alphabet omitting easily confused glyphs (0/O, 1/I)
const RECOVERY_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateSingleRecoveryCode() {
  const bytes = crypto.randomBytes(8);
  let chunk1 = '';
  let chunk2 = '';
  for (let i = 0; i < 4; i++) {
    chunk1 += RECOVERY_CHARSET[bytes[i] % RECOVERY_CHARSET.length];
    chunk2 += RECOVERY_CHARSET[bytes[i + 4] % RECOVERY_CHARSET.length];
  }
  return `SAMV-${chunk1}-${chunk2}`;
}

export function generateRecoveryCodes(count = 8) {
  const plaintextCodes = [];
  const hashedRecords = [];
  const batchId = `BATCH-${crypto.randomUUID()}`;

  for (let i = 0; i < count; i++) {
    const code = generateSingleRecoveryCode();
    const hash = hashRecoveryCode(code);
    plaintextCodes.push(code);
    hashedRecords.push({ hash, batchId });
  }

  // Plaintext codes are returned ONLY for one-time display to user upon registration/regeneration
  return { plaintextCodes, hashedRecords, batchId };
}

export function hashRecoveryCode(code) {
  if (!code || typeof code !== 'string') return '';
  // Normalize: uppercase and keep only alphanumeric characters
  const normalized = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// =========================================================================
// 3. Brute-Force Rate Limiting for Password & Recovery Attempts
// =========================================================================

const failedAttemptsMap = new Map();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;

export function checkRateLimit(key) {
  const record = failedAttemptsMap.get(key);
  const now = Date.now();

  if (!record) return { allowed: true, remaining: MAX_FAILED_ATTEMPTS };

  if (now > record.resetAt) {
    failedAttemptsMap.delete(key);
    return { allowed: true, remaining: MAX_FAILED_ATTEMPTS };
  }

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      waitSeconds,
      error: `Too many failed attempts. Please try again in ${Math.ceil(waitSeconds / 60)} minutes.`
    };
  }

  return { allowed: true, remaining: MAX_FAILED_ATTEMPTS - record.count };
}

export function recordFailedAttempt(key) {
  const now = Date.now();
  const record = failedAttemptsMap.get(key) || { count: 0, resetAt: now + ATTEMPT_WINDOW_MS };
  record.count += 1;
  failedAttemptsMap.set(key, record);
}

export function clearFailedAttempts(key) {
  failedAttemptsMap.delete(key);
}

// =========================================================================
// 4. Session Token Management (256-bit secure token, stored as SHA-256 hash)
// =========================================================================

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createSession(userId) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const sessionId = `SES-${crypto.randomUUID()}`;

  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_active_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(sessionId, userId, tokenHash, expiresAt, now, now);

  return { token: rawToken, expiresAt };
}

export function validateSession(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return null;

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    SELECT s.id as session_id, s.user_id, s.expires_at, u.account_type, u.display_name, u.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `);

  const row = stmt.get(tokenHash, now);
  if (!row) return null;

  // Touch last_active_at
  try {
    db.prepare(`UPDATE sessions SET last_active_at = ? WHERE id = ?`).run(now, row.session_id);
  } catch (e) {
    // Non-fatal
  }

  return {
    userId: row.user_id,
    accountType: row.account_type,
    displayName: row.display_name,
    createdAt: row.created_at
  };
}

export function revokeSession(rawToken) {
  if (!rawToken) return;
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(tokenHash);
}

export function revokeAllUserSessions(userId) {
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
}

// =========================================================================
// 5. Private Pseudonymous Account Registration & Login
// =========================================================================

export function registerPrivateAccount(username, plainPassword) {
  // Input validation
  const trimmedUser = (username || '').trim();
  if (!trimmedUser || trimmedUser.length < 2 || trimmedUser.length > 30) {
    throw new Error('Username must be between 2 and 30 characters.');
  }

  if (!/^[a-zA-Z0-9_ -]+$/.test(trimmedUser)) {
    throw new Error('Username can only contain letters, numbers, spaces, hyphens, and underscores.');
  }

  if (!plainPassword || plainPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const normalizedUser = trimmedUser.toLowerCase();

  // Check unique username
  const existingStmt = db.prepare(`
    SELECT id FROM auth_identities
    WHERE provider = 'pseudonymous_password' AND provider_subject_id = ?
  `);
  if (existingStmt.get(normalizedUser)) {
    throw new Error('This username is already taken. Please choose another username or nickname.');
  }

  const userId = `usr_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const { hash, salt } = hashPassword(plainPassword);
  const { plaintextCodes, hashedRecords, batchId } = generateRecoveryCodes(8);

  // Atomic database transaction
  db.exec('BEGIN TRANSACTION;');
  try {
    // 1. Insert user
    db.prepare(`
      INSERT INTO users (id, account_type, display_name, created_at, updated_at)
      VALUES (?, 'pseudonymous', ?, ?, ?)
    `).run(userId, trimmedUser, now, now);

    // 2. Insert auth identity
    db.prepare(`
      INSERT INTO auth_identities (id, user_id, provider, provider_subject_id, password_hash, password_salt, created_at, updated_at)
      VALUES (?, ?, 'pseudonymous_password', ?, ?, ?, ?, ?)
    `).run(`auth_${crypto.randomUUID()}`, userId, normalizedUser, hash, salt, now, now);

    // 3. Insert hashed recovery codes
    const insertCodeStmt = db.prepare(`
      INSERT INTO recovery_codes (id, user_id, code_hash, used_at, created_at, batch_id)
      VALUES (?, ?, ?, NULL, ?, ?)
    `);
    for (const rec of hashedRecords) {
      insertCodeStmt.run(`rec_${crypto.randomUUID()}`, userId, rec.hash, now, batchId);
    }

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  // Create active session
  const session = createSession(userId);

  return {
    user: {
      id: userId,
      displayName: trimmedUser,
      accountType: 'pseudonymous',
      createdAt: now
    },
    token: session.token,
    expiresAt: session.expiresAt,
    recoveryCodes: plaintextCodes // One-time display to user
  };
}

export function loginPrivateAccount(username, plainPassword, clientIp = '127.0.0.1') {
  const trimmedUser = (username || '').trim();
  const normalizedUser = trimmedUser.toLowerCase();
  const rateLimitKey = `login:${normalizedUser}:${clientIp}`;

  const rateCheck = checkRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    throw new Error(rateCheck.error);
  }

  const stmt = db.prepare(`
    SELECT ai.user_id, ai.password_hash, ai.password_salt, u.display_name, u.account_type, u.created_at
    FROM auth_identities ai
    JOIN users u ON ai.user_id = u.id
    WHERE ai.provider = 'pseudonymous_password' AND ai.provider_subject_id = ?
  `);

  const record = stmt.get(normalizedUser);
  if (!record) {
    recordFailedAttempt(rateLimitKey);
    throw new Error('Invalid username or password.');
  }

  const isValid = verifyPassword(plainPassword, record.password_hash, record.password_salt);
  if (!isValid) {
    recordFailedAttempt(rateLimitKey);
    throw new Error('Invalid username or password.');
  }

  clearFailedAttempts(rateLimitKey);

  const session = createSession(record.user_id);

  return {
    user: {
      id: record.user_id,
      displayName: record.display_name,
      accountType: record.account_type,
      createdAt: record.created_at
    },
    token: session.token,
    expiresAt: session.expiresAt
  };
}

// =========================================================================
// 6. Account Recovery using Single-Use Recovery Code
// =========================================================================

export function recoverAccountWithCode(username, recoveryCode, newPassword, clientIp = '127.0.0.1') {
  const trimmedUser = (username || '').trim();
  const normalizedUser = trimmedUser.toLowerCase();
  const rateLimitKey = `recover:${normalizedUser}:${clientIp}`;

  const rateCheck = checkRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    throw new Error(rateCheck.error);
  }

  if (!recoveryCode || typeof recoveryCode !== 'string' || !recoveryCode.trim()) {
    throw new Error('A valid recovery code is required.');
  }

  if (newPassword && typeof newPassword === 'string' && newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  const userStmt = db.prepare(`
    SELECT ai.user_id, u.display_name, u.account_type
    FROM auth_identities ai
    JOIN users u ON ai.user_id = u.id
    WHERE ai.provider = 'pseudonymous_password' AND ai.provider_subject_id = ?
  `);
  const userRecord = userStmt.get(normalizedUser);
  if (!userRecord) {
    recordFailedAttempt(rateLimitKey);
    throw new Error('Invalid recovery details. Please check your username and recovery code.');
  }

  const codeHash = hashRecoveryCode(recoveryCode);

  // Find matching recovery code (also check with SAMV- prefix if user omitted it)
  const codeStmt = db.prepare(`
    SELECT id, used_at FROM recovery_codes
    WHERE user_id = ? AND code_hash = ?
  `);
  let matchingCode = codeStmt.get(userRecord.user_id, codeHash);

  if (!matchingCode && !recoveryCode.toUpperCase().startsWith('SAMV')) {
    const prefixedHash = hashRecoveryCode(`SAMV-${recoveryCode}`);
    matchingCode = codeStmt.get(userRecord.user_id, prefixedHash);
  }

  if (!matchingCode) {
    recordFailedAttempt(rateLimitKey);
    throw new Error('Invalid recovery code. Please check that the code is entered accurately.');
  }

  // Strictly enforce single-use constraint (Step 9)
  if (matchingCode.used_at) {
    recordFailedAttempt(rateLimitKey);
    throw new Error('This recovery code has already been used and cannot be reused. Please use an unused code.');
  }

  const now = new Date().toISOString();

  // Atomic update
  db.exec('BEGIN TRANSACTION;');
  try {
    // 1. Invalidate this single-use recovery code permanently
    db.prepare(`UPDATE recovery_codes SET used_at = ? WHERE id = ?`).run(now, matchingCode.id);

    // 2. Update password credentials if a new password was provided
    if (newPassword && newPassword.length >= 8) {
      const { hash: newHash, salt: newSalt } = hashPassword(newPassword);
      db.prepare(`
        UPDATE auth_identities
        SET password_hash = ?, password_salt = ?, updated_at = ?
        WHERE user_id = ? AND provider = 'pseudonymous_password'
      `).run(newHash, newSalt, now, userRecord.user_id);
    }

    // 3. Invalidate all prior sessions for safety
    db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userRecord.user_id);

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  clearFailedAttempts(rateLimitKey);

  // Issue new session
  const session = createSession(userRecord.user_id);

  // Calculate remaining unused single-use recovery codes
  const remainingStmt = db.prepare(`
    SELECT COUNT(*) as remainingCount FROM recovery_codes
    WHERE user_id = ? AND used_at IS NULL
  `);
  const remainingCount = remainingStmt.get(userRecord.user_id)?.remainingCount ?? 0;

  return {
    success: true,
    message: newPassword
      ? 'Your password has been successfully reset. You are now logged in.'
      : 'Recovery verified successfully. Access has been restored.',
    remainingRecoveryCodes: remainingCount,
    user: {
      id: userRecord.user_id,
      displayName: userRecord.display_name,
      accountType: userRecord.account_type
    },
    token: session.token,
    expiresAt: session.expiresAt
  };
}

// =========================================================================
// 7. Google OAuth / OIDC Integration (Honest Configuration & Standard OIDC)
// =========================================================================

export function isGoogleConfigured() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return Boolean(clientId && clientSecret && clientId.trim() && clientSecret.trim());
}

export function getGoogleConfigStatus() {
  const configured = isGoogleConfigured();
  return {
    configured,
    clientId: configured ? process.env.GOOGLE_CLIENT_ID : null,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/api/auth/google/callback',
    requiresSetup: !configured,
    setupMessage: configured
      ? 'Google Sign-In is configured and ready.'
      : 'Google Sign-In requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the server .env file.'
  };
}

// In-memory OAuth state cache (expires in 10 minutes)
const oauthStateCache = new Map();

export function generateGoogleAuthUrl() {
  if (!isGoogleConfigured()) {
    throw new Error('Google OAuth credentials are not configured in server .env.');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/api/auth/google/callback';
  const state = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');

  oauthStateCache.set(state, { nonce, expiresAt: Date.now() + 10 * 60 * 1000 });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    nonce,
    access_type: 'online',
    prompt: 'select_account'
  });

  return {
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    state
  };
}

export async function handleGoogleCallback(code, state) {
  if (!isGoogleConfigured()) {
    throw new Error('Google OAuth credentials are not configured in server .env.');
  }

  if (!state || !oauthStateCache.has(state)) {
    throw new Error('Invalid or expired OAuth state parameter.');
  }

  oauthStateCache.delete(state);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/api/auth/google/callback';

  // 1. Exchange authorization code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    console.error('Google token exchange failed:', errText);
    throw new Error('Failed to exchange authorization code with Google.');
  }

  const tokens = await tokenResponse.json();

  // 2. Fetch verified user info using access token
  const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });

  if (!userinfoResponse.ok) {
    throw new Error('Failed to fetch user profile from Google.');
  }

  const googleProfile = await userinfoResponse.json();
  const googleSub = googleProfile.sub; // Permanent Google Subject ID (NOT email)
  const displayName = googleProfile.given_name || (googleProfile.name ? googleProfile.name.split(' ')[0] : 'Samvaad User');

  if (!googleSub) {
    throw new Error('Google did not return a valid user identity.');
  }

  // 3. Resolve to internal Samvaad user
  const identityStmt = db.prepare(`
    SELECT ai.user_id, u.display_name, u.account_type, u.created_at
    FROM auth_identities ai
    JOIN users u ON ai.user_id = u.id
    WHERE ai.provider = 'google_oidc' AND ai.provider_subject_id = ?
  `);

  let userRecord = identityStmt.get(googleSub);
  let userId;
  const now = new Date().toISOString();

  if (!userRecord) {
    // New Google User
    userId = `usr_${crypto.randomUUID()}`;

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO users (id, account_type, display_name, created_at, updated_at)
        VALUES (?, 'google', ?, ?, ?)
      `).run(userId, displayName, now, now);

      db.prepare(`
        INSERT INTO auth_identities (id, user_id, provider, provider_subject_id, created_at, updated_at)
        VALUES (?, ?, 'google_oidc', ?, ?, ?)
      `).run(`auth_${crypto.randomUUID()}`, userId, googleSub, now, now);

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    userRecord = {
      user_id: userId,
      display_name: displayName,
      account_type: 'google',
      created_at: now
    };
  } else {
    userId = userRecord.user_id;
  }

  // Create session
  const session = createSession(userId);

  return {
    user: {
      id: userId,
      displayName: userRecord.display_name,
      accountType: 'google',
      createdAt: userRecord.created_at
    },
    token: session.token,
    expiresAt: session.expiresAt
  };
}

// =========================================================================
// 8. Account Security Controls (Password & Recovery Code Management)
// =========================================================================

export function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || typeof currentPassword !== 'string') {
    throw new Error('Current password is required.');
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  const identity = db.prepare(`
    SELECT id, password_hash, password_salt
    FROM auth_identities
    WHERE user_id = ? AND provider = 'pseudonymous_password'
  `).get(userId);

  if (!identity) {
    throw new Error('This account does not use password credentials (e.g. Google managed account).');
  }

  const isValid = verifyPassword(currentPassword, identity.password_hash, identity.password_salt);
  if (!isValid) {
    throw new Error('Incorrect current password.');
  }

  const { hash: newHash, salt: newSalt } = hashPassword(newPassword);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE auth_identities
    SET password_hash = ?, password_salt = ?, updated_at = ?
    WHERE id = ?
  `).run(newHash, newSalt, now, identity.id);

  return { ok: true, message: 'Password updated successfully.' };
}

export function getRecoveryCodesStatus(userId) {
  const identity = db.prepare(`
    SELECT id FROM auth_identities
    WHERE user_id = ? AND provider = 'pseudonymous_password'
  `).get(userId);

  if (!identity) {
    return { supported: false };
  }

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN used_at IS NULL THEN 1 ELSE 0 END) as unused
    FROM recovery_codes
    WHERE user_id = ?
  `).get(userId);

  return {
    supported: true,
    unusedCount: stats.unused || 0,
    totalCount: stats.total || 0
  };
}

export function regenerateRecoveryCodes(userId) {
  const identity = db.prepare(`
    SELECT id FROM auth_identities
    WHERE user_id = ? AND provider = 'pseudonymous_password'
  `).get(userId);

  if (!identity) {
    throw new Error('Recovery codes are only supported for Private Accounts.');
  }

  const { plaintextCodes, hashedRecords, batchId } = generateRecoveryCodes(8);
  const now = new Date().toISOString();

  db.exec('BEGIN TRANSACTION;');
  try {
    // Invalidate/delete all existing recovery codes for this user
    db.prepare('DELETE FROM recovery_codes WHERE user_id = ?').run(userId);

    // Insert 8 new hashed codes
    const insertStmt = db.prepare(`
      INSERT INTO recovery_codes (id, user_id, code_hash, used_at, created_at, batch_id)
      VALUES (?, ?, ?, NULL, ?, ?)
    `);

    for (const rec of hashedRecords) {
      insertStmt.run(`rec_${crypto.randomUUID()}`, userId, rec.hash, now, batchId);
    }

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  return {
    ok: true,
    message: 'Replacement recovery codes generated. All previous recovery codes have been invalidated.',
    plaintextCodes,
    unusedCount: 8,
    totalCount: 8
  };
}

