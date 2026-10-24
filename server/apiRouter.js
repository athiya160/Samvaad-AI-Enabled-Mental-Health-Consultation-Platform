// API Router for Samvaad Platform
// Enforces Section 14 (Crisis Protocol), Section 15 (Privacy & Technical Logs),
// Section 16 (Rate Limiting & Cost Monitoring), and Section 18 Operating Sequence.

import { Router } from 'express';
import { checkSafetyScreen } from './safetyGuardrails.js';
import { llmService } from './llmService.js';
import { ClinicianSummaryGenerator } from './clinicianSummaryGenerator.js';
import { authRouter } from './routes/authRoutes.js';
import { userRouter } from './routes/userRoutes.js';

export const apiRouter = Router();

// Sub-routers for Unified Account Architecture (Phase 1)
apiRouter.use('/auth', authRouter);
apiRouter.use('/user', userRouter);

// In-Memory Rate Limiter (Section 16: Error handling and abuse prevention)
const ipRequestHistory = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests/minute

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  const now = Date.now();

  const record = ipRequestHistory.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + RATE_LIMIT_WINDOW_MS;
  } else {
    record.count++;
  }

  ipRequestHistory.set(ip, record);

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      ok: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please wait a moment before sending another message.'
    });
  }

  next();
}

apiRouter.use(rateLimiter);

// 1. Health & Config Status Check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    llmConfigured: llmService.isConfigured(),
    provider: llmService.getProviderName(),
    timestamp: new Date().toISOString()
  });
});

// 2. Section 16: AI Cost & Usage Monitoring Endpoint
apiRouter.get('/admin/metrics', (req, res) => {
  res.json({
    ok: true,
    metrics: llmService.getMetrics()
  });
});

// 3. Conversational Chat Endpoint (Section 14 & Section 18)
apiRouter.post('/chat', async (req, res) => {
  try {
    const { message, history = [], language = 'en' } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_INPUT',
        message: 'Message cannot be empty.'
      });
    }

    const trimmed = message.trim();

    // Section 14: Expanded Deterministic Safety Guardrail
    // Catches: Suicide/self-harm, Immediate danger, Abuse/exploitation, Somatic emergency
    const safetyResult = checkSafetyScreen(trimmed, language);
    if (safetyResult.isCrisis) {
      llmService.metrics.safetyTriggerCount++;
      return res.json({
        ok: true,
        text: safetyResult.text,
        isCrisis: true,
        crisisType: safetyResult.crisisType,
        isPhysicalEmergency: Boolean(safetyResult.isPhysicalEmergency),
        provider: 'safety_guardrail',
        detectedDomains: ['safety_risk_screen']
      });
    }

    // Call secure server LLM (Section 15: No sensitive message content in console logs)
    const result = await llmService.generateChatResponse(trimmed, history, language);

    if (!result.ok) {
      return res.json({ ok: false, fallback: true, error: result.error });
    }

    return res.json(result);
  } catch (err) {
    console.error('API /chat failed with code:', err.message?.substring(0, 50));
    return res.status(500).json({
      ok: false,
      error: 'SERVER_ERROR',
      message: 'An internal error occurred in the chat companion service.'
    });
  }
});

// 4. Personal Reflection Summary Endpoint (Section 18: GENERATE PERSONAL SUMMARY)
apiRouter.post('/personal-summary', async (req, res) => {
  try {
    const { messages = [], language = 'en' } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_INPUT',
        message: 'At least one message is required to generate a summary.'
      });
    }

    const result = await llmService.generatePersonalSummary(messages, language);
    return res.json(result);
  } catch (err) {
    console.error('API /personal-summary failed:', err.message?.substring(0, 50));
    return res.status(500).json({
      ok: false,
      error: 'SERVER_ERROR',
      message: 'Failed to generate personal summary.'
    });
  }
});

// 5. Clinician Summary Endpoint (Adheres to 14 Exact Headings and Strict Generation Rules)
apiRouter.post('/clinician-summary', async (req, res) => {
  try {
    const { messages = [], language = 'en', patientId } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_INPUT',
        message: 'At least one message is required.'
      });
    }

    const dossier = await ClinicianSummaryGenerator.generate(messages, language, patientId || 'Authorized Patient Record');
    return res.json({
      ok: true,
      clinicalDossier: dossier,
      clinicianSummary: dossier
    });
  } catch (err) {
    console.error('API /clinician-summary failed:', err.message?.substring(0, 50));
    return res.status(500).json({
      ok: false,
      error: 'SERVER_ERROR',
      message: 'Failed to generate clinician summary.'
    });
  }
});

// 6. Backward Compatibility Alias for /reflection
apiRouter.post('/reflection', async (req, res) => {
  try {
    const { messages = [], language = 'en' } = req.body || {};
    const personal = await llmService.generatePersonalSummary(messages, language);
    const clinician = await llmService.generateClinicianDossier(messages, language);

    return res.json({
      ok: true,
      reflection: personal.reflection,
      clinicalDossier: clinician.clinicalDossier
    });
  } catch (err) {
    console.error('API /reflection failed:', err.message?.substring(0, 50));
    return res.status(500).json({
      ok: false,
      error: 'SERVER_ERROR',
      message: 'Failed to generate reflection.'
    });
  }
});
