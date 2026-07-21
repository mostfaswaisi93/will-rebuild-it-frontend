import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { MaterialCategory, PagedResult, Supplier, SupplierStatus } from '@core/models';

export interface SupplierFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  status?: SupplierStatus;
  category?: MaterialCategory;
  governorate?: string;
}

@Injectable({ providedIn: 'root' })
export class SuppliersApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/suppliers`;

  list(filters: SupplierFilters): Observable<PagedResult<Supplier>> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    for (const key of ['searchKey', 'status', 'category', 'governorate'] as const) {
      const value = filters[key];
      if (value) {
        params = params.set(key, value);
      }
    }
    return this.http.get<PagedResult<Supplier>>(this.base, { params });
  }

  getById(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.base}/${id}`);
  }

  setStatus(id: string, status: SupplierStatus): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.base}/${id}/status`, { status });
  }
}
