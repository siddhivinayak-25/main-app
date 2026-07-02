import { get, patch, post } from './client.js';

export async function getCurrentUser() {
  const data = await get('/users/me');
  return data.user;
}

export async function updateProfile(updates) {
  const data = await patch('/users/me', updates);
  return data.user;
}

export async function updatePassword({ currentPassword, newPassword }) {
  return post('/users/me/password', { currentPassword, newPassword });
}
