import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  Equipment,
  EquipmentCategory,
  EquipmentProblemSeverity,
  EquipmentStatus,
  PagedResult,
} from '@core/models';

export interface EquipmentFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  category?: EquipmentCategory;
  status?: EquipmentStatus;
}

export interface EquipmentSummary {
  total: number;
  available: number;
  inUse: number;
  unavailable: number;
}

export type EquipmentPage = PagedResult<Equipment> & { summary: EquipmentSummary };

export interface BookEquipmentPayload {
  from: string;
  to: string;
  projectTitle: string;
  workOrderId?: string;
  bookedBy: string;
}

export interface ReportProblemPayload {
  severity: EquipmentProblemSeverity;
  description: string;
  reportedBy: string;
}

@Injectable({ providedIn: 'root' })
export class EquipmentApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/equipment`;

  list(filters: EquipmentFilters): Observable<EquipmentPage> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    for (const key of ['searchKey', 'category', 'status'] as const) {
      const value = filters[key];
      if (value) {
        params = params.set(key, value);
      }
    }
    return this.http.get<EquipmentPage>(this.base, { params });
  }

  /** Full fleet with bookings — for the schedule timeline. */
  schedule(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(`${this.base}/schedule`);
  }

  getById(id: string): Observable<Equipment> {
    return this.http.get<Equipment>(`${this.base}/${id}`);
  }

  book(id: string, payload: BookEquipmentPayload): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.base}/${id}/bookings`, payload);
  }

  reportProblem(id: string, payload: ReportProblemPayload): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.base}/${id}/problems`, payload);
  }

  resolveProblem(id: string, problemId: string): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.base}/${id}/problems/${problemId}/resolve`, {});
  }

  setStatus(id: string, status: EquipmentStatus): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.base}/${id}/status`, { status });
  }
}
