import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBuilding2,
  LucideCalculator,
  LucideClipboardCheck,
  LucideClipboardList,
  LucideCompass,
  LucideDynamicIcon,
  LucideFileText,
  LucideHeart,
  LucideLayoutDashboard,
  LucideLayoutGrid,
  LucideMegaphone,
  LucideMessageSquareWarning,
  LucidePackage,
  LucideReceipt,
  LucideScrollText,
  LucideSettings,
  LucideShieldCheck,
  LucideStar,
  LucideTags,
  LucideTruck,
  LucideUsers,
  LucideWallet,
  LucideWarehouse,
  LucideWrench,
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

/**
 * Back-office navigation is long enough (25+ destinations) that a flat list
 * becomes unscannable, so those roles get labelled groups. The three
 * public-facing roles keep a single unlabelled group — a heading above four
 * links is just noise.
 */
interface NavGroup {
  /** Omitted for short navs, which render as one unlabelled list. */
  labelKey?: string;
  items: NavItem[];
}

const BENEFICIARY_NAV: NavGroup[] = [
  {
    items: [
      { labelKey: 'nav.dashboard', path: '/app/dashboard', icon: LucideLayoutDashboard },
      { labelKey: 'nav.requests', path: '/app/requests', icon: LucideFileText },
      { labelKey: 'nav.projects', path: '/app/projects', icon: LucideBuilding2 },
      { labelKey: 'nav.teams', path: '/app/teams', icon: LucideUsers },
      { labelKey: 'nav.estimates', path: '/app/estimates', icon: LucideCalculator },
      { labelKey: 'nav.funding', path: '/app/funding', icon: LucideWallet },
      { labelKey: 'nav.reviews', path: '/app/reviews', icon: LucideStar },
    ],
  },
];

const DONOR_NAV: NavGroup[] = [
  {
    items: [
      { labelKey: 'nav.donations', path: '/app/donations', icon: LucideHeart },
      { labelKey: 'nav.browseProjects', path: '/pub', icon: LucideCompass },
    ],
  },
];

/**
 * Only the team's own workspace: the project/estimate LIST endpoints are not
 * team-scoped in the mock backend, so linking a team member at them would show
 * other teams' records. The workspace itself is properly scoped, and it links
 * out to the individual records this team is assigned to.
 */
const TEAM_NAV: NavGroup[] = [
  {
    items: [
      { labelKey: 'nav.teamDashboard', path: '/app/team-dashboard', icon: LucideLayoutDashboard },
    ],
  },
];

const ADMIN_NAV: NavGroup[] = [
  {
    labelKey: 'navGroup.overview',
    items: [
      { labelKey: 'nav.adminDashboard', path: '/app/admin-dashboard', icon: LucideLayoutDashboard },
    ],
  },
  {
    labelKey: 'navGroup.operations',
    items: [
      { labelKey: 'nav.workRequests', path: '/app/work-requests', icon: LucideFileText },
      { labelKey: 'nav.dispatch', path: '/app/dispatch', icon: LucideLayoutGrid },
      { labelKey: 'nav.workOrders', path: '/app/work-orders', icon: LucideClipboardList },
      { labelKey: 'nav.estimates', path: '/app/estimates', icon: LucideCalculator },
      { labelKey: 'nav.inspections', path: '/app/inspections', icon: LucideClipboardCheck },
      { labelKey: 'nav.projects', path: '/app/projects', icon: LucideBuilding2 },
    ],
  },
  {
    labelKey: 'navGroup.parties',
    items: [
      { labelKey: 'nav.beneficiaries', path: '/app/beneficiaries', icon: LucideUsers },
      { labelKey: 'nav.contractors', path: '/app/contractors', icon: LucideBuilding2 },
      { labelKey: 'nav.suppliers', path: '/app/suppliers', icon: LucideTruck },
      { labelKey: 'nav.staff', path: '/app/staff', icon: LucideUsers },
    ],
  },
  {
    labelKey: 'navGroup.finance',
    items: [
      { labelKey: 'nav.statements', path: '/app/statements', icon: LucideReceipt },
      { labelKey: 'nav.disbursements', path: '/app/disbursements', icon: LucideWallet },
      { labelKey: 'nav.pricebook', path: '/app/pricebook', icon: LucideTags },
      { labelKey: 'nav.priceList', path: '/app/price-lists', icon: LucideTags },
      { labelKey: 'nav.subscriptions', path: '/app/subscriptions', icon: LucideScrollText },
    ],
  },
  {
    labelKey: 'navGroup.resources',
    items: [
      { labelKey: 'nav.inventory', path: '/app/inventory', icon: LucidePackage },
      { labelKey: 'nav.warehouses', path: '/app/warehouses', icon: LucideWarehouse },
      { labelKey: 'nav.purchaseOrders', path: '/app/purchase-orders', icon: LucideClipboardList },
      { labelKey: 'nav.shipments', path: '/app/shipments', icon: LucideTruck },
      { labelKey: 'nav.equipment', path: '/app/equipment', icon: LucideWrench },
    ],
  },
  {
    labelKey: 'navGroup.monitoring',
    items: [
      { labelKey: 'nav.scorecard', path: '/app/scorecards', icon: LucideShieldCheck },
      { labelKey: 'nav.externalRatings', path: '/app/external-ratings', icon: LucideStar },
      { labelKey: 'nav.questions', path: '/app/questions', icon: LucideMessageSquareWarning },
      { labelKey: 'nav.campaigns', path: '/app/campaigns', icon: LucideMegaphone },
      { labelKey: 'nav.notifications', path: '/app/notifications', icon: LucideMegaphone },
      { labelKey: 'nav.logs', path: '/app/logs', icon: LucideScrollText },
    ],
  },
  {
    labelKey: 'navGroup.settings',
    items: [
      { labelKey: 'nav.accountSettings', path: '/app/account-settings', icon: LucideSettings },
      { labelKey: 'nav.globalSettings', path: '/app/global-settings', icon: LucideSettings },
      { labelKey: 'nav.permissions', path: '/app/permissions', icon: LucideShieldCheck },
    ],
  },
];

