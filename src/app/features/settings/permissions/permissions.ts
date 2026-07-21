import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BACK_OFFICE_ROLES, BackOfficeRole } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { PageHeader } from '@shared/ui/page-header/page-header';

interface Capability {
  labelKey: string;
  /** Roles allowed — kept in step with the `roleGuard` arrays in app.routes.ts. */
  roles: readonly BackOfficeRole[];
}

/**
 * Access-model reference — a read-only matrix of back-office capabilities
 * against the roles that can reach them, port of the legacy permission screens.
 * The legacy portal let an admin edit a permission bitmask per role; this
 * portal's access is enforced by route `roleGuard`s in code, so this page is
 * the human-readable mirror of that, not an editor. The `roles` here must be
 * kept in step with the guards in `app.routes.ts`.
 */
@Component({
  selector: 'app-permissions',
  imports: [TranslatePipe, PageHeader],
  templateUrl: './permissions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Permissions {
  protected readonly roles = BACK_OFFICE_ROLES;

  protected readonly capabilities: Capability[] = [
    { labelKey: 'nav.workRequests', roles: ['admin', 'contractor'] },
    { labelKey: 'workRequests.new.action', roles: ['admin'] },
    { labelKey: 'nav.estimates', roles: ['admin', 'contractor'] },
    { labelKey: 'nav.workOrders', roles: ['admin', 'contractor', 'staff'] },
    { labelKey: 'nav.inspections', roles: ['admin', 'contractor', 'staff'] },
    { labelKey: 'nav.statements', roles: ['admin', 'contractor'] },
    { labelKey: 'nav.disbursements', roles: ['admin'] },
    { labelKey: 'nav.pricebook', roles: ['admin'] },
    { labelKey: 'nav.beneficiaries', roles: ['admin', 'staff'] },
    { labelKey: 'nav.contractors', roles: ['admin', 'staff'] },
    { labelKey: 'nav.suppliers', roles: ['admin'] },
    { labelKey: 'nav.inventory', roles: ['admin', 'contractor', 'staff'] },
    { labelKey: 'nav.purchaseOrders', roles: ['admin', 'contractor', 'supplier'] },
    { labelKey: 'nav.equipment', roles: ['admin', 'contractor', 'staff'] },
    { labelKey: 'nav.accountSettings', roles: ['admin'] },
    { labelKey: 'nav.permissions', roles: ['admin'] },
  ];

  protected allowed(capability: Capability, role: BackOfficeRole): boolean {
    return capability.roles.includes(role);
  }
}
