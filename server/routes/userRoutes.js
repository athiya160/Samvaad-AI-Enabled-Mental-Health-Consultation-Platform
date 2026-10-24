// User Data, Personal Reflection Vault & Clinician Summary API Endpoints
// Enforces Section 8, 9, 10, 18 & Strict Consent Separation:
// - All queries strictly scoped to authenticated req.user.userId
// - Personal Reflection saving and Clinician Summary generation are strictly separate decisions
// - Clinician summary is NEVER automatically generated or stored during reflection save
// - Explicit consent required for: (1) Save Personal Reflection, (2) Generate Clinician Summary, (3) Share with Clinician
// - Clinician summary can be reviewed and corrected by user before any sharing
// - Data export and account deletion compliance (DPDP & GDPR)

import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { llmService } from '../llmService.js';
import {
  changePassword,
  getRecoveryCodesStatus,
  regenerateRecoveryCodes
} from '../services/authService.js';

export const userRouter = Router();

// Protect all routes in this router with session authentication
userRouter.use(requireAuth);

// =========================================================================
// 1. Personal Reflection Endpoints (Separate Permission)
// =========================================================================

// POST /api/user/reflections
// Saves Personal Reflection ONLY. Does NOT generate or save a clinician summary.
userRouter.post('/reflections', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reflection, conversationSnippet = '', metadata = {}, language = 'en' } = req.body || {};

    if (!reflection || typeof reflection !== 'object') {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_REFLECTION',
        message: 'A valid reflection summary object is required.'
      });
    }

    const reflectionId = `ref_${crypto.randomUUID()}`;
    const consentId = `cns_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const title = reflection.title || (language === 'kn' ? 'ವೈಯಕ್ತಿಕ ಆತ್ಮಾವಲೋಕನ ಸಾರಾಂಶ' : 'Personal Reflection Summary');
    const summaryJson = JSON.stringify(reflection);

    db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Insert personal reflection
      db.prepare(`
        INSERT INTO personal_reflections (id, user_id, title, summary_content, conversation_snippet, disclaimer_acknowledged, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `).run(reflectionId, userId, title, summaryJson, conversationSnippet, now, now);

      // 2. Log separate explicit consent for saving Personal Reflection
      db.prepare(`
        INSERT INTO consent_records (id, user_id, consent_type, granted, scope, recorded_at)
        VALUES (?, ?, 'save_personal_reflection', 1, 'personal_vault', ?)
      `).run(consentId, userId, now);

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    return res.status(201).json({
      ok: true,
      message: 'Your personal reflection has been saved.',
      reflectionId,
      savedAt: now
    });
  } catch (err) {
    console.error('Failed to save reflection:', err.message);
    return res.status(500).json({
      ok: false,
      error: 'STORAGE_FAILED',
      message: 'Failed to save reflection to your account.'
    });
  }
});

// GET /api/user/reflections
// Retrieves all saved personal reflections for the authenticated user
userRouter.get('/reflections', (req, res) => {
  try {
    const userId = req.user.userId;

    const stmt = db.prepare(`
      SELECT 
        id,
        title,
        summary_content,
        conversation_snippet,
        disclaimer_acknowledged,
        created_at,
        updated_at
      FROM personal_reflections
      WHERE user_id = ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(userId);

    const formatted = rows.map(r => {
      let parsedSummary = {};
      try { parsedSummary = JSON.parse(r.summary_content); } catch (e) {}

      return {
        id: r.id,
        title: r.title,
        reflection: parsedSummary,
        conversationSnippet: r.conversation_snippet,
        disclaimerAcknowledged: Boolean(r.disclaimer_acknowledged),
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };
    });

    return res.json({
      ok: true,
      reflections: formatted
    });
  } catch (err) {
    console.error('Failed to retrieve reflections:', err.message);
    return res.status(500).json({
      ok: false,
      error: 'RETRIEVAL_FAILED',
      message: 'Failed to load saved reflections.'
    });
  }
});

// DELETE /api/user/reflections/:id
userRouter.delete('/reflections/:id', (req, res) => {
  try {
    const userId = req.user.userId;
    const reflectionId = req.params.id;

    const exists = db.prepare(`SELECT id FROM personal_reflections WHERE id = ? AND user_id = ?`).get(reflectionId, userId);
    if (!exists) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND',
        message: 'Reflection not found or unauthorized.'
      });
    }

    db.prepare(`DELETE FROM personal_reflections WHERE id = ? AND user_id = ?`).run(reflectionId, userId);

    return res.json({
      ok: true,
      message: 'Reflection permanently deleted.'
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'DELETE_FAILED',
      message: 'Failed to delete reflection.'
    });
  }
});

