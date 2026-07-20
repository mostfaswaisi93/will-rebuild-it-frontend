import { MockHandler, notFound, ok } from '../mock-types';

/**
 * The signed-in team member's own workspace. A real backend would scope this
 * from the auth token; the mock resolves it from the seeded team user's
 * `teamId` so the team role has a genuine, data-backed dashboard.
 */
export const handleTeamWorkspace: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'team-workspace' || ctx.method !== 'GET' || ctx.segments.length !== 1) {
    return undefined;
  }

  const teamUser = ctx.store.users.find((user) => user.role === 'team');
  const team = ctx.store.teams.find((candidate) => candidate.id === teamUser?.teamId);
  if (!team) {
    return notFound('No team is linked to the signed-in user.');
  }

  const projects = ctx.store.projects.filter((project) => project.teamId === team.id);
  const estimates = ctx.store.estimates.filter((estimate) => estimate.teamId === team.id);
  const reviews = ctx.store.teamReviews.filter((review) => review.teamId === team.id);
  const matchedRequests = ctx.store.requests.filter((request) =>
    request.matchedTeams.some((matched) => matched.teamId === team.id),
  );
  const funding = ctx.store.funding.filter((record) =>
    projects.some((project) => project.id === record.projectId),
  );

  return ok({
    team,
    projects,
    estimates,
    reviews,
    matchedRequests,
    stats: {
      activeProjects: projects.filter((project) => project.status === 'active').length,
      deliveredProjects: projects.filter((project) => project.status === 'delivered').length,
      pendingEstimates: estimates.filter((estimate) => estimate.status === 'pendingApproval').length,
      openRequests: matchedRequests.filter((request) => request.status !== 'rejected').length,
      averageRating: team.averageRating,
      outstandingFunding: funding.reduce((sum, record) => sum + record.outstandingAmount, 0),
    },
  });
};
