import { GeoArea, GlobalSettings } from '@core/models';

export type GeoAreaDto = GeoArea;
export type GlobalSettingsDto = GlobalSettings;

export function mapGeoAreaFromDto(dto: GeoAreaDto): GeoArea {
  return { ...dto };
}

export function mapGlobalSettingsFromDto(dto: GlobalSettingsDto): GlobalSettings {
  return { ...dto };
}
