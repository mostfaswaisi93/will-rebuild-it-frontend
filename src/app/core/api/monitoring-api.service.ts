import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { MonitoringReport, MonitoringSource, PagedResult } from '@core/models';

export interface MonitoringFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  source?: MonitoringSource;
}

export interface MonitoringSummary {
  count: number;
  averageScore: number;
}

export type MonitoringPage = PagedResult<MonitoringReport> & { summary: MonitoringSummary };

@Injectable({ providedIn: 'root' })
export class MonitoringApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/monitoring`;

  list(filters: MonitoringFilters): Observable<MonitoringPage> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    if (filters.searchKey) {
      params = params.set('searchKey', filters.searchKey);
    }
    if (filters.source) {
      params = params.set('source', filters.source);
    }
    return this.http.get<MonitoringPage>(this.base, { params });
  }
}
