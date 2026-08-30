import { connectDB } from 'lib/mongodb';
import { storeOtp, canResendOtp } from 'lib/otp';
import { isValidEmail } from 'lib/validation';
import { normalizePhone } from 'lib/phone';
import { sendEmail } from 'lib/email';
import { sendSMS } from 'lib/sms';
import { OTP_EMAIL_SUBJECT, otpEmailText, otpEmailHtml, otpSmsText } from 'lib/constants';
import { withErrorHandler, allowMethods, apiError } from 'lib/api';

export default allowMethods(
  withErrorHandler(async (req, res) => {
    await connectDB();

    const { email, phone } = req.body || {};

    let identifier;
    let channel;

    if (email) {
      if (!isValidEmail(email)) throw apiError('Please enter a valid email address.', 400);
      identifier = String(email).toLowerCase().trim();
      channel = 'email';
    } else if (phone) {
      identifier = normalizePhone(phone);
      if (!identifier) throw apiError('Please enter a valid phone number.', 400);
      channel = 'sms';
    } else {
      throw apiError('Please provide an email or phone number.', 400);
    }

    // Respect the resend cooldown (prevents OTP bombing).
    const cooldown = await canResendOtp(identifier);
    if (!cooldown.ok) {
      throw apiError(`Please wait ${cooldown.remaining}s before requesting a new code.`, 429);
    }

    const code = await storeOtp(identifier, channel);

    if (channel === 'email') {
      // In development, Resend may not be wired up. If sending fails we still
      // report the code so local testing is possible — NEVER do this in prod.
      try {
        await sendEmail({
          to: identifier,
          subject: OTP_EMAIL_SUBJECT,
          text: otpEmailText(code),
          html: otpEmailHtml(code),
        });
      } catch (e) {
        // Comprehensive diagnostics: full error object, cause chain, and
        // which provider env vars are configured (values never logged).
        console.error('[/api/auth/request-otp] email send failed:', {
          message: e?.message,
          status: e?.status,
          cause: e?.cause?.message || e?.cause,
          stack: e?.stack,
          resendConfigured: Boolean(process.env.RESEND_API_KEY),
          resendFrom: process.env.RESEND_FROM || null,
        });
        if (process.env.NODE_ENV !== 'development') {
          throw apiError('Could not send the verification email. Please try again later.', 502);
        }
      }
    } else {
      try {
        await sendSMS({ to: identifier, message: otpSmsText(code) });
      } catch (e) {
        console.error('[/api/auth/request-otp] SMS send failed:', {
          message: e?.message,
          code: e?.code,
          status: e?.status,
          stack: e?.stack,
        });
        if (process.env.NODE_ENV !== 'development') {
          throw apiError('Could not send the verification SMS. Please try again later.', 502);
        }
      }
    }

    const response = {
      ok: true,
      channel,
      message: `Verification code sent via ${channel}.`,
    };
    if (process.env.NODE_ENV === 'development') {
      response.code = code; // dev convenience
    }
    return res.status(200).json(response);
  }),
  ['POST']
);
