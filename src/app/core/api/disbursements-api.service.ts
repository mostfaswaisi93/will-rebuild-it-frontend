import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  DisbursementMethod,
  DisbursementStatus,
  PagedResult,
  Payout,
} from '@core/models';

export interface DisbursementFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  status?: DisbursementStatus;
  method?: DisbursementMethod;
}

export interface DisbursementSummary {
  /** In-flight: pending + authorised + sent, not yet settled or failed. */
  inFlightCount: number;
  inFlightAmount: number;
  settledAmount: number;
  failedCount: number;
}

export type DisbursementPage = PagedResult<Payout> & { summary: DisbursementSummary };

@Injectable({ providedIn: 'root' })
export class DisbursementsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/disbursements`;

  list(filters: DisbursementFilters): Observable<DisbursementPage> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    for (const key of ['searchKey', 'status', 'method'] as const) {
      const value = filters[key];
      if (value) {
        params = params.set(key, value);
      }
    }
    return this.http.get<DisbursementPage>(this.base, { params });
  }

  getById(id: string): Observable<Payout> {
    return this.http.get<Payout>(`${this.base}/${id}`);
  }

  /**
   * Advances the payout. A `sent` transfer can carry its bank reference; the
   * backend validates that the move is legal from the current status.
   */
  transition(
    id: string,
    status: DisbursementStatus,
    reference?: string,
  ): Observable<Payout> {
    return this.http.post<Payout>(`${this.base}/${id}/transition`, { status, reference });
  }
}
