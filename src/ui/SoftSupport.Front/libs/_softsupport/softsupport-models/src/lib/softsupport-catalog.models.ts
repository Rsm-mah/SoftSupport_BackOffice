import { LookupItem } from './softsupport-user.models';

export interface ArticleRef {
  articleId: number;
  code: string | null;
  title: string;
}

export interface ProductListItem {
  productId: number;
  name: string;
  categoryId: number | null;
  categoryCode: string | null;
  categoryName: string | null;
  articleCount: number;
  isLocal: boolean;
}

export interface SaveProductPayload {
  name: string;
  categoryId: number | null;
}

export interface NamedItem {
  id: number;
  name: string;
  articleCount: number;
}

export interface PackItem {
  productId: number;
  productName: string;
  includedProducts: LookupItem[];
}

export interface CategoryListItem {
  categoryId: number;
  name: string;
  code: string;
  productCount: number;
}

export interface CategoryDetail {
  categoryId: number;
  name: string;
  code: string;
  products: LookupItem[];
}

export interface SaveCategoryPayload {
  name: string;
  code: string;
  productIds: number[];
}