// PUT /api/user/reflections/:id
// Edit / correct user notes or reflection details
userRouter.put('/reflections/:id', (req, res) => {
  try {
    const userId = req.user.userId;
    const reflectionId = req.params.id;
    const { title, reflection, userNotes } = req.body || {};

    const existing = db.prepare(`SELECT id, title, summary_content FROM personal_reflections WHERE id = ? AND user_id = ?`).get(reflectionId, userId);
    if (!existing) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND',
        message: 'Reflection not found or unauthorized.'
      });
    }

    let parsed = {};
    try { parsed = JSON.parse(existing.summary_content); } catch (e) {}
    if (reflection && typeof reflection === 'object') {
      parsed = { ...parsed, ...reflection };
    }
    if (userNotes !== undefined) {
      parsed.userNotes = userNotes;
    }

    const updatedTitle = (title && typeof title === 'string' && title.trim()) ? title.trim() : (parsed.title || existing.title || 'Personal Reflection Summary');
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE personal_reflections
      SET title = ?, summary_content = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(updatedTitle, JSON.stringify(parsed), now, reflectionId, userId);

    return res.json({
      ok: true,
      message: 'Reflection updated successfully.',
      reflection: {
        id: reflectionId,
        title: updatedTitle,
        reflection: parsed,
        updatedAt: now
      }
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'UPDATE_FAILED',
      message: 'Failed to update reflection.'
    });
  }
});

// =========================================================================
// 2. Clinician Summary Endpoints (Strictly Separate Consent)
// =========================================================================

