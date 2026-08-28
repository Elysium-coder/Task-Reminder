import { connectDB } from 'lib/mongodb';
import User from 'lib/models/User';
import { getSessionUser, safeUser } from 'lib/auth';
import { withErrorHandler, allowMethods } from 'lib/api';

export default allowMethods(
  withErrorHandler(async (req, res) => {
    const payload = getSessionUser(req);
    if (!payload) return res.status(200).json({ user: null });

    let user = null;
    try {
      await connectDB();
      const found = await User.findById(payload.userId).lean();
      user = found ? safeUser(found) : null;
    } catch (e) {
      console.error('[/api/auth/me] DB lookup failed:', e.message);
      user = {
        id: payload.userId,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
      };
    }
    return res.status(200).json({ user });
  }),
  ['GET']
);
