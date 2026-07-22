import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult, Shipment, ShipmentCrossing, ShipmentStatus } from '@core/models';
import { environment } from '@env/environment';

export interface ShipmentFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  status?: ShipmentStatus;
  crossing?: ShipmentCrossing;
}

export interface ShipmentSummary {
  /** Awaiting or undergoing crossing clearance. */
  atCrossing: number;
  /** On the road toward a warehouse. */
  inTransit: number;
  /** Arrived and unloaded. */
  delivered: number;
}

export type ShipmentPage = PagedResult<Shipment> & { summary: ShipmentSummary };

@Injectable({ providedIn: 'root' })
export class ShipmentsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/shipments`;

  list(filters: ShipmentFilters): Observable<ShipmentPage> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    for (const key of ['searchKey', 'status', 'crossing'] as const) {
      const value = filters[key];
      if (value) {
        params = params.set(key, value);
      }
    }
    return this.http.get<ShipmentPage>(this.base, { params });
  }

  getById(id: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${this.base}/${id}`);
  }

  /** Moves a shipment to the next crossing/transit state. */
  advance(id: string, status: ShipmentStatus): Observable<Shipment> {
    return this.http.post<Shipment>(`${this.base}/${id}/advance`, { status });
  }
}
