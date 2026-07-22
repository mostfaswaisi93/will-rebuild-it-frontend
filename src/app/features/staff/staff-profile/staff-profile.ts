import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { StaffMember } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { StaffApi } from '@core/api/staff-api.service';
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
  private readonly translation = inject(TranslationService);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getById(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly member = computed<StaffMember | null>(() => this.resource.value() ?? null);

  protected readonly totalHours = computed(() =>
    (this.member()?.timecard ?? []).reduce((sum, entry) => sum + entry.hours, 0),
  );

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
