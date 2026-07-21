import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Equipment } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { EquipmentApi } from '@core/api/equipment-api.service';
import { PageHeader } from '@shared/ui/page-header/page-header';

/** How many days the timeline spans, starting today. */
const WINDOW_DAYS = 21;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface ScheduleBar {
  id: string;
  projectTitle: string;
  /** Percent offset and width within the track. */
  leftPercent: number;
  widthPercent: number;
  tooltip: string;
}

interface ScheduleRow {
  equipment: Equipment;
  bars: ScheduleBar[];
}

interface DayColumn {
  date: Date;
  isWeekStart: boolean;
}

/**
 * Equipment booking timeline — the reconstruction of the legacy Syncfusion
 * `alp-equipment-schedular`. That component was ~570 lines wrapping a
 * drag-to-create calendar. The operator's actual need is narrower: see, at a
 * glance, which machines are committed when, so a new booking doesn't clash.
 * So this is a read-only Gantt strip — one row per machine, booking bars laid
 * over a rolling three-week window — and booking itself is done from the
 * equipment detail (which validates clashes server-side).
 */
@Component({
  selector: 'app-equipment-schedule',
  imports: [TranslatePipe, PageHeader],
  templateUrl: './equipment-schedule.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentSchedule {
  private readonly api = inject(EquipmentApi);
  private readonly translation = inject(TranslationService);

  private readonly resource = rxResource({ stream: () => this.api.schedule() });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly skeletons = [0, 1, 2, 3];

  /** Midnight today, the timeline's origin. */
  private readonly windowStart = computed(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  });

  protected readonly days = computed<DayColumn[]>(() => {
    const start = this.windowStart();
    return Array.from({ length: WINDOW_DAYS }, (_, index) => {
      const date = new Date(start + index * MS_PER_DAY);
      return { date, isWeekStart: date.getDay() === 6 /* Saturday starts the week */ };
    });
  });

  protected readonly rows = computed<ScheduleRow[]>(() => {
    const equipment = this.resource.value() ?? [];
    const start = this.windowStart();
    const windowEnd = start + WINDOW_DAYS * MS_PER_DAY;

    return equipment.map((machine) => {
      const bars = machine.bookings
        .map((booking) => {
          const from = new Date(booking.from).getTime();
          // A booking is inclusive of its end day, so extend by one day for width.
          const to = new Date(booking.to).getTime() + MS_PER_DAY;
          if (to <= start || from >= windowEnd) {
            return null; // Entirely outside the window.
          }
          const clampedFrom = Math.max(from, start);
          const clampedTo = Math.min(to, windowEnd);
          const leftPercent = ((clampedFrom - start) / (windowEnd - start)) * 100;
          const widthPercent = ((clampedTo - clampedFrom) / (windowEnd - start)) * 100;
          return {
            id: booking.id,
            projectTitle: booking.projectTitle,
            leftPercent,
            widthPercent,
            tooltip: `${booking.projectTitle} · ${this.short(booking.from)} → ${this.short(booking.to)}`,
          };
        })
        .filter((bar): bar is ScheduleBar => bar !== null);
      return { equipment: machine, bars };
    });
  });

  protected dayLabel(date: Date): string {
    return new Intl.DateTimeFormat(this.translation.locale(), { day: 'numeric' }).format(date);
  }

  protected weekdayLabel(date: Date): string {
    return new Intl.DateTimeFormat(this.translation.locale(), { weekday: 'narrow' }).format(date);
  }

  private short(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
