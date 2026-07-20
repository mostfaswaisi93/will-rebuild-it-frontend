import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Requires a date strictly in the future — used for credential expiry.
 *
 * An expired licence is worse than a missing one: it reads as valid in a list
 * while conferring nothing. The legacy form stored `tradeLicenseExpiration` as
 * free text with no validation at all.
 *
 * `today` is injectable so the boundary is testable without the calendar
 * moving under the spec.
 */
export function futureDateValidator(today: () => Date = () => new Date()): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = String(control.value ?? '').trim();
    if (!raw) {
      return null; // `required` owns the empty case.
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return { expiry: 'invalid' };
    }

    return parsed.getTime() > today().getTime() ? null : { expiry: 'expired' };
  };
}
