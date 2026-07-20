import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { LucideArrowLeft } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';

/**
 * Reusable page-header bar used at the top of app pages: optional back
 * button + title + optional subtitle + a projected slot for trailing
 * action buttons (e.g. "New request").
 */
@Component({
  selector: 'app-page-header',
  imports: [LucideArrowLeft, TranslatePipe],
  templateUrl: './page-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  private readonly location = inject(Location);

  /** Already-translated title text — the caller is responsible for translation. */
  readonly title = input.required<string>();
  /** Already-translated subtitle text — the caller is responsible for translation. */
  readonly subtitle = input<string>();
  readonly showBack = input(false);

  protected goBack(): void {
    this.location.back();
  }
}
