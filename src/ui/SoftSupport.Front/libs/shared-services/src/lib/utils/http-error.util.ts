import { HttpErrorResponse } from '@angular/common/http';
import { HttpErrorWithDetail } from '@soft-mfe/shared-models';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

type ApiErrorBody = {
  detail?: string;
  message?: string;
  title?: string;
  errors?: Record<string, unknown>;
};

function formatValidationErrors(errors: unknown): string | null {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) {
    return null;
  }

  const lines = Object.entries(errors as Record<string, unknown>)
    .map(([field, messages]) => {
      const texts = (Array.isArray(messages) ? messages : [messages])
        .filter((m): m is string => typeof m === 'string' && m.trim().length > 0)
        .map(m => m.trim());
      if (texts.length === 0) {
        return null;
      }
      return field.trim() ? `${field} : ${texts.join(' / ')}` : texts.join(' / ');
    })
    .filter((line): line is string => line !== null);

  return lines.length > 0 ? lines.join(' — ') : null;
}

function parseApiErrorBody(value: unknown): string | null {
  if (typeof value === 'string') {
    try {
      return parseApiErrorBody(JSON.parse(value) as ApiErrorBody);
    } catch {
      return value.trim() || null;
    }
  }

  if (value && typeof value === 'object') {
    const body = value as ApiErrorBody & { messageArguments?: Record<string, unknown> };
    const validation =
      formatValidationErrors(body.errors) ?? formatValidationErrors(body.messageArguments);
    if (validation) {
      const head = body.message ?? body.detail;
      if (head && validation && head.includes(validation.slice(0, Math.min(40, validation.length)))) {
        return head;
      }
      return head ? `${head} — ${validation}` : validation;
    }
    return body.message ?? body.detail ?? body.title ?? null;
  }

  return null;
}

export async function extractHttpErrorMessage(error: HttpErrorResponse): Promise<string | null> {
  if (error.error instanceof Blob) {
    try {
      const blobText = await error.error.text();
      return parseApiErrorBody(JSON.parse(blobText) as ApiErrorBody) ?? (blobText.trim() || null);
    } catch {
      return null;
    }
  }

  if (typeof error.error === 'string') {
    return parseApiErrorBody(error.error);
  }

  return parseApiErrorBody(error.error);
}

export function getApiErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const err = error as HttpErrorWithDetail;
  if (err.parsedDetail?.trim()) {
    return err.parsedDetail.trim();
  }

  const fromBody = parseApiErrorBody(err.error);
  if (fromBody) {
    return fromBody;
  }

  return typeof err.message === 'string' && err.message.trim() ? err.message.trim() : null;
}

export function mapBlobHttpError<T>(source: Observable<T>): Observable<T> {
  return source.pipe(
    catchError((error: HttpErrorResponse) => {
      if (!(error.error instanceof Blob)) {
        return throwError(() => enrichHttpError(error));
      }

      return from(error.error.text()).pipe(
        switchMap(text => throwError(() => enrichHttpError(error, text)))
      );
    })
  );
}

export function enrichHttpError(error: HttpErrorResponse, blobText?: string): HttpErrorWithDetail {
  const enriched = error as HttpErrorWithDetail;

  if (blobText) {
    try {
      const parsed = JSON.parse(blobText) as ApiErrorBody;
      enriched.parsedDetail = parseApiErrorBody(parsed) ?? blobText;
      return enriched;
    } catch {
      enriched.parsedDetail = blobText;
      return enriched;
    }
  }

  const parsedMessage = parseApiErrorBody(error.error);
  if (parsedMessage) {
    enriched.parsedDetail = parsedMessage
      .split(';')
      .map(message => message.trim())
      .find(Boolean);
    return enriched;
  }

  if (
    typeof error.error === 'object' &&
    error.error !== null &&
    typeof (error.error as { detail?: string }).detail === 'string'
  ) {
    const detail = (error.error as { detail: string }).detail;
    enriched.parsedDetail = detail
      .split(';')
      .map(message => message.trim())
      .find(Boolean);
  }

  return enriched;
}
