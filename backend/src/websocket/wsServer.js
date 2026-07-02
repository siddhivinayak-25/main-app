/**
 * HireOS WebSocket Server
 *
 * Handles two WebSocket channels:
 *
 *   /ws/terminal?sessionId=xxx&token=xxx
 *     ─ Real terminal session via Piston API
 *     ─ Commands typed by candidate → parsed → executed
 *     ─ Output streamed back in real-time
 *
 *   /ws/security?sessionId=xxx&token=xxx
 *     ─ Security events from the browser (face detection, tab switches, etc.)
 *     ─ Logged to security_events table
 *     ─ Severity-based alerts sent back to frontend
 *
 * Protocol (both channels): JSON messages
 *   Client → Server: { type: 'COMMAND'|'SECURITY_EVENT'|'PING', payload: {...} }
 *   Server → Client: { type: 'OUTPUT'|'ERROR'|'ACK'|'ALERT'|'PONG', payload: {...} }
 */

import { WebSocketServer } from 'ws';
import { URL } from 'url';
import { executeCode, runTestCases } from '../sandbox/pistonClient.js';
import { query } from '../db/index.js';

// ─── Session store: in-memory terminal state per candidate session ─────────
const activeSessions = new Map();
// { sessionId → { language, files: { filename: content }, history: [] } }

function getOrCreateSession(sessionId, language = 'python') {
  if (!activeSessions.has(sessionId)) {
    activeSessions.set(sessionId, {
      language,
      files: { 'main.py': '# Write your solution here\n' },
      history: [],
      createdAt: Date.now(),
    });
  }
  return activeSessions.get(sessionId);
}

function send(ws, type, payload) {
  if (ws.readyState === 1 /* OPEN */) {
    ws.send(JSON.stringify({ type, payload, ts: Date.now() }));
  }
}

// ─── Terminal Command Interpreter ─────────────────────────────────────────

const HELP_TEXT = `
HireOS Sandbox Terminal
─────────────────────────────────────────────
  run [filename]    Execute a file via Piston
  python main.py    Same as above (python)
  test              Run all test cases
  ls                List files in workspace
  cat <file>        Show file contents
  clear             Clear terminal
  lang <language>   Switch language runtime
  help              Show this help
─────────────────────────────────────────────
`.trim();

