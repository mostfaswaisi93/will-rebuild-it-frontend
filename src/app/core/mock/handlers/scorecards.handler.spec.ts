import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { ContractorScorecard } from '@core/api/dto/scorecard.dto';
import { handleScorecards } from './scorecards.handler';

function makeContext(store: MockStore, path: string): MockRequestContext {
  const segments = path.split('/').filter((segment) => segment.length > 0);
  return { method: 'GET', path, segments, query: new URLSearchParams(), body: null, store };
}

function expectHandled(result: MockResult | undefined): MockResult {
  expect(result).withContext('handler did not claim the route').toBeDefined();
  return result as MockResult;
}

describe('scorecards handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores non-GET methods', () => {
    const ctx = makeContext(store, 'scorecards');
    expect(handleScorecards({ ...ctx, method: 'POST' })).toBeUndefined();
  });

  it('returns one scorecard per team, best first', () => {
    const cards = expectHandled(handleScorecards(makeContext(store, 'scorecards')))
      .body as ContractorScorecard[];
    expect(cards.length).toBe(store.teams.length);
    for (let i = 1; i < cards.length; i++) {
      expect(cards[i - 1]!.overallScore).toBeGreaterThanOrEqual(cards[i]!.overallScore);
    }
  });

  it('scores every card within 0–100', () => {
    const cards = expectHandled(handleScorecards(makeContext(store, 'scorecards')))
      .body as ContractorScorecard[];
    for (const card of cards) {
      expect(card.overallScore).toBeGreaterThanOrEqual(0);
      expect(card.overallScore).toBeLessThanOrEqual(100);
    }
  });

  it('computes approval rate from a team\'s own statements', () => {
    // team-1 has statements in the fixtures; verify the rate matches them.
    const card = expectHandled(handleScorecards(makeContext(store, 'scorecards/team-1')))
      .body as ContractorScorecard;
    const own = store.statements.filter((s) => s.teamId === 'team-1');
    const approved = own.filter((s) =>
      ['approved', 'partiallyPaid', 'paid'].includes(s.status),
    ).length;
    const rejected = own.filter((s) => s.status === 'rejected').length;
    const expected = approved + rejected > 0 ? approved / (approved + rejected) : 1;
    expect(card.approvalRate).toBeCloseTo(expected, 5);
  });

  it('treats a team with no decided statements as a clean 100% approval', () => {
    // A team with no statements should not be penalised on approval.
    const teamWithNone = store.teams.find(
      (team) => !store.statements.some((s) => s.teamId === team.id),
    );
    if (teamWithNone) {
      const card = expectHandled(handleScorecards(makeContext(store, `scorecards/${teamWithNone.id}`)))
        .body as ContractorScorecard;
      expect(card.approvalRate).toBe(1);
    }
  });

  it('404s for an unknown team', () => {
    const result = expectHandled(handleScorecards(makeContext(store, 'scorecards/nope')));
    expect(result.status).toBe(404);
  });
});
