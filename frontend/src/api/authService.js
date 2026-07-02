import { get, post, setToken } from './client.js';

export async function login({ email, password }) {
  const data = await post('/auth/login', { email, password });
  setToken(data.token);
  return data; // { user, token }
}

export async function signup({ name, email, password }) {
  const data = await post('/auth/signup', { name, email, password });
  setToken(data.token);
  return data; // { user, token }
}

export async function logout() {
  try {
    await post('/auth/logout');
  } finally {
    setToken(null);
  }
}

export async function loginWithProvider(provider) {
  // OAuth providers — placeholder until OAuth flow is implemented
  throw new Error(`${provider} OAuth not yet configured. Use email/password login.`);
}

export async function getMe() {
  const data = await get('/auth/me');
  return data.user;
}
