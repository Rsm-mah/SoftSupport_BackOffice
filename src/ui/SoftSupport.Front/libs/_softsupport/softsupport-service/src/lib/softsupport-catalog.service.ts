import { Injectable } from '@angular/core';
import {
  ArticleRef,
  CategoryDetail,
  CategoryListItem,
  LookupItem,
  NamedItem,
  PackItem,
  ProductListItem,
  SaveCategoryPayload,
  SaveProductPayload,
} from '@softsupport/models';
import { Observable } from 'rxjs';
import { SoftSupportApiBase } from './softsupport-api.base';

@Injectable({ providedIn: 'root' })
export class SoftSupportProductService extends SoftSupportApiBase {
  getAll(): Observable<ProductListItem[]> {
    return this.getData<ProductListItem[]>('products');
  }

  getLookup(): Observable<LookupItem[]> {
    return this.getData<LookupItem[]>('products/lookup');
  }

  getArticles(productId: number): Observable<ArticleRef[]> {
    return this.getData<ArticleRef[]>(`products/${productId}/articles`);
  }

  create(payload: SaveProductPayload): Observable<string> {
    return this.sendMessage('POST', 'products', payload);
  }

  update(productId: number, payload: SaveProductPayload): Observable<string> {
    return this.sendMessage('PUT', `products/${productId}`, payload);
  }

  delete(productId: number): Observable<string> {
    return this.sendMessage('DELETE', `products/${productId}`);
  }

  importFromCrm(): Observable<string> {
    return this.sendMessage('POST', 'products/import-crm');
  }

  getPacks(): Observable<PackItem[]> {
    return this.getData<PackItem[]>('packs');
  }

  savePack(productId: number, includedProductIds: number[]): Observable<string> {
    return this.sendMessage('PUT', `packs/${productId}`, { includedProductIds });
  }

  deletePack(productId: number): Observable<string> {
    return this.sendMessage('DELETE', `packs/${productId}`);
  }
}

export type NamedResource = 'themes' | 'versions';

@Injectable({ providedIn: 'root' })
export class SoftSupportNamedItemService extends SoftSupportApiBase {
  getAll(resource: NamedResource): Observable<NamedItem[]> {
    return this.getData<NamedItem[]>(resource);
  }

  getArticles(resource: NamedResource, id: number): Observable<ArticleRef[]> {
    return this.getData<ArticleRef[]>(`${resource}/${id}/articles`);
  }

  create(resource: NamedResource, name: string): Observable<string> {
    return this.sendMessage('POST', resource, { name });
  }

  update(resource: NamedResource, id: number, name: string): Observable<string> {
    return this.sendMessage('PUT', `${resource}/${id}`, { name });
  }

  delete(resource: NamedResource, id: number): Observable<string> {
    return this.sendMessage('DELETE', `${resource}/${id}`);
  }

  importFromCrm(resource: NamedResource): Observable<string> {
    return this.sendMessage('POST', `${resource}/import-crm`);
  }
}

@Injectable({ providedIn: 'root' })
export class SoftSupportCategoryService extends SoftSupportApiBase {
  getAll(): Observable<CategoryListItem[]> {
    return this.getData<CategoryListItem[]>('categories');
  }

  get(categoryId: number): Observable<CategoryDetail> {
    return this.getData<CategoryDetail>(`categories/${categoryId}`);
  }

  getAssignableProducts(categoryId: number | null): Observable<LookupItem[]> {
    return this.getData<LookupItem[]>('categories/assignable-products', this.params({ categoryId }));
  }

  create(payload: SaveCategoryPayload): Observable<string> {
    return this.sendMessage('POST', 'categories', payload);
  }

  update(categoryId: number, payload: SaveCategoryPayload): Observable<string> {
    return this.sendMessage('PUT', `categories/${categoryId}`, payload);
  }

  delete(categoryId: number): Observable<string> {
    return this.sendMessage('DELETE', `categories/${categoryId}`);
  }
}
