import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { Estimate, PageRequest, PagedResult } from '@core/models';
import {
  EstimateDto,
  PagedEstimatesDto,
  mapEstimateFromDto,
  mapPagedEstimatesFromDto,
} from './dto/estimate.dto';

@Injectable({ providedIn: 'root' })
export class EstimatesApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/estimates`;

  getEstimates(filters: PageRequest): Observable<PagedResult<Estimate>> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    if (filters.searchKey) {
      params = params.set('searchKey', filters.searchKey);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<PagedEstimatesDto>(this.base, { params }).pipe(map(mapPagedEstimatesFromDto));
  }

  getEstimateDetails(id: string): Observable<Estimate> {
    return this.http.get<EstimateDto>(`${this.base}/${id}`).pipe(map(mapEstimateFromDto));
  }

  approveEstimate(id: string, signatureImage: string): Observable<Estimate> {
    return this.http
      .post<EstimateDto>(`${this.base}/${id}/approve`, { signatureImage })
      .pipe(map(mapEstimateFromDto));
  }

  rejectEstimate(id: string, rejectionReason: string): Observable<Estimate> {
    return this.http
      .post<EstimateDto>(`${this.base}/${id}/reject`, { rejectionReason })
      .pipe(map(mapEstimateFromDto));
  }
}
