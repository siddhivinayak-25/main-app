import { get, post, patch } from './client.js';

export async function sendInvitation(testId, candidateEmail, candidateName) {
  const data = await post('/invitations', { testId, candidateEmail, candidateName });
  return data; // { invitationToken, publicLink, expiresAt, candidateId }
}

export async function getInvitationByToken(token) {
  const data = await get(`/invitations/token/${token}`);
  return data; // { invitation, test }
}

export async function getInvitations(testId) {
  const url = testId ? `/invitations?testId=${testId}` : '/invitations';
  const data = await get(url);
  return data.invitations;
}

export async function revokeInvitation(id) {
  return patch(`/invitations/${id}/revoke`, {});
}

export async function resendInvitation(id) {
  return post(`/invitations/${id}/resend`, {});
}
