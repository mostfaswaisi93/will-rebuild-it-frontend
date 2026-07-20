import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { AuthSession } from '@core/models';
import { LoginResponseDto, mapAuthSessionFromDto } from './dto/auth.dto';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth`;

  checkEmail(email: string): Observable<boolean> {
    return this.http
      .post<{ exists: boolean }>(`${this.base}/check-email`, { email })
      .pipe(map((response) => response.exists));
  }

  login(email: string, password: string): Observable<AuthSession> {
    return this.http
      .post<LoginResponseDto>(`${this.base}/login`, { email, password })
      .pipe(map(mapAuthSessionFromDto));
  }
}
