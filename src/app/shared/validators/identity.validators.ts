import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Palestinian national ID: 9 digits, the last being a check digit over the
 * first eight (the same Luhn-style weighting used by the Israeli ID the
 * numbering derives from).
 *
 * This replaces the legacy `socialSecurity` field, which accepted a US SSN or
 * EIN with no validation at all — so a typo only surfaced when a disbursement
 * later failed identity checks.
 */
export function isValidNationalId(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 9) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    // Alternating weights 1,2,1,2… ; a two-digit product folds to its digit sum.
    const product = Number(digits[i]) * (i % 2 === 0 ? 1 : 2);
    sum += product > 9 ? product - 9 : product;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number(digits[8]);
}

export const nationalIdValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (!value) {
    return null; // `required` owns the empty case.
  }
  return isValidNationalId(value) ? null : { nationalId: true };
};

/**
 * Rejects a date of birth that is in the future or implies an age outside
 * 18–100. Contractors sign contracts, so a minor cannot register.
 */
export function dateOfBirthValidator(today: () => Date = () => new Date()): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = String(control.value ?? '').trim();
    if (!raw) {
      return null;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return { dateOfBirth: 'invalid' };
    }

    const now = today();
    if (parsed > now) {
      return { dateOfBirth: 'future' };
    }

    let age = now.getFullYear() - parsed.getFullYear();
    const monthDelta = now.getMonth() - parsed.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < parsed.getDate())) {
      age -= 1;
    }

    if (age < 18) {
      return { dateOfBirth: 'tooYoung' };
    }
    if (age > 100) {
      return { dateOfBirth: 'tooOld' };
    }
    return null;
  };
}