const CONTRACTOR_NAV: NavGroup[] = [
  {
    labelKey: 'navGroup.overview',
    items: [
      {
        labelKey: 'nav.contractorDashboard',
        path: '/app/contractor-dashboard',
        icon: LucideLayoutDashboard,
      },
    ],
  },
  {
    labelKey: 'navGroup.operations',
    items: [
      { labelKey: 'nav.workRequests', path: '/app/work-requests', icon: LucideFileText },
      { labelKey: 'nav.dispatch', path: '/app/dispatch', icon: LucideLayoutGrid },
      { labelKey: 'nav.workOrders', path: '/app/work-orders', icon: LucideClipboardList },
      { labelKey: 'nav.estimates', path: '/app/estimates', icon: LucideCalculator },
    ],
  },
  {
    labelKey: 'navGroup.resources',
    items: [
      { labelKey: 'nav.staff', path: '/app/staff', icon: LucideUsers },
      { labelKey: 'nav.inventory', path: '/app/inventory', icon: LucidePackage },
      { labelKey: 'nav.equipment', path: '/app/equipment', icon: LucideWrench },
    ],
  },
  {
    labelKey: 'navGroup.finance',
    items: [
      { labelKey: 'nav.statements', path: '/app/statements', icon: LucideReceipt },
      { labelKey: 'nav.pricebook', path: '/app/pricebook', icon: LucideTags },
      { labelKey: 'nav.subscriptions', path: '/app/subscriptions', icon: LucideScrollText },
    ],
  },
];

const STAFF_NAV: NavGroup[] = [
  {
    items: [
      { labelKey: 'nav.staffDashboard', path: '/app/staff-dashboard', icon: LucideLayoutDashboard },
      { labelKey: 'nav.workOrders', path: '/app/work-orders', icon: LucideClipboardList },
      { labelKey: 'nav.inspections', path: '/app/inspections', icon: LucideClipboardCheck },
      { labelKey: 'nav.equipment', path: '/app/equipment', icon: LucideWrench },
    ],
  },
];

const SUPPLIER_NAV: NavGroup[] = [
  {
    items: [
      {
        labelKey: 'nav.supplierDashboard',
        path: '/app/supplier-dashboard',
        icon: LucideLayoutDashboard,
      },
      { labelKey: 'nav.purchaseOrders', path: '/app/purchase-orders', icon: LucideClipboardList },
      { labelKey: 'nav.shipments', path: '/app/shipments', icon: LucideTruck },
    ],
  },
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

  protected readonly navGroups = computed<NavGroup[]>(() => {
    switch (this.session.role()) {
      case 'donor':
        return DONOR_NAV;
      case 'team':
        return TEAM_NAV;
      case 'admin':
        return ADMIN_NAV;
      case 'contractor':
        return CONTRACTOR_NAV;
      case 'staff':
        return STAFF_NAV;
      case 'supplier':
        return SUPPLIER_NAV;
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
