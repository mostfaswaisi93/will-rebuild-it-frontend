import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideStar } from '@lucide/angular';
import { GOVERNORATE_CENTROIDS, Team } from '@core/models';
import { TeamsApi } from '@core/api/teams-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { BrandMark } from '@shared/ui/brand-mark/brand-mark';
import { MapMarker, MapView } from '@shared/ui/map/map';

/**
 * Public, shareable profile for a reconstruction team — port of the legacy
 * `pro/propublic/:id`. Server-rendered (it falls under the `**` server rule) so
 * it is linkable and indexable.
 *
 * Privacy: the aggregate rating and review count are shown, but **not the
 * individual reviews**. Those carry beneficiary names, and a beneficiary who
 * reviewed the team that rebuilt their home did not consent to having that
 * association published on an open page. Signed-in users still see full reviews
 * at `/app/teams/:id`.
 */
@Component({
  selector: 'app-contractor-public',
  imports: [RouterLink, LucideStar, TranslatePipe, BrandMark, MapView],
  templateUrl: './contractor-public.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractorPublic {
  readonly id = input.required<string>();

  private readonly api = inject(TeamsApi);
  private readonly translation = inject(TranslationService);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getTeamProfile(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly team = computed<Team | null>(() => this.resource.value() ?? null);
  protected readonly currentYear = new Date().getFullYear();

  protected readonly coverageGovernorates = computed(() => {
    const areas = this.team()?.coverageAreas ?? [];
    return [...new Set(areas.map((area) => area.governorate))];
  });

  protected readonly coverageMarkers = computed<MapMarker[]>(() =>
    this.coverageGovernorates().map((governorate) => ({
      id: governorate,
      lat: GOVERNORATE_CENTROIDS[governorate].lat,
      lng: GOVERNORATE_CENTROIDS[governorate].lng,
      label: this.translation.translate(`governorates.${governorate}`),
    })),
  );

  protected readonly isRtl = this.translation.isRtl;

  protected toggleLocale(): void {
    this.translation.toggleLocale();
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
}
