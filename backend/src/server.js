import 'dotenv/config';
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

import authRoutes       from './routes/auth.js';
import testRoutes       from './routes/tests.js';
import candidateRoutes  from './routes/candidates.js';
import invitationRoutes from './routes/invitations.js';
import userRoutes       from './routes/users.js';
import dashboardRoutes  from './routes/dashboard.js';
import evaluationRoutes from './routes/evaluation.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();

// ─── Security & Logging ───────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));

// ─── CORS ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,       // Vite proxy handles origin restrictions in dev
  credentials: true,
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
});
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

// ─── 404 ──────────────────────────────────────────────────────────────────
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Error Handler ────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── DB Schema + Start ────────────────────────────────────────────────────
async function bootstrap() {
  try {
    const schemaPath = join(__dirname, 'db', 'schema.sql');
    const schema = await readFile(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('✓ Database schema applied');
  } catch (err) {
    console.error('✗ Failed to apply schema:', err.message);
    process.exit(1);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ HireOS API running on port ${PORT}`);
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠  GEMINI_API_KEY not set — LangGraph evaluation will not score candidates');
    } else {
      console.log('✓ Gemini Flash LLM ready for evaluation engine');
    }
  });
}

bootstrap();
