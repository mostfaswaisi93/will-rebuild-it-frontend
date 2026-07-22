import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ContractorTrade, PagedResult, PriceListItem } from '@core/models';
import { environment } from '@env/environment';

export interface PriceListFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  trade?: ContractorTrade;
}

@Injectable({ providedIn: 'root' })
export class PriceListApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/price-list`;

  list(filters: PriceListFilters): Observable<PagedResult<PriceListItem>> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    if (filters.searchKey) {
      params = params.set('searchKey', filters.searchKey);
    }
    if (filters.trade) {
      params = params.set('trade', filters.trade);
    }
    return this.http.get<PagedResult<PriceListItem>>(this.base, { params });
  }
}
