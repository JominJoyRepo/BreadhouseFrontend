import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Observable, retry, throwError, timer } from 'rxjs';

const RETRYABLE_STATUS = [408, 429, 500, 502, 503, 504];
const MAX_RETRIES = 2;

/**
 * Automatically retries GET requests on transient failures
 * (network errors or 5xx/429 responses). POST/PUT/DELETE are left
 * untouched so writes are never accidentally duplicated.
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    return next(req);
  }
  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error: unknown): Observable<unknown> => {
        if (error instanceof HttpErrorResponse) {
          const transient = error.status === 0 || RETRYABLE_STATUS.includes(error.status);
          if (transient) {
            return timer(1000);
          }
        }
        return throwError(() => error);
      },
    }),
  );
};
