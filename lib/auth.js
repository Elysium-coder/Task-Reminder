/**
 * Authentication helpers (JWT + cookies).
 *
 * Used on the SERVER side only:
 *   - API route handlers
 *   - pages/ getServerSideProps handlers
 *
 * The browser never imports this module — it gets the current user via the
 * `/api/auth/me` endpoint instead.
 */
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const TOKEN_NAME = 'token';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function buildCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

export function setAuthToken(res, payload) {
  const token = signToken(payload);
  res.setHeader(
    'Set-Cookie',
    cookie.serialize(TOKEN_NAME, token, { ...buildCookieOptions(), maxAge: TOKEN_MAX_AGE })
  );
  return token;
}

export function clearAuthToken(res) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize(TOKEN_NAME, '', { ...buildCookieOptions(), maxAge: 0 })
  );
}

export function getTokenFromReq(req) {
  const cookies = cookie.parse(req.headers?.cookie || '');
  return cookies[TOKEN_NAME] || null;
}

/** Returns the decoded session payload (or null) for a Next.js request. */
export function getSessionUser(req) {
  const token = getTokenFromReq(req);
  if (!token) return null;
  return verifyToken(token);
}

/**
 * For use inside API route handlers / getServerSideProps.
 * Throws an Error with `status` = 401 if not authenticated.
 */
export function requireAuth(req) {
  const payload = getSessionUser(req);
  if (!payload) {
    const err = new Error('Authentication required.');
    err.status = 401;
    throw err;
  }
  return payload;
}

/** Validate the admin secret (header x-admin-secret or ?secret=). */
export function requireAdmin(req) {
  const secret = req.headers['x-admin-secret'] || req.query?.secret;
  if (!secret || secret !== (process.env.ADMIN_SECRET || '')) {
    const err = new Error('Invalid admin secret.');
    err.status = 401;
    throw err;
  }
  return { via: 'secret' };
}

/**
 * Admin access may come from EITHER:
 *   - the ADMIN_SECRET (header/query) — for external/programmatic callers, or
 *   - an authenticated user whose role is 'admin' (JWT session) — for the
 *     interactive admin panel.
 * This keeps the admin secret out of the browser bundle entirely.
 */
export function requireAdminAccess(req) {
  const secret = req.headers['x-admin-secret'] || req.query?.secret;
  if (secret && secret === (process.env.ADMIN_SECRET || '')) {
    return { via: 'secret' };
  }
  const payload = getSessionUser(req);
  if (payload && payload.role === 'admin') {
    return { via: 'session', user: payload };
  }
  const err = new Error('Admin access required.');
  err.status = 401;
  throw err;
}

/** Validate the cron secret (header x-cron-secret or ?secret=). */
export function requireCron(req) {
  const secret = req.headers['x-cron-secret'] || req.query?.secret;
  if (!secret || secret !== (process.env.CRON_SECRET || '')) {
    const err = new Error('Invalid cron secret.');
    err.status = 401;
    throw err;
  }
  return true;
}

export const TOKEN_NAME_EXPORT = TOKEN_NAME;

/** Shape a mongoose user document for the client. */
export function safeUser(user) {
  if (!user) return null;
  return {
    id: user._id?.toString?.() ?? user._id,
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    isVerified: !!user.isVerified,
    role: user.role || 'user',
    subscribed: !!user.subscribed,
  };
}
