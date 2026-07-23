import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import {
  Address,
  DamageSeverity,
  PageRequest,
  PagedResult,
  PropertyType,
  ReconstructionRequest,
  RequestType,
} from '@core/models';
import { PagedRequestsDto, ReconstructionRequestDto, mapPagedRequestsFromDto, mapRequestFromDto } from './dto/request.dto';

export interface CreateRequestPayload {
  type: RequestType;
  propertyType: PropertyType;
  severity: DamageSeverity;
  description: string;
  address: Address;
  teamId?: string;
  contactName?: string;
  contactPhone?: string;
}

@Injectable({ providedIn: 'root' })
export class RequestsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/requests`;

  getMyRequests(filters: PageRequest): Observable<PagedResult<ReconstructionRequest>> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    if (filters.searchKey) {
      params = params.set('searchKey', filters.searchKey);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get<PagedRequestsDto>(this.base, { params }).pipe(map(mapPagedRequestsFromDto));
  }

  getRequestDetails(id: string): Observable<ReconstructionRequest> {
    return this.http.get<ReconstructionRequestDto>(`${this.base}/${id}`).pipe(map(mapRequestFromDto));
  }

  /** Files a beneficiary's damage report. The only create path — a second,
   * identical `POST /requests` method existed and was never called. */
  submitDamageReport(payload: CreateRequestPayload): Observable<ReconstructionRequest> {
    return this.http
      .post<ReconstructionRequestDto>(`${this.base}/damage-report`, payload)
      .pipe(map(mapRequestFromDto));
  }
}
