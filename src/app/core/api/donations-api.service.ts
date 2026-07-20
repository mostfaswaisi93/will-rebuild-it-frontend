import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { Donation, DonationFrequency, PageRequest, PagedResult } from '@core/models';
import {
  DonationDto,
  PagedDonationsDto,
  mapDonationFromDto,
  mapPagedDonationsFromDto,
} from './dto/donation.dto';

export interface CreateDonationPayload {
  amount: number;
  currency: string;
  frequency: DonationFrequency;
  projectId?: string;
  projectTitle?: string;
  donorName: string;
  email: string;
  isAnonymous: boolean;
}

@Injectable({ providedIn: 'root' })
export class DonationsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/donations`;

  getMyDonations(filters: PageRequest): Observable<PagedResult<Donation>> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<PagedDonationsDto>(this.base, { params }).pipe(map(mapPagedDonationsFromDto));
  }

  getDonationDetails(id: string): Observable<Donation> {
    return this.http.get<DonationDto>(`${this.base}/${id}`).pipe(map(mapDonationFromDto));
  }

  /**
   * Records a donation. Real card capture (Stripe Elements + PaymentIntent)
   * is deferred to a later phase — this endpoint accepts the donation intent
   * and returns a succeeded record so the impact/receipt flow is exercisable.
   */
  createDonation(payload: CreateDonationPayload): Observable<Donation> {
    return this.http.post<DonationDto>(this.base, payload).pipe(map(mapDonationFromDto));
  }
}
