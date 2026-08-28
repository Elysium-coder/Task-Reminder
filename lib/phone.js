/**
 * Phone number helpers (server-side).
 * Uses libphonenumber-js to normalize to E.164 and validate.
 * Imported only inside API routes / getServerSideProps, so the (large)
 * libphonenumber-js bundle stays server-side.
 */
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

const DEFAULT_COUNTRY = process.env.PHONE_DEFAULT_COUNTRY || 'NP';

export function normalizePhone(phone) {
  if (!phone) return null;
  try {
    const pn = parsePhoneNumber(phone, { defaultCountry: DEFAULT_COUNTRY });
    if (!pn.isValid()) return null;
    return pn.number; // E.164, e.g. +9779801234567
  } catch (e) {
    return null;
  }
}

export function isValidPhone(phone) {
  if (!phone) return false;
  try {
    return isValidPhoneNumber(phone, { defaultCountry: DEFAULT_COUNTRY });
  } catch (e) {
    return false;
  }
}

export default normalizePhone;
