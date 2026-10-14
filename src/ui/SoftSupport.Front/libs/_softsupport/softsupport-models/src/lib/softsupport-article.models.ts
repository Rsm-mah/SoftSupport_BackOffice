import { LookupItem } from './softsupport-user.models';

/** Valeurs de la colonne `option` : « 1 » = interne, « 2 » = clients. */
export const OPTION_INTERNE = '1';
export const OPTION_CLIENT = '2';

export function isInterne(options: string | null | undefined): boolean {
  return (options ?? '').split(',').includes(OPTION_INTERNE);
}

export function isClient(options: string | null | undefined): boolean {
  return (options ?? '').split(',').includes(OPTION_CLIENT);
}

export interface ArticleListItem {
  articleId: number;
  code: string | null;
  title: string;
  designation: string;
  productName: string | null;
  categoryCode: string | null;
  isValidated: boolean;
  options: string | null;
  viewNumber: number;
  createdAt: string;
}

export interface ArticlesQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  productId?: number | null;
  versionId?: number | null;
  themeId?: number | null;
  option?: string | null;
}

export interface ArticleStats {
  total: number;
  validated: number;
  pending: number;
  client: number;
}

export interface ArticleDetail {
  articleId: number;
  code: string | null;
  title: string;
  designation: string;
  problem: string;
  solution: string;
  isValidated: boolean;
  isEnabled: boolean;
  inCrm: boolean;
  viewNumber: number;
  createdAt: string;
  lastUpdate: string | null;
  productName: string | null;
  versionName: string | null;
  themeName: string | null;
  categoryCode: string | null;
  authorName: string | null;
  options: string | null;
  ticketNumber: string | null;
  requestNumber: string | null;
}

export interface MyArticle {
  articleId: number;
  code: string | null;
  title: string;
  productName: string | null;
  isValidated: boolean;
  viewNumber: number;
  createdAt: string;
  ticketNumber: string | null;
  requestNumber: string | null;
}

export interface RefusedArticle {
  articleId: number;
  code: string | null;
  title: string;
  productName: string | null;
  viewNumber: number;
  createdAt: string;
  comment: string | null;
}

export interface PendingArticle {
  articleId: number;
  code: string | null;
  title: string;
  productName: string | null;
  authorName: string | null;
  viewNumber: number;
  createdAt: string;
  ticketNumber: string | null;
  requestNumber: string | null;
  inCrm: boolean;
}

export interface EditableArticle {
  articleId: number;
  code: string | null;
  title: string;
  problem: string;
  solution: string;
  productId: number | null;
  versionId: number | null;
  themeId: number | null;
  ticketNumber: string | null;
  requestNumber: string | null;
  options: string | null;
  comment: string | null;
  isValidated: boolean;
  isEnabled: boolean;
  authorName: string | null;
}

export interface ProductLookup extends LookupItem {
  categoryCode?: string | null;
}

export interface ArticleReferences {
  products: ProductLookup[];
  versions: LookupItem[];
  themes: LookupItem[];
}

export interface SaveArticlePayload {
  title: string;
  problem: string;
  solution: string;
  productId: number | null;
  versionId: number | null;
  themeId: number | null;
  ticketNumber: string | null;
  requestNumber: string | null;
}

export interface ValidateArticlePayload extends SaveArticlePayload {
  interne: boolean;
  client: boolean;
}

export interface PendingCount {
  isValidator: boolean;
  count: number;
}
