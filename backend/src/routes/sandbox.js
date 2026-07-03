/**
 * Sandbox REST API
 *
 * Complements the WebSocket terminal with REST endpoints for:
 * - File CRUD (create, read, update, delete files in a session)
 * - One-shot code execution (for Run button without WebSocket)
 * - Test case execution
 * - Session file snapshot (autosave)
 * - AI prompt relay (candidate → Gemini → diff for Accept/Reject/Modify)
 */

import { Router } from 'express';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { executeCode, runTestCases } from '../sandbox/pistonClient.js';
import { activeSessions } from '../websocket/wsServer.js';
import { query } from '../db/index.js';

const router = Router();

// ─── Middleware: validate invitation token ────────────────────────────────

async function validateToken(req, res, next) {
  const token = req.headers['x-invitation-token'] || req.query.token;
  if (!token) return res.status(401).json({ error: 'Invitation token required' });

  try {
    const result = await query(
      `SELECT i.id, i.candidate_id, i.test_id, i.status,
              es.id AS session_id
       FROM invitations i
       LEFT JOIN evaluation_sessions es ON es.invitation_id = i.id
       WHERE i.invitation_token = $1`,
      [token]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Invalid invitation token' });
    const inv = result.rows[0];
    if (['expired'].includes(inv.status)) return res.status(403).json({ error: 'Invitation expired' });
    req.invitation = inv;
    next();
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/sandbox/files — list files in session ──────────────────────
router.get('/files', validateToken, async (req, res, next) => {
  try {
    const { session_id } = req.invitation;
    if (!session_id) return res.json({ files: {} });

    // Try in-memory first (live session), fall back to DB
    const memState = activeSessions.get(session_id);
    if (memState) return res.json({ files: memState.files, language: memState.language });

    const row = await query(
      `SELECT sandbox_files, (SELECT language FROM tests WHERE id = es.test_id) as language
       FROM evaluation_sessions es WHERE id = $1`,
      [session_id]
    );
    res.json({ files: row.rows[0]?.sandbox_files || {}, language: row.rows[0]?.language || 'python' });
  } catch (err) { next(err); }
});

// ─── POST /api/sandbox/files — save a file ───────────────────────────────
router.post('/files', validateToken, async (req, res, next) => {
  try {
    const { filename, content } = req.body;
    if (!filename) return res.status(400).json({ error: 'filename required' });
    // Sanitize filename — prevent path traversal / JSONB key injection
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(filename)) {
      return res.status(400).json({ error: 'Invalid filename. Use alphanumeric, dots, dashes, underscores only.' });
    }

    const { session_id } = req.invitation;
    if (!session_id) return res.status(400).json({ error: 'No active session' });

    // Update in-memory session
    const memState = activeSessions.get(session_id);
    if (memState) memState.files[filename] = content || '';

    // Persist to DB
    await query(
      `UPDATE evaluation_sessions
       SET sandbox_files = jsonb_set(COALESCE(sandbox_files, '{}'), $1, $2)
       WHERE id = $3`,
      [`{${filename}}`, JSON.stringify(content || ''), session_id]
    );

    // Append FILE_SAVED telemetry
    await query(
      `UPDATE evaluation_sessions SET telemetry = telemetry || $1::jsonb WHERE id = $2`,
      [JSON.stringify([{ eventType: 'FILE_SAVED', timestamp: Date.now(), payload: { filename, size: (content||'').length } }]), session_id]
    );

    res.json({ ok: true, filename });
  } catch (err) { next(err); }
});

// ─── POST /api/sandbox/run — execute code (REST version) ─────────────────
router.post('/run', validateToken, async (req, res, next) => {
  try {
    const { code, language = 'python', stdin = '', filename = 'main.py' } = req.body;
    if (!code) return res.status(400).json({ error: 'code required' });

    const result = await executeCode({ language, code, stdin, timeout: 12000 });

    // Log telemetry
    const { session_id } = req.invitation;
    if (session_id) {
      await query(
        `UPDATE evaluation_sessions SET telemetry = telemetry || $1::jsonb WHERE id = $2`,
        [JSON.stringify([{
          eventType: result.error ? 'ERROR_ENCOUNTERED' : 'CODE_EXECUTED',
          timestamp: Date.now(),
          payload: { filename, language, exitCode: result.exitCode, stderr: result.stderr?.slice(0, 300) },
        }]), session_id]
      );
    }

    res.json(result);
  } catch (err) { next(err); }
});

// ─── POST /api/sandbox/test — run all test cases ─────────────────────────
router.post('/test', validateToken, async (req, res, next) => {
  try {
    const { code, language = 'python' } = req.body;
    const { test_id, session_id } = req.invitation;

    const tcRows = await query(
      `SELECT name, input, expected_output AS "expectedOutput", is_hidden FROM test_cases
       WHERE test_id = $1`,
      [test_id]
    );
    const testCases = tcRows.rows.filter(tc => !tc.is_hidden);
    if (!testCases.length) return res.json({ results: [], message: 'No visible test cases' });

    const results = await runTestCases(code, language, testCases);
    const passed  = results.filter(r => r.passed).length;

    // Append test result events to telemetry
    if (session_id) {
      const events = results.map(r => ({
        eventType: 'TEST_CASE_RESULT',
        timestamp: Date.now(),
        payload: r,
      }));
      await query(
        `UPDATE evaluation_sessions SET telemetry = telemetry || $1::jsonb WHERE id = $2`,
        [JSON.stringify(events), session_id]
      );
    }

    res.json({ results, passed, total: testCases.length });
  } catch (err) { next(err); }
});

// ─── POST /api/sandbox/ai — AI prompt relay ──────────────────────────────
// Candidate prompts → Gemini generates/modifies code → returns diff for Accept/Reject
router.post('/ai', validateToken, async (req, res, next) => {
  try {
    const { prompt, currentCode = '', language = 'python', action = 'generate', context: ctx = '' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'AI not configured' });

    const { session_id } = req.invitation;

    // Log PROMPT_SENT event
    if (session_id) {
      await query(
        `UPDATE evaluation_sessions SET telemetry = telemetry || $1::jsonb WHERE id = $2`,
        [JSON.stringify([{ eventType: 'PROMPT_SENT', timestamp: Date.now(), payload: { prompt, action, language } }]), session_id]
      );
    }

    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.3,
      maxOutputTokens: 2048,
    });

    const systemPrompt = action === 'generate'
      ? `You are an expert ${language} engineer helping a candidate in a timed coding test. 
Generate clean, well-commented ${language} code based on the prompt.
Return ONLY the code — no markdown code fences, no explanation before or after.
The code should be complete and runnable.`
      : `You are an expert ${language} engineer. Modify the existing code based on the instruction.
Return ONLY the modified code — no markdown fences, no explanation.
Preserve the existing structure where possible.`;

    const userContent = action === 'generate'
      ? `Task context:\n${ctx}\n\nCandidate prompt:\n${prompt}`
      : `Current code:\n${currentCode}\n\nModification instruction:\n${prompt}`;

    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userContent),
    ]);

    const generatedCode = typeof response.content === 'string'
      ? response.content.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
      : JSON.stringify(response.content);

    // Log MODEL_RESPONSE
    if (session_id) {
      await query(
        `UPDATE evaluation_sessions SET telemetry = telemetry || $1::jsonb WHERE id = $2`,
        [JSON.stringify([{ eventType: 'MODEL_RESPONSE', timestamp: Date.now(), payload: { codeLength: generatedCode.length, model: 'gemini-2.5-flash' } }]), session_id]
      );
    }

    res.json({ code: generatedCode, model: 'gemini-2.5-flash' });
  } catch (err) { next(err); }
});

