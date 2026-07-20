import { Estimate, PagedResult } from '@core/models';

export type EstimateDto = Estimate;
export type PagedEstimatesDto = PagedResult<EstimateDto>;

export function mapEstimateFromDto(dto: EstimateDto): Estimate {
  return { ...dto };
}

export function mapPagedEstimatesFromDto(dto: PagedEstimatesDto): PagedResult<Estimate> {
  return { ...dto, items: dto.items.map(mapEstimateFromDto) };
}
