import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideDynamicIcon,
  LucideFileText,
  LucideShieldCheck,
  LucideTags,
  type LucideIcon,
} from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { PageHeader } from '@shared/ui/page-header/page-header';

interface SettingsCard {
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  path: string;
  /** Not yet built — shown disabled with a "coming soon" note. */
  disabled?: boolean;
}

/**
 * Settings landing — port of the legacy `global-settings` layout. A hub of
 * cards to each settings area. Only the areas actually built are enabled;
 * the rest are surfaced as forthcoming rather than hidden, so the shape of the
 * settings section is visible.
 */
@Component({
  selector: 'app-settings-hub',
  imports: [RouterLink, LucideDynamicIcon, TranslatePipe, PageHeader],
  templateUrl: './settings-hub.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsHub {
  protected readonly cards: SettingsCard[] = [
    {
      titleKey: 'settings.hub.terms',
      descriptionKey: 'settings.hub.termsDesc',
      icon: LucideFileText,
      path: '/app/global-settings/terms',
    },
    {
      titleKey: 'settings.hub.pricebook',
      descriptionKey: 'settings.hub.pricebookDesc',
      icon: LucideTags,
      path: '/app/pricebook',
    },
    {
      titleKey: 'settings.hub.permissions',
      descriptionKey: 'settings.hub.permissionsDesc',
      icon: LucideShieldCheck,
      path: '/app/permissions',
    },
  ];
}
