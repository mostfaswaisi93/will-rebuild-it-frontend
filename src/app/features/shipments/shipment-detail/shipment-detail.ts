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
import { RouterLink } from '@angular/router';
import { SHIPMENT_STATUSES, Shipment, ShipmentStatus } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { ShipmentsApi } from '@core/api/shipments-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/**
 * Convoy order. `rejected` is reachable from any clearance stage — a crossing
 * can turn a load back — so it is offered alongside the forward move rather
 * than as a successor of one state.
 */
const NEXT_STATUS: Partial<Record<ShipmentStatus, ShipmentStatus>> = {
  planned: 'awaitingClearance',
  awaitingClearance: 'atCrossing',
  atCrossing: 'inTransit',
  inTransit: 'delivered',
};

/** Stages a load can still be turned back at; once moving inland it cannot. */
const REJECTABLE: readonly ShipmentStatus[] = ['awaitingClearance', 'atCrossing'];

/**
 * One shipment's clearance and delivery record — port of the legacy
 * `inventory/truckOrderDetails`. The list carries the register; this page
 * carries the timeline a delayed convoy is actually chased on, and is where the
 * crossing decision (advance, or turn back) is recorded.
 */
@Component({
  selector: 'app-shipment-detail',
  imports: [RouterLink, TranslatePipe, PageHeader, StatusPill],
  templateUrl: './shipment-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipmentDetail {
  readonly id = input.required<string>();

  private readonly api = inject(ShipmentsApi);
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
  protected readonly shipment = computed<Shipment | null>(() => this.resource.value() ?? null);
  protected readonly updating = signal(false);

  /** Only an operator moves a convoy along; a supplier watches its own loads. */
  protected readonly canDecide = computed(() => this.session.role() === 'admin');

  protected readonly nextStatus = computed<ShipmentStatus | undefined>(() => {
    const status = this.shipment()?.status;
    return status ? NEXT_STATUS[status] : undefined;
  });

  protected readonly canReject = computed(() => {
    const status = this.shipment()?.status;
    return !!status && REJECTABLE.includes(status);
  });

  /**
   * The convoy stages in order, each marked done/current/pending, so the
   * timeline reads as progress rather than as a bare status word. `rejected` is
   * terminal and off the forward path, so it collapses the trail.
   */
  protected readonly trail = computed(() => {
    const shipment = this.shipment();
    if (!shipment) {
      return [];
    }
    const stages = SHIPMENT_STATUSES.filter((s) => s !== 'rejected');
    if (shipment.status === 'rejected') {
      return [{ status: 'rejected' as ShipmentStatus, state: 'current' as const }];
    }
    const reached = stages.indexOf(shipment.status);
    return stages.map((status, i) => ({
      status,
      state: i < reached ? ('done' as const) : i === reached ? ('current' as const) : ('pending' as const),
    }));
  });

  /** Late only while still in motion — a delivered load is never overdue. */
  protected readonly overdue = computed(() => {
    const shipment = this.shipment();
    if (!shipment?.expectedArrival) {
      return false;
    }
    if (shipment.status === 'delivered' || shipment.status === 'rejected') {
      return false;
    }
    return new Date(shipment.expectedArrival).getTime() < Date.now();
  });

  protected advance(): void {
    const target = this.nextStatus();
    if (target) {
      this.move(target, 'shipments.advanced');
    }
  }

  protected reject(): void {
    this.move('rejected', 'shipments.detail.rejected');
  }

  private move(target: ShipmentStatus, successKey: string): void {
    const shipment = this.shipment();
    if (!shipment || this.updating()) {
      return;
    }
    this.updating.set(true);
    this.api
      .advance(shipment.id, target)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.updating.set(false);
          this.resource.set(updated);
          this.toast.success(successKey);
        },
        error: () => {
          this.updating.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  }

  protected formatDateTime(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  }
}
