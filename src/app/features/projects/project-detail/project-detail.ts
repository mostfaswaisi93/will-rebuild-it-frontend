import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Project } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { ProjectsApi } from '@core/api/projects-api.service';
import { TeamsApi } from '@core/api/teams-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { PhaseStepper } from '@shared/ui/phase-stepper/phase-stepper';
import { RatingStars } from '@shared/ui/rating-stars/rating-stars';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/** Beneficiary-facing project detail — the phase stepper is the emotional core:
 * concrete proof a home is being rebuilt. Reuses the shared `PhaseStepper`. */
@Component({
  selector: 'app-project-detail',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    TranslatePipe,
    PageHeader,
    PhaseStepper,
    RatingStars,
    StatusPill,
  ],
  templateUrl: './project-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetail {
  readonly id = input.required<string>();

  private readonly api = inject(ProjectsApi);
  private readonly teamsApi = inject(TeamsApi);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getProjectDetails(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly project = computed<Project | null>(() => this.resource.value() ?? null);

  /** Timeline newest-first. */
  protected readonly timeline = computed(() =>
    [...(this.project()?.timeline ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

  // --- Rate the team --------------------------------------------------------

  /**
   * A team is rated on finished work, so the card only appears once the project
   * is completed or delivered — and only for the beneficiary whose home it is.
   */
  protected readonly canReview = computed(() => {
    const status = this.project()?.status;
    return (
      this.session.role() === 'beneficiary' && (status === 'completed' || status === 'delivered')
    );
  });

  protected readonly reviewOpen = signal(false);
  protected readonly reviewSent = signal(false);
  protected readonly submittingReview = signal(false);

  protected readonly workQuality = signal(0);
  protected readonly timeliness = signal(0);
  protected readonly professionalism = signal(0);
  protected readonly comments = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(10)],
  });

  /** Every criterion must be scored — a partial rating skews the team average. */
  protected readonly reviewComplete = computed(
    () => this.workQuality() > 0 && this.timeliness() > 0 && this.professionalism() > 0,
  );

  protected openReview(): void {
    this.reviewOpen.set(true);
  }

  protected submitReview(): void {
    const project = this.project();
    if (!project || this.submittingReview()) {
      return;
    }
    this.comments.markAsTouched();
    if (!this.reviewComplete() || this.comments.invalid) {
      return;
    }

    const user = this.session.user();
    this.submittingReview.set(true);
    this.teamsApi
      .submitTeamReview(project.teamId, {
        projectId: project.id,
        authorName: user ? `${user.firstName} ${user.lastName}` : '',
        workQuality: this.workQuality(),
        timeliness: this.timeliness(),
        professionalism: this.professionalism(),
        comments: this.comments.value.trim(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submittingReview.set(false);
          this.reviewSent.set(true);
          this.reviewOpen.set(false);
          this.toast.success('projects.teamReview.thanksMessage');
        },
        error: () => {
          this.submittingReview.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected t(key: string): string {
    return this.translation.translate(key);
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
