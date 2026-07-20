import { MockStore } from './mock-store.service';

export interface MockResult {
  status: number;
  body: unknown;
}

export interface MockRequestContext {
  method: string;
  path: string;
  segments: string[];
  query: URLSearchParams;
  body: unknown;
  store: MockStore;
}

export type MockHandler = (ctx: MockRequestContext) => MockResult | undefined;

export function ok(body: unknown): MockResult {
  return { status: 200, body };
}

export function created(body: unknown): MockResult {
  return { status: 201, body };
}

export function notFound(message = 'Not found'): MockResult {
  return { status: 404, body: { message } };
}

export function badRequest(message: string): MockResult {
  return { status: 400, body: { message } };
}

/** The resource already exists — e.g. registering an email that is taken. */
export function conflict(message: string): MockResult {
  return { status: 409, body: { message } };
}

export function unauthorized(message = 'Invalid credentials'): MockResult {
  return { status: 401, body: { message } };
}

export function paginate<T>(items: T[], ctx: MockRequestContext): { items: T[]; totalCount: number; pageNo: number; pageSize: number } {
  const pageNo = Number(ctx.query.get('pageNo') ?? '1') || 1;
  const pageSize = Number(ctx.query.get('pageSize') ?? '10') || 10;
  const start = (pageNo - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalCount: items.length,
    pageNo,
    pageSize,
  };
}
