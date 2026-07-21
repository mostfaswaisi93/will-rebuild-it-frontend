import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PagedResult, Statement, StatementStatus } from '@core/models';

export interface StatementFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  status?: StatementStatus;
}

export interface StatementSummary {
  total: number;
  awaitingReview: number;
  approvedUnpaid: number;
  /** Net value of statements approved but not yet fully paid. */
  approvedUnpaidAmount: number;
  paidAmount: number;
}

export type StatementPage = PagedResult<Statement> & { summary: StatementSummary };

@Injectable({ providedIn: 'root' })
export class StatementsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/statements`;

  list(filters: StatementFilters): Observable<StatementPage> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    if (filters.searchKey) {
      params = params.set('searchKey', filters.searchKey);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<StatementPage>(this.base, { params });
  }

  getById(id: string): Observable<Statement> {
    return this.http.get<Statement>(`${this.base}/${id}`);
  }

  /** Moves a submitted statement into review. */
  startReview(id: string): Observable<Statement> {
    return this.http.post<Statement>(`${this.base}/${id}/review`, {});
  }

  /**
   * Approves for an amount — which may be less than the net claimed if lines
   * were queried. Defaults to the full net amount when omitted.
   */
  approve(id: string, approvedAmount?: number): Observable<Statement> {
    return this.http.post<Statement>(`${this.base}/${id}/approve`, { approvedAmount });
  }

  reject(id: string, rejectionReason: string): Observable<Statement> {
    return this.http.post<Statement>(`${this.base}/${id}/reject`, { rejectionReason });
  }

  /** Records payment. A partial amount moves it to `partiallyPaid`. */
  recordPayment(id: string, amount: number): Observable<Statement> {
    return this.http.post<Statement>(`${this.base}/${id}/pay`, { amount });
  }
}
