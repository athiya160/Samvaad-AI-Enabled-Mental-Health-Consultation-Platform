// Samvaad Platform Database Layer
// Implements unified relational data model using built-in node:sqlite (Node 22+)
// Enforces foreign key constraints, parameterized queries, and ownership isolation.

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path configured via env or default to server/data/samvaad.db
const dbDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dbDir, 'samvaad.db');

export const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for reliability
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
`);

// Initialize Database Schema
db.exec(`
  -- 1. Unified Users Table (supports Pseudonymous, Private & Google accounts)
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    account_type TEXT NOT NULL,
    display_name TEXT DEFAULT 'User',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 2. Authentication Identities (separates credentials from identity, prevents using email as DB PK)
  CREATE TABLE IF NOT EXISTS auth_identities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_subject_id TEXT NOT NULL,
    password_hash TEXT,
    password_salt TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(provider, provider_subject_id)
  );

  -- 2b. Private Credentials Table (for compatibility with private accounts)
  CREATE TABLE IF NOT EXISTS private_credentials (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 2c. Google Identities Table (for compatibility with Google accounts)
  CREATE TABLE IF NOT EXISTS google_identities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    google_sub TEXT NOT NULL UNIQUE,
    email TEXT,
    name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 3. Cryptographic Single-Use Recovery Codes (high-entropy, only stored as SHA-256 hash)
  CREATE TABLE IF NOT EXISTS recovery_codes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL,
    batch_id TEXT DEFAULT 'DEFAULT'
  );

  -- 4. Active Sessions (stores SHA-256 token hash; raw token never stored in DB)
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_active_at TEXT NOT NULL
  );

  -- 5. Personal Reflection Summaries (enforces strict user ownership)
  CREATE TABLE IF NOT EXISTS personal_reflections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    summary_content TEXT NOT NULL,
    conversation_snippet TEXT,
    disclaimer_acknowledged INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 6. Clinician Summaries (separate initial history dossier; never exposed without consent)
  CREATE TABLE IF NOT EXISTS clinician_summaries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reflection_id TEXT REFERENCES personal_reflections(id) ON DELETE SET NULL,
    dossier_content TEXT NOT NULL,
    generated_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    sharing_status TEXT NOT NULL DEFAULT 'private',
    doctor_id TEXT,
    shared_at TEXT
  );

  -- 7. Audit Consent Records (records user authorization events)
  CREATE TABLE IF NOT EXISTS consent_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    granted INTEGER NOT NULL CHECK(granted IN (0, 1)),
    scope TEXT NOT NULL,
    recorded_at TEXT NOT NULL
  );

  -- Performance & Lookup Indexes
  CREATE INDEX IF NOT EXISTS idx_auth_identities_user_id ON auth_identities(user_id);
  CREATE INDEX IF NOT EXISTS idx_auth_identities_lookup ON auth_identities(provider, provider_subject_id);
  CREATE INDEX IF NOT EXISTS idx_recovery_codes_user_id ON recovery_codes(user_id);
  CREATE INDEX IF NOT EXISTS idx_recovery_codes_lookup ON recovery_codes(user_id, code_hash);
  CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
  CREATE INDEX IF NOT EXISTS idx_personal_reflections_user_id ON personal_reflections(user_id);
  CREATE INDEX IF NOT EXISTS idx_clinician_summaries_user_id ON clinician_summaries(user_id);
  CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON consent_records(user_id);
`);

// Safe migrations for newly added columns if DB was already created
try { db.exec("ALTER TABLE clinician_summaries ADD COLUMN sharing_status TEXT DEFAULT 'private';"); } catch(e) {}
try { db.exec("ALTER TABLE clinician_summaries ADD COLUMN doctor_id TEXT;"); } catch(e) {}
try { db.exec("ALTER TABLE clinician_summaries ADD COLUMN shared_at TEXT;"); } catch(e) {}
try { db.exec("ALTER TABLE google_identities ADD COLUMN provider_sub TEXT;"); } catch(e) {}
try { db.exec("ALTER TABLE google_identities ADD COLUMN email_masked TEXT;"); } catch(e) {}

// Ensure users display_name does not fail inserts without display_name
try {
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  const displayNameCol = tableInfo.find(c => c.name === 'display_name');
  if (displayNameCol && displayNameCol.notnull === 1 && displayNameCol.dflt_value === null) {
    db.exec(`
      PRAGMA foreign_keys=off;
      CREATE TABLE users_temp (
        id TEXT PRIMARY KEY,
        account_type TEXT NOT NULL,
        display_name TEXT DEFAULT 'User',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT INTO users_temp SELECT id, account_type, COALESCE(display_name, 'User'), created_at, updated_at FROM users;
      DROP TABLE users;
      ALTER TABLE users_temp RENAME TO users;
      PRAGMA foreign_keys=on;
    `);
  }
} catch(e) {}

console.log('[Samvaad DB] SQLite initialized with foreign keys & WAL mode at:', dbPath);