async function handleTerminalCommand(ws, sessionState, rawCmd, sessionId, testCases = []) {
  const cmd = rawCmd.trim();
  if (!cmd) { send(ws, 'OUTPUT', { text: '\r\n' }); return; }

  sessionState.history.push(cmd);
  const parts = cmd.split(/\s+/);
  const verb  = parts[0].toLowerCase();

  // ── built-ins
  if (verb === 'clear') {
    send(ws, 'CLEAR', {});
    return;
  }

  if (verb === 'help') {
    send(ws, 'OUTPUT', { text: HELP_TEXT + '\r\n' });
    return;
  }

  if (verb === 'ls') {
    const files = Object.keys(sessionState.files);
    send(ws, 'OUTPUT', { text: files.join('  ') + '\r\n' });
    return;
  }

  if (verb === 'cat') {
    const filename = parts[1];
    if (!filename) { send(ws, 'OUTPUT', { text: 'Usage: cat <filename>\r\n' }); return; }
    const content = sessionState.files[filename];
    if (!content) { send(ws, 'OUTPUT', { text: `cat: ${filename}: No such file\r\n` }); return; }
    send(ws, 'OUTPUT', { text: content + '\r\n' });
    return;
  }

  if (verb === 'lang') {
    const lang = parts[1];
    if (!lang) { send(ws, 'OUTPUT', { text: `Current language: ${sessionState.language}\r\n` }); return; }
    sessionState.language = lang;
    send(ws, 'OUTPUT', { text: `✓ Language set to: ${lang}\r\n` });
    return;
  }

  if (verb === 'test') {
    send(ws, 'OUTPUT', { text: `Running ${testCases.length} test cases via Piston...\r\n` });
    const mainFile = Object.entries(sessionState.files).find(([n]) =>
      n.startsWith('main') || n.startsWith('solution')
    );
    if (!mainFile) { send(ws, 'OUTPUT', { text: 'No main file found.\r\n' }); return; }

    const results = await runTestCases(mainFile[1], sessionState.language, testCases);
    const lines = results.map(r =>
      `  ${r.passed ? '✓' : '✗'} ${r.name} ${r.passed ? '(passed)' : `(expected: ${r.expectedOutput}, got: ${r.actualOutput})`}`
    );
    const passed = results.filter(r => r.passed).length;
    send(ws, 'OUTPUT', { text: lines.join('\r\n') + `\r\n\r\n${passed}/${results.length} passed\r\n` });
    send(ws, 'TEST_RESULTS', { results, passed, total: results.length });
    return;
  }

  // ── code execution: `run`, `python main.py`, `node index.js`, etc.
  const isRun = ['run', 'python', 'python3', 'node', 'go', 'java', 'rustc', 'ruby', 'php'].includes(verb);
  if (isRun) {
    const filename = parts[1] || Object.keys(sessionState.files)[0];
    const code     = sessionState.files[filename];

    if (!code) {
      send(ws, 'OUTPUT', { text: `No file '${filename}' in workspace. Use the editor to create it.\r\n` });
      return;
    }

    const lang = verb === 'run' ? sessionState.language : verb;
    send(ws, 'OUTPUT', { text: `\x1b[33m▶ Running ${filename} via Piston (${lang})...\x1b[0m\r\n` });

    const result = await executeCode({ language: lang, code, timeout: 10000 });

    if (result.stdout) send(ws, 'OUTPUT', { text: result.stdout.replace(/\n/g, '\r\n') });
    if (result.stderr) send(ws, 'OUTPUT', { text: `\x1b[31m${result.stderr.replace(/\n/g, '\r\n')}\x1b[0m` });
    send(ws, 'OUTPUT', {
      text: `\r\n\x1b[${result.error ? '31' : '32'}m` +
            `[exit ${result.exitCode} | ${result.time}ms]\x1b[0m\r\n`,
    });
    send(ws, 'EXECUTION_DONE', { exitCode: result.exitCode, time: result.time, error: result.error });

    // Emit telemetry event
    await appendTelemetry(sessionId, {
      eventType: result.error ? 'ERROR_ENCOUNTERED' : 'CODE_EXECUTED',
      payload: { filename, language: lang, exitCode: result.exitCode, stderr: result.stderr?.slice(0, 500) },
    });
    return;
  }

  // ── unknown command
  send(ws, 'OUTPUT', { text: `\x1b[31mbash: ${verb}: command not found\x1b[0m\r\nType 'help' for available commands.\r\n` });
}

// ─── Telemetry Helper ─────────────────────────────────────────────────────

async function appendTelemetry(sessionId, event) {
  try {
    await query(
      `UPDATE evaluation_sessions
       SET telemetry = telemetry || $1::jsonb
       WHERE id = $2`,
      [JSON.stringify([{ ...event, timestamp: Date.now() }]), sessionId]
    );
  } catch { /* non-blocking */ }
}

// ─── Security Event Handler ───────────────────────────────────────────────

const SEVERITY_MAP = {
  TAB_SWITCH:        'warning',
  FACE_NOT_DETECTED: 'warning',
  MULTIPLE_FACES:    'critical',
  COPY_PASTE:        'warning',
  WINDOW_BLUR:       'info',
  CAMERA_DISABLED:   'critical',
  BIOMETRIC_ANOMALY: 'warning',
  FOCUS_LOST:        'info',
  DEVTOOLS_OPEN:     'critical',
};

