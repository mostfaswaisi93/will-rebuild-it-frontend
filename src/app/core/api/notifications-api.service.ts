import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AppNotification } from '@core/models';

@Injectable({ providedIn: 'root' })
export class NotificationsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/notifications`;

  /** Broadcasts an announcement to platform users. */
  broadcast(payload: { title: string; body: string; linkUrl?: string }): Observable<AppNotification> {
    return this.http.post<AppNotification>(this.base, payload);
  }

  getNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(this.base);
  }

  markRead(id: string): Observable<AppNotification> {
    return this.http.post<AppNotification>(`${this.base}/${id}/read`, {});
  }

  markAllRead(): Observable<AppNotification[]> {
    return this.http.post<AppNotification[]>(`${this.base}/read-all`, {});
  }

  remove(id: string): Observable<{ id: string }> {
    return this.http.delete<{ id: string }>(`${this.base}/${id}`);
  }
}
