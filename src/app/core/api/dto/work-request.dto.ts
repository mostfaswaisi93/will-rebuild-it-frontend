import { PagedResult, ReconstructionRequest, RequestStatus } from '@core/models';

/**
 * Filters an operator can apply to the work-request queue. Ported from the
 * legacy admin-list's per-column filter popovers, but reduced to the fields
 * that still exist in Gaza's data: the legacy set included US-only columns
 * (zipcode, state) and lead-marketplace concepts (purchase date, price) that
 * don't apply to reconstruction requests.
 */
export interface WorkRequestFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  status?: RequestStatus;
  severity?: string;
  governorate?: string;
  type?: string;
  origin?: string;
}

/** Headline counts shown above the queue — the legacy `TotalValues` cards. */
export interface WorkRequestSummary {
  total: number;
  unassigned: number;
  matched: number;
  accepted: number;
}

export interface WorkRequestListDto {
  items: ReconstructionRequest[];
  totalCount: number;
  pageNo: number;
  pageSize: number;
  summary: WorkRequestSummary;
}

export function mapWorkRequestList(
  dto: WorkRequestListDto,
): PagedResult<ReconstructionRequest> & { summary: WorkRequestSummary } {
  return {
    items: dto.items,
    totalCount: dto.totalCount,
    pageNo: dto.pageNo,
    pageSize: dto.pageSize,
    summary: dto.summary,
  };
}