// POST /api/user/clinician-summaries (or /api/user/clinician-summary)
// Generates and saves a Clinician Summary ONLY after explicit separate consent is granted
userRouter.post(['/clinician-summaries', '/clinician-summary'], async (req, res) => {
  try {
    const userId = req.user.userId;
    const { messages = [], reflectionId = null, summary = null, language = 'en', metadata = {} } = req.body || {};

    let clinicianDossier = summary;

    // Generate if not provided directly
    if (!clinicianDossier) {
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          ok: false,
          error: 'MISSING_MESSAGES',
          message: 'Conversation messages are required to synthesize the clinician summary.'
        });
      }

      const dossierResult = await llmService.generateClinicianDossier(messages, language, userId);
      clinicianDossier = dossierResult.clinicalDossier;
    }

    const summaryId = `clin_${crypto.randomUUID()}`;
    const consentId = `cns_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Save clinician summary with status 'draft' and sharing_status 'private'
      db.prepare(`
        INSERT INTO clinician_summaries (id, user_id, reflection_id, dossier_content, generated_at, status, sharing_status)
        VALUES (?, ?, ?, ?, ?, 'draft', 'private')
      `).run(summaryId, userId, reflectionId, JSON.stringify(clinicianDossier), now);

      // 2. Record separate explicit consent for generating/storing clinician summary
      db.prepare(`
        INSERT INTO consent_records (id, user_id, consent_type, granted, scope, recorded_at)
        VALUES (?, ?, 'generate_clinician_summary', 1, 'private_account_dossier', ?)
      `).run(consentId, userId, now);

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    return res.status(201).json({
      ok: true,
      message: 'Clinician initial history summary prepared and saved to your private account. It is not shared with any doctor unless you explicitly choose to share it later.',
      summaryId,
      clinicianSummary: clinicianDossier,
      sharingStatus: 'private',
      savedAt: now
    });
  } catch (err) {
    console.error('Failed to generate/save clinician summary:', err.message);
    return res.status(500).json({
      ok: false,
      error: 'CLINICIAN_SUMMARY_FAILED',
      message: 'Failed to prepare clinician summary.'
    });
  }
});

// GET /api/user/clinician-summaries
userRouter.get('/clinician-summaries', (req, res) => {
  try {
    const userId = req.user.userId;

    const rows = db.prepare(`
      SELECT id, reflection_id, dossier_content, generated_at, status, sharing_status, doctor_id, shared_at
      FROM clinician_summaries
      WHERE user_id = ?
      ORDER BY generated_at DESC
    `).all(userId);

    const formatted = rows.map(r => {
      let content = {};
      try { content = JSON.parse(r.dossier_content); } catch (e) {}
      return {
        id: r.id,
        reflectionId: r.reflection_id,
        clinicianSummary: content,
        generatedAt: r.generated_at,
        status: r.status,
        sharingStatus: r.sharing_status || 'private',
        doctorId: r.doctor_id,
        sharedAt: r.shared_at
      };
    });

    return res.json({
      ok: true,
      summaries: formatted
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'RETRIEVAL_FAILED',
      message: 'Failed to load clinician summaries.'
    });
  }
});

// GET /api/user/clinician-summaries/:id
userRouter.get('/clinician-summaries/:id', (req, res) => {
  try {
    const userId = req.user.userId;
    const summaryId = req.params.id;

    const row = db.prepare(`
      SELECT id, reflection_id, dossier_content, generated_at, status, sharing_status, doctor_id, shared_at
      FROM clinician_summaries
      WHERE id = ? AND user_id = ?
    `).get(summaryId, userId);

    if (!row) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND',
        message: 'Clinician summary not found or unauthorized.'
      });
    }

    let content = {};
    try { content = JSON.parse(row.dossier_content); } catch (e) {}

    return res.json({
      ok: true,
      summary: {
        id: row.id,
        reflectionId: row.reflection_id,
        clinicianSummary: content,
        generatedAt: row.generated_at,
        status: row.status,
        sharingStatus: row.sharing_status || 'private',
        doctorId: row.doctor_id,
        sharedAt: row.shared_at
      }
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'RETRIEVAL_FAILED',
      message: 'Failed to load clinician summary.'
    });
  }
});

// PUT /api/user/clinician-summaries/:id
// Review and correct the clinician summary before sharing
userRouter.put('/clinician-summaries/:id', (req, res) => {
  try {
    const userId = req.user.userId;
    const summaryId = req.params.id;
    const { clinicianSummary } = req.body || {};

    if (!clinicianSummary || typeof clinicianSummary !== 'object') {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_CONTENT',
        message: 'Updated clinician summary content is required.'
      });
    }

    const exists = db.prepare(`SELECT id FROM clinician_summaries WHERE id = ? AND user_id = ?`).get(summaryId, userId);
    if (!exists) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND',
        message: 'Summary not found or unauthorized.'
      });
    }

    db.prepare(`
      UPDATE clinician_summaries
      SET dossier_content = ?
      WHERE id = ? AND user_id = ?
    `).run(JSON.stringify(clinicianSummary), summaryId, userId);

    return res.json({
      ok: true,
      message: 'Clinician summary updated and corrected successfully.'
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'UPDATE_FAILED',
      message: 'Failed to update clinician summary.'
    });
  }
});

// DELETE /api/user/clinician-summaries/:id
userRouter.delete('/clinician-summaries/:id', (req, res) => {
  try {
    const userId = req.user.userId;
    const summaryId = req.params.id;

    const exists = db.prepare(`SELECT id FROM clinician_summaries WHERE id = ? AND user_id = ?`).get(summaryId, userId);
    if (!exists) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND',
        message: 'Summary not found or unauthorized.'
      });
    }

    db.prepare(`DELETE FROM clinician_summaries WHERE id = ? AND user_id = ?`).run(summaryId, userId);

    return res.json({
      ok: true,
      message: 'Clinician summary permanently deleted.'
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'DELETE_FAILED',
      message: 'Failed to delete clinician summary.'
    });
  }
});

// POST /api/user/clinician-summaries/:id/share
// Authorize voluntary sharing with a specific doctor during consultation
userRouter.post('/clinician-summaries/:id/share', (req, res) => {
  try {
    const userId = req.user.userId;
    const summaryId = req.params.id;
    const { doctorId = 'dr-alan-samuel', doctorName = 'Dr. Alan Samuel' } = req.body || {};

    const exists = db.prepare(`SELECT id FROM clinician_summaries WHERE id = ? AND user_id = ?`).get(summaryId, userId);
    if (!exists) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND',
        message: 'Summary not found or unauthorized.'
      });
    }

    const consentId = `cns_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        UPDATE clinician_summaries
        SET sharing_status = 'shared_with_doctor', doctor_id = ?, shared_at = ?
        WHERE id = ? AND user_id = ?
      `).run(doctorId, now, summaryId, userId);

      db.prepare(`
        INSERT INTO consent_records (id, user_id, consent_type, granted, scope, recorded_at)
        VALUES (?, ?, 'share_clinician_summary', 1, ?, ?)
      `).run(consentId, userId, `shared_with_${doctorId}`, now);

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    return res.json({
      ok: true,
      message: `Explicit consent recorded. Initial history summary securely authorized for consultation review by ${doctorName}.`
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'SHARING_FAILED',
      message: 'Failed to authorize summary sharing.'
    });
  }
});

// =========================================================================
// 3. Consent Audit Trail & Data Subject Rights (DPDP / GDPR)
// =========================================================================

// GET /api/user/consents (or /api/user/consent-history)
userRouter.get(['/consents', '/consent-history'], (req, res) => {
  try {
    const userId = req.user.userId;

    const rows = db.prepare(`
      SELECT id, consent_type, granted, scope, recorded_at
      FROM consent_records
      WHERE user_id = ?
      ORDER BY recorded_at DESC
    `).all(userId);

    return res.json({
      ok: true,
      consents: rows.map(r => ({
        id: r.id,
        consentType: r.consent_type,
        granted: Boolean(r.granted),
        scope: r.scope,
        recordedAt: r.recorded_at
      }))
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'CONSENT_RETRIEVAL_FAILED',
      message: 'Failed to retrieve consent records.'
    });
  }
});

// GET /api/user/export
userRouter.get('/export', (req, res) => {
  try {
    const userId = req.user.userId;

    const user = db.prepare('SELECT id, account_type, display_name, created_at FROM users WHERE id = ?').get(userId);
    const reflections = db.prepare('SELECT id, title, summary_content, created_at FROM personal_reflections WHERE user_id = ?').all(userId).map(r => {
      try { return { ...r, summary_content: JSON.parse(r.summary_content) }; } catch(e) { return r; }
    });
    const clinicianSummaries = db.prepare('SELECT id, dossier_content, generated_at, sharing_status, doctor_id, shared_at FROM clinician_summaries WHERE user_id = ?').all(userId).map(r => {
      try { return { ...r, dossier_content: JSON.parse(r.dossier_content) }; } catch(e) { return r; }
    });
    const consents = db.prepare('SELECT id, consent_type, granted, scope, recorded_at FROM consent_records WHERE user_id = ?').all(userId);

    return res.json({
      ok: true,
      exportDate: new Date().toISOString(),
      user,
      personalReflections: reflections,
      clinicianSummaries: clinicianSummaries,
      consentRecords: consents,
      transparencyNotice: "This data export contains all records stored under your account on Samvaad. In accordance with privacy principles, this data is retained under your control and may be deleted at any time."
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'EXPORT_FAILED',
      message: 'Failed to export user data.'
    });
  }
});

// DELETE /api/user/account
userRouter.delete('/account', (req, res) => {
  try {
    const userId = req.user.userId;

    // Foreign keys with CASCADE will delete auth identities, recovery codes, sessions, reflections, summaries, and consent
    db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);

    return res.json({
      ok: true,
      message: 'Your account and all associated reflections and summaries have been permanently deleted.'
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'ACCOUNT_DELETE_FAILED',
      message: 'Failed to delete account.'
    });
  }
});

// =========================================================================
// 4. Security & Credential Management (Password & Single-Use Recovery Codes)
// =========================================================================

// GET /api/user/security/status
userRouter.get('/security/status', (req, res) => {
  try {
    const userId = req.user.userId;
    const user = db.prepare('SELECT id, account_type, display_name FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });
    }

    const recoveryStatus = getRecoveryCodesStatus(userId);

    return res.json({
      ok: true,
      accountType: user.account_type,
      displayName: user.display_name,
      isPrivateAccount: user.account_type === 'pseudonymous',
      isGoogleAccount: user.account_type === 'google',
      recoveryCodes: recoveryStatus
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'STATUS_FAILED', message: err.message });
  }
});

// POST /api/user/security/change-password
userRouter.post('/security/change-password', (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body || {};

    const result = changePassword(userId, currentPassword, newPassword);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({
      ok: false,
      error: 'PASSWORD_CHANGE_FAILED',
      message: err.message
    });
  }
});

// POST /api/user/security/recovery-codes/regenerate
// Invalidate previous recovery codes and issue a fresh set of 8 codes
userRouter.post('/security/recovery-codes/regenerate', (req, res) => {
  try {
    const userId = req.user.userId;
    const result = regenerateRecoveryCodes(userId);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({
      ok: false,
      error: 'REGENERATE_FAILED',
      message: err.message
    });
  }
});
