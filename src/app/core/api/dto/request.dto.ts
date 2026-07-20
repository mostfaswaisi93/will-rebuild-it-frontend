import { PagedResult, ReconstructionRequest } from '@core/models';

export type ReconstructionRequestDto = ReconstructionRequest;
export type PagedRequestsDto = PagedResult<ReconstructionRequestDto>;

export function mapRequestFromDto(dto: ReconstructionRequestDto): ReconstructionRequest {
  return { ...dto };
}

export function mapPagedRequestsFromDto(dto: PagedRequestsDto): PagedResult<ReconstructionRequest> {
  return { ...dto, items: dto.items.map(mapRequestFromDto) };
}
