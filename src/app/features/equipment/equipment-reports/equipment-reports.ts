import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_PROBLEM_SEVERITIES,
  EQUIPMENT_STATUSES,
  Equipment,
  EquipmentCategory,
  EquipmentProblemSeverity,
  EquipmentStatus,
} from '@core/models';
import { EquipmentApi } from '@core/api/equipment-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatCard } from '@shared/ui/stat-card/stat-card';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

interface Tally<T> {
  key: T;
  count: number;
  /** Share of the fleet, 0–1, for the bar width. */
  share: number;
}

/**
 * Fleet reports — port of the legacy `equipment-reports`. Everything here is
 * derived from the equipment list the app already serves (status, category,
 * bookings and open problems are all on the record), so this needs no
 * reporting endpoint of its own.
 */
@Component({
  selector: 'app-equipment-reports',
  imports: [TranslatePipe, PageHeader, StatCard, StatusPill],
  templateUrl: './equipment-reports.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentReports {
  private readonly api = inject(EquipmentApi);
  private readonly translation = inject(TranslationService);

  private readonly page = rxResource({
    stream: () => this.api.list({ pageNo: 1, pageSize: 200 }),
  });

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);

  private readonly fleet = computed<Equipment[]>(() => this.page.value()?.items ?? []);
  protected readonly total = computed(() => this.fleet().length);

  /** Machines committed to at least one booking. */
  protected readonly bookedCount = computed(
    () => this.fleet().filter((e) => e.bookings.length > 0).length,
  );

  protected readonly openProblemCount = computed(() =>
    this.fleet().reduce((sum, e) => sum + e.problems.filter((p) => !p.resolvedAt).length, 0),
  );

  /** Share of the fleet that is available or already working, i.e. not out of action. */
  protected readonly serviceableRate = computed(() => {
    const total = this.total();
    if (total === 0) {
      return 0;
    }
    const down = this.fleet().filter(
      (e) => e.status === 'maintenance' || e.status === 'outOfService',
    ).length;
    return (total - down) / total;
  });

  protected readonly byStatus = computed<Tally<EquipmentStatus>[]>(() =>
    this.tally(EQUIPMENT_STATUSES, (e) => e.status),
  );

  protected readonly byCategory = computed<Tally<EquipmentCategory>[]>(() =>
    this.tally(EQUIPMENT_CATEGORIES, (e) => e.category).filter((row) => row.count > 0),
  );

  protected readonly bySeverity = computed<Tally<EquipmentProblemSeverity>[]>(() => {
    const open = this.fleet().flatMap((e) => e.problems.filter((p) => !p.resolvedAt));
    const total = open.length || 1;
    return EQUIPMENT_PROBLEM_SEVERITIES.map((key) => {
      const count = open.filter((p) => p.severity === key).length;
      return { key, count, share: count / total };
    }).filter((row) => row.count > 0);
  });

  private tally<T extends string>(keys: readonly T[], pick: (e: Equipment) => T): Tally<T>[] {
    const fleet = this.fleet();
    const total = fleet.length || 1;
    return keys.map((key) => {
      const count = fleet.filter((e) => pick(e) === key).length;
      return { key, count, share: count / total };
    });
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  protected percent(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'percent',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
