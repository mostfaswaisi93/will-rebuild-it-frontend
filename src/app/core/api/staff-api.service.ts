import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PagedResult, StaffMember, StaffStatus } from '@core/models';

export interface StaffFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  status?: StaffStatus;
  teamId?: string;
}

@Injectable({ providedIn: 'root' })
export class StaffApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/staff`;

  list(filters: StaffFilters): Observable<PagedResult<StaffMember>> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    for (const key of ['searchKey', 'status', 'teamId'] as const) {
      const value = filters[key];
      if (value) {
        params = params.set(key, value);
      }
    }
    return this.http.get<PagedResult<StaffMember>>(this.base, { params });
  }

  getById(id: string): Observable<StaffMember> {
    return this.http.get<StaffMember>(`${this.base}/${id}`);
  }

  setStatus(id: string, status: StaffStatus): Observable<StaffMember> {
    return this.http.post<StaffMember>(`${this.base}/${id}/status`, { status });
  }
}
