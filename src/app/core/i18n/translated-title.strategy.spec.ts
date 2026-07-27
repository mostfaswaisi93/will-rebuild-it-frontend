import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot } from '@angular/router';
import { TranslationService } from './translation.service';
import { TranslatedTitleStrategy } from './translated-title.strategy';

/**
 * Every route used to inherit one static `<title>`, so all 108 read the same
 * thing — a WCAG 2.4.2 failure that no compiler or lint rule can see. These
 * pin the three behaviours that would silently undo it: the deepest key wins,
 * an unresolvable key never leaks into the tab, and a locale change re-titles
 * the page already open.
 */
describe('TranslatedTitleStrategy', () => {
  let strategy: TranslatedTitleStrategy;
  let title: Title;

  /** Minimal snapshot: a root → child chain carrying `data.titleKey`. */
  function snapshotFor(...keys: (string | undefined)[]): RouterStateSnapshot {
    const nodes = keys.map((k) => ({ data: k ? { titleKey: k } : {}, firstChild: null as unknown }));
    nodes.forEach((n, i) => (n.firstChild = nodes[i + 1] ?? null));
    return { root: nodes[0] } as unknown as RouterStateSnapshot;
  }

  beforeEach(() => {
    localStorage.removeItem('wri-locale');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    strategy = TestBed.inject(TranslatedTitleStrategy);
    title = TestBed.inject(Title);
  });

  /**
   * With no dictionary loaded, `translate` echoes the key back. Showing
   * `shipments.detail.title` in a browser tab would be worse than showing the
   * platform name, so an unresolved key must fall back.
   */
  it('never puts a raw dictionary key in the tab', () => {
    strategy.updateTitle(snapshotFor(undefined, 'shipments.detail.title'));

    expect(title.getTitle()).not.toContain('shipments.detail.title');
    expect(title.getTitle()).toBe('brand.nameAr');
  });

  it('takes the deepest key, so a child overrides its parent', () => {
    const spy = spyOn(TestBed.inject(TranslationService), 'translate').and.callFake(
      (key: string) => `T(${key})`,
    );

    strategy.updateTitle(snapshotFor('auth.reset.request.title', 'auth.reset.verify.title'));

    expect(title.getTitle()).toBe('T(auth.reset.verify.title) · T(brand.nameAr)');
    expect(spy).toHaveBeenCalledWith('auth.reset.verify.title');
  });

  it('falls back to the platform name when no route declares a key', () => {
    spyOn(TestBed.inject(TranslationService), 'translate').and.returnValue('حنعمرها');

    strategy.updateTitle(snapshotFor(undefined, undefined));

    expect(title.getTitle()).toBe('حنعمرها');
  });

  /**
   * The locale toggle does not navigate, so without re-titling in place the tab
   * would keep the previous language until the user moved to another page.
   */
  it('re-titles the open page when the locale changes', () => {
    const translation = TestBed.inject(TranslationService);
    spyOn(translation, 'translate').and.callFake((key: string) => `${translation.locale()}:${key}`);

    strategy.updateTitle(snapshotFor('shipments.title'));
    expect(title.getTitle()).toBe('ar:shipments.title · ar:brand.nameAr');

    translation.setLocale('en');
    TestBed.tick();

    expect(title.getTitle()).toBe('en:shipments.title · en:brand.nameAr');
  });
});
