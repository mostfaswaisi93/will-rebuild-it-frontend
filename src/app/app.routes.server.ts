import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Public routes render per-request on the server (good for SEO/perf on
 * landing/project/team pages). The authenticated `/app/*` shell renders
 * client-only: session state lives in `localStorage`, which the server has
 * no access to, so SSR-ing a guarded route would either leak a flash of
 * protected content or force `authGuard` to redirect on every hard refresh
 * even for a signed-in user. Client rendering sidesteps both — the guard
 * only ever runs where it can actually see the session. Revisit once the
 * mock localStorage session is replaced by a real HttpOnly-cookie session
 * the server can read.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'app/**',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
