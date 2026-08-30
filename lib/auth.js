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
import * as cookieNS from 'cookie';

/**
 * The `cookie` package is CommonJS. Depending on the bundler / deployment
 * target (Netlify's Next.js runtime, Vercel, plain Next), the default export
 * may be exposed on `default` or directly on the module namespace. Resolve it
 * once, defensively, so `cookie.parse` / `cookie.serialize` never end up
 * undefined at runtime.
 */
const cookieMod =
  cookieNS && typeof cookieNS === 'object'
    ? typeof cookieNS.parse === 'function' && typeof cookieNS.serialize === 'function'
      ? cookieNS
      : cookieNS.default || {}
    : {};

export function parseCookies(header) {
  if (typeof cookieMod.parse === 'function') {
    return cookieMod.parse(header || '');
  }
  // Minimal fallback parser (handles "name=value; name2=value2").
  const out = {};
  String(header || '')
    .split(';')
    .forEach((part) => {
      const idx = part.indexOf('=');
      if (idx === -1) return;
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      if (k) out[k] = decodeURIComponent(v);
    });
  return out;
}

export function serializeCookie(name, value, options) {
  if (typeof cookieMod.serialize === 'function') {
    return cookieMod.serialize(name, value, options);
  }
  // Minimal fallback serializer (supports the options we use).
  let str = `${name}=${encodeURIComponent(value)}`;
  if (options?.path) str += `; Path=${options.path}`;
  if (options?.maxAge != null) str += `; Max-Age=${Math.floor(options.maxAge)}`;
  if (options?.httpOnly) str += '; HttpOnly';
  if (options?.secure) str += '; Secure';
  if (options?.sameSite) str += `; SameSite=${options.sameSite}`;
  return str;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const TOKEN_NAME = 'token';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function signToken(payload) {
  // jsonwebtoken is CommonJS too; resolve whatever shape the bundler gives us.
  const j = typeof jwt?.sign === 'function' ? jwt : jwt?.default;
  return j.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    const j = typeof jwt?.verify === 'function' ? jwt : jwt?.default;
    return j.verify(token, JWT_SECRET);
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
    serializeCookie(TOKEN_NAME, token, { ...buildCookieOptions(), maxAge: TOKEN_MAX_AGE })
  );
  return token;
}

export function clearAuthToken(res) {
  res.setHeader(
    'Set-Cookie',
    serializeCookie(TOKEN_NAME, '', { ...buildCookieOptions(), maxAge: 0 })
  );
}

export function getTokenFromReq(req) {
  // Defensive: tolerate missing/odd headers and any cookie-parser shape.
  let cookies = {};
  try {
    cookies = parseCookies(req.headers?.cookie) || {};
  } catch (e) {
    console.error('[auth] failed to parse cookie header:', e?.message);
  }
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
    // Also accept Vercel Cron's automatic `x-vercel-cron` header, whose value
    // is the CRON_SECRET variable set in the project.
    const vercelCron = req.headers['x-vercel-cron'];
    if (!vercelCron || vercelCron !== (process.env.CRON_SECRET || '')) {
      const err = new Error('Invalid cron secret.');
      err.status = 401;
      throw err;
    }
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
