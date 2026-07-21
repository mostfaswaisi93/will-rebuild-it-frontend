import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  Inspection,
  InspectionItem,
  InspectionKind,
  PagedResult,
  WorkOrder,
  WorkOrderStatus,
} from '@core/models';

export interface WorkOrderFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  status?: WorkOrderStatus;
  priority?: string;
  governorate?: string;
}

export interface WorkOrderSummary {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
}

export type WorkOrderPage = PagedResult<WorkOrder> & { summary: WorkOrderSummary };

/** What the inspection form submits. */
export interface SubmitInspectionPayload {
  items: Pick<InspectionItem, 'id' | 'response' | 'photoUrls'>[];
  notes: string;
  inspectorName: string;
  signatureUrl: string;
}

@Injectable({ providedIn: 'root' })
export class WorkOrdersApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/work-orders`;

  list(filters: WorkOrderFilters): Observable<WorkOrderPage> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    for (const key of ['searchKey', 'status', 'priority', 'governorate'] as const) {
      const value = filters[key];
      if (value) {
        params = params.set(key, value);
      }
    }
    return this.http.get<WorkOrderPage>(this.base, { params });
  }

  getById(id: string): Observable<WorkOrder> {
    return this.http.get<WorkOrder>(`${this.base}/${id}`);
  }

  /**
   * Moves a work order to the next state. The backend validates the transition,
   * so an out-of-order request (e.g. completing before the pre-work inspection)
   * is rejected rather than silently applied.
   */
  transition(id: string, status: WorkOrderStatus): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(`${this.base}/${id}/transition`, { status });
  }

  /** Returns the blank checklist for a kind, ready to fill in. */
  startInspection(id: string, kind: InspectionKind): Observable<Inspection> {
    return this.http.get<Inspection>(`${this.base}/${id}/inspection/${kind}`);
  }

  submitInspection(
    id: string,
    kind: InspectionKind,
    payload: SubmitInspectionPayload,
  ): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(`${this.base}/${id}/inspection/${kind}`, payload);
  }
}
