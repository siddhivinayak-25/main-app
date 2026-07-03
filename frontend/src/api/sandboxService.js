const BASE = '/api';

// Sandbox calls use invitation token (not JWT) for auth
async function sandboxFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Authenticated fetch using stored JWT (for session submission)
async function authFetch(path, options = {}) {
  let token = null;
  try { const a = localStorage.getItem('auth'); if (a) token = JSON.parse(a).token; } catch {}
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const h = (token) => ({ 'x-invitation-token': token });

export const sandboxService = {
  getFiles: (token) =>
    sandboxFetch('/sandbox/files', { headers: h(token) }),

  saveFile: (token, filename, content) =>
    sandboxFetch('/sandbox/files', {
      method: 'POST', headers: h(token),
      body: JSON.stringify({ filename, content }),
    }),

  run: (token, { code, language, stdin }) =>
    sandboxFetch('/sandbox/run', {
      method: 'POST', headers: h(token),
      body: JSON.stringify({ code, language, stdin }),
    }),

  runTests: (token, { code, language }) =>
    sandboxFetch('/sandbox/test', {
      method: 'POST', headers: h(token),
      body: JSON.stringify({ code, language }),
    }),

  aiPrompt: (token, { prompt, currentCode, language, action, context }) =>
    sandboxFetch('/sandbox/ai', {
      method: 'POST', headers: h(token),
      body: JSON.stringify({ prompt, currentCode, language, action, context }),
    }),

  logAiAction: (token, action, filename) =>
    sandboxFetch('/sandbox/ai-action', {
      method: 'POST', headers: h(token),
      body: JSON.stringify({ action, filename }),
    }),

  snapshot: (token, files) =>
    sandboxFetch('/sandbox/snapshot', {
      method: 'POST', headers: h(token),
      body: JSON.stringify({ files }),
    }),

  submit: ({ sessionId, candidateId, testId, files }) =>
    authFetch(`/evaluation/sessions/${sessionId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        candidateId, testId, files,
        finalCode: Object.values(files || {}).map(f => f.content).join('\n\n---\n\n'),
      }),
    }),

  logSecurityEvent: ({ sessionId, candidateId, eventType, payload }) =>
    fetch(`${BASE}/security/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, candidateId, eventType, payload }),
    }).catch(() => {}),
};
