import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { PageRequest, PagedResult, SupportTicket } from '@core/models';
import {
  PagedSupportDto,
  SupportTicketDto,
  mapPagedSupportFromDto,
  mapSupportTicketFromDto,
} from './dto/support.dto';

export interface CreateSupportPayload {
  projectId?: string;
  projectTitle?: string;
  subject: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class SupportApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/support`;

  getTickets(filters: PageRequest): Observable<PagedResult<SupportTicket>> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<PagedSupportDto>(this.base, { params }).pipe(map(mapPagedSupportFromDto));
  }

  getTicketDetails(id: string): Observable<SupportTicket> {
    return this.http.get<SupportTicketDto>(`${this.base}/${id}`).pipe(map(mapSupportTicketFromDto));
  }

  createTicket(payload: CreateSupportPayload): Observable<SupportTicket> {
    return this.http.post<SupportTicketDto>(this.base, payload).pipe(map(mapSupportTicketFromDto));
  }

  addMessage(id: string, body: string): Observable<SupportTicket> {
    return this.http.post<SupportTicketDto>(`${this.base}/${id}/messages`, { body }).pipe(map(mapSupportTicketFromDto));
  }
}
