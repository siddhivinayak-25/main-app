import { apiFetch } from './client.js';

const headers = (token) => ({ 'x-invitation-token': token });

export const sandboxService = {
  /** Get all files in the session workspace */
  getFiles: (token) =>
    apiFetch('/sandbox/files', { headers: headers(token) }),

  /** Save / update a file */
  saveFile: (token, filename, content) =>
    apiFetch('/sandbox/files', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ filename, content }),
    }),

  /** Execute code via Piston */
  run: (token, { code, language, stdin }) =>
    apiFetch('/sandbox/run', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ code, language, stdin }),
    }),

  /** Run all visible test cases */
  runTests: (token, { code, language }) =>
    apiFetch('/sandbox/test', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ code, language }),
    }),

  /** Send a prompt to Gemini, get generated code back */
  aiPrompt: (token, { prompt, currentCode, language, action, context }) =>
    apiFetch('/sandbox/ai', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ prompt, currentCode, language, action, context }),
    }),

  /** Log Accept / Reject / Modify decision */
  logAiAction: (token, action, filename) =>
    apiFetch('/sandbox/ai-action', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ action, filename }),
    }),

  /** Autosave snapshot of all files */
  snapshot: (token, files) =>
    apiFetch('/sandbox/snapshot', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ files }),
    }),

  /** Submit the test */
  submit: ({ sessionId, candidateId, testId, files, invitationId }) =>
    apiFetch(`/evaluation/sessions/${sessionId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        candidateId, testId, files,
        finalCode: Object.values(files || {}).map(f => f.content).join('\n\n---\n\n'),
      }),
    }),

  /** Log security event via REST (WebSocket fallback) */
  logSecurityEvent: ({ sessionId, candidateId, eventType, payload }) =>
    apiFetch('/security/event', {
      method: 'POST',
      body: JSON.stringify({ sessionId, candidateId, eventType, payload }),
    }).catch(() => {}), // fire-and-forget, never throw
};
