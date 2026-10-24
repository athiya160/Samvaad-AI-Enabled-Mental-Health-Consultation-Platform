// Production and Standalone Server for Samvaad Mental Health Platform
// Serves /api endpoints and static frontend build

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './apiRouter.js';
import { authRouter } from './routes/authRoutes.js';
import { userRouter } from './routes/userRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root of mental-health-platform
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// Request logging middleware for monitoring API calls
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - start}ms)`);
    });
  }
  next();
});

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api', apiRouter);

// Serve static frontend build in production
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback for client-side routing
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Samvaad Server Running. For frontend dev mode, run: npm run dev');
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==================================================`);
  console.log(` Samvaad AI Companion Server`);
  console.log(` Running on: http://localhost:${PORT}`);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(` LLM Configured: ${process.env.GEMINI_API_KEY ? 'Google Gemini' : (process.env.OPENAI_API_KEY ? 'OpenAI' : 'None (Set GEMINI_API_KEY in .env)')}`);
  console.log(`==================================================\n`);
});
