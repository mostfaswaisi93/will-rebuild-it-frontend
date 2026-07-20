import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { PageRequest, PagedResult, Project } from '@core/models';
import { PagedProjectsDto, ProjectDto, mapPagedProjectsFromDto, mapProjectFromDto } from './dto/project.dto';

@Injectable({ providedIn: 'root' })
export class ProjectsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/projects`;

  getMyProjects(filters: PageRequest): Observable<PagedResult<Project>> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    if (filters.searchKey) {
      params = params.set('searchKey', filters.searchKey);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get<PagedProjectsDto>(this.base, { params }).pipe(map(mapPagedProjectsFromDto));
  }

  getProjectDetails(id: string): Observable<Project> {
    return this.http.get<ProjectDto>(`${this.base}/${id}`).pipe(map(mapProjectFromDto));
  }

  /**
   * Public (unauthenticated) project page reads the same project record —
   * the mock backend doesn't yet model a separate public/private projection.
   * A real backend would likely expose a narrower `/pub/projects/:id`
   * endpoint that omits beneficiary-identifying fields; this method is the
   * seam to repoint when that exists.
   */
  getPublicProject(id: string): Observable<Project> {
    return this.getProjectDetails(id);
  }
}
