import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ContractorScorecard } from './dto/scorecard.dto';

@Injectable({ providedIn: 'root' })
export class ScorecardsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/scorecards`;

  /** All contractors, ranked by overall score (best first). */
  list(): Observable<ContractorScorecard[]> {
    return this.http.get<ContractorScorecard[]>(this.base);
  }

  getByTeam(teamId: string): Observable<ContractorScorecard> {
    return this.http.get<ContractorScorecard>(`${this.base}/${teamId}`);
  }
}
