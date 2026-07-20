import { localizeAssessmentQuestions } from '../fixtures/assessment.fixture';
import { MockHandler, ok } from '../mock-types';

export const handleMaster: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'master' || ctx.method !== 'GET') {
    return undefined;
  }

  if (ctx.segments[1] === 'geo-areas') {
    return ok(ctx.store.geoAreas);
  }

  if (ctx.segments[1] === 'settings') {
    return ok(ctx.store.globalSettings);
  }

  if (ctx.segments[1] === 'assessment-questions') {
    return ok(localizeAssessmentQuestions(ctx.store.assessmentQuestions, ctx.query.get('lang') ?? 'en'));
  }

  return undefined;
};
