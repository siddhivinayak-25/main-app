/**
 * HireOS API Client
 * All requests go to /api (proxied to backend on port 3001 in dev).
 * Returns { data } on success, throws Error on failure.
 */

const BASE = '/api';

function getToken() {
  // AuthContext stores auth as JSON under 'auth' key
  try {
    const auth = localStorage.getItem('auth');
    if (auth) return JSON.parse(auth).token;
  } catch {}
  return null;
}

export function setToken(token) {
  // No-op: AuthContext manages the 'auth' key directly
}

export async function request(method, path, body) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return data;
}

export const get  = (path)        => request('GET',    path);
export const post = (path, body)  => request('POST',   path, body);
export const patch = (path, body) => request('PATCH',  path, body);
export const del  = (path)        => request('DELETE', path);
