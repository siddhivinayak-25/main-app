import { get } from './client.js';

export async function getDashboardStats() {
  const data = await get('/dashboard/stats');
  return data.stats;
}

export async function getHiringFunnel() {
  const data = await get('/dashboard/pipeline');
  return data.pipeline; // [{ stage, count }]
}

export async function getPipelineStats() {
  return getHiringFunnel();
}

export async function getRecentActiveTests() {
  const data = await get('/dashboard/recent-tests');
  return data.tests; // [{ id, name, completed }]
}

export async function getTopCandidates() {
  const data = await get('/dashboard/top-candidates');
  return data.candidates; // [{ id, name, score }]
}
