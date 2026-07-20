import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { Toasts } from '@shared/ui/toasts/toasts';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';

/**
 * Shell for every authenticated `/app/*` route: sidebar + sticky header +
 * router-outlet + footer, guarded upstream by `authGuard`. Mounts the global
 * toast stack once here rather than per-page.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Header, Toasts, TranslatePipe],
  templateUrl: './app-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  protected readonly currentYear = new Date().getFullYear();
}
