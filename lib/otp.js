import bcrypt from 'bcryptjs';
import Otp from './models/Otp';

const OTP_LENGTH = parseInt(process.env.OTP_LENGTH, 10) || 6;
const OTP_EXPIRY_MS = ((parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10) * 60 * 1000);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5;
const OTP_COOLDOWN_MS = ((parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 45) * 1000);

export function generateOtp() {
  // e.g. OTP_LENGTH = 6 => a number between 100000 and 999999.
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

/**
 * Create and persist (hashed) a new OTP for `identifier`.
 * Returns the PLAIN code (only ever sent once via email/SMS, never stored).
 */
export async function storeOtp(identifier, channel = 'email') {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await Otp.deleteMany({ identifier });
  const codeHash = await bcrypt.hash(code, 10);
  await Otp.create({ identifier, channel, codeHash, expiresAt, attempts: 0 });

  return code;
}

/** Verify a user-supplied OTP code for `identifier`. */
export async function verifyOtp(identifier, code) {
  const otp = await Otp.findOne({ identifier, expiresAt: { $gt: new Date() } }).sort({
    createdAt: -1,
  });

  if (!otp) {
    return { ok: false, error: 'OTP expired or not found. Please request a new one.' };
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await Otp.deleteMany({ identifier });
    return { ok: false, error: 'Too many attempts. Please request a new OTP.' };
  }

  const valid = await bcrypt.compare(String(code), otp.codeHash);
  if (!valid) {
    otp.attempts += 1;
    await otp.save();
    return { ok: false, error: 'Invalid OTP code.' };
  }

  // Invalidate the OTP (single use).
  await Otp.deleteMany({ identifier });
  return { ok: true };
}

/** Whether a new OTP can be sent to `identifier` (respects resend cooldown). */
export async function canResendOtp(identifier) {
  const latest = await Otp.findOne({ identifier }).sort({ createdAt: -1 });
  if (!latest) return { ok: true, remaining: 0 };

  const lastSent = latest.createdAt.getTime();
  const remaining = Math.max(0, OTP_COOLDOWN_MS - (Date.now() - lastSent));
  return { ok: remaining === 0, remaining: Math.ceil(remaining / 1000) };
}
