import { FormControl, FormGroup, Validators } from '@angular/forms';
import { mustMatch, passwordStrength, passwordStrengthValidator } from './password.validators';

describe('passwordStrength', () => {
  it('reports every rule for a compliant password', () => {
    expect(passwordStrength('Abcdef1!')).toEqual({
      length: true,
      uppercase: true,
      lowercase: true,
      number: true,
      symbol: true,
    });
  });

  it('rejects anything longer than 15 characters', () => {
    // The legacy form capped input at maxlength=15; the rule has to agree or a
    // pasted longer password would tick every box and fail on submit.
    expect(passwordStrength('Abcdefgh1!234567').length).toBeFalse();
  });

  it('accepts symbols the legacy fixed set excluded', () => {
    // Legacy tested only [#?!@$%^&*-], so '_' failed while the on-screen rule
    // said "one special character".
    expect(passwordStrength('Abcdef1_').symbol).toBeTrue();
    expect(passwordStrength('Abcdef1+').symbol).toBeTrue();
  });
});

describe('passwordStrengthValidator', () => {
  it('passes a compliant password', () => {
    expect(passwordStrengthValidator(new FormControl('Abcdef1!'))).toBeNull();
  });

  it('lists the unmet rules', () => {
    const errors = passwordStrengthValidator(new FormControl('abcdefgh'));
    expect(errors?.['passwordStrength'].unmet).toEqual(['uppercase', 'number', 'symbol']);
  });

  it('stays silent on an empty value so `required` owns that message', () => {
    expect(passwordStrengthValidator(new FormControl(''))).toBeNull();
  });
});

describe('mustMatch', () => {
  function makeGroup(): FormGroup {
    return new FormGroup(
      {
        password: new FormControl('', { nonNullable: true }),
        confirmPassword: new FormControl('', {
          nonNullable: true,
          validators: [Validators.required],
        }),
      },
      { validators: mustMatch('password', 'confirmPassword') },
    );
  }

  it('flags the confirmation field when the two differ', () => {
    const group = makeGroup();
    group.setValue({ password: 'Abcdef1!', confirmPassword: 'Different1!' });
    expect(group.get('confirmPassword')?.hasError('mustMatch')).toBeTrue();
  });

  it('clears its own error once they match', () => {
    const group = makeGroup();
    group.setValue({ password: 'Abcdef1!', confirmPassword: 'nope' });
    expect(group.get('confirmPassword')?.hasError('mustMatch')).toBeTrue();

    group.patchValue({ confirmPassword: 'Abcdef1!' });
    expect(group.get('confirmPassword')?.hasError('mustMatch')).toBeFalse();
    expect(group.get('confirmPassword')?.errors).toBeNull();
  });

  it('does not clobber another validator on the confirmation field', () => {
    // An empty confirmation is `required`-invalid; that message must survive
    // rather than being replaced by a mismatch complaint.
    const group = makeGroup();
    group.setValue({ password: 'Abcdef1!', confirmPassword: '' });
    expect(group.get('confirmPassword')?.hasError('required')).toBeTrue();
  });
});
