import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Project } from '@core/models';
import { ProjectsApi } from '@core/api/projects-api.service';
import { SupportApi } from '@core/api/support-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';

/**
 * Raise a support ticket. Linking it to a project is optional — a question can
 * be about the platform rather than a particular rebuild — so the project
 * select is not required and failing to load projects must not block the form.
 */
@Component({
  selector: 'app-support-new',
  imports: [ReactiveFormsModule, TranslatePipe, PageHeader],
  templateUrl: './support-new.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportNew {
  private readonly api = inject(SupportApi);
  private readonly projectsApi = inject(ProjectsApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  private readonly projectsResource = rxResource({
    stream: () => this.projectsApi.getMyProjects({ pageNo: 1, pageSize: 50 }),
  });

  protected readonly projects = computed<Project[]>(() => this.projectsResource.value()?.items ?? []);
  protected readonly projectsFailed = computed(() => this.projectsResource.error() !== undefined);

  protected readonly form = this.fb.nonNullable.group({
    projectId: [''],
    subject: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.minLength(15)]],
  });

  protected submit(): void {
    if (this.saving()) {
      return;
    }
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();
    const project = this.projects().find((p) => p.id === raw.projectId);

    this.saving.set(true);
    this.api
      .createTicket({
        projectId: raw.projectId || undefined,
        projectTitle: project?.title,
        subject: raw.subject.trim(),
        description: raw.description.trim(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ticket) => {
          this.saving.set(false);
          this.toast.success('support.form.success');
          void this.router.navigate(['/app/support', ticket.id]);
        },
        error: () => {
          this.saving.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }
}
