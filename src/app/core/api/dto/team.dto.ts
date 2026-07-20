import { PagedResult, Team, TeamReview } from '@core/models';

export type TeamDto = Team;
export type PagedTeamsDto = PagedResult<TeamDto>;
export type TeamReviewDto = TeamReview;

export function mapTeamFromDto(dto: TeamDto): Team {
  return { ...dto };
}

export function mapPagedTeamsFromDto(dto: PagedTeamsDto): PagedResult<Team> {
  return { ...dto, items: dto.items.map(mapTeamFromDto) };
}

export function mapTeamReviewFromDto(dto: TeamReviewDto): TeamReview {
  return { ...dto };
}
