import { SPECIALIZATIONS, specializationKey } from './contractor-spec';

describe('specializationKey', () => {
  it('camelCases a multi-word Title-Case specialization', () => {
    expect(specializationKey('Structural repair')).toBe('structuralRepair');
    expect(specializationKey('Finishing works')).toBe('finishingWorks');
  });

  it('lowercases a single word', () => {
    expect(specializationKey('Residential')).toBe('residential');
    expect(specializationKey('Commercial')).toBe('commercial');
  });

  it('trims surrounding whitespace', () => {
    expect(specializationKey('  Infrastructure  ')).toBe('infrastructure');
  });

  it('maps every declared filter option to its own i18n key', () => {
    // The whole point of the bridge: the filter value and the i18n key must
    // agree, so a badge and a filter option for the same specialization read
    // the same.
    for (const option of SPECIALIZATIONS) {
      expect(specializationKey(option.value)).toBe(option.key);
    }
  });
});
