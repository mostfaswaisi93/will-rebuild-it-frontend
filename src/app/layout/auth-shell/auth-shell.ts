import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { BrandMark } from '@shared/ui/brand-mark/brand-mark';
import { Toasts } from '@shared/ui/toasts/toasts';

/**
 * Shell for the unauthenticated `/auth/*` routes. The legacy portal's
 * `AuthLayoutComponent` was a bare `<router-outlet>`; the branding and the
 * split-panel framing lived duplicated inside each of the four auth pages.
 * Hoisting it here keeps the pages to their forms.
 */
@Component({
  selector: 'app-auth-shell',
  imports: [RouterLink, RouterOutlet, TranslatePipe, BrandMark, Toasts],
  templateUrl: './auth-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthShell {
  protected readonly currentYear = new Date().getFullYear();
}
