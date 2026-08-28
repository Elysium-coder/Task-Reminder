import { connectDB } from 'lib/mongodb';
import Subscription from 'lib/models/Subscription';
import { requireAdminAccess } from 'lib/auth';
import { withErrorHandler, allowMethods } from 'lib/api';

function sanitizeSubscription(s) {
  return {
    id: s._id.toString(),
    provider: s.provider,
    amount: s.amount,
    currency: s.currency,
    transactionId: s.transactionId || '',
    status: s.status,
    adminApproved: s.adminApproved,
    user: s.user
      ? { id: s.user._id?.toString(), email: s.user.email, phone: s.user.phone }
      : null,
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : null,
  };
}

/** Admin: list all subscriptions (optionally filter by status). */
export default allowMethods(
  withErrorHandler(async (req, res) => {
    requireAdminAccess(req);
    await connectDB();

    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const subs = await Subscription.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ subscriptions: subs.map(sanitizeSubscription) });
  }),
  ['GET']
);


