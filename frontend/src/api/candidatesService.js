import { get, patch } from './client.js';

export async function getCandidates() {
  const data = await get('/candidates');
  return data.candidates;
}

export async function getCandidateById(id) {
  const data = await get(`/candidates/${id}`);
  return data.candidate;
}

export async function updateCandidateStatus(candidateId, newStatus, note) {
  const data = await patch(`/candidates/${candidateId}/status`, { status: newStatus, note });
  return data.candidate;
}
