# Samvaad (ಸಂವಾದ) — Mental Health Platform

> **Affordable, Stigma-Free Mental Health Care for Bharat**  
> An empathetic, bilingual (English & Kannada) conversational mental-health platform with non-diagnostic personal reflections, privacy-preserving pseudonymous accounts, single-use recovery code security, and seamless pathways to licensed psychiatric consultation.

---

## 🌟 Key Highlights & Architecture

- **Zero-Login First Experience**: Users can immediately converse with Aura (AI companion) without mandatory registration.
- **Adaptive History Taking & Crisis Screen**: Real-time deterministic crisis detection (suicide, self-harm, somatic emergencies) with immediate 24/7 national helpline links (KIRAN `1800-599-0019`, Tele-MANAS `14416`).
- **Structured Personal Reflection (Sections A–G)**: Accurate, non-diagnostic synthesis of user-shared context.
- **Privacy-First Save Workflow**:
  - Personal reflection saved to account first.
  - Optional, separately consented 14-section clinician dossier generation stored privately (`DO NOT SHARE` status by default).
- **Dual Authentication**:
  - **Private Pseudonymous**: Nickname + Password + 8 single-use cryptographic recovery codes (`SAMV-XXXX-XXXX`). No email or phone collected.
  - **Google OAuth 2.0 / OIDC**: Clean, honest configuration with zero frontend secrets exposure.
- **Stack**: React 18, Vite, Tailwind CSS, Node.js Express, built-in SQLite (`node:sqlite`), Google Gemini 1.5 Flash (or OpenAI).

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
- Node.js 22.x or 24.x (LTS recommended)
- npm 9+

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Configure your API keys in `.env` (optional for offline mode, recommended for live AI responses):
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5001
NODE_ENV=development
```

### 3. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 4. Run Production Server
```bash
npm run build
npm start
```
Open **`http://localhost:5001`** in your browser. The Express server serves both the React frontend and all `/api` endpoints simultaneously.

---

## 🌐 How to Add This Project Live (Deployment Guide)

Here are the best ways to make this project live on the internet so that Dr. Alan and others can visit and test it with a public URL:

### Option 1: Instant Live URL via Cloudflare Tunnel / LocalTunnel (Fastest — 60 Seconds)
If you want to share a live working link **right now** directly from your running computer without creating cloud accounts or credit cards:

1. Start your local server:
   ```bash
   npm run dev -- --host
   ```
2. In a second terminal, run:
   ```bash
   npx localtunnel --port 5173
   ```
3. It will give you a public URL like:
   `https://samvaad-preview.loca.lt`
   Share this URL with anyone on mobile or desktop!

---

### Option 2: Free 24/7 Cloud Hosting on Render (Recommended for Permanent URL)
Render provides free web hosting for Node.js full-stack applications with automatic HTTPS.

1. **Push your code to GitHub**:
   - Create a new repository on [GitHub](https://github.com).
   - Push this project to your repository.
2. **Deploy on Render**:
   - Go to [render.com](https://render.com) and sign in.
   - Click **New +** → **Web Service**.
   - Connect your GitHub repository.
   - Configure the following settings:
     - **Name**: `samvaad-mental-health`
     - **Runtime**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: `Free`
   - Under **Environment Variables**, add:
     - `NODE_ENV` = `production`
     - `PORT` = `10000`
     - `GEMINI_API_KEY` = *(your Google AI Studio key)*
3. Click **Deploy Web Service**.
4. Render will build and provide a live URL like:
   `https://samvaad-mental-health.onrender.com`

---

### Option 3: Railway.app (Automatic SQLite Persistence)
Railway offers automatic containerized hosting with persistent storage for SQLite:

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select this repository.
4. Add environment variables (`GEMINI_API_KEY`, `NODE_ENV=production`).
5. Under Settings → Networking, click **Generate Domain**.
6. Railway automatically runs `npm install`, `npm run build`, and `npm start`.

---

### Option 4: Deploying to Google Cloud Run
If you have a Google Cloud account:
```bash
# Build & Deploy directly via Google Cloud CLI:
gcloud run deploy samvaad-mental-health \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="your_api_key",NODE_ENV="production"
```

---

## 🧪 Running Automated Tests

To run the complete test suite (Crisis guardrails, Aura conversational engine, Account architecture, and Single-Use Recovery Code state machine):

```bash
npm test
```

---

## 🔒 Security & Privacy Notice

- Zero secrets are embedded into client-side code.
- Cryptographic password hashing uses OWASP-recommended `scrypt` with individual salts.
- Single-use recovery codes are stored solely as SHA-256 hashes and permanently invalidated upon first use.
- Fictional consultant profiles and demo appointments are clearly designated for demonstration safety.
