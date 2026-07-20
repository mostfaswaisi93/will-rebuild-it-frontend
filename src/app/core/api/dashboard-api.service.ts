import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  AdminDashboardDto,
  ContractorDashboardDto,
  StaffDashboardDto,
} from './dto/dashboard.dto';

/**
 * Dashboard aggregates. One endpoint per role rather than a generic one: the
 * three dashboards answer different questions, and a shared shape would either
 * over-fetch or collapse into a union nobody can read.
 */
@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/dashboard`;

  getAdminDashboard(): Observable<AdminDashboardDto> {
    return this.http.get<AdminDashboardDto>(`${this.base}/admin`);
  }

  getContractorDashboard(): Observable<ContractorDashboardDto> {
    return this.http.get<ContractorDashboardDto>(`${this.base}/contractor`);
  }

  getStaffDashboard(): Observable<StaffDashboardDto> {
    return this.http.get<StaffDashboardDto>(`${this.base}/staff`);
  }
}
