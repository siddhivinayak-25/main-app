import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import pool from './db/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { attachWebSocketServer } from './websocket/wsServer.js';

import authRoutes       from './routes/auth.js';
import testRoutes       from './routes/tests.js';
import candidateRoutes  from './routes/candidates.js';
import invitationRoutes from './routes/invitations.js';
import userRoutes       from './routes/users.js';
import dashboardRoutes  from './routes/dashboard.js';
import evaluationRoutes from './routes/evaluation.js';
import sandboxRoutes    from './routes/sandbox.js';
import securityRoutes   from './routes/security.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();

// ─── Security & Logging ───────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));

// ─── CORS ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));

// ─── Body Parsing ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20,
  message: { error: 'Too many requests, please try again later.' } });
app.use('/api/auth/login',  authLimiter);
app.use('/api/auth/signup', authLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'unreachable' });
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/tests',      testRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/invitations',invitationRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/sandbox',    sandboxRoutes);
app.use('/api/security',   securityRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────
app.use('/api/*', (_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    const schema = await readFile(join(__dirname, 'db', 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✓ Database schema applied');
  } catch (err) {
    console.error('✗ Schema error:', err.message);
    process.exit(1);
  }

  // Create HTTP server (needed to attach WebSocket)
  const httpServer = createServer(app);
  attachWebSocketServer(httpServer);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ HireOS API running on port ${PORT}`);
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠  GEMINI_API_KEY not set — AI features disabled');
    } else {
      console.log('✓ Gemini 2.5 Flash ready (evaluation + AI panel)');
    }
  });
}

bootstrap();
