import { Complaint, PagedResult } from '@core/models';

export type ComplaintDto = Complaint;
export type PagedComplaintsDto = PagedResult<ComplaintDto>;

export function mapComplaintFromDto(dto: ComplaintDto): Complaint {
  return { ...dto };
}

export function mapPagedComplaintsFromDto(dto: PagedComplaintsDto): PagedResult<Complaint> {
  return { ...dto, items: dto.items.map(mapComplaintFromDto) };
}
