import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { BoqCategory, PagedResult, PricebookItem } from '@core/models';

export interface PricebookFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  category?: BoqCategory;
  /** 'active' | 'inactive'; omitted shows both. */
  active?: string;
}

/** The editable fields of a pricebook item. */
export interface PricebookItemInput {
  code: string;
  category: BoqCategory;
  description: string;
  unit: string;
  unitRate: number;
}

@Injectable({ providedIn: 'root' })
export class PricebookApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/pricebook`;

  list(filters: PricebookFilters): Observable<PagedResult<PricebookItem>> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    for (const key of ['searchKey', 'category', 'active'] as const) {
      const value = filters[key];
      if (value) {
        params = params.set(key, value);
      }
    }
    return this.http.get<PagedResult<PricebookItem>>(this.base, { params });
  }

  create(input: PricebookItemInput): Observable<PricebookItem> {
    return this.http.post<PricebookItem>(this.base, input);
  }

  update(id: string, input: PricebookItemInput): Observable<PricebookItem> {
    return this.http.put<PricebookItem>(`${this.base}/${id}`, input);
  }

  /** Toggles the active flag — items are deactivated, never deleted, so old
   * estimates that reference them stay intact. */
  setActive(id: string, active: boolean): Observable<PricebookItem> {
    return this.http.post<PricebookItem>(`${this.base}/${id}/active`, { active });
  }
}
