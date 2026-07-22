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
import { LucideStar } from '@lucide/angular';
import { Team, TeamReview } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { TeamsApi } from '@core/api/teams-api.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';

@Component({
  selector: 'app-team-detail',
  imports: [LucideStar, TranslatePipe, PageHeader],
  templateUrl: './team-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamDetail {
  readonly id = input.required<string>();

  private readonly api = inject(TeamsApi);
  private readonly translation = inject(TranslationService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getTeamProfile(params.id),
  });

  private readonly reviewsResource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getTeamReviews(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly team = computed<Team | null>(() => this.resource.value() ?? null);
  protected readonly reviews = computed<TeamReview[]>(() => this.reviewsResource.value() ?? []);

  protected readonly following = signal<boolean | null>(null);
  protected readonly working = signal(false);

  /** The follow state shown: the optimistic override if set, else the server value. */
  protected readonly isFollowing = computed(
    () => this.following() ?? this.team()?.isFollowedByCurrentUser ?? false,
  );

  protected toggleFollow(): void {
    const team = this.team();
    if (!team || this.working()) {
      return;
    }
    this.working.set(true);
    this.api
      .toggleFollow(team.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (state) => {
          this.working.set(false);
          this.following.set(state);
          this.toast.success(state ? 'teams.list.followSuccess' : 'teams.list.unfollowSuccess');
        },
        error: () => {
          this.working.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected t(key: string): string {
    return this.translation.translate(key);
  }

  protected rating(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  }

  protected reviewAverage(review: TeamReview): string {
    const avg = (review.workQuality + review.timeliness + review.professionalism) / 3;
    return this.rating(avg);
  }
}
