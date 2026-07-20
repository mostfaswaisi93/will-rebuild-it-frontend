import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { PageRequest, PagedResult, Team, TeamReview } from '@core/models';
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

  getTeams(filters: PageRequest & { specialization?: string; governorate?: string }): Observable<PagedResult<Team>> {
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

    return this.http.get<PagedTeamsDto>(this.base, { params }).pipe(map(mapPagedTeamsFromDto));
  }

  getTeamProfile(id: string): Observable<Team> {
    return this.http.get<TeamDto>(`${this.base}/${id}`).pipe(map(mapTeamFromDto));
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
