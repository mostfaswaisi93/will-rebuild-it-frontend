import { Injectable, effect, inject, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslationService } from './translation.service';

/**
 * Sets the document title per route, translated.
 *
 * Every route used to inherit the one static `<title>` from `index.html`, so all
 * 108 of them read "منصة إعمار غزة — لوحة الإدارة". That fails WCAG 2.4.2: browser
 * history and bookmarks were indistinguishable, and a screen reader announced
 * the same title after every navigation, giving no signal that the page had
 * changed. On the server-rendered public pages it also meant a shared project
 * link previewed as "admin console".
 *
 * Angular's built-in strategy takes a static `title` string, which cannot work
 * here: the locale is switched at runtime, so a string baked in at route-config
 * time would be wrong in one language. Routes therefore carry
 * `data: { titleKey }` — an existing dictionary key, the same one the page's
 * header already renders — and this strategy resolves it, re-resolving whenever
 * the locale or the dictionary changes.
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translation = inject(TranslationService);

  /** The last navigation's key, so a language toggle can re-title in place. */
  private currentKey: string | undefined;

  constructor() {
    super();
    // The dictionary arrives asynchronously and the locale can change without
    // any navigation; both must re-title the page that is already open.
    effect(() => {
      this.translation.locale();
      this.translation.dictionary();
      untracked(() => this.apply(this.currentKey));
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    // `buildTitle` walks to the deepest route that declares a title; the same
    // walk is needed for our key so a child (an onboarding step, a reset step)
    // can override its parent.
    this.currentKey = this.deepestTitleKey(snapshot);
    this.apply(this.currentKey);
  }

  private deepestTitleKey(snapshot: RouterStateSnapshot): string | undefined {
    let route = snapshot.root;
    let key: string | undefined;
    while (route) {
      const candidate = route.data?.['titleKey'];
      if (typeof candidate === 'string' && candidate) {
        key = candidate;
      }
      route = route.firstChild!;
    }
    return key;
  }

  private apply(key: string | undefined): void {
    const suffix = this.translation.translate('brand.nameAr');
    if (!key) {
      this.title.setTitle(suffix);
      return;
    }
    const page = this.translation.translate(key);
    // `translate` returns the key itself when it cannot resolve one. Showing a
    // raw dictionary key in the tab would be worse than the generic name.
    this.title.setTitle(page === key ? suffix : `${page} · ${suffix}`);
  }
}
