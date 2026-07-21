import { TERMS_AUDIENCES, TermsAudience, TermsDocument } from '@core/models';
import { MockHandler, badRequest, created, notFound, ok } from '../mock-types';

interface TermsBody {
  title?: string;
  audience?: TermsAudience;
  version?: string;
  body?: string;
}

function validate(body: TermsBody): string | null {
  if (!body.title?.trim() || !body.version?.trim() || !body.body?.trim()) {
    return 'Title, version and body are required.';
  }
  if (!body.audience || !TERMS_AUDIENCES.includes(body.audience)) {
    return 'A valid audience is required.';
  }
  return null;
}

export const handleSettings: MockHandler = (ctx) => {
  // Routes are /settings/terms[...]
  if (ctx.segments[0] !== 'settings' || ctx.segments[1] !== 'terms') {
    return undefined;
  }

  const doc = ctx.segments[2]
    ? ctx.store.terms.find((candidate) => candidate.id === ctx.segments[2])
    : undefined;

  // POST /settings/terms — create (inactive until explicitly activated)
  if (ctx.method === 'POST' && ctx.segments.length === 2) {
    const body = (ctx.body ?? {}) as TermsBody;
    const error = validate(body);
    if (error) {
      return badRequest(error);
    }
    const record: TermsDocument = {
      id: `terms-${Date.now()}`,
      title: body.title!.trim(),
      audience: body.audience!,
      version: body.version!.trim(),
      body: body.body!.trim(),
      active: false,
      updatedAt: new Date().toISOString(),
    };
    ctx.store.terms.unshift(record);
    return created(record);
  }

  // PUT /settings/terms/:id — update
  if (ctx.method === 'PUT' && ctx.segments.length === 3) {
    if (!doc) {
      return notFound(`Terms ${ctx.segments[2]} not found.`);
    }
    const body = (ctx.body ?? {}) as TermsBody;
    const error = validate(body);
    if (error) {
      return badRequest(error);
    }
    doc.title = body.title!.trim();
    doc.audience = body.audience!;
    doc.version = body.version!.trim();
    doc.body = body.body!.trim();
    doc.updatedAt = new Date().toISOString();
    return ok(doc);
  }

  // POST /settings/terms/:id/activate — make it the sole active one for its audience
  if (ctx.method === 'POST' && ctx.segments.length === 4 && ctx.segments[3] === 'activate') {
    if (!doc) {
      return notFound(`Terms ${ctx.segments[2]} not found.`);
    }
    for (const candidate of ctx.store.terms) {
      if (candidate.audience === doc.audience) {
        candidate.active = candidate.id === doc.id;
      }
    }
    return ok(ctx.store.terms);
  }

  // GET /settings/terms
  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    // Active first, then newest.
    const sorted = [...ctx.store.terms].sort((a, b) => {
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return ok(sorted);
  }

  return undefined;
};
