import { ADMIN_ROLES, COMMERCIAL_ROLES } from './softsupport-roles';

export const DASHBOARD_ARTICLE_ROLES: readonly string[] = ADMIN_ROLES;
export const DASHBOARD_CUSTOMER_ROLES: readonly string[] = COMMERCIAL_ROLES;
export const DASHBOARD_ROLES: readonly string[] = [...DASHBOARD_ARTICLE_ROLES, ...DASHBOARD_CUSTOMER_ROLES];

export interface TopArticle {
  articleId: number;
  code: string | null;
  title: string;
  productName: string | null;
  viewNumber: number;
  likes: number;
  dislikes: number;
  satisfactionPercent: number | null;
}

export interface ArticleDashboard {
  publishedArticles: number;
  totalViews: number;
  totalLikes: number;
  totalDislikes: number;
  poorlyRatedCount: number;
  mostRead: TopArticle[];
  worstRated: TopArticle[];
}

export interface ExpiringContractItem {
  contractId: number;
  companyId: number;
  companyName: string;
  productName: string | null;
  startDate: string;
  endDate: string;
  daysLeft: number;
  renewed: boolean;
}

export type QuotaStatus = 'Available' | 'Full' | 'Exceeded';

export interface CompanyQuota {
  companyId: number;
  companyName: string;
  shortName: string;
  userNumber: number;
  accountCount: number;
  status: QuotaStatus;
}

export interface CustomerDashboard {
  monthStart: string;
  monthEnd: string;
  expiringThisMonth: ExpiringContractItem[];
  toRenewCount: number;
  quotas: CompanyQuota[];
  fullCount: number;
  exceededCount: number;
}
