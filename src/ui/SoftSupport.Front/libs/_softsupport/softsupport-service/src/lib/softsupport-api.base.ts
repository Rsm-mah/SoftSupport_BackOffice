import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { AppConfigService } from '@soft-mfe/shared-services';
import { SoftSupportApiResponse } from '@softsupport/models';
import { map, Observable } from 'rxjs';

export abstract class SoftSupportApiBase {
  protected readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  protected url(path: string): string {
    return `${this.config.apiBaseUrl}/softsupport/${path}`;
  }

  protected getData<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http.get<SoftSupportApiResponse<T>>(this.url(path), { params }).pipe(map(response => response.data));
  }

  protected sendMessage(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Observable<string> {
    return this.http
      .request<SoftSupportApiResponse<unknown>>(method, this.url(path), { body })
      .pipe(map(response => response.message));
  }

  protected sendData<T>(method: 'POST' | 'PUT', path: string, body: unknown): Observable<SoftSupportApiResponse<T>> {
    return this.http.request<SoftSupportApiResponse<T>>(method, this.url(path), { body });
  }

  protected download(path: string, params?: HttpParams): Observable<Blob> {
    return this.http.get(this.url(path), { params, responseType: 'blob' });
  }

  protected params(values: Record<string, string | number | null | undefined>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(values)) {
      if (value === null || value === undefined) {
        continue;
      }
      const text = String(value).trim();
      if (text) {
        params = params.set(key, text);
      }
    }
    return params;
  }
}
