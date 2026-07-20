import { Donation, PagedResult } from '@core/models';

export type DonationDto = Donation;
export type PagedDonationsDto = PagedResult<DonationDto>;

export function mapDonationFromDto(dto: DonationDto): Donation {
  return { ...dto };
}

export function mapPagedDonationsFromDto(dto: PagedDonationsDto): PagedResult<Donation> {
  return { ...dto, items: dto.items.map(mapDonationFromDto) };
}
