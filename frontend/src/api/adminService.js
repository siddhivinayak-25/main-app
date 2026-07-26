import { get, post, setAdminToken } from './client.js';

export async function adminLogin({ username, password, favoritePerson, favoriteNumber }) {
  const data = await post('/admin/login', { username, password, favoritePerson, favoriteNumber });
  setAdminToken(data.token);
  return data;
}

export async function getAdminMe() {
  const data = await get('/admin/me');
  return data.admin;
}

export async function getAdminStats() {
  return get('/admin/stats');
}

export async function getAdminCompanies() {
  const data = await get('/admin/companies');
  return data.companies;
}

export async function getAdminCandidates() {
  const data = await get('/admin/candidates');
  return data.candidates;
}

export async function getAdminTests() {
  const data = await get('/admin/tests');
  return data.tests;
}

export async function getAdminSessions() {
  const data = await get('/admin/sessions');
  return data.sessions;
}

export async function getAdminSecurityEvents() {
  const data = await get('/admin/security-events');
  return data.securityEvents;
}

export async function getAdminActivities() {
  const data = await get('/admin/activities');
  return data.activities;
}

export async function adminTakeTest(testId) {
  return post(`/admin/tests/${testId}/take`);
}