async function handleSecurityEvent(ws, { sessionId, candidateId, eventType, payload }) {
  const severity = SEVERITY_MAP[eventType] || 'info';
  try {
    await query(
      `INSERT INTO security_events (session_id, candidate_id, event_type, severity, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, candidateId, eventType, severity, JSON.stringify(payload || {})]
    );
  } catch { /* non-blocking */ }

  // Acknowledge + send alert if serious
  send(ws, 'SECURITY_ACK', { eventType, severity, ts: Date.now() });
  if (severity === 'critical') {
    send(ws, 'SECURITY_ALERT', {
      eventType, severity,
      message: getAlertMessage(eventType),
    });
  }
}

function getAlertMessage(type) {
  const msgs = {
    MULTIPLE_FACES:    'Multiple faces detected. This session is being monitored.',
    CAMERA_DISABLED:   'Camera must remain enabled throughout the test.',
    DEVTOOLS_OPEN:     'Developer tools detected. This has been logged.',
  };
  return msgs[type] || 'Security event logged.';
}

// ─── WebSocket Server Setup ───────────────────────────────────────────────

export function attachWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    const url    = new URL(req.url, `http://localhost`);
    const channel = url.searchParams.get('channel') || 'terminal';
    const sessionId   = url.searchParams.get('sessionId');
    const candidateId = url.searchParams.get('candidateId');
    const token       = url.searchParams.get('token');

    if (!sessionId) { ws.close(4000, 'sessionId required'); return; }

    // Validate token → invitation
    let testCases = [];
    try {
      const inv = await query(
        `SELECT i.id, i.candidate_id, t.language,
                json_agg(json_build_object('name',tc.name,'input',tc.input,'expectedOutput',tc.expected_output))
                  FILTER (WHERE tc.id IS NOT NULL AND tc.is_hidden = false) AS test_cases
         FROM invitations i
         JOIN tests t ON t.id = i.test_id
         LEFT JOIN test_cases tc ON tc.test_id = t.id
         WHERE i.invitation_token = $1
         GROUP BY i.id, t.language`,
        [token]
      );
      if (inv.rows.length) {
        testCases = inv.rows[0].test_cases || [];
        const lang = inv.rows[0].language || 'python';
        getOrCreateSession(sessionId, lang);
      }
    } catch { /* non-blocking */ }

    const sessionState = getOrCreateSession(sessionId);

    if (channel === 'terminal') {
      // Send welcome banner
      send(ws, 'OUTPUT', {
        text: `\x1b[36mHireOS Sandbox Terminal\x1b[0m — Powered by Piston (${sessionState.language})\r\nType 'help' for commands.\r\n$ `,
      });

      ws.on('message', async (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'COMMAND') {
            await handleTerminalCommand(ws, sessionState, msg.payload.command, sessionId, testCases);
            send(ws, 'PROMPT', {});  // signal frontend to show next prompt
          } else if (msg.type === 'FILE_UPDATE') {
            // Sync file from editor to terminal session
            const { filename, content } = msg.payload;
            sessionState.files[filename] = content;
          } else if (msg.type === 'PING') {
            send(ws, 'PONG', {});
          }
        } catch (err) {
          send(ws, 'ERROR', { message: err.message });
        }
      });

    } else if (channel === 'security') {
      send(ws, 'SECURITY_READY', { sessionId });

      ws.on('message', async (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'SECURITY_EVENT') {
            await handleSecurityEvent(ws, {
              sessionId, candidateId: msg.payload.candidateId || candidateId,
              eventType: msg.payload.eventType,
              payload:   msg.payload,
            });
            // Append to telemetry too
            await appendTelemetry(sessionId, { eventType: msg.payload.eventType, payload: msg.payload });
          } else if (msg.type === 'PING') {
            send(ws, 'PONG', {});
          }
        } catch (err) {
          send(ws, 'ERROR', { message: err.message });
        }
      });
    }

    ws.on('close', () => {
      // Persist final files to DB on disconnect
      const state = activeSessions.get(sessionId);
      if (state) {
        query(
          `UPDATE evaluation_sessions SET sandbox_files = $1 WHERE id = $2`,
          [JSON.stringify(state.files), sessionId]
        ).catch(() => {});
      }
    });

    ws.on('error', (err) => console.warn('[WS] Error:', err.message));
  });

  console.log('✓ WebSocket server attached (/ws)');
  return wss;
}

export { activeSessions };
