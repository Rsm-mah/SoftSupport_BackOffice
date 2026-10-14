import { Injectable } from '@angular/core';
import {
  ArticleDetail,
  ArticleListItem,
  ArticleReferences,
  ArticlesQuery,
  ArticleStats,
  EditableArticle,
  MyArticle,
  PendingArticle,
  PendingCount,
  RefusedArticle,
  SaveArticlePayload,
  SOFTSUPPORT_DEFAULT_PAGE_SIZE,
  SoftSupportPagedResult,
  ValidateArticlePayload,
} from '@softsupport/models';
import { Observable, shareReplay } from 'rxjs';
import { SoftSupportApiBase } from './softsupport-api.base';

@Injectable({ providedIn: 'root' })
export class SoftSupportArticleService extends SoftSupportApiBase {
  private references$: Observable<ArticleReferences> | null = null;

  search(query: ArticlesQuery = {}): Observable<SoftSupportPagedResult<ArticleListItem>> {
    return this.getData<SoftSupportPagedResult<ArticleListItem>>(
      'articles',
      this.params({
        page: query.page ?? 1,
        pageSize: query.pageSize ?? SOFTSUPPORT_DEFAULT_PAGE_SIZE,
        search: query.search,
        productId: query.productId,
        versionId: query.versionId,
        themeId: query.themeId,
        option: query.option,
      }),
    );
  }

  getStats(): Observable<ArticleStats> {
    return this.getData<ArticleStats>('articles/stats');
  }

  getRecent(): Observable<ArticleListItem[]> {
    return this.getData<ArticleListItem[]>('articles/recent');
  }

  getReferences(refresh = false): Observable<ArticleReferences> {
    if (!this.references$ || refresh) {
      this.references$ = this.getData<ArticleReferences>('articles/references').pipe(shareReplay(1));
    }
    return this.references$;
  }

  open(articleId: number): Observable<ArticleDetail> {
    return this.getData<ArticleDetail>(`articles/${articleId}`);
  }

  getMine(): Observable<MyArticle[]> {
    return this.getData<MyArticle[]>('articles/mine');
  }

  getRefused(): Observable<RefusedArticle[]> {
    return this.getData<RefusedArticle[]>('articles/refused');
  }

  getEditable(articleId: number): Observable<EditableArticle> {
    return this.getData<EditableArticle>(`articles/${articleId}/edit`);
  }

  create(payload: SaveArticlePayload): Observable<string> {
    return this.sendMessage('POST', 'articles', payload);
  }

  update(articleId: number, payload: SaveArticlePayload): Observable<string> {
    return this.sendMessage('PUT', `articles/${articleId}`, payload);
  }

  delete(articleId: number): Observable<string> {
    return this.sendMessage('DELETE', `articles/${articleId}`);
  }

  changeOptions(articleId: number, interne: boolean, client: boolean): Observable<string> {
    return this.sendMessage('PUT', `articles/${articleId}/options`, { interne, client });
  }

  sendBackToValidation(articleId: number): Observable<string> {
    return this.sendMessage('POST', `articles/${articleId}/revalidate`);
  }

  export(from: string, to: string, departementId: number): Observable<Blob> {
    return this.download('articles/export', this.params({ from, to, departementId }));
  }
}

@Injectable({ providedIn: 'root' })
export class SoftSupportValidationService extends SoftSupportApiBase {
  count(): Observable<PendingCount> {
    return this.getData<PendingCount>('validation/count');
  }

  getPending(): Observable<PendingArticle[]> {
    return this.getData<PendingArticle[]>('validation/articles');
  }

  get(articleId: number): Observable<EditableArticle> {
    return this.getData<EditableArticle>(`validation/articles/${articleId}`);
  }

  validate(articleId: number, payload: ValidateArticlePayload): Observable<string> {
    return this.sendMessage('POST', `validation/articles/${articleId}/validate`, payload);
  }

  deny(articleId: number, comment: string): Observable<string> {
    return this.sendMessage('POST', `validation/articles/${articleId}/deny`, { comment });
  }

  remove(articleId: number, comment: string): Observable<string> {
    return this.sendMessage('POST', `validation/articles/${articleId}/remove`, { comment });
  }

  importFromCrm(): Observable<string> {
    return this.sendMessage('POST', 'validation/import-crm');
  }
}
