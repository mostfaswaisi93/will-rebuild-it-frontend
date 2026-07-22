import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Campaign, CampaignStatus, PagedResult } from '@core/models';

export interface CampaignFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  status?: CampaignStatus;
}

@Injectable({ providedIn: 'root' })
export class CampaignsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/campaigns`;

  list(filters: CampaignFilters): Observable<PagedResult<Campaign>> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    if (filters.searchKey) {
      params = params.set('searchKey', filters.searchKey);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<PagedResult<Campaign>>(this.base, { params });
  }

  getById(id: string): Observable<Campaign> {
    return this.http.get<Campaign>(`${this.base}/${id}`);
  }

  /** Launches a draft/scheduled campaign now — marks it active and "sends". */
  send(id: string): Observable<Campaign> {
    return this.http.post<Campaign>(`${this.base}/${id}/send`, {});
  }

  cancel(id: string): Observable<Campaign> {
    return this.http.post<Campaign>(`${this.base}/${id}/cancel`, {});
  }
}
