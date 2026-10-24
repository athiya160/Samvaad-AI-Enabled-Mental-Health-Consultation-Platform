// Authentication API Endpoints
// Handles Private Pseudonymous accounts, Recovery codes, and Google OIDC

import { Router } from 'express';
import {
  registerPrivateAccount,
  loginPrivateAccount,
  recoverAccountWithCode,
  getGoogleConfigStatus,
  generateGoogleAuthUrl,
  handleGoogleCallback,
  revokeSession
} from '../services/authService.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const authRouter = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 3600 * 1000,
  path: '/'
};

// 1. Private Pseudonymous Registration
authRouter.post(['/register', '/register-private'], (req, res) => {
  try {
    const username = req.body?.username || req.body?.nickname;
    const { password } = req.body || {};

    const result = registerPrivateAccount(username, password);
    res.cookie('samvaad_session', result.token, COOKIE_OPTIONS);

    return res.status(201).json({
      ok: true,
      message: 'Private account created successfully.',
      user: {
        ...result.user,
        nickname: result.user.displayName || result.user.username
      },
      token: result.token,
      expiresAt: result.expiresAt,
      recoveryCodes: result.recoveryCodes
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      error: 'REGISTRATION_FAILED',
      message: err.message
    });
  }
});

// 2. Private Pseudonymous Login
authRouter.post(['/login', '/login-private'], (req, res) => {
  try {
    const username = req.body?.username || req.body?.nickname;
    const { password } = req.body || {};
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

    const result = loginPrivateAccount(username, password, clientIp);
    res.cookie('samvaad_session', result.token, COOKIE_OPTIONS);

    return res.json({
      ok: true,
      message: 'Logged in successfully.',
      user: {
        ...result.user,
        nickname: result.user.displayName || result.user.username
      },
      token: result.token,
      expiresAt: result.expiresAt
    });
  } catch (err) {
    return res.status(401).json({
      ok: false,
      error: 'LOGIN_FAILED',
      message: err.message
    });
  }
});

// 3. Account Recovery with Single-Use Recovery Code
authRouter.post('/recover', (req, res) => {
  try {
    const username = req.body?.username || req.body?.nickname;
    const { recoveryCode, newPassword } = req.body || {};
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

    const result = recoverAccountWithCode(username, recoveryCode, newPassword, clientIp);
    res.cookie('samvaad_session', result.token, COOKIE_OPTIONS);

    return res.json({
      ok: true,
      message: result.message,
      remainingRecoveryCodes: result.remainingRecoveryCodes,
      user: {
        ...result.user,
        nickname: result.user.displayName || result.user.username
      },
      token: result.token,
      expiresAt: result.expiresAt
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      error: 'RECOVERY_FAILED',
      message: err.message
    });
  }
});

// 4. Current Session Verification (/api/auth/me)
authRouter.get('/me', requireAuth, (req, res) => {
  return res.json({
    ok: true,
    user: {
      ...req.user,
      id: req.user.userId || req.user.id,
      nickname: req.user.displayName || req.user.username || 'User'
    }
  });
});

// 5. Logout
authRouter.post('/logout', requireAuth, (req, res) => {
  revokeSession(req.rawToken);
  res.clearCookie('samvaad_session', { path: '/' });
  return res.json({
    ok: true,
    message: 'Logged out successfully.'
  });
});

// 6. Google Config Status Check
authRouter.get('/google/status', (req, res) => {
  const status = getGoogleConfigStatus();
  return res.json({
    ok: true,
    status
  });
});

// 7. Google OAuth Initiation URL
authRouter.get('/google/url', (req, res) => {
  try {
    const { url, state } = generateGoogleAuthUrl();
    return res.json({
      ok: true,
      url,
      state
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      error: 'GOOGLE_AUTH_UNAVAILABLE',
      message: err.message
    });
  }
});

// 8. Google OAuth Callback
authRouter.post('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.body || {};
    const result = await handleGoogleCallback(code, state);
    res.cookie('samvaad_session', result.token, COOKIE_OPTIONS);

    return res.json({
      ok: true,
      message: 'Google authentication successful.',
      user: result.user,
      token: result.token,
      expiresAt: result.expiresAt
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      error: 'GOOGLE_AUTH_FAILED',
      message: err.message
    });
  }
});

// 9. Direct Google Sign-In & Verification Endpoint
// Enforces: Do not fake successful Google authentication; require valid token or explicit dev sandbox.
authRouter.post('/google', async (req, res) => {
  try {
    const { idToken, credential, mockPayload } = req.body || {};
    const rawToken = idToken || credential;

    let googleSub = null;
    let displayName = 'Google User';

    // Sandbox / Development environment support for testing unified account flow
    if (process.env.NODE_ENV !== 'production' && (rawToken === 'mock-google-token' || rawToken === 'demo-token')) {
      googleSub = mockPayload?.sub || 'demo_google_sandbox_sub';
      displayName = mockPayload?.name || 'Google User (Sandbox)';
    } else {
      if (!isGoogleConfigured()) {
        return res.status(400).json({
          ok: false,
          error: 'GOOGLE_AUTH_UNAVAILABLE',
          message: 'Google Sign-In is not configured on this server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.'
        });
      }

      if (!rawToken || typeof rawToken !== 'string') {
        return res.status(400).json({
          ok: false,
          error: 'INVALID_CREDENTIAL',
          message: 'A valid Google ID token credential is required.'
        });
      }

      // Verify token directly with Google Token Info endpoint
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(rawToken)}`);
      if (!verifyRes.ok) {
        return res.status(401).json({
          ok: false,
          error: 'INVALID_GOOGLE_TOKEN',
          message: 'Google rejected the authentication credential.'
        });
      }

      const payload = await verifyRes.json();
      googleSub = payload.sub; // Permanent Google Subject ID (NOT email)
      displayName = payload.given_name || (payload.name ? payload.name.split(' ')[0] : 'Samvaad User');

      if (!googleSub) {
        return res.status(401).json({
          ok: false,
          error: 'GOOGLE_IDENTITY_MISSING',
          message: 'Could not extract valid subject ID from Google credential.'
        });
      }
    }

    // Resolve Google identity to internal Samvaad user UUID (never email)
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

    const session = createSession(userId);
    res.cookie('samvaad_session', session.token, COOKIE_OPTIONS);

    return res.json({
      ok: true,
      message: 'Google authentication successful.',
      user: {
        id: userId,
        nickname: userRecord.display_name,
        displayName: userRecord.display_name,
        accountType: 'google',
        createdAt: userRecord.created_at
      },
      token: session.token,
      expiresAt: session.expiresAt
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'GOOGLE_AUTH_ERROR',
      message: err.message
    });
  }
});
