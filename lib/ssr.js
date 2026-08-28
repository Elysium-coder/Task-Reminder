/**
 * Server-side auth helpers for getServerSideProps (Pages Router).
 * Runs only on the server — safe to import mongoose here.
 */
import { connectDB } from 'lib/mongodb';
import User from 'lib/models/User';
import { getSessionUser, safeUser } from 'lib/auth';

/** Look up the current user from the Next.js request, or null. */
export async function getServerSideUser(context) {
  const payload = getSessionUser(context.req);
  if (!payload) return null;
  try {
    await connectDB();
    const found = await User.findById(payload.userId).lean();
    return found ? safeUser(found) : null;
  } catch (e) {
    console.error('[/ssr] user lookup failed:', e.message);
    return {
      id: payload.userId,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      subscribed: false,
    };
  }
}

/** Build a Next.js redirect object to /login (preserving the target path). */
export function loginRedirect(next = '/') {
  return {
    redirect: {
      destination: `/login?next=${encodeURIComponent(next)}`,
      permanent: false,
    },
  };
}

/** Require authentication inside a getServerSideProps context. */
export async function requirePageAuth(context) {
  const user = await getServerSideUser(context);
  if (!user) return { props: null, redirect: loginRedirect(context.resolvedUrl) };
  return { props: { initialUser: user } };
}

export async function requirePageAuthAdmin(context) {
  const user = await getServerSideUser(context);
  if (!user) return { props: null, redirect: loginRedirect(context.resolvedUrl) };
  if (user.role !== 'admin') return { notFound: true };
  return { props: { initialUser: user } };
}
