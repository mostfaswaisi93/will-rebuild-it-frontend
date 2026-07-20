import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideCheck } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { PROJECT_PHASE_KEYS, ProjectPhase } from '@core/models';

/**
 * Visualizes the seven reconstruction phases of a project, from damage
 * assessment through handover. This is the single most visually important
 * component in the app: for a beneficiary family, this stepper is the
 * concrete, legible proof that their home is actually being rebuilt.
 *
 * Read-only display component (not a form control). Renders vertically,
 * stacked top-to-bottom with a start-side connecting line, from mobile up
 * through `lg:`; at `lg:` and above it switches to a horizontal left-to-right
 * (or right-to-left under `dir="rtl"`, automatically, via plain flexbox)
 * stepper.
 */
@Component({
  selector: 'app-phase-stepper',
  imports: [TranslatePipe, LucideCheck],
  templateUrl: './phase-stepper.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhaseStepper {
  /** Exactly 7 phases, one per `PROJECT_PHASE_KEYS` entry (any order/subset is tolerated). */
  readonly phases = input.required<ProjectPhase[]>();

  /** Phases reordered to match the canonical `PROJECT_PHASE_KEYS` sequence, dropping unknown/missing entries defensively. */
  protected readonly steps = computed<ProjectPhase[]>(() => {
    const byKey = new Map(this.phases().map((phase) => [phase.key, phase]));
    return PROJECT_PHASE_KEYS.map((key) => byKey.get(key)).filter(
      (phase): phase is ProjectPhase => phase !== undefined,
    );
  });

  /** Raw ISO substring date formatting only — no shared date pipe is available to this batch. */
  protected dateRange(phase: ProjectPhase): string | null {
    if (!phase.startedAt) {
      return null;
    }
    const start = phase.startedAt.slice(0, 10);
    if (phase.completedAt) {
      return `${start} – ${phase.completedAt.slice(0, 10)}`;
    }
    return start;
  }

  protected visiblePhotos(phase: ProjectPhase) {
    return phase.photos.slice(0, 3);
  }

  protected extraPhotoCount(phase: ProjectPhase): number {
    return Math.max(0, phase.photos.length - 3);
  }

  protected statusLabelKey(phase: ProjectPhase): string {
    switch (phase.status) {
      case 'completed':
        return 'shared.phaseStepper.statusCompleted';
      case 'inProgress':
        return 'shared.phaseStepper.statusInProgress';
      default:
        return 'shared.phaseStepper.statusPending';
    }
  }

  /** Responsible-team name and formatted date range, joined for a single muted meta line. */
  protected metaText(phase: ProjectPhase): string | null {
    const parts = [phase.responsibleName, this.dateRange(phase)].filter(
      (part): part is string => !!part && part.length > 0,
    );
    return parts.length > 0 ? parts.join(' · ') : null;
  }
}
