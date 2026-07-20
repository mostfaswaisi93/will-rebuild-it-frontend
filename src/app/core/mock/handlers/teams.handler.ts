import { Team, TeamReview } from '@core/models';
import { MockHandler, created, notFound, ok, paginate } from '../mock-types';

interface ReviewBody {
  projectId?: string;
  authorName?: string;
  workQuality?: number;
  timeliness?: number;
  professionalism?: number;
  comments?: string;
}

export const handleTeams: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'teams') {
    return undefined;
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items: Team[] = ctx.store.teams;

    const specialization = ctx.query.get('specialization');
    if (specialization) {
      items = items.filter((team) => team.specializations.includes(specialization));
    }

    const governorate = ctx.query.get('governorate');
    if (governorate) {
      items = items.filter((team) => team.coverageAreas.some((area) => area.governorate === governorate));
    }

    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter((team) => team.name.toLowerCase().includes(searchKey));
    }

    return ok(paginate(items, ctx));
  }

  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    const team = ctx.store.teams.find((candidate) => candidate.id === ctx.segments[1]);
    return team ? ok(team) : notFound(`Team ${ctx.segments[1]} not found.`);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 3 && ctx.segments[2] === 'reviews') {
    const reviews = ctx.store.teamReviews.filter((review) => review.teamId === ctx.segments[1]);
    return ok(reviews);
  }

  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'reviews') {
    const teamId = ctx.segments[1];
    const team = ctx.store.teams.find((candidate) => candidate.id === teamId);
    if (!team) {
      return notFound(`Team ${teamId} not found.`);
    }
    const body = (ctx.body ?? {}) as ReviewBody;
    const review: TeamReview = {
      id: `review-${Date.now()}`,
      teamId,
      projectId: body.projectId ?? '',
      authorName: body.authorName ?? 'Anonymous',
      workQuality: body.workQuality ?? 0,
      timeliness: body.timeliness ?? 0,
      professionalism: body.professionalism ?? 0,
      comments: body.comments ?? '',
      createdAt: new Date().toISOString(),
    };
    ctx.store.teamReviews.push(review);

    // Update the aggregate INCREMENTALLY rather than recomputing from the
    // reviews held in memory. A team's historical review count (e.g. 21) is
    // deliberately larger than the handful of full review bodies seeded here,
    // exactly as a real backend would expose a running total without shipping
    // every review to the client. Recomputing would make the displayed count
    // visibly collapse (21 -> 3) the moment a user posts a review.
    const reviewScore = (review.workQuality + review.timeliness + review.professionalism) / 3;
    const previousCount = team.reviewsCount;
    const nextCount = previousCount + 1;
    team.averageRating = (team.averageRating * previousCount + reviewScore) / nextCount;
    team.reviewsCount = nextCount;

    return created(review);
  }

  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'follow') {
    const team = ctx.store.teams.find((candidate) => candidate.id === ctx.segments[1]);
    if (!team) {
      return notFound(`Team ${ctx.segments[1]} not found.`);
    }
    team.isFollowedByCurrentUser = !team.isFollowedByCurrentUser;
    return ok({ isFollowedByCurrentUser: team.isFollowedByCurrentUser });
  }

  return undefined;
};
