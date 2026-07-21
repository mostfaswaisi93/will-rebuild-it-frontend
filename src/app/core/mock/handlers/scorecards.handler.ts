import { Team } from '@core/models';
import { MockHandler, notFound, ok } from '../mock-types';
import { ContractorScorecard } from '@core/api/dto/scorecard.dto';

const COMPLETED_WO_STATUSES = ['completed', 'inspected', 'closed'];

/**
 * Computes a team's scorecard from live store data. The composite weights the
 * three signals a reconstruction operator cares about: quality (rating),
 * throughput (how many work orders they finish), and claim discipline (how
 * often their statements are approved rather than queried).
 */
function scorecardFor(ctx: Parameters<MockHandler>[0], team: Team): ContractorScorecard {
  const workOrders = ctx.store.workOrders.filter((wo) => wo.teamId === team.id);
  const workOrdersCompleted = workOrders.filter((wo) =>
    COMPLETED_WO_STATUSES.includes(wo.status),
  ).length;
  const completionRate = workOrders.length > 0 ? workOrdersCompleted / workOrders.length : 0;

  const statements = ctx.store.statements.filter((statement) => statement.teamId === team.id);
  const approved = statements.filter(
    (statement) =>
      statement.status === 'approved' ||
      statement.status === 'partiallyPaid' ||
      statement.status === 'paid',
  ).length;
  const rejected = statements.filter((statement) => statement.status === 'rejected').length;
  const decided = approved + rejected;
  const approvalRate = decided > 0 ? approved / decided : 1;

  // 0–100 composite: rating 50%, completion 25%, approval 25%. A team with no
  // history yet still scores on its rating so a new team isn't ranked at zero.
  const ratingScore = (team.averageRating / 5) * 50;
  const overallScore = Math.round(ratingScore + completionRate * 25 + approvalRate * 25);

  return {
    teamId: team.id,
    teamName: team.name,
    averageRating: team.averageRating,
    completedProjects: team.completedProjectsCount,
    workOrdersTotal: workOrders.length,
    workOrdersCompleted,
    completionRate,
    statementsTotal: statements.length,
    statementsApproved: approved,
    statementsRejected: rejected,
    approvalRate,
    overallScore,
  };
}

export const handleScorecards: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'scorecards' || ctx.method !== 'GET') {
    return undefined;
  }

  // GET /scorecards/:teamId
  if (ctx.segments.length === 2) {
    const team = ctx.store.teams.find((candidate) => candidate.id === ctx.segments[1]);
    return team ? ok(scorecardFor(ctx, team)) : notFound(`Team ${ctx.segments[1]} not found.`);
  }

  // GET /scorecards — all, best first
  if (ctx.segments.length === 1) {
    const cards = ctx.store.teams
      .map((team) => scorecardFor(ctx, team))
      .sort((a, b) => b.overallScore - a.overallScore);
    return ok(cards);
  }

  return undefined;
};
