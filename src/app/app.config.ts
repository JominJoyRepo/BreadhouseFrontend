import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { retryInterceptor } from './core/retry.interceptor';
import { tokenInterceptor } from './core/token.interceptor';

export const appConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([tokenInterceptor, retryInterceptor])),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
  ],
};
