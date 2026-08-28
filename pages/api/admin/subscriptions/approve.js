import { connectDB } from 'lib/mongodb';
import Subscription from 'lib/models/Subscription';
import User from 'lib/models/User';
import { requireAdminAccess } from 'lib/auth';
import { withErrorHandler, allowMethods, apiError } from 'lib/api';

// Admin: approve (or reject) a subscription. Protected by ADMIN_SECRET.
export default allowMethods(
  withErrorHandler(async (req, res) => {
        requireAdminAccess(req);
    await connectDB();

    const { id, status } = req.body || {};
    if (!id) throw apiError('Subscription id is required.', 400);

    const sub = await Subscription.findById(id);
    if (!sub) throw apiError('Subscription not found.', 404);

    if (status) {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        throw apiError('Invalid status.', 400);
      }
      sub.status = status;
      sub.adminApproved = status === 'approved';
    } else {
      sub.status = 'approved';
      sub.adminApproved = true;
    }

    await sub.save();

    // If approved, grant the user an active subscription window.
    if (sub.status === 'approved') {
      await User.updateOne(
        { _id: sub.user },
        {
          $set: {
            subscribed: true,
            subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        }
      );
    }

    return res.status(200).json({
      ok: true,
      subscription: {
        id: sub._id.toString(),
        provider: sub.provider,
        amount: sub.amount,
        status: sub.status,
        adminApproved: sub.adminApproved,
      },
    });
  }),
  ['POST']
);
