import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { TermsAudience, TermsDocument } from '@core/models';

export interface TermsInput {
  title: string;
  audience: TermsAudience;
  version: string;
  body: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/settings/terms`;

  listTerms(): Observable<TermsDocument[]> {
    return this.http.get<TermsDocument[]>(this.base);
  }

  createTerms(input: TermsInput): Observable<TermsDocument> {
    return this.http.post<TermsDocument>(this.base, input);
  }

  updateTerms(id: string, input: TermsInput): Observable<TermsDocument> {
    return this.http.put<TermsDocument>(`${this.base}/${id}`, input);
  }

  /**
   * Makes this the active document for its audience — the backend deactivates
   * any other active document for the same audience, so exactly one is live.
   */
  activateTerms(id: string): Observable<TermsDocument[]> {
    return this.http.post<TermsDocument[]>(`${this.base}/${id}/activate`, {});
  }
}
