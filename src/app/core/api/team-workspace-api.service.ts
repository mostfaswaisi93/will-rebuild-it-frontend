import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Estimate, Project, ReconstructionRequest, Team, TeamReview } from '@core/models';

export interface TeamWorkspaceStats {
  activeProjects: number;
  deliveredProjects: number;
  pendingEstimates: number;
  openRequests: number;
  averageRating: number;
  outstandingFunding: number;
}

export interface TeamWorkspace {
  team: Team;
  projects: Project[];
  estimates: Estimate[];
  reviews: TeamReview[];
  matchedRequests: ReconstructionRequest[];
  stats: TeamWorkspaceStats;
}

/** The signed-in reconstruction team's own workspace (scoped server-side in a real backend). */
@Injectable({ providedIn: 'root' })
export class TeamWorkspaceApi {
  private readonly http = inject(HttpClient);

  getWorkspace(): Observable<TeamWorkspace> {
    return this.http.get<TeamWorkspace>(`${environment.apiUrl}/team-workspace`);
  }
}
