import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EQUIPMENT_CATEGORIES, EquipmentCategory } from '@core/models';
import { EquipmentApi } from '@core/api/equipment-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';

/**
 * Register or edit a machine — ports the legacy `add-equipment` and
 * `edit-equipment` screens, which were near-identical forms. One component
 * serves both: with an `:id` it loads and updates, without it creates.
 * Bookings, problems and status are deliberately not editable here — each has
 * its own guarded action on the detail page.
 */
@Component({
  selector: 'app-equipment-form',
  imports: [ReactiveFormsModule, TranslatePipe, PageHeader],
  templateUrl: './equipment-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentForm {
  /** Absent when registering a new machine. */
  readonly id = input<string>();

  private readonly api = inject(EquipmentApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categories = EQUIPMENT_CATEGORIES;
  protected readonly saving = signal(false);
  protected readonly isEdit = computed(() => !!this.id());

  // Returning `undefined` from `params` leaves the resource idle, so no request
  // is made when registering a new machine.
  private readonly existing = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.api.getById(params),
  });

  protected readonly loading = computed(() => this.isEdit() && this.existing.isLoading());
  protected readonly failed = computed(() => this.existing.error() !== undefined);

  protected readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    category: ['excavator' as EquipmentCategory, Validators.required],
    location: [''],
    dailyRate: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    // Populate once the existing machine arrives (edit mode only).
    effect(() => {
      const machine = this.existing.value();
      if (machine) {
        this.form.patchValue({
          code: machine.code,
          name: machine.name,
          category: machine.category,
          location: machine.location,
          dailyRate: machine.dailyRate,
        });
      }
    });
  }

  protected submit(): void {
    if (this.saving()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const input = this.form.getRawValue();
    const id = this.id();
    const request$ = id ? this.api.update(id, input) : this.api.create(input);

    this.saving.set(true);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (machine) => {
        this.saving.set(false);
        this.toast.success(id ? 'equipment.form.updated' : 'equipment.form.created');
        void this.router.navigate(['/app/equipment', machine.id]);
      },
      error: () => {
        this.saving.set(false);
        this.toast.danger('equipment.form.saveFailed');
      },
    });
  }
}
