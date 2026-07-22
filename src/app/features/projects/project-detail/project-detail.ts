import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Project } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { ProjectsApi } from '@core/api/projects-api.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { PhaseStepper } from '@shared/ui/phase-stepper/phase-stepper';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/** Beneficiary-facing project detail — the phase stepper is the emotional core:
 * concrete proof a home is being rebuilt. Reuses the shared `PhaseStepper`. */
@Component({
  selector: 'app-project-detail',
  imports: [TranslatePipe, PageHeader, PhaseStepper, StatusPill],
  templateUrl: './project-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetail {
  readonly id = input.required<string>();

  private readonly api = inject(ProjectsApi);
  private readonly translation = inject(TranslationService);

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
