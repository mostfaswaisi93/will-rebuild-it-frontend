import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { PageRequest, PagedResult, Team, TeamReview, TeamStatus } from '@core/models';
import {
  PagedTeamsDto,
  TeamDto,
  TeamReviewDto,
  mapPagedTeamsFromDto,
  mapTeamFromDto,
  mapTeamReviewFromDto,
} from './dto/team.dto';

export interface SubmitTeamReviewPayload {
  projectId: string;
  authorName: string;
  workQuality: number;
  timeliness: number;
  professionalism: number;
  comments: string;
}

@Injectable({ providedIn: 'root' })
export class TeamsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/teams`;

  /**
   * `status` is opt-in: the operator's contractor register wants every firm
   * including suspended ones, while the beneficiary-facing browse asks for
   * `active` so a suspended firm is never offered to a family choosing who
   * rebuilds their home.
   */
  getTeams(
    filters: PageRequest & { specialization?: string; governorate?: string; status?: TeamStatus },
  ): Observable<PagedResult<Team>> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    if (filters.searchKey) {
      params = params.set('searchKey', filters.searchKey);
    }
    if (filters.specialization) {
      params = params.set('specialization', filters.specialization);
    }
    if (filters.governorate) {
      params = params.set('governorate', filters.governorate);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get<PagedTeamsDto>(this.base, { params }).pipe(map(mapPagedTeamsFromDto));
  }

  getTeamProfile(id: string): Observable<Team> {
    return this.http.get<TeamDto>(`${this.base}/${id}`).pipe(map(mapTeamFromDto));
  }

  /**
   * Withdraws or restores a firm's standing. `note` is required to suspend and
   * the server rejects a suspension without one — a firm that can no longer bid
   * must carry the reason it cannot.
   */
  setStatus(id: string, status: TeamStatus, note?: string): Observable<Team> {
    return this.http.post<Team>(`${this.base}/${id}/status`, { status, note });
  }

  getTeamReviews(id: string): Observable<TeamReview[]> {
    return this.http
      .get<TeamReviewDto[]>(`${this.base}/${id}/reviews`)
      .pipe(map((dtos) => dtos.map(mapTeamReviewFromDto)));
  }

  submitTeamReview(teamId: string, payload: SubmitTeamReviewPayload): Observable<TeamReview> {
    return this.http
      .post<TeamReviewDto>(`${this.base}/${teamId}/reviews`, payload)
      .pipe(map(mapTeamReviewFromDto));
  }

  toggleFollow(teamId: string): Observable<boolean> {
    return this.http
      .post<{ isFollowedByCurrentUser: boolean }>(`${this.base}/${teamId}/follow`, {})
      .pipe(map((response) => response.isFollowedByCurrentUser));
  }
}
