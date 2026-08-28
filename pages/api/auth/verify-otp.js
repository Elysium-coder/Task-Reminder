import { connectDB } from 'lib/mongodb';
import User from 'lib/models/User';
import { verifyOtp } from 'lib/otp';
import { setAuthToken, safeUser } from 'lib/auth';
import { isValidEmail } from 'lib/validation';
import { withErrorHandler, allowMethods, apiError } from 'lib/api';

export default allowMethods(
  withErrorHandler(async (req, res) => {
    await connectDB();

    const { identifier, code } = req.body || {};
    if (!identifier || !code) throw apiError('Identifier and code are required.', 400);

        const result = await verifyOtp(identifier, String(code));
    if (!result.ok) throw apiError(result.error, 400);

    // Promote a known admin email (ADMIN_EMAIL / SMTP_USER) to the admin role.
    const adminEmails = [
      process.env.ADMIN_EMAIL || '',
      process.env.SMTP_USER || '',
    ]
      .map((e) => (e || '').toLowerCase())
      .filter(Boolean);
    const isAdmin = adminEmails.includes(identifier.toLowerCase());

    // Find an existing user by email OR phone; create if this is their first sign-in.
    let user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
    if (!user) {
      const data = isValidEmail(identifier) ? { email: identifier } : { phone: identifier };
      user = await User.create({ ...data, isVerified: true, role: isAdmin ? 'admin' : 'user' });
    } else {
      user.isVerified = true;
      if (isAdmin) user.role = 'admin';
      await user.save();
    }

    setAuthToken(res, {
      userId: user._id.toString(),
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
    });

    return res.status(200).json({ ok: true, user: safeUser(user) });
  }),
  ['POST']
);
