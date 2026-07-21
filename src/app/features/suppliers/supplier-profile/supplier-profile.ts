import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Supplier, SupplierStatus } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { SuppliersApi } from '@core/api/suppliers-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/**
 * Supplier profile — port of the legacy `vendor/vendorprofile`. The operator's
 * view of a materials supplier, with the approval decision (approve / suspend).
 */
@Component({
  selector: 'app-supplier-profile',
  imports: [TranslatePipe, PageHeader, StatusPill],
  templateUrl: './supplier-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierProfile {
  readonly id = input.required<string>();

  private readonly api = inject(SuppliersApi);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getById(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly supplier = computed<Supplier | null>(() => this.resource.value() ?? null);
  protected readonly updating = signal(false);

  protected readonly isAdmin = computed(() => this.session.role() === 'admin');
  protected readonly canApprove = computed(() => this.isAdmin() && this.supplier()?.status !== 'approved');
  protected readonly canSuspend = computed(() => this.isAdmin() && this.supplier()?.status === 'approved');

  protected setStatus(status: SupplierStatus): void {
    const supplier = this.supplier();
    if (!supplier || this.updating()) {
      return;
    }
    this.updating.set(true);
    this.api
      .setStatus(supplier.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.updating.set(false);
          this.resource.set(updated);
          this.toast.success(
            status === 'approved' ? 'suppliers.detail.approved' : 'suppliers.detail.suspended',
          );
        },
        error: () => {
          this.updating.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected t(key: string): string {
    return this.translation.translate(key);
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
