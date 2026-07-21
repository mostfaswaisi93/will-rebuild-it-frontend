import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import {
  DamageSeverity,
  GazaGovernorate,
  PagedResult,
  PropertyType,
  ReconstructionRequest,
  RequestType,
} from '@core/models';
import {
  WorkRequestFilters,
  WorkRequestListDto,
  WorkRequestSummary,
  mapWorkRequestList,
} from './dto/work-request.dto';

export type WorkRequestPage = PagedResult<ReconstructionRequest> & { summary: WorkRequestSummary };

/** What an operator fills in to log a request on a beneficiary's behalf. */
export interface CreateWorkRequestPayload {
  contactName: string;
  contactPhone: string;
  type: RequestType;
  propertyType: PropertyType;
  severity: DamageSeverity;
  governorate: GazaGovernorate;
  district: string;
  streetDescription: string;
  description: string;
}

/**
 * Back-office view of reconstruction requests — the operator/contractor "leads"
 * queue. Distinct from `RequestsApi`, which is the beneficiary's view of their
 * own requests: this one lists everyone's, carries the summary cards, and can
 * assign a team.
 */
@Injectable({ providedIn: 'root' })
export class WorkRequestsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/work-requests`;

  list(filters: WorkRequestFilters): Observable<WorkRequestPage> {
    let params = new HttpParams()
      .set('pageNo', filters.pageNo)
      .set('pageSize', filters.pageSize);

    // Only send filters that are actually set — an empty string would filter
    // the list down to nothing rather than being ignored.
    for (const key of ['searchKey', 'status', 'severity', 'governorate', 'type', 'origin'] as const) {
      const value = filters[key];
      if (value) {
        params = params.set(key, value);
      }
    }

    return this.http
      .get<WorkRequestListDto>(this.base, { params })
      .pipe(map(mapWorkRequestList));
  }

  getById(id: string): Observable<ReconstructionRequest> {
    return this.http.get<ReconstructionRequest>(`${this.base}/${id}`);
  }

  /** Logs a new direct-booking request. Returns the created record. */
  create(payload: CreateWorkRequestPayload): Observable<ReconstructionRequest> {
    return this.http.post<ReconstructionRequest>(this.base, payload);
  }

  /** Assigns a team and moves the request to `matched`. */
  assignTeam(id: string, teamId: string): Observable<ReconstructionRequest> {
    return this.http.post<ReconstructionRequest>(`${this.base}/${id}/assign`, { teamId });
  }

  /** Records an operator's rejection of a request. */
  reject(id: string): Observable<ReconstructionRequest> {
    return this.http.post<ReconstructionRequest>(`${this.base}/${id}/reject`, {});
  }
}
