import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from './server/apiRouter.js';

// Load environment variables from .env
dotenv.config();

// Vite Dev Server Plugin: Mounts API middleware server-side in Node.js
// This ensures API keys are NEVER exposed to the frontend/browser
function samvaadApiDevPlugin() {
  const apiApp = express();
  apiApp.use(cookieParser());
  apiApp.use(express.json());
  apiApp.use(apiRouter);

  return {
    name: 'samvaad-api-dev-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/api')) {
          const originalUrl = req.url;
          req.url = req.url.replace(/^\/api/, '') || '/';
          return apiApp(req, res, (err) => {
            req.url = originalUrl;
            next(err);
          });
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), samvaadApiDevPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
