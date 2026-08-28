import { connectDB } from 'lib/mongodb';
import PushSubscriptionModel from 'lib/models/PushSubscription';
import { requireAuth } from 'lib/auth';
import { withErrorHandler, allowMethods, apiError } from 'lib/api';

export default allowMethods(
  withErrorHandler(async (req, res) => {
    await connectDB();
    const session = requireAuth(req);

    const { subscription, unsubscribe } = req.body || {};

    if (req.method === 'GET') {
      const subs = await PushSubscriptionModel.find({ user: session.userId })
        .select('endpoint createdAt -_id')
        .lean();
      return res.status(200).json({ subscriptions: subs });
    }

    // POST
    if (unsubscribe) {
      await PushSubscriptionModel.deleteMany({ user: session.userId });
      return res.status(200).json({ ok: true });
    }
    if (!subscription || !subscription.endpoint) {
      throw apiError('A valid push subscription is required.', 400);
    }
    await PushSubscriptionModel.updateOne(
      { user: session.userId, endpoint: subscription.endpoint },
      {
        user: session.userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys || {},
        raw: JSON.stringify(subscription),
      },
      { upsert: true }
    );
    return res.status(200).json({ ok: true });
  }),
  ['GET', 'POST', 'DELETE']
);

