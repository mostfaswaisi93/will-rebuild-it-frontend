import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Complaint } from '@core/models';
import { ComplaintsApi } from '@core/api/complaints-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/** The five reason flags, so the view can list only the ticked ones. */
const REASON_KEYS = [
  'delay',
  'poorQuality',
  'specificationMismatch',
  'misconduct',
  'otherReason',
] as const;

/**
 * One complaint in full — port of the legacy `report-a-pro-view`. The
 * beneficiary sees what they filed and any reply; an operator additionally gets
 * the reply box, and answering closes the complaint.
 */
@Component({
  selector: 'app-complaint-detail',
  imports: [RouterLink, ReactiveFormsModule, TranslatePipe, PageHeader, StatusPill],
  templateUrl: './complaint-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplaintDetail {
  readonly id = input.required<string>();

  private readonly api = inject(ComplaintsApi);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getComplaintDetails(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly complaint = computed<Complaint | null>(() => this.resource.value() ?? null);
  protected readonly saving = signal(false);

  /** Only the reasons actually ticked, for a clean list. */
  protected readonly reasons = computed(() => {
    const complaint = this.complaint();
    if (!complaint) {
      return [];
    }
    return REASON_KEYS.filter((key) => complaint.reasons[key]);
  });

  protected readonly otherDetail = computed(() => this.complaint()?.reasons.otherReasonDetail ?? '');

  /** Operators answer complaints; the person who filed one does not. */
  protected readonly canRespond = computed(
    () => this.session.role() === 'admin' && this.complaint()?.status === 'open',
  );

  protected readonly form = this.fb.nonNullable.group({
    responseBody: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected respond(): void {
    const complaint = this.complaint();
    if (!complaint || this.saving()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.api
      .respond(complaint.id, this.form.getRawValue().responseBody.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.resource.set(updated);
          this.form.reset();
          this.toast.success('complaints.view.responded');
        },
        error: () => {
          this.saving.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
