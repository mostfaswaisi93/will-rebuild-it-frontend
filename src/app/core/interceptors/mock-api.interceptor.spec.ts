import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { catchError, firstValueFrom, of } from 'rxjs';
import { PagedResult, Team } from '@core/models';
import { mockApiInterceptor } from './mock-api.interceptor';

/**
 * These cover the seam that silently broke once already: the interceptor used
 * to read `HttpRequest.url`, which EXCLUDES serialized `HttpParams`. Filters,
 * paging and `lang` therefore never reached the handlers, and the bug was
 * invisible because the seeded lists are small enough that unfiltered results
 * still looked plausible. Every assertion below fails if that regresses.
 */
describe('mockApiInterceptor', () => {
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([mockApiInterceptor]))],
    });
    http = TestBed.inject(HttpClient);
  });

  function pageParams(pageNo: number, pageSize: number): HttpParams {
    return new HttpParams().set('pageNo', pageNo).set('pageSize', pageSize);
  }

  function getTeams(params: HttpParams): Promise<PagedResult<Team>> {
    return firstValueFrom(http.get<PagedResult<Team>>('/api/teams', { params }));
  }

  it('serves a seeded collection', async () => {
    const result = await getTeams(pageParams(1, 10));

    expect(result.items.length).toBeGreaterThan(1);
    expect(result.totalCount).toBe(result.items.length);
  });

  it('applies a filter passed via HttpParams', async () => {
    const all = await getTeams(pageParams(1, 10));
    const rafahOnly = await getTeams(pageParams(1, 10).set('governorate', 'rafah'));

    // The guard against the regression: a filtered call must return FEWER rows.
    expect(rafahOnly.items.length).toBeLessThan(all.items.length);
    expect(rafahOnly.items.length).toBeGreaterThan(0);
    for (const team of rafahOnly.items) {
      expect(team.coverageAreas.some((area) => area.governorate === 'rafah')).toBeTrue();
    }
  });

  it('honours pageSize and pageNo from HttpParams', async () => {
    const firstPage = await getTeams(pageParams(1, 1));
    const secondPage = await getTeams(pageParams(2, 1));

    expect(firstPage.items.length).toBe(1);
    expect(secondPage.items.length).toBe(1);
    expect(firstPage.pageNo).toBe(1);
    expect(secondPage.pageNo).toBe(2);
    // Paging must actually advance rather than re-serving page one.
    expect(secondPage.items[0].id).not.toBe(firstPage.items[0].id);
    expect(firstPage.totalCount).toBeGreaterThan(1);
  });

  it('serves backend content in the locale requested via HttpParams', async () => {
    const url = '/api/master/assessment-questions';
    const en = await firstValueFrom(
      http.get<{ prompt: string }[]>(url, { params: new HttpParams().set('lang', 'en') }),
    );
    const ar = await firstValueFrom(
      http.get<{ prompt: string }[]>(url, { params: new HttpParams().set('lang', 'ar') }),
    );

    expect(en.length).toBeGreaterThan(0);
    expect(ar.length).toBe(en.length);
    expect(ar[0].prompt).not.toBe(en[0].prompt);
    // Arabic script range — proves localization happened, not just a copy.
    expect(ar[0].prompt).toMatch(/[؀-ۿ]/);
  });

  it('surfaces an unknown record as a 404 error, not a success', async () => {
    const status = await firstValueFrom(
      http.get('/api/teams/does-not-exist').pipe(
        catchError((error: HttpErrorResponse) => of(error.status)),
      ),
    );

    expect(status).toBe(404);
  });

  /**
   * The second regression this seam has had. Handlers mutate the store in place
   * and return the record they just changed, so the interceptor used to hand
   * callers a reference straight into the mock's own state. `resource.set(res)`
   * then set a signal to the value it already held — `Object.is` equal, so no
   * notification, so every derived `computed` kept a stale value while a
   * template reading the field directly appeared to update. That is how an
   * approved purchase order kept offering "approve". A real server cannot do
   * this: it serializes. These two specs pin that it stays that way.
   */
  describe('response isolation from the store', () => {
    it('does not hand back the same object twice', async () => {
      const first = await firstValueFrom(http.get<Team>('/api/teams/team-1'));
      const second = await firstValueFrom(http.get<Team>('/api/teams/team-1'));

      expect(first).not.toBe(second);
      expect(first.id).toBe(second.id);
    });

    it('keeps a mutation of the response out of the store', async () => {
      const received = await firstValueFrom(http.get<Team>('/api/teams/team-1'));
      const originalName = received.name;
      received.name = 'MUTATED BY CALLER';

      const refetched = await firstValueFrom(http.get<Team>('/api/teams/team-1'));
      expect(refetched.name).toBe(originalName);
    });
  });
});
