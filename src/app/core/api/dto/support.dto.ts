import { PagedResult, SupportTicket } from '@core/models';

export type SupportTicketDto = SupportTicket;
export type PagedSupportDto = PagedResult<SupportTicketDto>;

export function mapSupportTicketFromDto(dto: SupportTicketDto): SupportTicket {
  return { ...dto };
}

export function mapPagedSupportFromDto(dto: PagedSupportDto): PagedResult<SupportTicket> {
  return { ...dto, items: dto.items.map(mapSupportTicketFromDto) };
}
