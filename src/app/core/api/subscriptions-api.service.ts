import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PagedResult, Subscription, SubscriptionPlan, SubscriptionStatus } from '@core/models';

export interface SubscriptionFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  status?: SubscriptionStatus;
  plan?: SubscriptionPlan;
}

export interface SubscriptionSummary {
  /** Memberships currently active. */
  activeCount: number;
  /** Memberships overdue for renewal. */
  pastDueCount: number;
  /** Annualised membership revenue from active subscriptions, in USD. */
  annualRevenue: number;
}

export type SubscriptionPage = PagedResult<Subscription> & { summary: SubscriptionSummary };

@Injectable({ providedIn: 'root' })
export class SubscriptionsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/subscriptions`;

  list(filters: SubscriptionFilters): Observable<SubscriptionPage> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    if (filters.searchKey) {
      params = params.set('searchKey', filters.searchKey);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.plan) {
      params = params.set('plan', filters.plan);
    }
    return this.http.get<SubscriptionPage>(this.base, { params });
  }

  getById(id: string): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.base}/${id}`);
  }

  /** Records a renewal payment, extends the cover by a year, and marks it active. */
  renew(id: string): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.base}/${id}/renew`, {});
  }

  cancel(id: string): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.base}/${id}/cancel`, {});
  }

  /** Reverses a single membership payment (the legacy leadgen refund flow). */
  refundPayment(id: string, paymentId: string): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.base}/${id}/payments/${paymentId}/refund`, {});
  }
}
