import { TEAM_STATUSES, Team, TeamReview, TeamStatus } from '@core/models';
import { MockHandler, badRequest, created, notFound, ok, paginate } from '../mock-types';

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

    // Opt-in, not default: the operator's contractor register must still show a
    // suspended firm (that is where it gets reinstated), while the
    // beneficiary-facing browse asks for active only — offering a suspended firm
    // to a family choosing who rebuilds their home is the thing suspension is
    // for. Filtering here by default would hide it from both.
    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((team) => team.status === status);
    }

    return ok(paginate(items, ctx));
  }

  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    const team = ctx.store.teams.find((candidate) => candidate.id === ctx.segments[1]);
    return team ? ok(team) : notFound(`Team ${ctx.segments[1]} not found.`);
  }

  // POST /teams/:id/status — withdraw or restore a firm's standing
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'status') {
    const team = ctx.store.teams.find((candidate) => candidate.id === ctx.segments[1]);
    if (!team) {
      return notFound(`Team ${ctx.segments[1]} not found.`);
    }
    const body = (ctx.body ?? {}) as { status?: string; note?: string };
    if (!body.status || !TEAM_STATUSES.includes(body.status as TeamStatus)) {
      return badRequest('A valid team status is required.');
    }
    // Guarded on the server, not just disabled in the form: suspending a firm
    // stops it bidding and is visible to the beneficiaries choosing it, so the
    // record has to say why. Reinstating needs no justification.
    if (body.status === 'suspended' && !body.note?.trim()) {
      return badRequest('A reason is required to suspend a contracting firm.');
    }
    team.status = body.status as TeamStatus;
    team.statusNote = body.status === 'suspended' ? body.note?.trim() : undefined;
    team.statusChangedAt = new Date().toISOString();
    return ok(team);
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
