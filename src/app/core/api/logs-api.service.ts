import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { DeliveryLog, LogChannel, LogStatus, PagedResult } from '@core/models';

export interface LogFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  channel?: LogChannel;
  status?: LogStatus;
}

@Injectable({ providedIn: 'root' })
export class LogsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/logs`;

  list(filters: LogFilters): Observable<PagedResult<DeliveryLog>> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    for (const key of ['searchKey', 'channel', 'status'] as const) {
      const value = filters[key];
      if (value) {
        params = params.set(key, value);
      }
    }
    return this.http.get<PagedResult<DeliveryLog>>(this.base, { params });
  }
}
