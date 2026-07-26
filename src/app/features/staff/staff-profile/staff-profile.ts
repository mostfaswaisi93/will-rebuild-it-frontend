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
import { STAFF_STATUSES, StaffMember, StaffStatus } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { StaffApi } from '@core/api/staff-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/** Staff member profile with recent timecard — port of `staff/staffprofile` + `staff-timecard`. */
@Component({
  selector: 'app-staff-profile',
  imports: [RouterLink, TranslatePipe, PageHeader, StatusPill],
  templateUrl: './staff-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffProfile {
  readonly id = input.required<string>();

  private readonly api = inject(StaffApi);
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
  protected readonly member = computed<StaffMember | null>(() => this.resource.value() ?? null);
  protected readonly updating = signal(false);

  protected readonly totalHours = computed(() =>
    (this.member()?.timecard ?? []).reduce((sum, entry) => sum + entry.hours, 0),
  );

  /** The firm manages its own crew; the operator can too. Mirrors the route guard. */
  protected readonly canManage = computed(() => {
    const role = this.session.role();
    return role === 'admin' || role === 'contractor';
  });

  /** The states this member is not already in. */
  protected readonly statusOptions = computed<StaffStatus[]>(() => {
    const current = this.member()?.status;
    return current ? STAFF_STATUSES.filter((option) => option !== current) : [];
  });

  protected setStatus(status: StaffStatus): void {
    const member = this.member();
    if (!member || this.updating()) {
      return;
    }
    this.updating.set(true);
    this.api
      .getById(member.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.updating.set(false);
          this.resource.set(updated);
          this.toast.success('staff.profile.statusUpdated');
        },
        error: () => {
          this.updating.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected number(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), { maximumFractionDigits: 1 }).format(value);
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
