import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { SessionStore } from '../session/session-store.service';
import { ToastService } from '../toast/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const session = inject(SessionStore);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && req.url.startsWith(environment.apiUrl)) {
        if (error.status === 401) {
          session.clearSession();
          void router.navigate(['/auth/sign-in']);
        } else if (error.status === 0) {
          toast.danger('common.errorGeneric');
        } else if (error.status >= 500) {
          toast.danger('common.errorGeneric');
        }
      }
      return throwError(() => error);
    }),
  );
};
