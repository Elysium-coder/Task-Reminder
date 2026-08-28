import { connectDB } from 'lib/mongodb';
import User from 'lib/models/User';
import { requireAuth, safeUser } from 'lib/auth';
import { withErrorHandler, allowMethods, apiError } from 'lib/api';
import { sanitizeString } from 'lib/validation';

export default allowMethods(
  withErrorHandler(async (req, res) => {
    const session = requireAuth(req);
    await connectDB();

    const user = await User.findById(session.userId);
    if (!user) throw apiError('User not found.', 404);

    if (req.method === 'PUT') {
      const { name } = req.body || {};
      if (name !== undefined) user.name = sanitizeString(name, 100);
      await user.save();
    }

    return res.status(200).json({ user: safeUser(user) });
  }),
  ['GET', 'PUT']
);
