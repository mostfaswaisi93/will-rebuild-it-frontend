import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Beneficiary, BeneficiaryStatus, PagedResult, ReconstructionRequest } from '@core/models';

export interface BeneficiaryFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  status?: BeneficiaryStatus;
  governorate?: string;
}

/** A beneficiary's case file plus the requests gathered under it. */
export interface BeneficiaryDetail {
  beneficiary: Beneficiary;
  requests: ReconstructionRequest[];
}

@Injectable({ providedIn: 'root' })
export class BeneficiariesApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/beneficiaries`;

  list(filters: BeneficiaryFilters): Observable<PagedResult<Beneficiary>> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    for (const key of ['searchKey', 'status', 'governorate'] as const) {
      const value = filters[key];
      if (value) {
        params = params.set(key, value);
      }
    }
    return this.http.get<PagedResult<Beneficiary>>(this.base, { params });
  }

  getById(id: string): Observable<BeneficiaryDetail> {
    return this.http.get<BeneficiaryDetail>(`${this.base}/${id}`);
  }

  setStatus(id: string, status: BeneficiaryStatus): Observable<Beneficiary> {
    return this.http.post<Beneficiary>(`${this.base}/${id}/status`, { status });
  }
}
