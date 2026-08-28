import { connectDB } from 'lib/mongodb';
import Subscription from 'lib/models/Subscription';
import { requireAuth } from 'lib/auth';
import { withErrorHandler, allowMethods, apiError } from 'lib/api';

function sanitizeSubscription(s) {
  return {
    id: s._id.toString(),
    provider: s.provider,
    amount: s.amount,
    currency: s.currency,
    transactionId: s.transactionId || '',
    status: s.status,
    adminApproved: s.adminApproved,
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : null,
  };
}

export default allowMethods(
  withErrorHandler(async (req, res) => {
    await connectDB();
    const session = requireAuth(req);

    if (req.method === 'GET') {
      const subs = await Subscription.find({ user: session.userId })
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json({ subscriptions: subs.map(sanitizeSubscription) });
    }

    // POST — create a pending subscription (user initiates payment).
    const { provider, amount, transactionId } = req.body || {};
    if (!provider || !['esewa', 'khalti'].includes(provider)) {
      throw apiError('A valid provider (esewa|khalti) is required.', 400);
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) throw apiError('A positive amount is required.', 400);

    const sub = await Subscription.create({
      user: session.userId,
      provider,
      amount: amt,
      transactionId: transactionId ? String(transactionId) : '',
      status: 'pending',
      adminApproved: false,
    });
    return res.status(201).json({ subscription: sanitizeSubscription(sub) });
  }),
  ['GET', 'POST']
);
