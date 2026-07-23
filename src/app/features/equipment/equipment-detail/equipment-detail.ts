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
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  EQUIPMENT_PROBLEM_SEVERITIES,
  Equipment,
  EquipmentProblem,
  EquipmentProblemSeverity,
} from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { EquipmentApi } from '@core/api/equipment-api.service';
import { RouterLink } from '@angular/router';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

type Panel = 'none' | 'book' | 'problem';

@Component({
  selector: 'app-equipment-detail',
  imports: [RouterLink, ReactiveFormsModule, TranslatePipe, PageHeader, StatusPill],
  templateUrl: './equipment-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentDetail {
  readonly id = input.required<string>();

  private readonly api = inject(EquipmentApi);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly severities = EQUIPMENT_PROBLEM_SEVERITIES;

  /** Staff can work a machine but not edit its record — mirrors the route guard. */
  protected readonly canManage = computed(() => {
    const role = this.session.role();
    return role === 'admin' || role === 'contractor';
  });

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getById(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly equipment = computed<Equipment | null>(() => this.resource.value() ?? null);

  protected readonly openProblems = computed(() =>
    (this.equipment()?.problems ?? []).filter((problem) => !problem.resolvedAt),
  );
  protected readonly resolvedProblems = computed(() =>
    (this.equipment()?.problems ?? []).filter((problem) => problem.resolvedAt),
  );

  protected readonly bookable = computed(() => {
    const status = this.equipment()?.status;
    return status !== 'maintenance' && status !== 'outOfService';
  });

  protected readonly panel = signal<Panel>('none');
  protected readonly submitting = signal(false);

  protected readonly bookForm = new FormGroup({
    from: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    to: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    projectTitle: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly problemForm = new FormGroup({
    severity: new FormControl<EquipmentProblemSeverity>('minor', { nonNullable: true }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)],
    }),
  });

  private readonly actorName = computed(() => {
    const user = this.session.user();
    return user ? `${user.firstName} ${user.lastName}` : 'Operator';
  });

  protected openBook(): void {
    this.panel.set('book');
  }

  protected openProblem(): void {
    this.panel.set('problem');
  }

  protected closePanel(): void {
    this.panel.set('none');
    this.bookForm.reset();
    this.problemForm.reset({ severity: 'minor', description: '' });
  }

  protected submitBooking(): void {
    const equipment = this.equipment();
    if (!equipment || this.submitting()) {
      return;
    }
    if (this.bookForm.invalid) {
      this.bookForm.markAllAsTouched();
      return;
    }
    const value = this.bookForm.getRawValue();
    if (value.from > value.to) {
      this.toast.danger('equipment.detail.bookDatesInvalid');
      return;
    }

    this.submitting.set(true);
    this.api
      .book(equipment.id, {
        from: new Date(value.from).toISOString(),
        to: new Date(value.to).toISOString(),
        projectTitle: value.projectTitle.trim(),
        bookedBy: this.actorName(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.submitting.set(false);
          this.resource.set(updated);
          this.closePanel();
          this.toast.success('equipment.detail.booked');
        },
        error: () => {
          this.submitting.set(false);
          // The commonest failure is a clash — surface it specifically.
          this.toast.danger('equipment.detail.bookClash');
        },
      });
  }

  protected submitProblem(): void {
    const equipment = this.equipment();
    if (!equipment || this.submitting()) {
      return;
    }
    if (this.problemForm.invalid) {
      this.problemForm.markAllAsTouched();
      return;
    }
    const value = this.problemForm.getRawValue();

    this.submitting.set(true);
    this.api
      .reportProblem(equipment.id, {
        severity: value.severity,
        description: value.description.trim(),
        reportedBy: this.actorName(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.submitting.set(false);
          this.resource.set(updated);
          this.closePanel();
          this.toast.success('equipment.detail.problemReported');
        },
        error: () => {
          this.submitting.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected resolveProblem(problem: EquipmentProblem): void {
    const equipment = this.equipment();
    if (!equipment) {
      return;
    }
    this.api
      .resolveProblem(equipment.id, problem.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.resource.set(updated);
          this.toast.success('equipment.detail.problemResolved');
        },
        error: () => this.toast.danger('common.errorGeneric'),
      });
  }

  protected t(key: string): string {
    return this.translation.translate(key);
  }

  protected money(amount: number, currency: string): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
