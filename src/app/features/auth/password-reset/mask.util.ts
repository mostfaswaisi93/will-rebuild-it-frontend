/**
 * Masking for the "where should we send the code?" step. The user has to
 * recognise their own address/number without the page disclosing a full
 * contact detail to whoever typed the email in.
 *
 * Ported from the legacy `generateMaskedEmai`, which produced different
 * results for names of 5+ vs under 5 characters and could return `undefined`
 * for an address with no `@`. These keep one rule and always return a string.
 */

/** `bassam@example.com` → `ba****@example.com`; short names keep one char. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at <= 0) {
    // No local part to mask — mask the lot rather than leaking it.
    return '*'.repeat(Math.max(email.length, 1));
  }

  const local = email.slice(0, at);
  const domain = email.slice(at);
  // Two visible characters is enough to recognise your own address; a
  // single-character local part would otherwise be shown in full.
  const visible = local.length >= 4 ? 2 : 1;
  return local.slice(0, visible) + '*'.repeat(Math.max(local.length - visible, 1)) + domain;
}

/** `+970598334455` → `••••••••4455`, preserving only the last four digits. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) {
    return digits;
  }
  return '•'.repeat(digits.length - 4) + digits.slice(-4);
}
