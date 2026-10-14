import { Route } from '@angular/router';
import { ADMIN_ROLES, COMMENT_ROLES, COMMERCIAL_ROLES, DASHBOARD_ROLES, REDACTION_ROLES } from '@softsupport/models';
import {
  softSupportAuthGuard,
  softSupportGuestGuard,
  softSupportRoleGuard,
  softSupportValidatorGuard,
} from '@softsupport/service';
import { AppLayoutComponent } from './layout/app-layout.component';
import { HomeRedirectComponent } from './pages/home-redirect.component';
import { ForbiddenPageComponent, NotFoundPageComponent } from './pages/status-pages.component';

const feature = () => import('@softsupport/feature');

export const appRoutes: Route[] = [
  {
    path: 'login',
    canActivate: [softSupportGuestGuard],
    title: 'SoftSupport — Connexion',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [softSupportAuthGuard],
    children: [
      { path: '', pathMatch: 'full', component: HomeRedirectComponent },
      {
        path: 'tableau-de-bord',
        title: 'SoftSupport — Tableau de bord',
        canActivate: [softSupportRoleGuard],
        data: { roles: DASHBOARD_ROLES },
        loadComponent: () => feature().then(m => m.SoftSupportDashboardPage),
      },
      {
        path: 'articles',
        title: 'SoftSupport — Tous les articles',
        loadComponent: () => feature().then(m => m.SoftSupportArticlesPage),
      },
      {
        path: 'articles-recents',
        title: 'SoftSupport — Ajoutés récemment',
        loadComponent: () => feature().then(m => m.SoftSupportRecentArticlesPage),
      },
      {
        path: 'mes-articles',
        title: 'SoftSupport — Mes articles',
        canActivate: [softSupportRoleGuard],
        data: { roles: REDACTION_ROLES },
        loadComponent: () => feature().then(m => m.SoftSupportMyArticlesPage),
      },
      {
        path: 'non-valides',
        title: 'SoftSupport — Non validés',
        canActivate: [softSupportRoleGuard],
        data: { roles: REDACTION_ROLES },
        loadComponent: () => feature().then(m => m.SoftSupportRefusedArticlesPage),
      },
      {
        path: 'validation',
        title: 'SoftSupport — En attente de validation',
        canActivate: [softSupportValidatorGuard],
        loadComponent: () => feature().then(m => m.SoftSupportValidationPage),
      },
      {
        path: 'produits',
        title: 'SoftSupport — Produits',
        canActivate: [softSupportRoleGuard],
        data: { roles: ADMIN_ROLES },
        loadComponent: () => feature().then(m => m.SoftSupportProductsPage),
      },
      {
        path: 'packs',
        title: 'SoftSupport — Packs',
        canActivate: [softSupportRoleGuard],
        data: { roles: ADMIN_ROLES },
        loadComponent: () => feature().then(m => m.SoftSupportPacksPage),
      },
      {
        path: 'versions',
        title: 'SoftSupport — Versions',
        canActivate: [softSupportRoleGuard],
        data: { roles: ADMIN_ROLES, resource: 'versions' },
        loadComponent: () => feature().then(m => m.SoftSupportNamedItemsPage),
      },
      {
        path: 'themes',
        title: 'SoftSupport — Thèmes',
        canActivate: [softSupportRoleGuard],
        data: { roles: ADMIN_ROLES, resource: 'themes' },
        loadComponent: () => feature().then(m => m.SoftSupportNamedItemsPage),
      },
      {
        path: 'categories',
        title: 'SoftSupport — Catégories',
        canActivate: [softSupportRoleGuard],
        data: { roles: ADMIN_ROLES },
        loadComponent: () => feature().then(m => m.SoftSupportCategoriesPage),
      },
      {
        path: 'commentaires',
        title: 'SoftSupport — Commentaires clients',
        canActivate: [softSupportRoleGuard],
        data: { roles: COMMENT_ROLES },
        loadComponent: () => feature().then(m => m.SoftSupportCommentsPage),
      },
      {
        path: 'clients',
        canActivate: [softSupportRoleGuard],
        data: { roles: COMMERCIAL_ROLES },
        children: [
          { path: '', title: 'SoftSupport — Clients', loadComponent: () => feature().then(m => m.SoftSupportCompaniesPage) },
          { path: 'nouveau', title: 'SoftSupport — Nouvelle société', loadComponent: () => feature().then(m => m.SoftSupportCompanyFormPage) },
          { path: ':id', title: 'SoftSupport — Société', loadComponent: () => feature().then(m => m.SoftSupportCompanyDetailPage) },
          { path: ':id/modifier', title: 'SoftSupport — Modifier la société', loadComponent: () => feature().then(m => m.SoftSupportCompanyFormPage) },
        ],
      },
      {
        path: 'historique',
        title: 'SoftSupport — Historique des contrats',
        canActivate: [softSupportRoleGuard],
        data: { roles: COMMERCIAL_ROLES },
        loadComponent: () => feature().then(m => m.SoftSupportHistoryPage),
      },
      {
        path: 'utilisateurs',
        title: 'SoftSupport — Utilisateurs',
        canActivate: [softSupportRoleGuard],
        data: { roles: ADMIN_ROLES },
        loadComponent: () => feature().then(m => m.SoftSupportUsersPage),
      },
      {
        path: 'profil',
        title: 'SoftSupport — Mon profil',
        loadComponent: () => feature().then(m => m.SoftSupportProfilePage),
      },
      { path: 'acces-refuse', title: 'SoftSupport — Accès refusé', component: ForbiddenPageComponent },
      { path: '**', title: 'SoftSupport — Page introuvable', component: NotFoundPageComponent },
    ],
  },
];
