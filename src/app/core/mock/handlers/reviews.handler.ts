import { MockHandler, ok } from '../mock-types';

/**
 * Reviews authored by the signed-in beneficiary. A real backend would match
 * on the author's user id; the seeded reviews only carry an author name, so
 * the mock matches on that.
 */
export const handleReviews: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'reviews' || ctx.method !== 'GET' || ctx.segments.length !== 1) {
    return undefined;
  }

  const profile = ctx.store.beneficiaryProfile;
  const authorName = `${profile.firstName} ${profile.lastName}`;

  const mine = ctx.store.teamReviews
    .filter((review) => review.authorName === authorName)
    .map((review) => ({
      ...review,
      teamName: ctx.store.teams.find((team) => team.id === review.teamId)?.name ?? '',
      projectTitle: ctx.store.projects.find((project) => project.id === review.projectId)?.title ?? '',
    }));

  return ok(mine);
};
