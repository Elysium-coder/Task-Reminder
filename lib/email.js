import nodemailer from 'nodemailer';

let transporter = null;

function getSmtpTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false, // upgrade via STARTTLS (SMTP_PORT 587)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

function defaultFrom() {
  return process.env.SMTP_FROM || process.env.DEFAULT_FROM_EMAIL || 'Task Reminder <noreply@example.com>';
}

export async function sendEmail({ to, subject, text, html }) {
  if (!to) throw new Error('sendEmail: `to` is required');

  // Primary channel: SMTP (Gmail SMTP in most deployments).
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const info = await getSmtpTransporter().sendMail({
        from: defaultFrom(),
        to,
        subject,
        text,
        html,
      });
      return { provider: 'smtp', messageId: info.messageId };
    } catch (e) {
      console.error('SMTP send failed, will try Resend fallback:', e.message);
    }
  }

  // Fallback channel: Resend.
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || defaultFrom(),
          to,
          subject,
          text,
          html,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Resend ${res.status}: ${body}`);
      }
      return { provider: 'resend' };
    } catch (e) {
      console.error('Resend send failed:', e.message);
      throw e;
    }
  }

  const err = new Error('No email provider configured. Set SMTP_* or RESEND_API_KEY.');
  err.status = 502;
  throw err;
}

export default sendEmail;
