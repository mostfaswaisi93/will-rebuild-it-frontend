import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideStar } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { AuthoredReview, ReviewsApi } from '@core/api/reviews-api.service';
import { PageHeader } from '@shared/ui/page-header/page-header';

/** Reviews the signed-in beneficiary has written — port of the legacy
 * "my reviews" list. Reads `ReviewsApi.getMyReviews`. */
@Component({
  selector: 'app-review-list',
  imports: [LucideStar, TranslatePipe, PageHeader],
  templateUrl: './review-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewList {
  private readonly api = inject(ReviewsApi);
  private readonly translation = inject(TranslationService);

  private readonly resource = rxResource({
    stream: () => this.api.getMyReviews(),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly reviews = computed<AuthoredReview[]>(() => this.resource.value() ?? []);
  protected readonly skeletons = [0, 1, 2];

  protected average(review: AuthoredReview): string {
    const avg = (review.workQuality + review.timeliness + review.professionalism) / 3;
    return new Intl.NumberFormat(this.translation.locale(), {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(avg);
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
