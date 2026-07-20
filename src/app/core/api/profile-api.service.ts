import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { BeneficiaryProfile } from '@core/models';

export interface NotificationPreferences {
  projectUpdates: boolean;
  fundingUpdates: boolean;
  teamMessages: boolean;
  donationReceipts: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProfileApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/profile`;

  getProfile(): Observable<BeneficiaryProfile> {
    return this.http.get<BeneficiaryProfile>(this.base);
  }

  updateProfile(patch: Partial<BeneficiaryProfile>): Observable<BeneficiaryProfile> {
    return this.http.put<BeneficiaryProfile>(this.base, patch);
  }

  getNotificationPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.base}/notification-preferences`);
  }

  updateNotificationPreferences(prefs: NotificationPreferences): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(`${this.base}/notification-preferences`, prefs);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ changed: boolean }> {
    return this.http.post<{ changed: boolean }>(`${this.base}/change-password`, {
      currentPassword,
      newPassword,
    });
  }
}
