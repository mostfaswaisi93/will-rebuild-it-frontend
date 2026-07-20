import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { AppLocale, DEFAULT_LOCALE, LOCALE_STORAGE_KEY } from './app-locale';
import { TranslationParams, interpolate, resolveEntry, selectPluralForm } from './i18n-format.util';

export type { AppLocale };

type Dictionary = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly locale = signal<AppLocale>(this.readInitialLocale());
  readonly isRtl = computed(() => this.locale() === 'ar');

  private readonly dictionaryResource = httpResource<Dictionary>(
    () => `/i18n/${this.locale()}.json`,
  );

  readonly dictionary = computed<Dictionary>(() => this.dictionaryResource.value() ?? {});
  readonly isLoading = computed(() => this.dictionaryResource.isLoading());

  constructor() {
    effect(() => {
      const locale = this.locale();
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    });
  }

  setLocale(locale: AppLocale): void {
    this.locale.set(locale);
  }

  toggleLocale(): void {
    this.locale.set(this.locale() === 'en' ? 'ar' : 'en');
  }

  /**
   * Resolves a key to display copy. Plural selection and interpolation live in
   * `i18n-format.util` as pure functions so they can be exhaustively tested
   * without standing up an HTTP-backed dictionary.
   */
  translate(key: string, params?: TranslationParams): string {
    const entry = resolveEntry(key, this.dictionary());
    const form = selectPluralForm(entry, this.locale(), params);
    return form === undefined ? key : interpolate(form, params);
  }

  private readInitialLocale(): AppLocale {
    if (!isPlatformBrowser(this.platformId)) {
      return DEFAULT_LOCALE;
    }
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored === 'en' || stored === 'ar' ? stored : DEFAULT_LOCALE;
  }
}
