import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { AuthSession, UserRole } from '@core/models';
import {
  AccountRoleDto,
  ContractorOnboardingDto,
  EmailLookupResponseDto,
  LoginResponseDto,
  mapAuthSessionFromDto,
} from './dto/auth.dto';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth`;


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

  /**
   * Creates a contractor account in the pending state. Sign-in blocks it until
   * onboarding is finished, which is what the registration wizard does next.
   *
   * Rejects with 409 when the address already holds a contractor account.
   */
  register(payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }): Observable<{ userId: string }> {
    return this.http.post<{ userId: string }>(`${this.base}/register`, payload);
  }

  /**
   * Submits the contractor onboarding profile. Clears the pending state that
   * blocks sign-in, and returns a session so the contractor lands inside the
   * portal rather than back at the sign-in form.
   */
  completeContractorOnboarding(payload: ContractorOnboardingDto): Observable<AuthSession> {
    return this.http
      .post<LoginResponseDto>(`${this.base}/contractor-onboarding`, payload)
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
