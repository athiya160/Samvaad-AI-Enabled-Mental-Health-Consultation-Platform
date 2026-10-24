// Authentication Middleware for Samvaad Platform
// Verifies Bearer session tokens server-side against SQLite sessions table.
// Enforces that internal user ID from the validated session is used for all protected data queries.

import { validateSession } from '../services/authService.js';

export function extractBearerToken(req) {
  if (req.cookies && req.cookies.samvaad_session) {
    return req.cookies.samvaad_session;
  }

  if (req.headers && req.headers.cookie) {
    const match = req.headers.cookie.match(/samvaad_session=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  if (req.headers && req.headers['x-session-token']) {
    return req.headers['x-session-token'];
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1].trim();
  }
  return null;
}

export function requireAuth(req, res, next) {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({
      ok: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication session is required to access this resource.'
    });
  }

  const sessionUser = validateSession(token);
  if (!sessionUser) {
    return res.status(401).json({
      ok: false,
      error: 'SESSION_EXPIRED',
      message: 'Your session has expired or is invalid. Please log in again.'
    });
  }

  // Attach verified user to request object (Do not trust user_id from body/params!)
  req.user = sessionUser;
  req.rawToken = token;
  next();
}

export function optionalAuth(req, res, next) {
  const token = extractBearerToken(req);
  if (token) {
    const sessionUser = validateSession(token);
    if (sessionUser) {
      req.user = sessionUser;
      req.rawToken = token;
    }
  }
  next();
}
