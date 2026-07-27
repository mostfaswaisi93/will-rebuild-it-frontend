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
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GOVERNORATE_CENTROIDS, Team, TeamReview } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { TeamsApi } from '@core/api/teams-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { MapMarker, MapView } from '@shared/ui/map/map';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';
import { specializationKey } from '../contractor-spec';

/**
 * Contractor profile — port of the legacy `pro/promyprofile`. The operator's
 * view of a reconstruction team: standing, capability, coverage and feedback.
 *
 * The team's *details* stay read-only — editing its own profile is the team's
 * task in their workspace. The one operator decision here is the firm's
 * standing (the legacy `pro-status-modal`): suspending a firm stops it bidding
 * and removes it from the list beneficiaries choose from.
 */
@Component({
  selector: 'app-contractor-profile',
  imports: [RouterLink, ReactiveFormsModule, TranslatePipe, MapView, PageHeader, StatusPill],
  templateUrl: './contractor-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractorProfile {
  readonly id = input.required<string>();

  private readonly api = inject(TeamsApi);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getTeamProfile(params.id),
  });

  private readonly reviewsResource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getTeamReviews(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly team = computed<Team | null>(() => this.resource.value() ?? null);
  protected readonly reviews = computed<TeamReview[]>(() => this.reviewsResource.value() ?? []);

  /** Withdrawing a firm's standing is the platform operator's call alone. */
  protected readonly canDecide = computed(() => this.session.role() === 'admin');
  protected readonly suspended = computed(() => this.team()?.status === 'suspended');
  protected readonly updating = signal(false);
  protected readonly suspendOpen = signal(false);

  /** Mirrors the server's rule so the form fails before the request does. */
  protected readonly note = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(10)],
  });

  protected openSuspend(): void {
    this.note.reset('');
    this.suspendOpen.set(true);
  }

  protected cancelSuspend(): void {
    this.suspendOpen.set(false);
  }

  protected suspend(): void {
    if (this.note.invalid) {
      this.note.markAsTouched();
      return;
    }
    this.apply('suspended', this.note.value.trim(), 'contractors.profile.suspended');
  }

  protected reinstate(): void {
    this.apply('active', undefined, 'contractors.profile.reinstated');
  }

  private apply(status: 'active' | 'suspended', note: string | undefined, successKey: string): void {
    const team = this.team();
    if (!team || this.updating()) {
      return;
    }
    this.updating.set(true);
    this.api
      .setStatus(team.id, status, note)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.updating.set(false);
          this.suspendOpen.set(false);
          this.resource.set(updated);
          this.toast.success(successKey);
        },
        error: () => {
          this.updating.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  /** Distinct governorates the team covers, for a compact coverage summary. */
  protected readonly coverageGovernorates = computed(() => {
    const areas = this.team()?.coverageAreas ?? [];
    return [...new Set(areas.map((area) => area.governorate))];
  });

  /**
   * One marker per covered governorate, at its centroid — the service-area view
   * of the legacy `promyprofile/map`. Coverage is recorded per governorate, so
   * a centroid pin is the honest resolution; it is not a precise address.
   */
  protected readonly coverageMarkers = computed<MapMarker[]>(() =>
    this.coverageGovernorates().map((governorate) => ({
      id: governorate,
      lat: GOVERNORATE_CENTROIDS[governorate].lat,
      lng: GOVERNORATE_CENTROIDS[governorate].lng,
      label: this.translation.translate(`governorates.${governorate}`),
    })),
  );

  protected specKey(value: string): string {
    return specializationKey(value);
  }

  protected rating(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  protected year(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), { year: 'numeric' }).format(new Date(iso));
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
