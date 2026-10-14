import { COMMENT_ROLES } from './softsupport-comment.models';
import { DASHBOARD_ROLES } from './softsupport-dashboard.models';
import { ADMIN_ROLES, ALL_ROLES, COMMERCIAL_ROLES, REDACTION_ROLES } from './softsupport-roles';

export interface SoftSupportNavItem {
  id: string;
  translationKey: string;
  icon: string;
  route?: string;
  roles: readonly string[];
  requiresValidator?: boolean;
  children?: SoftSupportNavItem[];
}

export const SOFTSUPPORT_SIDEBAR: readonly SoftSupportNavItem[] = [
  { id: 'dashboard', translationKey: 'softsupport.sidebar.dashboard', icon: 'dashboard', route: 'tableau-de-bord', roles: DASHBOARD_ROLES },
  {
    id: 'articles',
    translationKey: 'softsupport.sidebar.articles',
    icon: 'books',
    roles: ALL_ROLES,
    children: [
      { id: 'articles-all', translationKey: 'softsupport.sidebar.articlesAll', icon: 'book', route: 'articles', roles: ALL_ROLES },
      { id: 'articles-recent', translationKey: 'softsupport.sidebar.articlesRecent', icon: 'clock', route: 'articles-recents', roles: ALL_ROLES },
      { id: 'articles-mine', translationKey: 'softsupport.sidebar.articlesMine', icon: 'edit', route: 'mes-articles', roles: REDACTION_ROLES },
      {
        id: 'articles-pending',
        translationKey: 'softsupport.sidebar.articlesPending',
        icon: 'check-circle',
        route: 'validation',
        roles: ALL_ROLES,
        requiresValidator: true,
      },
      { id: 'articles-refused', translationKey: 'softsupport.sidebar.articlesRefused', icon: 'x-circle', route: 'non-valides', roles: REDACTION_ROLES },
    ],
  },
  { id: 'comments', translationKey: 'softsupport.sidebar.comments', icon: 'chat', route: 'commentaires', roles: COMMENT_ROLES },
  {
    id: 'catalog',
    translationKey: 'softsupport.sidebar.catalog',
    icon: 'layers',
    roles: ADMIN_ROLES,
    children: [
      { id: 'products', translationKey: 'softsupport.sidebar.products', icon: 'package', route: 'produits', roles: ADMIN_ROLES },
      { id: 'packs', translationKey: 'softsupport.sidebar.packs', icon: 'inventory', route: 'packs', roles: ADMIN_ROLES },
      { id: 'versions', translationKey: 'softsupport.sidebar.versions', icon: 'tag', route: 'versions', roles: ADMIN_ROLES },
      { id: 'themes', translationKey: 'softsupport.sidebar.themes', icon: 'list', route: 'themes', roles: ADMIN_ROLES },
      { id: 'categories', translationKey: 'softsupport.sidebar.categories', icon: 'folder', route: 'categories', roles: ADMIN_ROLES },
    ],
  },
  { id: 'customers', translationKey: 'softsupport.sidebar.customers', icon: 'building-library', route: 'clients', roles: COMMERCIAL_ROLES },
  { id: 'history', translationKey: 'softsupport.sidebar.history', icon: 'archive', route: 'historique', roles: COMMERCIAL_ROLES },
  { id: 'users', translationKey: 'softsupport.sidebar.users', icon: 'users', route: 'utilisateurs', roles: ADMIN_ROLES },
  { id: 'profile', translationKey: 'softsupport.sidebar.profile', icon: 'user', route: 'profil', roles: ALL_ROLES },
];
