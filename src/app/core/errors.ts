import { HttpErrorResponse } from '@angular/common/http';

export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { detail?: string | { msg: string }[] } | undefined;
    if (body && typeof body === 'object' && body.detail) {
      if (typeof body.detail === 'string') {
        return body.detail;
      }
      return body.detail.map((d) => d.msg).join(', ');
    }
    if (typeof err.error === 'string' && err.error) {
      return err.error;
    }
    return err.status ? `Request failed (${err.status})` : 'Network error - is the backend running?';
  }
  return 'Something went wrong';
}
