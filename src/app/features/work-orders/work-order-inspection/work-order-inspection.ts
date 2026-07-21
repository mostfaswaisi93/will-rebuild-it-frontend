import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Inspection, InspectionItem, InspectionKind } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { WorkOrdersApi } from '@core/api/work-orders-api.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { SignaturePad } from '@shared/ui/signature-pad/signature-pad';

/** Local editable copy of a checklist line. */
interface EditableItem extends InspectionItem {
  prompt: string;
}

/**
 * Pre/post-work inspection checklist — ports the legacy
 * `new-preworkinspection` / `new-postworkinspection` into one kind-parameterised
 * form. The legacy pair were near-identical components differing only in their
 * question set; here the kind comes from the route and the questions from the
 * template the backend hands back.
 *
 * Read-only once the inspection is already completed — an inspection is a
 * point-in-time record, not a live document.
 */
@Component({
  selector: 'app-work-order-inspection',
  imports: [ReactiveFormsModule, TranslatePipe, PageHeader, SignaturePad],
  templateUrl: './work-order-inspection.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkOrderInspection {
  readonly id = input.required<string>();
  readonly kind = input.required<InspectionKind>();

  private readonly api = inject(WorkOrdersApi);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({
    params: () => ({ id: this.id(), kind: this.kind() }),
    stream: ({ params }) => this.api.startInspection(params.id, params.kind),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly inspection = computed<Inspection | null>(() => this.resource.value() ?? null);

  protected readonly readOnly = computed(() => !!this.inspection()?.completedAt);
  protected readonly items = signal<EditableItem[]>([]);

  protected readonly inspectorName = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  private capturedSignature = signal('');
  protected readonly submitting = signal(false);

  constructor() {
    // Seed the editable copy once the inspection loads. Written untracked so
    // editing the items doesn't loop back through this effect.
    effect(() => {
      const inspection = this.inspection();
      if (!inspection) {
        return;
      }
      untracked(() => {
        this.items.set(inspection.items.map((item) => ({ ...item })));
        this.inspectorName.setValue(inspection.inspectorName);
        if (inspection.completedAt) {
          this.inspectorName.disable();
        }
      });
    });
  }

  protected setResponse(itemId: string, response: string): void {
    this.items.update((items) =>
      items.map((item) => (item.id === itemId ? { ...item, response } : item)),
    );
  }

  protected onSignature(dataUrl: string): void {
    this.capturedSignature.set(dataUrl);
  }

  protected readonly canSubmit = computed(
    () =>
      !this.readOnly() &&
      this.inspectorName.valid &&
      this.capturedSignature().length > 0 &&
      // Every non-text line must be answered; free-text notes are optional.
      this.items().every((item) => item.kind === 'text' || item.response.trim().length > 0) &&
      !this.submitting(),
  );

  protected submit(): void {
    if (!this.canSubmit()) {
      this.inspectorName.markAsTouched();
      return;
    }

    this.submitting.set(true);
    this.api
      .submitInspection(this.id(), this.kind(), {
        items: this.items().map((item) => ({
          id: item.id,
          response: item.response,
          photoUrls: item.photoUrls,
        })),
        notes: this.items().find((item) => item.kind === 'text')?.response ?? '',
        inspectorName: this.inspectorName.value.trim(),
        signatureUrl: this.capturedSignature(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.toast.success('workOrders.inspection.submitted');
          void this.router.navigate(['/app/work-orders', this.id()]);
        },
        error: () => {
          this.submitting.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected t(key: string): string {
    return this.translation.translate(key);
  }
}
