import { Resend } from 'resend';

let client = null;

function getResendClient() {
  if (client) return client;
  if (!process.env.RESEND_API_KEY) {
    const err = new Error('RESEND_API_KEY is not configured.');
    err.status = 502;
    throw err;
  }
  client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

function defaultFrom() {
  // Resend requires a verified sender domain; onboarding@resend.dev works
  // for testing but only delivers to the account owner's own address.
  return process.env.RESEND_FROM || process.env.DEFAULT_FROM_EMAIL || 'Task Reminder <onboarding@resend.dev>';
}

/**
 * Send an email via the Resend HTTP API (no TCP sockets — works in any
 * serverless runtime, including Netlify where raw SMTP is blocked).
 *
 * Interface unchanged: `sendEmail({ to, subject, text, html })`.
 */
export async function sendEmail({ to, subject, text, html }) {
  if (!to) throw new Error('sendEmail: `to` is required');

  try {
    const { data, error } = await getResendClient().emails.send(
      {
        from: defaultFrom(),
        to: [to],
        subject,
        text,
        html: html || `<pre style="font-family:sans-serif">${text || ''}</pre>`,
      },
      // Fail fast so the request never hangs past the OTP delivery budget.
      { signal: AbortSignal.timeout(8000) }
    );

    if (error) {
      console.error('[email] Resend API error:', {
        name: error.name,
        message: error.message,
      });
      const err = new Error(error.message || 'Resend email delivery failed.');
      err.status = 502;
      throw err;
    }

    return { provider: 'resend', id: data?.id };
  } catch (e) {
    if (e?.status !== 502) {
      console.error('[email] Resend send failed:', {
        message: e?.message,
        cause: e?.cause?.message || e?.cause,
        stack: e?.stack,
      });
    }
    throw e;
  }
}

export default sendEmail;
