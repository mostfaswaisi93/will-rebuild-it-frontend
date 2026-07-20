import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslationService } from './translation.service';

/**
 * Covers locale state and the missing-key contract. Plural selection and
 * interpolation are pure functions tested exhaustively in
 * `i18n-format.util.spec.ts`, so this spec deliberately does not stand up the
 * HTTP-backed dictionary.
 */
describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    localStorage.removeItem('wri-locale');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TranslationService);
  });

  // Arabic is the portal's primary locale — beneficiaries, contractors and
  // field staff all work in it. English is the secondary, for donors/partners.
  it('defaults to Arabic, in RTL', () => {
    expect(service.locale()).toBe('ar');
    expect(service.isRtl()).toBeTrue();
  });

  it('marks English as LTR', () => {
    service.setLocale('en');
    expect(service.locale()).toBe('en');
    expect(service.isRtl()).toBeFalse();
  });

  it('toggles between the two locales', () => {
    expect(service.locale()).toBe('ar');
    service.toggleLocale();
    expect(service.locale()).toBe('en');
    service.toggleLocale();
    expect(service.locale()).toBe('ar');
  });

  it('falls back to the key when the dictionary has no entry', () => {
    // Showing the key makes a missing translation obvious rather than blank.
    expect(service.translate('nothing.here')).toBe('nothing.here');
  });
});
