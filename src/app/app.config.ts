import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, isDevMode } from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { mockApiInterceptor } from '@core/interceptors/mock-api.interceptor';
import { TranslatedTitleStrategy } from '@core/i18n/translated-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // A short native cross-fade between pages, so navigation reads as
      // continuous rather than as a flash. Browsers without the View
      // Transitions API simply swap, and `skipInitialTransition` keeps the
      // first paint instant — an animation on arrival would delay the content.
      //
      // Reduced-motion is handled in `styles.css`, which disables the
      // `::view-transition-*` animations along with everything else, rather
      // than here: one place decides whether this app moves at all.
      withViewTransitions({ skipInitialTransition: true }),
    ),
    // Titles come from a dictionary key per route rather than a static string,
    // because the locale is switched at runtime. See TranslatedTitleStrategy.
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor, mockApiInterceptor])),
    provideClientHydration(withEventReplay()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
