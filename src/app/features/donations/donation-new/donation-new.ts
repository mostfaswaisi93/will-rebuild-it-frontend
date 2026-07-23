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
import { DONATION_FREQUENCIES, DonationFrequency, Project } from '@core/models';
import { DonationsApi } from '@core/api/donations-api.service';
import { ProjectsApi } from '@core/api/projects-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';

/** Suggested amounts, in USD — the legacy page offered a similar ladder. */
const PRESET_AMOUNTS = [25, 50, 100, 250] as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Make a donation — port of the legacy donate flow. Card capture is
 * deliberately absent: the endpoint records the donation *intent* and returns a
 * receipt reference (see `donations.donate.paymentNote`), so no payment
 * credentials are collected or stored anywhere in this app.
 */
@Component({
  selector: 'app-donation-new',
  imports: [ReactiveFormsModule, TranslatePipe, PageHeader],
  templateUrl: './donation-new.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonationNew {
  private readonly api = inject(DonationsApi);
  private readonly projectsApi = inject(ProjectsApi);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly presets = PRESET_AMOUNTS;
  protected readonly frequencies = DONATION_FREQUENCIES;
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  private readonly projectsResource = rxResource({
    stream: () => this.projectsApi.getMyProjects({ pageNo: 1, pageSize: 50 }),
  });
  protected readonly projects = computed<Project[]>(() => this.projectsResource.value()?.items ?? []);

  private readonly user = this.session.user();

  protected readonly form = this.fb.nonNullable.group({
    amount: [50, [Validators.required, Validators.min(1)]],
    frequency: ['once' as DonationFrequency, Validators.required],
    projectId: [''],
    donorName: [this.user ? `${this.user.firstName} ${this.user.lastName}` : '', Validators.required],
    email: [this.user?.email ?? '', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    isAnonymous: [false],
  });

  protected selectPreset(amount: number): void {
    this.form.controls.amount.setValue(amount);
  }

  protected isSelected(amount: number): boolean {
    return this.form.controls.amount.value === amount;
  }

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
      .createDonation({
        amount: Number(raw.amount),
        currency: 'USD',
        frequency: raw.frequency,
        projectId: raw.projectId || undefined,
        projectTitle: project?.title,
        donorName: raw.donorName.trim(),
        email: raw.email.trim(),
        isAnonymous: raw.isAnonymous,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (donation) => {
          this.saving.set(false);
          this.toast.success('donations.donate.success');
          void this.router.navigate(['/app/donations', donation.id]);
        },
        error: () => {
          this.saving.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected money(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
