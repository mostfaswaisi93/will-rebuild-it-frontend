import { FormControl } from '@angular/forms';
import { futureDateValidator } from './date.validators';

describe('futureDateValidator', () => {
  // Fixed "today" so the boundary cannot drift with the calendar.
  const today = () => new Date('2026-07-20T00:00:00.000Z');
  const validate = futureDateValidator(today);

  it('accepts a date in the future', () => {
    expect(validate(new FormControl('2027-01-01'))).toBeNull();
  });

  it('rejects an expired licence', () => {
    // The legacy field accepted this silently, so an expired licence sat in
    // the contractor's profile looking valid.
    expect(validate(new FormControl('2025-01-01'))).toEqual({ expiry: 'expired' });
  });

  it('rejects today itself as already expired', () => {
    expect(validate(new FormControl('2026-07-20'))).toEqual({ expiry: 'expired' });
  });

  it('rejects an unparseable date', () => {
    expect(validate(new FormControl('soon'))).toEqual({ expiry: 'invalid' });
  });

  it('stays silent on empty so `required` owns that message', () => {
    expect(validate(new FormControl(''))).toBeNull();
  });
});
