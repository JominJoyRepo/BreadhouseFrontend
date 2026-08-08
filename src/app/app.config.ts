import { provideAppInitializer, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AppConfigService } from './core/app-config.service';
import { breadhouseDateAdapterProvider } from './core/date-format';
import { retryInterceptor } from './core/retry.interceptor';
import { tokenInterceptor } from './core/token.interceptor';

export const appConfig = {
  providers: [
    provideAppInitializer(() => inject(AppConfigService).load()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([tokenInterceptor, retryInterceptor])),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    breadhouseDateAdapterProvider,
  ],
};
