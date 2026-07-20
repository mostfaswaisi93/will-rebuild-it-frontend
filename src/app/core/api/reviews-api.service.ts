import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { TeamReview } from '@core/models';

/** A review the signed-in beneficiary wrote, enriched with the team/project it belongs to. */
export interface AuthoredReview extends TeamReview {
  teamName: string;
  projectTitle: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewsApi {
  private readonly http = inject(HttpClient);

  getMyReviews(): Observable<AuthoredReview[]> {
    return this.http.get<AuthoredReview[]>(`${environment.apiUrl}/reviews`);
  }
}
