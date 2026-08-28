/**
 * SMS delivery.
 *   Primary:  Sparrow SMS (https://sparrowsms.com) via HTTP API
 *   Fallback: Twilio via HTTP API
 *
 * Both providers are called with the global `fetch` (Node 18+) — no native
 * additives / builds required, which keeps the Vercel build reliable.
 */

async function sendViaSparrow({ to, message }) {
  const token = process.env.SPARROW_SMS_TOKEN;
  const from = process.env.SPARROW_SMS_FROM || 'TaskReminder';
  const params = new URLSearchParams({ token, from, to, text: message });
  const res = await fetch('https://api.sparrowsms.com/v2/sms/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Sparrow SMS ${res.status}: ${body}`);
  return { provider: 'sparrow', raw: body };
}

async function sendViaTwilio({ to, message }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const basic = Buffer.from(`${sid}:${auth}`).toString('base64');
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: to, Body: message }),
    }
  );
  const body = await res.json();
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${JSON.stringify(body)}`);
  return { provider: 'twilio', raw: body };
}

export async function sendSMS({ to, message }) {
  if (!to) throw new Error('sendSMS: `to` is required');

  if (process.env.SPARROW_SMS_TOKEN) {
    try {
      return await sendViaSparrow({ to, message });
    } catch (e) {
      console.error('Sparrow SMS failed, falling back to Twilio:', e.message);
    }
  }

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    return await sendViaTwilio({ to, message });
  }

  const err = new Error('No SMS provider configured. Set SPARROW_SMS_TOKEN or Twilio env vars.');
  err.status = 502;
  throw err;
}

export default sendSMS;