// ─── POST /api/sandbox/ai-action — log Accept/Reject/Modify ──────────────
router.post('/ai-action', validateToken, async (req, res, next) => {
  try {
    const { action, filename } = req.body; // action: 'CODE_ACCEPTED' | 'CODE_REJECTED' | 'CODE_MODIFIED'
    const { session_id } = req.invitation;
    if (!session_id) return res.json({ ok: true });

    const validActions = ['CODE_ACCEPTED', 'CODE_REJECTED', 'CODE_MODIFIED'];
    if (!validActions.includes(action)) return res.status(400).json({ error: 'Invalid action' });

    await query(
      `UPDATE evaluation_sessions SET telemetry = telemetry || $1::jsonb WHERE id = $2`,
      [JSON.stringify([{ eventType: action, timestamp: Date.now(), payload: { filename } }]), session_id]
    );

    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── POST /api/sandbox/snapshot — autosave files ─────────────────────────
router.post('/snapshot', validateToken, async (req, res, next) => {
  try {
    const { files } = req.body;
    const { session_id } = req.invitation;
    if (!session_id) return res.json({ ok: true });

    await query(
      `INSERT INTO sandbox_snapshots (session_id, files) VALUES ($1, $2)`,
      [session_id, JSON.stringify(files || {})]
    );

    // Update live session
    const memState = activeSessions.get(session_id);
    if (memState && files) Object.assign(memState.files, files);

    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
