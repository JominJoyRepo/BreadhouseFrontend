import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { Observable, TimeoutError, retry, throwError, timer, timeout } from 'rxjs';

const RETRYABLE_STATUS = [408, 429, 500, 502, 503, 504];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;
const REQUEST_TIMEOUT_MS = 75_000;

/**
 * Handles transient failures, including Render free-tier cold starts
 * (instances sleep after ~15 min idle and take 30-60 s to wake).
 *
 * Every request gets a generous timeout so a dead instance never hangs
 * the UI forever.
 *
 * GET:  retried on no-response/timeout and 5xx/429/408/504.
 * POST: retried ONLY when no response was received at all (network error
 *       or timeout). This is safe because all write endpoints are
 *       idempotent (login issues a disposable token, submitting
 *       requirements upserts per store+date, logout deletes a token).
 *       A real server error response is never retried.
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'GET') {
    return next(req).pipe(
      timeout(REQUEST_TIMEOUT_MS),
      retry({
        count: MAX_RETRIES,
        delay: (error: unknown): Observable<unknown> =>
          canRetry(error) || isRetryableStatus(error) ? timer(RETRY_DELAY_MS) : throwError(() => error),
      }),
    );
  }
  if (req.method === 'POST') {
    return next(req).pipe(
      timeout(REQUEST_TIMEOUT_MS),
      retry({
        count: MAX_RETRIES,
        delay: (error: unknown): Observable<unknown> =>
          isNoResponse(error) ? timer(RETRY_DELAY_MS) : throwError(() => error),
      }),
    );
  }
  return next(req).pipe(timeout(REQUEST_TIMEOUT_MS));
};

function isNoResponse(error: unknown): boolean {
  return (
    error instanceof TimeoutError ||
    (error instanceof HttpErrorResponse && error.status === 0)
  );
}

function canRetry(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 0;
}

function isRetryableStatus(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse && RETRYABLE_STATUS.includes(error.status)
  );
}
