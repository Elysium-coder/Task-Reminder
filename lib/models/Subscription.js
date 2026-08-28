import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, enum: ['esewa', 'khalti'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NPR' },
    transactionId: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    // Manually approved by an admin (eSewa / Khalti manual verification).
    adminApproved: { type: Boolean, default: false },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default
  mongoose.models.Subscription ||
  mongoose.model('Subscription', SubscriptionSchema);
