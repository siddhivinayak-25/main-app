import { request } from './client';
import { testInvitations, tests } from '../data/mockData';

export const sendInvitation = (testId, candidateEmail, candidateName) =>
  request(() => {
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const newInvitation = {
      id: crypto.randomUUID(),
      testId,
      candidateEmail,
      candidateName,
      invitedAt: new Date().toISOString(),
      status: 'pending',
      submittedAt: null,
      invitationToken,
      expiresAt: expiresAt.toISOString(),
    };

    testInvitations.push(newInvitation);

    return {
      invitationToken,
      publicLink: `${window.location.origin}/test/${testId}?token=${invitationToken}`,
    };
  });

export const getInvitationByToken = (token) =>
  request(() => {
    const invitation = testInvitations.find((inv) => inv.invitationToken === token);
    
    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      throw new Error('Invitation has expired');
    }

    const test = tests.find((t) => t.id === Number(invitation.testId));
    if (!test) {
      throw new Error('Test not found');
    }

    return { invitation, test };
  });
