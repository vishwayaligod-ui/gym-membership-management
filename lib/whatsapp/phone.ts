/**
 * Indian phone number normalization and validation for WhatsApp.
 *
 * WhatsApp requires numbers in E.164 format with country code,
 * e.g. +919876543210. This module normalizes common Indian
 * formats (10-digit, +91 prefix, 0 prefix, spaces/dashes) and
 * rejects invalid numbers so we never silently send to bad ones.
 */

const INDIA_COUNTRY_CODE = "91";

/**
 * Normalize an Indian phone number to E.164 format (without the leading +).
 * Returns null if the number is invalid.
 *
 * Accepted formats:
 *   - 9876543210
 *   - +919876543210
 *   - 919876543210
 *   - 09876543210
 *   - +91 98765 43210
 *   - 91-98765-43210
 */
export function normalizeIndianPhoneNumber(input: string): string | null {
  if (!input) return null;

  // Strip all non-digit characters
  const digits = input.replace(/\D/g, "");

  if (digits.length === 10) {
    // Plain 10-digit Indian mobile number
    if (!/^[6-9]\d{9}$/.test(digits)) return null;
    return `${INDIA_COUNTRY_CODE}${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    // 0-prefixed 10-digit number, e.g. 09876543210
    const local = digits.slice(1);
    if (!/^[6-9]\d{9}$/.test(local)) return null;
    return `${INDIA_COUNTRY_CODE}${local}`;
  }

  if (digits.length === 12 && digits.startsWith(INDIA_COUNTRY_CODE)) {
    // 91 followed by 10 digits, e.g. 919876543210
    const local = digits.slice(2);
    if (!/^[6-9]\d{9}$/.test(local)) return null;
    return digits;
  }

  if (digits.length === 13 && digits.startsWith(`00${INDIA_COUNTRY_CODE}`)) {
    // 00-prefixed international format, e.g. 00919876543210
    const local = digits.slice(4);
    if (!/^[6-9]\d{9}$/.test(local)) return null;
    return `${INDIA_COUNTRY_CODE}${local}`;
  }

  return null;
}

/**
 * Format a normalized E.164 number (e.g. 919876543210) for display.
 */
export function formatIndianPhoneNumber(normalized: string): string {
  if (!normalized || normalized.length !== 12 || !normalized.startsWith(INDIA_COUNTRY_CODE)) {
    return normalized;
  }
  const local = normalized.slice(2);
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}