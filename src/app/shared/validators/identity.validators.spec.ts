import { FormControl } from '@angular/forms';
import { dateOfBirthValidator, isValidNationalId, nationalIdValidator } from './identity.validators';

describe('isValidNationalId', () => {
  // Check digit computed with the documented weighting.
  const VALID = '999999998';

  it('accepts a number whose check digit matches', () => {
    expect(isValidNationalId(VALID)).toBeTrue();
  });

  it('rejects a number whose check digit does not match', () => {
    expect(isValidNationalId('999999997')).toBeFalse();
  });

  it('rejects anything that is not nine digits', () => {
    expect(isValidNationalId('99999999')).toBeFalse();
    expect(isValidNationalId('9999999980')).toBeFalse();
    expect(isValidNationalId('')).toBeFalse();
  });

  it('ignores separators when counting digits', () => {
    expect(isValidNationalId('999-999-998')).toBeTrue();
  });

  it('catches a single-digit typo', () => {
    // The whole point of the check digit — the legacy field validated nothing,
    // so a typo surfaced only when a disbursement failed.
    expect(isValidNationalId('999999988')).toBeFalse();
  });
});

describe('nationalIdValidator', () => {
  it('passes a valid number', () => {
    expect(nationalIdValidator(new FormControl('999999998'))).toBeNull();
  });

  it('flags an invalid number', () => {
    expect(nationalIdValidator(new FormControl('123456789'))).toEqual({ nationalId: true });
  });

  it('stays silent on empty so `required` owns that message', () => {
    expect(nationalIdValidator(new FormControl(''))).toBeNull();
  });
});

describe('dateOfBirthValidator', () => {
  // Fixed "today" so the age boundaries can't drift with the calendar.
  const today = () => new Date('2026-07-20T00:00:00.000Z');
  const validate = dateOfBirthValidator(today);

  it('accepts an adult', () => {
    expect(validate(new FormControl('1990-05-10'))).toBeNull();
  });

  it('rejects a future date', () => {
    expect(validate(new FormControl('2030-01-01'))).toEqual({ dateOfBirth: 'future' });
  });

  it('rejects someone under 18', () => {
    expect(validate(new FormControl('2010-01-01'))).toEqual({ dateOfBirth: 'tooYoung' });
  });

  it('accepts someone who turns 18 today', () => {
    expect(validate(new FormControl('2008-07-20'))).toBeNull();
  });

  it('rejects someone one day short of 18', () => {
    expect(validate(new FormControl('2008-07-21'))).toEqual({ dateOfBirth: 'tooYoung' });
  });

  it('rejects an implausible age', () => {
    expect(validate(new FormControl('1900-01-01'))).toEqual({ dateOfBirth: 'tooOld' });
  });

  it('rejects an unparseable date', () => {
    expect(validate(new FormControl('not-a-date'))).toEqual({ dateOfBirth: 'invalid' });
  });

  it('stays silent on empty', () => {
    expect(validate(new FormControl(''))).toBeNull();
  });
});
