import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { AuthSession, UserRole } from '@core/models';
import {
  AccountRoleDto,
  EmailLookupResponseDto,
  LoginResponseDto,
  mapAuthSessionFromDto,
} from './dto/auth.dto';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth`;

  checkEmail(email: string): Observable<boolean> {
    return this.http
      .post<{ exists: boolean }>(`${this.base}/check-email`, { email })
      .pipe(map((response) => response.exists));
  }

  /**
   * Resolves an email to the role accounts behind it. Sign-in calls this before
   * accepting a password so it can show the role picker (and the account-status
   * warnings) up front, matching the legacy `verifyloginEmail` flow.
   *
   * Returns an empty array for an unknown email rather than erroring.
   */
  lookupAccounts(email: string): Observable<AccountRoleDto[]> {
    return this.http
      .post<EmailLookupResponseDto>(`${this.base}/lookup`, { email })
      .pipe(map((response) => response.accounts));
  }

  login(email: string, password: string, role?: UserRole): Observable<AuthSession> {
    return this.http
      .post<LoginResponseDto>(`${this.base}/login`, { email, password, role })
      .pipe(map(mapAuthSessionFromDto));
  }

  /** Sends a one-time code over the channel the user picked. Returns its id. */
  sendVerificationCode(
    email: string,
    channel: 'email' | 'sms',
    role: UserRole,
  ): Observable<{ challengeId: string }> {
    return this.http.post<{ challengeId: string }>(`${this.base}/verification-code`, {
      email,
      channel,
      role,
    });
  }

  /**
   * Verified server-side — the legacy page compared the entered code against a
   * token handed back in the response body, so anyone reading the network tab
   * could reset any account's password.
   */
  verifyCode(challengeId: string, code: string): Observable<{ resetToken: string }> {
    return this.http.post<{ resetToken: string }>(`${this.base}/verification-code/verify`, {
      challengeId,
      code,
    });
  }

  resetPassword(resetToken: string, password: string): Observable<AuthSession> {
    return this.http
      .post<LoginResponseDto>(`${this.base}/reset-password`, { resetToken, password })
      .pipe(map(mapAuthSessionFromDto));
  }

  /** Activates a pending account: sets its first password and records consent. */
  activateAccount(payload: {
    resetToken: string;
    password: string;
    acceptedTerms: boolean;
    subscribeToEmails: boolean;
  }): Observable<AuthSession> {
    return this.http
      .post<LoginResponseDto>(`${this.base}/activate`, payload)
      .pipe(map(mapAuthSessionFromDto));
  }
}
