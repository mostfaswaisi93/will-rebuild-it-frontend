/**
 * The specialization values stored on teams are free-form Title-Case strings
 * ('Structural repair'); the existing `teams.specialization.*` dictionary keys
 * them in camelCase. This bridges the two so the back-office can reuse those
 * translations, and offers the known set as filter options.
 *
 * `value` is what the teams API filters on (an exact string match); `key` is
 * the i18n key under `teams.specialization`.
 */
export interface SpecializationOption {
  value: string;
  key: string;
}

export const SPECIALIZATIONS: readonly SpecializationOption[] = [
  { value: 'Residential', key: 'residential' },
  { value: 'Commercial', key: 'commercial' },
  { value: 'Agricultural', key: 'agricultural' },
  { value: 'Infrastructure', key: 'infrastructure' },
  { value: 'Structural repair', key: 'structuralRepair' },
  { value: 'Finishing works', key: 'finishingWorks' },
];

/** camelCase key for a stored specialization string, for `teams.specialization.<key>`. */
export function specializationKey(value: string): string {
  return value
    .trim()
    .replace(/\s+(.)/g, (_, char: string) => char.toUpperCase())
    .replace(/^./, (char) => char.toLowerCase());
}
