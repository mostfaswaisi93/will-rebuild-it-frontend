import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { GOVERNORATE_CENTROIDS, Team, TeamReview } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { TeamsApi } from '@core/api/teams-api.service';
import { MapMarker, MapView } from '@shared/ui/map/map';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { specializationKey } from '../contractor-spec';

/**
 * Contractor profile — port of the legacy `pro/promyprofile`. The operator's
 * read-only view of a reconstruction team: standing, capability, coverage and
 * feedback. Editing a team's own profile is the team's task in their workspace,
 * not an operator action, so this is read-only.
 */
@Component({
  selector: 'app-contractor-profile',
  imports: [TranslatePipe, MapView, PageHeader],
  templateUrl: './contractor-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractorProfile {
  readonly id = input.required<string>();

  private readonly api = inject(TeamsApi);
  private readonly translation = inject(TranslationService);

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
