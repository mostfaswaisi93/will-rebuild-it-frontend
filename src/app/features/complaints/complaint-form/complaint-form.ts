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
import { ComplaintReasons, Project, Team } from '@core/models';
import { ComplaintsApi } from '@core/api/complaints-api.service';
import { ProjectsApi } from '@core/api/projects-api.service';
import { TeamsApi } from '@core/api/teams-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';

/** The five reason checkboxes, in the order the legacy form showed them. */
const REASON_KEYS = [
  'delay',
  'poorQuality',
  'specificationMismatch',
  'misconduct',
  'otherReason',
] as const;
type ReasonKey = (typeof REASON_KEYS)[number];

/** File a complaint against a reconstruction team — port of the legacy
 * "report a pro" form, reframed for the reconstruction domain. */
@Component({
  selector: 'app-complaint-form',
  imports: [ReactiveFormsModule, TranslatePipe, PageHeader],
  templateUrl: './complaint-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplaintForm {
  private readonly api = inject(ComplaintsApi);
  private readonly teamsApi = inject(TeamsApi);
  private readonly projectsApi = inject(ProjectsApi);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly reasonKeys = REASON_KEYS;
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  private readonly teamsResource = rxResource({
    stream: () => this.teamsApi.getTeams({ pageNo: 1, pageSize: 50 }),
  });
  private readonly projectsResource = rxResource({
    stream: () => this.projectsApi.getMyProjects({ pageNo: 1, pageSize: 50 }),
  });

  protected readonly teams = computed<Team[]>(() => this.teamsResource.value()?.items ?? []);
  protected readonly projects = computed<Project[]>(() => this.projectsResource.value()?.items ?? []);
  protected readonly loadFailed = computed(() => this.teamsResource.error() !== undefined);

  protected readonly form = this.fb.nonNullable.group({
    teamId: ['', Validators.required],
    projectId: [''],
    delay: [false],
    poorQuality: [false],
    specificationMismatch: [false],
    misconduct: [false],
    otherReason: [false],
    otherReasonDetail: [''],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  /** At least one reason must be ticked — checkbox groups have no built-in validator. */
  protected readonly noReasonPicked = computed(() => {
    this.formVersion();
    return !REASON_KEYS.some((key) => this.form.controls[key].value);
  });

  /** Bumped on every value change so the computed signals above re-evaluate. */
  private readonly formVersion = signal(0);

  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formVersion.update((v) => v + 1));
  }

  protected readonly otherDetailMissing = computed(() => {
    this.formVersion();
    return this.form.controls.otherReason.value && !this.form.controls.otherReasonDetail.value.trim();
  });

  protected submit(): void {
    if (this.saving()) {
      return;
    }
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.noReasonPicked() || this.otherDetailMissing()) {
      return;
    }

    const raw = this.form.getRawValue();
    const team = this.teams().find((t) => t.id === raw.teamId);
    const reasons: ComplaintReasons = {
      delay: raw.delay,
      poorQuality: raw.poorQuality,
      specificationMismatch: raw.specificationMismatch,
      misconduct: raw.misconduct,
      otherReason: raw.otherReason,
      otherReasonDetail: raw.otherReason ? raw.otherReasonDetail.trim() : undefined,
    };

    this.saving.set(true);
    this.api
      .createComplaint({
        teamId: raw.teamId,
        teamName: team?.name ?? '',
        projectId: raw.projectId || undefined,
        description: raw.description.trim(),
        reasons,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('complaints.thanks.body');
          void this.router.navigate(['/app/complaints']);
        },
        error: () => {
          this.saving.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected reasonControl(key: ReasonKey) {
    return this.form.controls[key];
  }
}
