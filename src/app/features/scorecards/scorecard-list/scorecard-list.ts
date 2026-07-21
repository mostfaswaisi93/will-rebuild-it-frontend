import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideStar } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { ScorecardsApi } from '@core/api/scorecards-api.service';
import { ContractorScorecard } from '@core/api/dto/scorecard.dto';
import { PageHeader } from '@shared/ui/page-header/page-header';

/**
 * Contractor scorecards — port of the legacy `scorecardHome`. Ranks the teams
 * by a composite performance score, computed live from their ratings, work-order
 * throughput and statement-approval record.
 */
@Component({
  selector: 'app-scorecard-list',
  imports: [RouterLink, LucideStar, TranslatePipe, PageHeader],
  templateUrl: './scorecard-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScorecardList {
  private readonly api = inject(ScorecardsApi);
  private readonly translation = inject(TranslationService);

  private readonly resource = rxResource({ stream: () => this.api.list() });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly cards = computed<ContractorScorecard[]>(() => this.resource.value() ?? []);
  protected readonly skeletons = [0, 1, 2, 3];

  /** Score band drives the meter colour: strong / fair / weak. */
  protected scoreClass(score: number): string {
    if (score >= 75) {
      return 'bg-brand-500';
    }
    if (score >= 50) {
      return 'bg-sand-500';
    }
    return 'bg-danger';
  }

  protected rating(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  protected percent(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'percent',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
