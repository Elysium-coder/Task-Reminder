import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    // A user authenticates with either an email or a phone number.
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // Paywall
    subscribed: { type: Boolean, default: false },
    subscriptionExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
