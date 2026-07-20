import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBuilding2,
  LucideCalculator,
  LucideCompass,
  LucideDynamicIcon,
  LucideFileText,
  LucideHeart,
  LucideLayoutDashboard,
  LucideStar,
  LucideUsers,
  LucideWallet,
  LucideX,
  type LucideIcon,
} from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { SessionStore } from '@core/session/session-store.service';
import { BrandMark } from '@shared/ui/brand-mark/brand-mark';
import { SidebarStateService } from '../sidebar-state.service';

interface NavItem {
  labelKey: string;
  path: string;
  icon: LucideIcon;
}

const BENEFICIARY_NAV: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/app/dashboard', icon: LucideLayoutDashboard },
  { labelKey: 'nav.requests', path: '/app/requests', icon: LucideFileText },
  { labelKey: 'nav.projects', path: '/app/projects', icon: LucideBuilding2 },
  { labelKey: 'nav.teams', path: '/app/teams', icon: LucideUsers },
  { labelKey: 'nav.estimates', path: '/app/estimates', icon: LucideCalculator },
  { labelKey: 'nav.funding', path: '/app/funding', icon: LucideWallet },
  { labelKey: 'nav.reviews', path: '/app/reviews', icon: LucideStar },
];

const DONOR_NAV: NavItem[] = [
  { labelKey: 'nav.donations', path: '/app/donations', icon: LucideHeart },
  { labelKey: 'nav.browseProjects', path: '/pub', icon: LucideCompass },
];

/**
 * Only the team's own workspace: the project/estimate LIST endpoints are not
 * team-scoped in the mock backend, so linking a team member at them would show
 * other teams' records. The workspace itself is properly scoped, and it links
 * out to the individual records this team is assigned to.
 */
const TEAM_NAV: NavItem[] = [
  { labelKey: 'nav.teamDashboard', path: '/app/team-dashboard', icon: LucideLayoutDashboard },
];

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, LucideX, LucideDynamicIcon, TranslatePipe, BrandMark],
  templateUrl: './sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  protected readonly session = inject(SessionStore);
  protected readonly sidebarState = inject(SidebarStateService);

  protected readonly navItems = computed<NavItem[]>(() => {
    switch (this.session.role()) {
      case 'donor':
        return DONOR_NAV;
      case 'team':
        return TEAM_NAV;
      case 'beneficiary':
      default:
        return BENEFICIARY_NAV;
    }
  });

  /** Mutually-exclusive transform classes — avoids ever having `-translate-x-full` and
   * `translate-x-0` present on the element at once, which would leave the visual result
   * to depend on Tailwind's generated rule order instead of explicit state. */
  protected readonly panelTransformClass = computed(() =>
    this.sidebarState.isOpen() ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
  );

  protected closeOnNavigate(): void {
    this.sidebarState.close();
  }
}
