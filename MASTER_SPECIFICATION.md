# Samvaad AI Mental Health Platform — Master Specification & Acceptance Criteria

**Document Reference:** SAMVAAD-MASTER-SPEC-2026-V2  
**Target Stakeholder:** Dr. Alan Samuel (Consultant Psychiatrist) & Antigravity Engineering Team  
**Verification Framework:** Deterministic Acceptance Criteria with Playwright Automated Verification  

---

## 1. Core Operating Principles

1. **Free Exploration Without Mandatory Registration:**  
   The initial conversational exploration with Aura is accessible immediately from the homepage with zero registration, login, phone number, or payment gate.
2. **Supportive, Non-Diagnostic AI Companion:**  
   The companion explores thoughts, emotions, sleep, and stressors using open-ended questions. It strictly avoids routine treatment advice, medication recommendations, diagnoses, CBT, meditation scripts, or automated clinical formulations.
3. **Transparent Subsidized Consultation Pathway (< ₹500):**  
   Consultation with licensed psychiatrists and psychologists is completely optional, subsidized under ₹500, and never represented as a confirmed real appointment during prototype simulation.
4. **Zero-Latency Crisis Interruption:**  
   Any crisis or self-harm disclosure immediately halts routine history-taking and presents verified 24x7 Indian national helplines: **KIRAN** (`1800-599-0019`), **Tele-MANAS** (`14416`), **AASRA** (`98204 66726`), and **112**.

---

## 2. Updated Section 10: Three-Tier Consent Architecture

### Generation Rule (Updated)

> **After the user explicitly chooses to save the Personal Reflection and successfully authenticates, save the Personal Reflection.**
> 
> **Then separately ask whether the user consents to generation and persistent storage of the clinician-facing initial history summary.**
> 
> **Only generate and persist the clinician-facing summary if that separate consent is explicitly granted.**
> 
> **Consent to save a Personal Reflection does not constitute consent to generate, save, or share a clinician-facing summary.**
> 
> **Generation/storage consent does not constitute consent to share the clinician-facing summary with a professional.**
> 
> **Sharing requires another explicit authorization during the consultation workflow.**

```text
Three Clean Actions. Three Independent Permissions:

      Consent 1
SAVE PERSONAL REFLECTION
         ↓
      Consent 2
GENERATE + STORE CLINICIAN SUMMARY
         ↓
      Consent 3
SHARE CLINICIAN SUMMARY WITH SELECTED PROFESSIONAL
```

---

## 3. Account Architecture & Security (Phase 1)

1. **Unified User Model:**
   - Single internal user model (`users` table) with unique internal UUID (`usr_<uuid>`).
   - Supports both **Google-authenticated accounts** (`google_oidc`) and **Private pseudonymous accounts** (`pseudonymous_password`).
   - Email is **never** used as the primary database identifier.
2. **Server-Side Authentication Source of Truth:**
   - Browser `localStorage` is **not** the source of truth for authentication.
   - Sessions are managed server-side in SQLite (`sessions` table) storing SHA-256 hashes of 256-bit cryptographic tokens.
   - Client validates sessions via `GET /api/auth/me`.
3. **Password Security:**
   - Server-side `scrypt` hashing with 32-byte cryptographically secure random salt ($N=16384, r=8, p=1, \text{keylen}=64$).
   - Constant-time verification with `crypto.timingSafeEqual`.
   - Minimum 8 characters enforced.
   - Zero plaintext password storage or logging.
4. **Single-Use High-Entropy Recovery Codes:**
   - 8 cryptographic random codes generated per private account (`XXXX-XXXX-XXXX-XXXX`).
   - Displayed in plaintext **only once** upon generation.
   - Stored strictly as SHA-256 hashes in `recovery_codes` table.
   - Single-use invalidation (`used_at = datetime('now')`) prevents reuse.
   - Rate-limiting (maximum 5 attempts per 15 minutes) prevents brute-force attacks.
5. **Mandatory Disclosures:**
   - *"Private accounts are pseudonymous. You do not need to provide your real name, email address, or phone number to create this account."*
   - *"Please store your recovery codes somewhere safe. If you lose your password and all unused recovery codes, you may permanently lose access to this account."*
   - Accounts are accurately described as **pseudonymous**, not completely anonymous.
6. **Honest Google OAuth Status:**
   - Requires real `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
   - No mock or simulated Google logins are fabricated. If unconfigured, the UI transparently informs the user and guides them to create a Private Account.

---

## 4. Acceptance Criteria Matrix

| Domain | Item | Standard | Status |
| :--- | :---: | :--- | :---: |
| **A. Conversation** | 1 | Available without mandatory registration | PASS |
| | 2 | Friendly greeting and free-text acceptance | PASS |
| | 3 | Relevant open-ended follow-up questions | PASS |
| | 4 | Avoids repetitive questions and allows early finish | PASS |
| | 5 | No diagnoses, medication, CBT, or treatment plans | PASS |
| | 6 | Supports English and Kannada | PASS |
| **B. Reflection** | 7 | Summary appears before save prompt | PASS |
| | 8 | Mentions only conversation-supported facts | PASS |
| | 9 | Highlights relevant unknowns without assumptions | PASS |
| | 10 | Exact mandatory non-diagnostic clinical disclaimer | PASS |
| | 11 | Offers both SAVE SUMMARY and DO NOT SAVE | PASS |
| | 12 | DO NOT SAVE ensures zero persistent storage | PASS |
| **C. Saving & Consent** | 13 | SAVE SUMMARY leads to account selection | PASS |
| | 14 | Clear distinction between Google & Private accounts | PASS |
| | 15 | Cancelled registration does not save reflection | PASS |
| | 16 | Successful save permits retrieval and deletion | PASS |
| | 17 | **Separate consent required to generate clinician summary** | PASS |
| | 18 | Clinician summary follows 14 headings without diagnosis | PASS |
| | 19 | Clinician summary is never exposed or shared without separate consent | PASS |
| **D. Consultation** | 20 | Booking is completely optional | PASS |
| | 21 | User can continue without booking | PASS |
| | 22 | Transparent fees (< ₹500) and verified qualifications | PASS |
| | 23 | Pre-consultation summary sharing is optional | PASS |
| | 24 | Demo bookings are clearly labeled simulated | PASS |
| **E. Safety & Tech** | 25 | Crisis interrupts questioning with verified helplines | PASS |
| | 26 | Zero client-side API key exposure | PASS |
| | 27 | Backend session enforcement (no localStorage auth) | PASS |
| | 28 | Privacy and consent match actual SQLite implementation | PASS |
| | 29 | Demo consultant data clearly labeled simulated | PASS |
| | 30 | Production build compiles with zero errors | PASS |
