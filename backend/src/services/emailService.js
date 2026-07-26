import { Resend } from 'resend';
import { query } from '../db/index.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const isEnabled = () => Boolean(resend);

/**
 * Send an invitation email to a candidate with a secure magic link.
 * Updates the invitations table with delivery status.
 *
 * Returns { ok, providerId, sentAt, error, fallback }.
 * If Resend is not configured, it records a fallback status and returns the
 * link so the recruiter can still share it manually.
 */
export async function sendInvitationEmail({
  invitationId,
  candidateEmail,
  candidateName,
  testName,
  publicLink,
  isResend = false,
}) {
  if (!isEnabled()) {
    await trackEmailStatus(invitationId, 'not_configured', null);
    return {
      ok: false,
      fallback: true,
      error: 'Resend is not configured. Add RESEND_API_KEY to backend/.env to send real emails.',
    };
  }

  const subject = isResend
    ? `Reminder: Your ${testName} assessment on hiresprint`
    : `You're invited to complete the ${testName} assessment on hiresprint`;

  const html = buildInvitationHtml({ candidateName, testName, publicLink, isResend });
  const text = buildInvitationText({ candidateName, testName, publicLink, isResend });

  try {
    const result = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: candidateEmail,
      subject,
      html,
      text,
    });

    const providerId = result?.data?.id || null;
    const sentAt = new Date().toISOString();
    await trackEmailStatus(invitationId, 'sent', providerId);

    return { ok: true, providerId, sentAt };
  } catch (err) {
    const message = err?.message || String(err);
    console.error('[emailService] Failed to send invitation email:', message);
    await trackEmailStatus(invitationId, 'failed', null);
    return { ok: false, error: message };
  }
}

async function trackEmailStatus(invitationId, status, providerId) {
  await query(
    `UPDATE invitations
     SET email_status = $2,
         email_provider_id = $3,
         email_sent_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE email_sent_at END
     WHERE id = $1`,
    [invitationId, status, providerId]
  );
}

function buildInvitationHtml({ candidateName, testName, publicLink, isResend }) {
  const greeting = candidateName ? `Hi ${candidateName},` : 'Hi there,';
  const lead = isResend
    ? 'This is a reminder that you still have an assessment waiting for you on hiresprint.'
    : 'You have been invited to complete a technical assessment on hiresprint.';
  const cta = isResend ? 'Continue Assessment' : 'Start Assessment';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>hiresprint Assessment Invitation</title>
</head>
<body style="margin:0; padding:0; background-color:#F7F5FC; font-family:Inter, Helvetica, Arial, sans-serif; color:#1E1B2E;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F5FC;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(124,58,237,0.08);">
          <tr>
            <td style="padding:40px 40px 24px;">
              <p style="margin:0 0 8px; font-size:16px; line-height:1.5;">${greeting}</p>
              <p style="margin:0 0 24px; font-size:16px; line-height:1.5;">${lead}</p>
              <h1 style="margin:0 0 8px; font-size:24px; font-weight:600; color:#4C1D95;">${testName}</h1>
              <p style="margin:0 0 32px; font-size:14px; color:#6B6478;">Click the button below to access your secure assessment environment. This link is unique to you.</p>
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:8px; background-color:#7C3AED;">
                    <a href="${publicLink}" style="display:inline-block; padding:14px 28px; font-size:14px; font-weight:600; color:#FFFFFF; text-decoration:none; border-radius:8px;">${cta}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 40px;">
              <p style="margin:0 0 8px; font-size:13px; color:#6B6478;">Or copy and paste this link into your browser:</p>
              <p style="margin:0; font-size:13px; word-break:break-all; color:#7C3AED;">${publicLink}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px; background-color:#F7F5FC; border-top:1px solid #E7E2F5;">
              <p style="margin:0; font-size:12px; color:#6B6478;">If you did not expect this invitation, you can safely ignore it.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function buildInvitationText({ candidateName, testName, publicLink, isResend }) {
  const greeting = candidateName ? `Hi ${candidateName},` : 'Hi there,';
  const lead = isResend
    ? 'This is a reminder that you still have an assessment waiting for you on hiresprint.'
    : 'You have been invited to complete a technical assessment on hiresprint.';
  const cta = isResend ? 'Continue Assessment' : 'Start Assessment';

  return `${greeting}

${lead}

Assessment: ${testName}

${cta}: ${publicLink}

This link is unique to you. Please do not share it.

If you did not expect this invitation, you can safely ignore it.

— hiresprint
  `.trim();
}

export default { sendInvitationEmail, isEnabled };
