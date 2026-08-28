/**
 * Lightweight validators usable on BOTH client and server (no heavy deps).
 * The strict libphonenumber-js normalization lives in lib/phone.js (server).
 */

export function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}

// Loose, client-friendly phone check (digits, optional + and separators).
export function looksLikePhone(phone) {
  if (!phone) return false;
  const digits = String(phone).replace(/[\s-]/g, '');
  return /^\+?\d{7,15}$/.test(digits);
}

export function sanitizeString(value, max = 1000) {
  if (value == null) return '';
  return String(value).trim().slice(0, max);
}
