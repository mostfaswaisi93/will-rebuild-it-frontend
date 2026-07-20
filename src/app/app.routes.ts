import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

/**
 * Route map for the back-office portal, ported from the legacy TopProz Angular
 * 10 app. `ROUTE-MAP.md` at the repo root is the authoritative inventory of all
 * ~130 legacy routes and tracks which have been ported; routes appear here only
 * once their page actually exists, so the build never points at a stub.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/sign-in',
  },

  // ---- Public / unauthenticated ----
  {
    path: 'auth',
    loadComponent: () => import('./layout/auth-shell/auth-shell').then((m) => m.AuthShell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'sign-in',
      },
      {
        path: 'sign-in',
        loadComponent: () => import('./features/auth/sign-in/sign-in').then((m) => m.SignIn),
      },
    ],
  },

  // ---- Authenticated back-office shell ----
  {
    path: 'app',
    loadComponent: () => import('./layout/app-shell/app-shell').then((m) => m.AppShell),
    canActivate: [authGuard],
    children: [],
  },

  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
