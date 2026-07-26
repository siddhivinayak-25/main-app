import { get } from './client.js';

/**
 * Fetch session replay data for a candidate.
 * Returns { candidate, session, timeline, snapshots, securityEvents, evaluationResult, finalFiles }
 */
export async function getSessionReplay(candidateId) {
  return get(`/sessions/${candidateId}/replay`);
}
