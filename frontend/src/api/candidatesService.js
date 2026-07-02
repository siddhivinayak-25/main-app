import { request } from './client';
import { candidates } from '../data/mockData';

export const getCandidates = () => request(() => candidates);

export const getCandidateById = (id) =>
  request(() => candidates.find((c) => c.id === Number(id)));

export const updateCandidateStatus = (candidateId, newStatus, note = '') =>
  request(() => {
    const candidate = candidates.find((c) => c.id === Number(candidateId));
    if (!candidate) throw new Error('Candidate not found');
    candidate.status = newStatus;
    candidate.lastActivity = 'Just now';
    candidate.activityLog.push({
      id: crypto.randomUUID(),
      status: newStatus,
      timestamp: new Date().toISOString(),
      note,
    });
    return candidate;
  });