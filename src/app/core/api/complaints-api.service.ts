import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { Complaint, ComplaintReasons, PageRequest, PagedResult } from '@core/models';
import {
  ComplaintDto,
  PagedComplaintsDto,
  mapComplaintFromDto,
  mapPagedComplaintsFromDto,
} from './dto/complaint.dto';

export interface CreateComplaintPayload {
  teamId: string;
  teamName: string;
  projectId?: string;
  description: string;
  reasons: ComplaintReasons;
}

@Injectable({ providedIn: 'root' })
export class ComplaintsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/complaints`;

  getComplaints(filters: PageRequest): Observable<PagedResult<Complaint>> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<PagedComplaintsDto>(this.base, { params }).pipe(map(mapPagedComplaintsFromDto));
  }

  getComplaintDetails(id: string): Observable<Complaint> {
    return this.http.get<ComplaintDto>(`${this.base}/${id}`).pipe(map(mapComplaintFromDto));
  }

  /** Operator reply — answering a complaint closes it. */
  respond(id: string, responseBody: string): Observable<Complaint> {
    return this.http
      .post<ComplaintDto>(`${this.base}/${id}/respond`, { responseBody })
      .pipe(map(mapComplaintFromDto));
  }

  createComplaint(payload: CreateComplaintPayload): Observable<Complaint> {
    return this.http.post<ComplaintDto>(this.base, payload).pipe(map(mapComplaintFromDto));
  }
}
