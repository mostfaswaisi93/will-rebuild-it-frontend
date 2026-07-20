import { PagedResult, Project } from '@core/models';

export type ProjectDto = Project;
export type PagedProjectsDto = PagedResult<ProjectDto>;

export function mapProjectFromDto(dto: ProjectDto): Project {
  return { ...dto };
}

export function mapPagedProjectsFromDto(dto: PagedProjectsDto): PagedResult<Project> {
  return { ...dto, items: dto.items.map(mapProjectFromDto) };
}
