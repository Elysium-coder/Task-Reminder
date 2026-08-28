import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema(
  {
    // email or E.164 phone number — the OTP "channel" identifier.
    identifier: { type: String, required: true, index: true },
    channel: { type: String, enum: ['email', 'sms'], required: true },
    // Store only a bcrypt hash of the OTP — never the plaintext code.
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Otp || mongoose.model('Otp', OtpSchema);
