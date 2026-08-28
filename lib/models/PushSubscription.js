import mongoose from 'mongoose';

const PushSubscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true },
    keys: { type: Object, required: true },
    // The subscription object (stringified) — mirrors what the browser sends.
    raw: { type: String, required: true },
  },
  { timestamps: true }
);

PushSubscriptionSchema.index({ user: 1, endpoint: 1 }, { unique: true });

export default
  mongoose.models.PushSubscription ||
  mongoose.model('PushSubscription', PushSubscriptionSchema);
