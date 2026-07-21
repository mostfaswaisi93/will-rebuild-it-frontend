import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { ScorecardsApi } from '@core/api/scorecards-api.service';
import { ContractorScorecard } from '@core/api/dto/scorecard.dto';
import { PageHeader } from '@shared/ui/page-header/page-header';

interface Metric {
  labelKey: string;
  /** 0–1 for the meter. */
  ratio: number;
  display: string;
}

/**
 * A single contractor's scorecard — the breakdown behind the composite score,
 * so an operator can see *why* a team scores as it does before assigning work.
 */
@Component({
  selector: 'app-scorecard-detail',
  imports: [RouterLink, TranslatePipe, PageHeader],
  templateUrl: './scorecard-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScorecardDetail {
  readonly id = input.required<string>();

  private readonly api = inject(ScorecardsApi);
  private readonly translation = inject(TranslationService);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getByTeam(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly card = computed<ContractorScorecard | null>(() => this.resource.value() ?? null);

  protected readonly metrics = computed<Metric[]>(() => {
    const card = this.card();
    if (!card) {
      return [];
    }
    return [
      {
        labelKey: 'scorecards.rating',
        ratio: card.averageRating / 5,
        display: `${this.rating(card.averageRating)} / 5`,
      },
      {
        labelKey: 'scorecards.completion',
        ratio: card.completionRate,
        display: this.percent(card.completionRate),
      },
      {
        labelKey: 'scorecards.approval',
        ratio: card.approvalRate,
        display: this.percent(card.approvalRate),
      },
    ];
  });

  protected scoreClass(score: number): string {
    if (score >= 75) {
      return 'bg-brand-500';
    }
    if (score >= 50) {
      return 'bg-sand-500';
    }
    return 'bg-danger';
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
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
