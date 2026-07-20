import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { Disbursement, Funding, PageRequest, PagedResult } from '@core/models';
import {
  DisbursementDto,
  FundingDto,
  PagedFundingDto,
  mapDisbursementFromDto,
  mapFundingFromDto,
  mapPagedFundingFromDto,
} from './dto/funding.dto';

export interface ConfirmReceiptPayload {
  signatureImage: string;
  signatureType: 'draw' | 'type';
  signatureText?: string;
}

@Injectable({ providedIn: 'root' })
export class FundingApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/funding`;

  getFundingList(filters: PageRequest): Observable<PagedResult<Funding>> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    if (filters.searchKey) {
      params = params.set('searchKey', filters.searchKey);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<PagedFundingDto>(this.base, { params }).pipe(map(mapPagedFundingFromDto));
  }

  getFundingDetails(id: string): Observable<Funding> {
    return this.http.get<FundingDto>(`${this.base}/${id}`).pipe(map(mapFundingFromDto));
  }

  getDisbursement(fundingId: string, disbursementId: string): Observable<Disbursement> {
    return this.http
      .get<DisbursementDto>(`${this.base}/${fundingId}/disbursements/${disbursementId}`)
      .pipe(map(mapDisbursementFromDto));
  }

  confirmReceipt(id: string, payload: ConfirmReceiptPayload): Observable<Funding> {
    return this.http.post<FundingDto>(`${this.base}/${id}/confirm-receipt`, payload).pipe(map(mapFundingFromDto));
  }
}
