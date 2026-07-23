import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  GAZA_GOVERNORATES,
  GOVERNORATE_CENTROIDS,
  GazaGovernorate,
  GeoArea,
} from '@core/models';
import { MasterApi } from '@core/api/master-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { MapMarker, MapView } from '@shared/ui/map/map';
import { PageHeader } from '@shared/ui/page-header/page-header';

interface GovernorateGroup {
  governorate: GazaGovernorate;
  districts: GeoArea[];
}

/**
 * Service coverage areas — port of the legacy `geofencingSetting`. The legacy
 * screen drew editable radius geofences around US ZIP codes; coverage here is
 * recorded per governorate and district instead, so this presents the areas the
 * platform operates in rather than a radius editor.
 */
@Component({
  selector: 'app-geofencing',
  imports: [TranslatePipe, PageHeader, MapView],
  templateUrl: './geofencing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Geofencing {
  private readonly api = inject(MasterApi);
  private readonly translation = inject(TranslationService);

  private readonly areas = rxResource({
    stream: () => this.api.getGeoAreas(),
  });

  protected readonly loading = computed(() => this.areas.isLoading());
  protected readonly failed = computed(() => this.areas.error() !== undefined);

  /** Districts grouped under their governorate, north to south; empty governorates are dropped. */
  protected readonly groups = computed<GovernorateGroup[]>(() => {
    const all = this.areas.value() ?? [];
    return GAZA_GOVERNORATES.map((governorate) => ({
      governorate,
      districts: all.filter((area) => area.governorate === governorate),
    })).filter((group) => group.districts.length > 0);
  });

  protected readonly totalDistricts = computed(() => (this.areas.value() ?? []).length);

  /** One marker per covered governorate, placed at its centroid. */
  protected readonly markers = computed<MapMarker[]>(() =>
    this.groups().map((group) => ({
      id: group.governorate,
      lat: GOVERNORATE_CENTROIDS[group.governorate].lat,
      lng: GOVERNORATE_CENTROIDS[group.governorate].lng,
      label: this.translation.translate(`governorates.${group.governorate}`),
    })),
  );
}
