import { AppLocale } from './app-locale';

export type TranslationParams = Record<string, string | number>;

/**
 * A dictionary entry is either a finished string, or — when the copy varies by
 * count — an object of CLDR plural forms. Keys may be a plural category
 * ('one' | 'two' | 'few' | 'many' | 'other' | 'zero') or an exact match ('=0').
 */
export type TranslationEntry = string | Record<string, unknown>;

/**
 * Picks the right plural form for `count` under the given locale's CLDR rules.
 *
 * This matters far beyond English's one/other: Arabic distinguishes six
 * categories, so "3 تقييمات" (few) and "11 تقييمًا" (many) are genuinely
 * different words. A single interpolated string cannot be correct for both.
 *
 * An exact-match form ("=0") always wins, so copy like "No reviews yet" can
 * replace a bare "0 reviews".
 *
 * Returns `undefined` when the entry cannot be resolved, letting the caller
 * fall back to showing the key.
 */
export function selectPluralForm(
  raw: TranslationEntry | undefined,
  locale: AppLocale,
  params?: TranslationParams,
): string | undefined {
  if (typeof raw === 'string') {
    return raw;
  }
  if (raw === null || typeof raw !== 'object') {
    return undefined;
  }

  const count = params?.['count'];
  if (typeof count !== 'number') {
    return undefined;
  }

  const exact = raw[`=${count}`];
  if (typeof exact === 'string') {
    return exact;
  }

  const category = new Intl.PluralRules(locale).select(count);
  const selected = raw[category] ?? raw['other'];
  return typeof selected === 'string' ? selected : undefined;
}

/** Replaces `{{token}}` placeholders; unknown tokens collapse to an empty string. */
export function interpolate(value: string, params?: TranslationParams): string {
  if (!params) {
    return value;
  }
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, token: string) =>
    token in params ? String(params[token]) : '',
  );
}

/** Walks a dotted key path through a nested dictionary. */
export function resolveEntry(key: string, dictionary: Record<string, unknown>): TranslationEntry | undefined {
  let current: unknown = dictionary;
  for (const segment of key.split('.')) {
    if (current !== null && typeof current === 'object' && segment in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  if (typeof current === 'string') {
    return current;
  }
  return current !== null && typeof current === 'object'
    ? (current as Record<string, unknown>)
    : undefined;
}
