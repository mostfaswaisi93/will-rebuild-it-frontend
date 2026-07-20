import { maskEmail, maskPhone } from './mask.util';

describe('maskEmail', () => {
  it('keeps two leading characters and the whole domain', () => {
    expect(maskEmail('bassam@example.com')).toBe('ba****@example.com');
  });

  it('keeps only one character for a short local part', () => {
    // 'ali' is short enough that showing two of three would barely mask it.
    expect(maskEmail('ali@example.com')).toBe('a**@example.com');
  });

  it('still masks a single-character local part', () => {
    expect(maskEmail('a@example.com')).toBe('a*@example.com');
  });

  it('masks against the last @, so a plus-tagged address is handled', () => {
    expect(maskEmail('bassam+leads@example.com')).toBe('ba**********@example.com');
  });

  it('masks the whole string when there is no local part to mask', () => {
    // The legacy helper returned undefined here, which rendered as "undefined".
    expect(maskEmail('not-an-email')).toBe('************');
    expect(maskEmail('@example.com')).toBe('************');
  });

  it('never returns an empty string', () => {
    expect(maskEmail('')).toBe('*');
  });
});

describe('maskPhone', () => {
  it('reveals only the last four digits', () => {
    expect(maskPhone('+970598334455')).toBe('••••••••4455');
  });

  it('ignores separators when counting digits', () => {
    expect(maskPhone('059-833-4455')).toBe('••••••4455');
  });

  it('returns short numbers unmasked rather than erroring', () => {
    expect(maskPhone('4455')).toBe('4455');
    expect(maskPhone('')).toBe('');
  });
});
