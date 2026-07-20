import { Disbursement, Funding, PagedResult } from '@core/models';

export type FundingDto = Funding;
export type PagedFundingDto = PagedResult<FundingDto>;
export type DisbursementDto = Disbursement;

export function mapFundingFromDto(dto: FundingDto): Funding {
  return { ...dto };
}

export function mapPagedFundingFromDto(dto: PagedFundingDto): PagedResult<Funding> {
  return { ...dto, items: dto.items.map(mapFundingFromDto) };
}

export function mapDisbursementFromDto(dto: DisbursementDto): Disbursement {
  return { ...dto };
}
