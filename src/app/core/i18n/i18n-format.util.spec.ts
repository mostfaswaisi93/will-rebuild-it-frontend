import { interpolate, resolveEntry, selectPluralForm } from './i18n-format.util';

describe('i18n-format', () => {
  describe('resolveEntry', () => {
    const dictionary = { a: { b: { c: 'found' } }, plural: { one: 'x', other: 'y' } };

    it('walks a dotted path to a string', () => {
      expect(resolveEntry('a.b.c', dictionary)).toBe('found');
    });

    it('returns the object for a plural entry', () => {
      expect(resolveEntry('plural', dictionary)).toEqual({ one: 'x', other: 'y' });
    });

    it('returns undefined for a missing path', () => {
      expect(resolveEntry('a.b.nope', dictionary)).toBeUndefined();
      expect(resolveEntry('totally.absent', dictionary)).toBeUndefined();
    });
  });

  describe('interpolate', () => {
    it('replaces named tokens', () => {
      expect(interpolate('Hello, {{name}}', { name: 'Youssef' })).toBe('Hello, Youssef');
    });

    it('tolerates surrounding whitespace in the token', () => {
      expect(interpolate('{{ count }} items', { count: 3 })).toBe('3 items');
    });

    it('collapses unknown tokens rather than leaving braces on screen', () => {
      expect(interpolate('Hi {{missing}}!', { name: 'x' })).toBe('Hi !');
    });

    it('returns the value untouched when no params are given', () => {
      expect(interpolate('No tokens here')).toBe('No tokens here');
    });
  });

  describe('selectPluralForm', () => {
    const forms = {
      '=0': 'none at all',
      zero: 'zero-form',
      one: 'one-form',
      two: 'two-form',
      few: 'few-form',
      many: 'many-form',
      other: 'other-form',
    };

    it('passes a plain string straight through', () => {
      expect(selectPluralForm('just text', 'en')).toBe('just text');
    });

    it('prefers an exact-match form over the category', () => {
      expect(selectPluralForm(forms, 'en', { count: 0 })).toBe('none at all');
      expect(selectPluralForm(forms, 'ar', { count: 0 })).toBe('none at all');
    });

    it('selects English categories (one / other)', () => {
      expect(selectPluralForm(forms, 'en', { count: 1 })).toBe('one-form');
      expect(selectPluralForm(forms, 'en', { count: 2 })).toBe('other-form');
      expect(selectPluralForm(forms, 'en', { count: 11 })).toBe('other-form');
      expect(selectPluralForm(forms, 'en', { count: 100 })).toBe('other-form');
    });

    it('selects all six Arabic categories', () => {
      // This is the whole reason plural support exists — Arabic genuinely
      // needs distinct words for dual, few (3-10) and many (11-99).
      expect(selectPluralForm(forms, 'ar', { count: 1 })).toBe('one-form');
      expect(selectPluralForm(forms, 'ar', { count: 2 })).toBe('two-form');
      expect(selectPluralForm(forms, 'ar', { count: 3 })).toBe('few-form');
      expect(selectPluralForm(forms, 'ar', { count: 10 })).toBe('few-form');
      expect(selectPluralForm(forms, 'ar', { count: 11 })).toBe('many-form');
      expect(selectPluralForm(forms, 'ar', { count: 99 })).toBe('many-form');
      expect(selectPluralForm(forms, 'ar', { count: 100 })).toBe('other-form');
    });

    it('falls back to "other" when the exact category is absent', () => {
      const sparse = { other: 'fallback' };
      expect(selectPluralForm(sparse, 'ar', { count: 2 })).toBe('fallback');
      expect(selectPluralForm(sparse, 'en', { count: 1 })).toBe('fallback');
    });

    it('returns undefined for a plural entry with no count param', () => {
      // Caller then shows the key, which surfaces the authoring mistake.
      expect(selectPluralForm(forms, 'en')).toBeUndefined();
      expect(selectPluralForm(forms, 'en', { name: 'x' })).toBeUndefined();
    });

    it('returns undefined for a missing entry', () => {
      expect(selectPluralForm(undefined, 'en', { count: 1 })).toBeUndefined();
    });
  });
});
