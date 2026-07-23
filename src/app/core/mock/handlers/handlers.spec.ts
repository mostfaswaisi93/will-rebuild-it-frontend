import { AppNotification, Disbursement, Estimate, Funding, Team, TeamReview } from '@core/models';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { handleEstimates } from './estimates.handler';
import { handleFunding } from './funding.handler';
import { handleNotifications } from './notifications.handler';
import { handleTeams } from './teams.handler';

interface ContextOverrides {
  method?: string;
  path: string;
  query?: Record<string, string>;
  body?: unknown;
}

/** Builds the exact context shape the mock-api interceptor hands to a handler. */
function makeContext(store: MockStore, { method = 'GET', path, query = {}, body = null }: ContextOverrides): MockRequestContext {
  const segments = path.split('/').filter((segment) => segment.length > 0);
  return {
    method,
    path,
    segments,
    query: new URLSearchParams(query),
    body,
    store,
  };
}

/** Narrows a handler result that the test expects to have matched. */
function expectHandled(result: MockResult | undefined): MockResult {
  expect(result).withContext('handler unexpectedly returned undefined (did not claim the route)').toBeDefined();
  return result as MockResult;
}

describe('mock backend handlers', () => {
  let store: MockStore;

  beforeEach(() => {
    // A fresh store per spec: MockStore structuredClones every fixture in its
    // field initialisers, so mutations here never leak into the next test.
    store = new MockStore();
  });

  describe('MockStore seeding', () => {
    it('self-seeds from the fixtures without any injector or TestBed', () => {
      expect(store.estimates.length).toBeGreaterThan(0);
      expect(store.funding.length).toBeGreaterThan(0);
      expect(store.teams.length).toBeGreaterThan(0);
      expect(store.notifications.length).toBeGreaterThan(0);
    });

    it('gives each new instance its own copies so one test cannot corrupt the next', () => {
      const other = new MockStore();
      store.estimates[0].status = 'rejected';

      expect(other.estimates[0].status).not.toBe('rejected');
    });
  });

  describe('estimates handler', () => {
    it('sets the status to approved and stamps approvedAt when approving an estimate', () => {
      const before = store.estimates.find((estimate) => estimate.id === 'estimate-3')!;
      expect(before.status).toBe('pendingApproval');
      const originalApprovedAt = before.approvedAt;

      const result = expectHandled(
        handleEstimates(makeContext(store, { method: 'POST', path: '/estimates/estimate-3/approve', body: {} })),
      );

      expect(result.status).toBe(200);
      const body = result.body as Estimate;
      expect(body.status).toBe('approved');
      expect(body.approvedAt).toBeDefined();
      expect(body.approvedAt).not.toBe(originalApprovedAt);
      expect(Number.isNaN(Date.parse(body.approvedAt!))).toBe(false);
    });

    it('mutates the stored estimate in place when approving, not just the response copy', () => {
      handleEstimates(makeContext(store, { method: 'POST', path: '/estimates/estimate-3/approve', body: {} }));

      expect(store.estimates.find((estimate) => estimate.id === 'estimate-3')!.status).toBe('approved');
    });

    it('sets the status to rejected and stores the supplied reason when rejecting an estimate', () => {
      const result = expectHandled(
        handleEstimates(
          makeContext(store, {
            method: 'POST',
            path: '/estimates/estimate-3/reject',
            body: { rejectionReason: 'Labour rates are above the agreed ceiling.' },
          }),
        ),
      );

      const body = result.body as Estimate;
      expect(result.status).toBe(200);
      expect(body.status).toBe('rejected');
      expect(body.rejectionReason).toBe('Labour rates are above the agreed ceiling.');
    });

    it('records an empty rejection reason when the request body omits one', () => {
      const result = expectHandled(
        handleEstimates(makeContext(store, { method: 'POST', path: '/estimates/estimate-3/reject', body: {} })),
      );

      expect((result.body as Estimate).rejectionReason).toBe('');
    });

    it('records an empty rejection reason when the request body is null', () => {
      const result = expectHandled(
        handleEstimates(makeContext(store, { method: 'POST', path: '/estimates/estimate-3/reject', body: null })),
      );

      expect((result.body as Estimate).rejectionReason).toBe('');
    });

    it('returns 404 when approving an estimate id that does not exist', () => {
      const result = expectHandled(
        handleEstimates(makeContext(store, { method: 'POST', path: '/estimates/estimate-nope/approve', body: {} })),
      );

      expect(result.status).toBe(404);
      expect(result.body).toEqual({ message: 'Estimate estimate-nope not found.' });
    });

    it('returns 404 when rejecting an estimate id that does not exist', () => {
      const result = expectHandled(
        handleEstimates(makeContext(store, { method: 'POST', path: '/estimates/estimate-nope/reject', body: {} })),
      );

      expect(result.status).toBe(404);
    });

    it('returns 404 when fetching an estimate id that does not exist', () => {
      const result = expectHandled(handleEstimates(makeContext(store, { path: '/estimates/estimate-nope' })));

      expect(result.status).toBe(404);
    });

    it('returns the single estimate when fetching an id that exists', () => {
      const result = expectHandled(handleEstimates(makeContext(store, { path: '/estimates/estimate-1' })));

      expect(result.status).toBe(200);
      expect((result.body as Estimate).id).toBe('estimate-1');
    });

    it('filters the estimates list by the status query parameter', () => {
      const result = expectHandled(
        handleEstimates(makeContext(store, { path: '/estimates', query: { status: 'pendingApproval', pageSize: '50' } })),
      );

      const body = result.body as { items: Estimate[] };
      expect(body.items.length).toBeGreaterThan(0);
      expect(body.items.every((estimate) => estimate.status === 'pendingApproval')).toBe(true);
    });
  });

  describe('funding handler', () => {
    it('stamps receiptConfirmedAt when the beneficiary confirms receipt', () => {
      const before = store.funding.find((funding) => funding.id === 'funding-1')!;
      expect(before.receiptConfirmedAt).toBeUndefined();

      const result = expectHandled(
        handleFunding(makeContext(store, { method: 'POST', path: '/funding/funding-1/confirm-receipt', body: {} })),
      );

      const body = result.body as Funding;
      expect(result.status).toBe(200);
      expect(body.receiptConfirmedAt).toBeDefined();
      expect(Number.isNaN(Date.parse(body.receiptConfirmedAt!))).toBe(false);
      expect(store.funding.find((funding) => funding.id === 'funding-1')!.receiptConfirmedAt).toBe(
        body.receiptConfirmedAt,
      );
    });

    it('overwrites an existing receiptConfirmedAt when confirming again', () => {
      const seeded = store.funding.find((funding) => funding.id === 'funding-2')!.receiptConfirmedAt;
      expect(seeded).toBe('2026-03-05T09:00:00.000Z');

      const result = expectHandled(
        handleFunding(makeContext(store, { method: 'POST', path: '/funding/funding-2/confirm-receipt', body: {} })),
      );

      expect((result.body as Funding).receiptConfirmedAt).not.toBe(seeded);
    });

    it('returns 404 when confirming receipt on a funding id that does not exist', () => {
      const result = expectHandled(
        handleFunding(makeContext(store, { method: 'POST', path: '/funding/funding-nope/confirm-receipt', body: {} })),
      );

      expect(result.status).toBe(404);
      expect(result.body).toEqual({ message: 'Funding funding-nope not found.' });
    });

    it('returns a nested disbursement by its own id', () => {
      const result = expectHandled(
        handleFunding(makeContext(store, { path: '/funding/funding-1/disbursements/disb-1-2' })),
      );

      const body = result.body as Disbursement;
      expect(result.status).toBe(200);
      expect(body.id).toBe('disb-1-2');
      expect(body.fundingId).toBe('funding-1');
    });

    it('returns 404 for a disbursement id that is not on that funding record', () => {
      const result = expectHandled(
        handleFunding(makeContext(store, { path: '/funding/funding-1/disbursements/disb-2-1' })),
      );

      expect(result.status).toBe(404);
      expect(result.body).toEqual({ message: 'Disbursement disb-2-1 not found.' });
    });

    it('returns 404 for a disbursement under a funding record that does not exist', () => {
      const result = expectHandled(
        handleFunding(makeContext(store, { path: '/funding/funding-nope/disbursements/disb-1-1' })),
      );

      expect(result.status).toBe(404);
      expect(result.body).toEqual({ message: 'Funding funding-nope not found.' });
    });
  });

  describe('teams handler', () => {
    function team1(): Team {
      return store.teams.find((team) => team.id === 'team-1')!;
    }

    it('appends the posted review to the store and returns 201', () => {
      const before = store.teamReviews.filter((review) => review.teamId === 'team-1').length;

      const result = expectHandled(
        handleTeams(
          makeContext(store, {
            method: 'POST',
            path: '/teams/team-1/reviews',
            body: {
              projectId: 'project-1',
              authorName: 'Youssef Al-Najjar',
              workQuality: 3,
              timeliness: 3,
              professionalism: 3,
              comments: 'Good work overall.',
            },
          }),
        ),
      );

      expect(result.status).toBe(201);
      const review = result.body as TeamReview;
      expect(review.teamId).toBe('team-1');
      expect(review.comments).toBe('Good work overall.');
      expect(store.teamReviews.filter((candidate) => candidate.teamId === 'team-1').length).toBe(before + 1);
      expect(store.teamReviews).toContain(review);
    });

    it('folds a new review into the running average incrementally', () => {
      // The aggregate is maintained incrementally, NOT recomputed from the few
      // full review bodies seeded in memory — a team's historical count (21)
      // deliberately exceeds them, as with a real backend. Posting (3,3,3):
      // (4.7 * 21 + 3) / 22.
      expect(team1().averageRating).toBe(4.7);
      expect(team1().reviewsCount).toBe(21);

      handleTeams(
        makeContext(store, {
          method: 'POST',
          path: '/teams/team-1/reviews',
          body: { workQuality: 3, timeliness: 3, professionalism: 3 },
        }),
      );

      expect(team1().averageRating).toBeCloseTo((4.7 * 21 + 3) / 22, 10);
    });

    it('keeps folding on a second review rather than leaving the first value stale', () => {
      const post = (score: number): void => {
        handleTeams(
          makeContext(store, {
            method: 'POST',
            path: '/teams/team-1/reviews',
            body: { workQuality: score, timeliness: score, professionalism: score },
          }),
        );
      };

      post(3);
      const afterFirst = (4.7 * 21 + 3) / 22;
      expect(team1().averageRating).toBeCloseTo(afterFirst, 10);

      post(1);
      expect(team1().averageRating).toBeCloseTo((afterFirst * 22 + 1) / 23, 10);
      expect(team1().reviewsCount).toBe(23);
    });

    it('increments reviewsCount so the displayed total never collapses', () => {
      const before = team1().reviewsCount;

      handleTeams(
        makeContext(store, {
          method: 'POST',
          path: '/teams/team-1/reviews',
          body: { workQuality: 5, timeliness: 5, professionalism: 5 },
        }),
      );

      // Regression guard: recomputing from in-memory reviews would drop 21 -> 3.
      expect(team1().reviewsCount).toBe(before + 1);
      expect(team1().reviewsCount).toBeGreaterThan(3);
    });

    it('leaves other teams’ ratings untouched when a review is posted', () => {
      const team3Before = store.teams.find((team) => team.id === 'team-3')!.averageRating;

      handleTeams(
        makeContext(store, {
          method: 'POST',
          path: '/teams/team-1/reviews',
          body: { workQuality: 1, timeliness: 1, professionalism: 1 },
        }),
      );

      expect(store.teams.find((team) => team.id === 'team-3')!.averageRating).toBe(team3Before);
    });

    it('fills in placeholder values for review fields the body omits', () => {
      const result = expectHandled(
        handleTeams(makeContext(store, { method: 'POST', path: '/teams/team-1/reviews', body: {} })),
      );

      const review = result.body as TeamReview;
      expect(review.authorName).toBe('Anonymous');
      expect(review.projectId).toBe('');
      expect(review.comments).toBe('');
      expect(review.workQuality).toBe(0);
    });

    it('returns 404 when reviewing a team that does not exist', () => {
      const result = expectHandled(
        handleTeams(makeContext(store, { method: 'POST', path: '/teams/team-nope/reviews', body: {} })),
      );

      expect(result.status).toBe(404);
      expect(result.body).toEqual({ message: 'Team team-nope not found.' });
    });

    it('toggles isFollowedByCurrentUser on each follow call', () => {
      expect(team1().isFollowedByCurrentUser).toBeFalsy();

      const first = expectHandled(handleTeams(makeContext(store, { method: 'POST', path: '/teams/team-1/follow' })));
      expect(first.status).toBe(200);
      expect(first.body).toEqual({ isFollowedByCurrentUser: true });
      expect(team1().isFollowedByCurrentUser).toBe(true);

      const second = expectHandled(handleTeams(makeContext(store, { method: 'POST', path: '/teams/team-1/follow' })));
      expect(second.body).toEqual({ isFollowedByCurrentUser: false });
      expect(team1().isFollowedByCurrentUser).toBe(false);

      const third = expectHandled(handleTeams(makeContext(store, { method: 'POST', path: '/teams/team-1/follow' })));
      expect(third.body).toEqual({ isFollowedByCurrentUser: true });
    });

    it('returns 404 when following a team that does not exist', () => {
      const result = expectHandled(
        handleTeams(makeContext(store, { method: 'POST', path: '/teams/team-nope/follow' })),
      );

      expect(result.status).toBe(404);
    });

    it('lists only the reviews belonging to the requested team', () => {
      const result = expectHandled(handleTeams(makeContext(store, { path: '/teams/team-1/reviews' })));

      const reviews = result.body as TeamReview[];
      expect(reviews.length).toBeGreaterThan(0);
      expect(reviews.every((review) => review.teamId === 'team-1')).toBe(true);
    });
  });

  describe('notifications handler', () => {
    it('marks every notification read on read-all', () => {
      expect(store.notifications.some((notification) => !notification.isRead)).toBe(true);

      const result = expectHandled(
        handleNotifications(makeContext(store, { method: 'POST', path: '/notifications/read-all', body: {} })),
      );

      expect(result.status).toBe(200);
      expect((result.body as AppNotification[]).every((notification) => notification.isRead)).toBe(true);
      expect(store.notifications.every((notification) => notification.isRead)).toBe(true);
    });

    it('marks a single notification read without touching the others', () => {
      const result = expectHandled(
        handleNotifications(makeContext(store, { method: 'POST', path: '/notifications/notif-1/read', body: {} })),
      );

      expect((result.body as AppNotification).isRead).toBe(true);
      expect(store.notifications.find((notification) => notification.id === 'notif-2')!.isRead).toBe(false);
    });

    it('returns 404 when marking an unknown notification read', () => {
      const result = expectHandled(
        handleNotifications(makeContext(store, { method: 'POST', path: '/notifications/notif-nope/read', body: {} })),
      );

      expect(result.status).toBe(404);
    });

    it('removes exactly one notification on delete and leaves the rest in order', () => {
      const before = store.notifications.length;
      const survivingIds = store.notifications
        .filter((notification) => notification.id !== 'notif-2')
        .map((notification) => notification.id);

      const result = expectHandled(
        handleNotifications(makeContext(store, { method: 'DELETE', path: '/notifications/notif-2' })),
      );

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ id: 'notif-2' });
      expect(store.notifications.length).toBe(before - 1);
      expect(store.notifications.map((notification) => notification.id)).toEqual(survivingIds);
    });

    it('returns 404 and removes nothing when deleting an unknown notification', () => {
      const before = store.notifications.length;

      const result = expectHandled(
        handleNotifications(makeContext(store, { method: 'DELETE', path: '/notifications/notif-nope' })),
      );

      expect(result.status).toBe(404);
      expect(store.notifications.length).toBe(before);
    });

    it('broadcasts an announcement to the top of the list, unread', () => {
      const before = store.notifications.length;

      const result = expectHandled(
        handleNotifications(
          makeContext(store, {
            method: 'POST',
            path: '/notifications',
            body: { title: 'Crossing closed', body: 'Kerem Shalom is closed until Sunday.' },
          }),
        ),
      );

      expect(result.status).toBe(201);
      const announcement = result.body as AppNotification;
      expect(announcement.title).toBe('Crossing closed');
      expect(announcement.isRead).toBe(false);
      expect(store.notifications.length).toBe(before + 1);
      // Newest first, so it leads the list.
      expect(store.notifications[0].id).toBe(announcement.id);
    });

    it('rejects a broadcast with no title or body', () => {
      const result = expectHandled(
        handleNotifications(
          makeContext(store, { method: 'POST', path: '/notifications', body: { title: '  ' } }),
        ),
      );

      expect(result.status).toBe(400);
    });
  });

  describe('fall-through: a handler returns undefined for paths it does not own', () => {
    it('estimates handler declines any path whose first segment is not "estimates"', () => {
      expect(handleEstimates(makeContext(store, { path: '/funding/funding-1' }))).toBeUndefined();
      expect(handleEstimates(makeContext(store, { path: '/teams' }))).toBeUndefined();
      expect(
        handleEstimates(makeContext(store, { method: 'POST', path: '/notifications/read-all', body: {} })),
      ).toBeUndefined();
    });

    it('estimates handler declines an "estimates" path with a verb it does not implement', () => {
      expect(
        handleEstimates(makeContext(store, { method: 'DELETE', path: '/estimates/estimate-1' })),
      ).toBeUndefined();
      expect(
        handleEstimates(makeContext(store, { method: 'POST', path: '/estimates/estimate-1/archive', body: {} })),
      ).toBeUndefined();
    });

    it('notifications handler declines any path whose first segment is not "notifications"', () => {
      expect(handleNotifications(makeContext(store, { path: '/estimates' }))).toBeUndefined();
      expect(
        handleNotifications(makeContext(store, { method: 'POST', path: '/teams/team-1/follow' })),
      ).toBeUndefined();
    });

    it('funding handler declines any path whose first segment is not "funding"', () => {
      expect(handleFunding(makeContext(store, { path: '/estimates/estimate-1' }))).toBeUndefined();
      expect(handleFunding(makeContext(store, { path: '/teams/team-1' }))).toBeUndefined();
    });

    it('teams handler declines any path whose first segment is not "teams"', () => {
      expect(handleTeams(makeContext(store, { path: '/funding' }))).toBeUndefined();
      expect(
        handleTeams(makeContext(store, { method: 'POST', path: '/estimates/estimate-1/approve', body: {} })),
      ).toBeUndefined();
    });

    it('every handler declines an empty path so an unmatched request reaches the real backend', () => {
      for (const handler of [handleEstimates, handleFunding, handleTeams, handleNotifications]) {
        expect(handler(makeContext(store, { path: '/' }))).toBeUndefined();
      }
    });
  });
});
