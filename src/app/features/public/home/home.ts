import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideBuilding2, LucideHandHeart, LucideUsers } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { BrandMark } from '@shared/ui/brand-mark/brand-mark';

/**
 * Public landing — port of the legacy `welcome`. The platform's front door,
 * shown at `/`: mission, headline impact figures, how it works, and routes into
 * sign-in / contractor registration. Rendered server-side for SEO (see
 * `app.routes.server.ts`), so it stays outside the authenticated shell.
 */
@Component({
  selector: 'app-public-home',
  imports: [RouterLink, LucideBuilding2, LucideHandHeart, LucideUsers, TranslatePipe, BrandMark],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicHome {
  private readonly translation = inject(TranslationService);

  protected readonly currentYear = new Date().getFullYear();

  protected readonly steps = [
    { icon: LucideUsers, key: 'register' },
    { icon: LucideBuilding2, key: 'rebuild' },
    { icon: LucideHandHeart, key: 'fund' },
  ];

  /** Headline figures — illustrative, as the public site has no live backend. */
  protected readonly stats = [
    { value: '1,240', key: 'homes' },
    { value: '86', key: 'teams' },
    { value: '5', key: 'governorates' },
  ];

  protected toggleLocale(): void {
    this.translation.toggleLocale();
  }

  protected readonly isRtl = this.translation.isRtl;
}
