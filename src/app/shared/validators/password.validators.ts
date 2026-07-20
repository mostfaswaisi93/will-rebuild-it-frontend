import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * The five rules `app-password-field` renders as a live checklist. The
 * validator and the checklist must agree — the legacy portal drove them from
 * two different regexes, so a password could satisfy every visible tick and
 * still be rejected on submit.
 *
 * Symbols are "any non-alphanumeric" rather than the legacy's fixed
 * `[#?!@$%^&*-]` set, which silently rejected characters like `_` and `+`
 * that the on-screen rule ("one special character") clearly permitted.
 */
export function passwordStrength(value: string): {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  symbol: boolean;
} {
  return {
    length: value.length >= 8 && value.length <= 15,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /[0-9]/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
  };
}

/** Fails with `{ passwordStrength: { unmet: [...] } }` listing the broken rules. */
export const passwordStrengthValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '');
  if (!value) {
    return null; // `required` owns the empty case.
  }

  const unmet = Object.entries(passwordStrength(value))
    .filter(([, satisfied]) => !satisfied)
    .map(([rule]) => rule);

  return unmet.length > 0 ? { passwordStrength: { unmet } } : null;
};

/**
 * Group-level validator setting `{ mustMatch: true }` on the confirmation
 * control. Replaces the legacy `MustMatch` helper.
 */
export function mustMatch(controlName: string, matchingControlName: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const control = group.get(controlName);
    const matching = group.get(matchingControlName);

    if (!control || !matching) {
      return null;
    }

    // Don't clobber another validator's error on the confirmation field.
    if (matching.errors && !matching.hasError('mustMatch')) {
      return null;
    }

    if (control.value !== matching.value) {
      matching.setErrors({ ...matching.errors, mustMatch: true });
      return { mustMatch: true };
    }

    // Clear only our own error, leaving any others intact.
    if (matching.hasError('mustMatch')) {
      const { mustMatch: _removed, ...rest } = matching.errors ?? {};
      matching.setErrors(Object.keys(rest).length > 0 ? rest : null);
    }
    return null;
  };
}
