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
import { RouterLink } from '@angular/router';
import { Beneficiary, ReconstructionRequest } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { BeneficiariesApi } from '@core/api/beneficiaries-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/** The vulnerability flags, in the order they should read. */
const FLAGS: { key: keyof Beneficiary; labelKey: string }[] = [
  { key: 'displaced', labelKey: 'beneficiaries.flags.displaced' },
  { key: 'femaleHeaded', labelKey: 'beneficiaries.flags.femaleHeaded' },
  { key: 'hasDisability', labelKey: 'beneficiaries.flags.hasDisability' },
  { key: 'elderlyPresent', labelKey: 'beneficiaries.flags.elderlyPresent' },
];

/**
 * Beneficiary case file — port of the legacy `customer-details`. Shows the
 * household, its prioritisation flags, and the reconstruction requests gathered
 * under it, with the operator's eligibility decision (verify / reject).
 */
@Component({
  selector: 'app-beneficiary-detail',
  imports: [RouterLink, TranslatePipe, PageHeader, StatusPill],
  templateUrl: './beneficiary-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BeneficiaryDetail {
  readonly id = input.required<string>();

  private readonly api = inject(BeneficiariesApi);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getById(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly beneficiary = computed<Beneficiary | null>(
    () => this.resource.value()?.beneficiary ?? null,
  );
  protected readonly requests = computed<ReconstructionRequest[]>(
    () => this.resource.value()?.requests ?? [],
  );
  protected readonly updating = signal(false);

  protected readonly isAdmin = computed(() => this.session.role() === 'admin');

  /** Only the flags that are set, as label keys — an unset flag is not shown. */
  protected readonly activeFlags = computed(() => {
    const b = this.beneficiary();
    if (!b) {
      return [];
    }
    return FLAGS.filter((flag) => b[flag.key] === true).map((flag) => flag.labelKey);
  });

  protected setStatus(status: 'verified' | 'rejected'): void {
    const beneficiary = this.beneficiary();
    if (!beneficiary || this.updating()) {
      return;
    }
    this.updating.set(true);
    this.api
      .setStatus(beneficiary.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.updating.set(false);
          // Preserve the requests already loaded; only the case status changed.
          this.resource.set({ beneficiary: updated, requests: this.requests() });
          this.toast.success(
            status === 'verified' ? 'beneficiaries.detail.verified' : 'beneficiaries.detail.rejected',
          );
        },
        error: () => {
          this.updating.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected t(key: string): string {
    return this.translation.translate(key);
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
}
