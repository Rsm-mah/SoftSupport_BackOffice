import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CardDashboardComponent, DataTableEmptyStateComponent, SoftBadgeComponent, SoftIconComponent } from '@soft-mfe/shared-components';
import { CardDashboardConfig } from '@soft-mfe/shared-models';
import { getApiErrorMessage } from '@soft-mfe/shared-services';
import {
  ArticleDashboard,
  CompanyQuota,
  CustomerDashboard,
  DASHBOARD_ARTICLE_ROLES,
  DASHBOARD_CUSTOMER_ROLES,
  ExpiringContractItem,
  QuotaStatus,
  TopArticle,
} from '@softsupport/models';
import { SoftSupportDashboardService, SoftSupportSessionService } from '@softsupport/service';
import { SoftSupportArticleCodeComponent, SoftSupportArticleDetailModalComponent, SoftSupportPageHeaderComponent } from '@softsupport/ui';

const QUOTA_VARIANT: Record<QuotaStatus, 'success' | 'warning' | 'danger'> = {
  Available: 'success',
  Full: 'warning',
  Exceeded: 'danger',
};

@Component({
  selector: 'softsupport-dashboard-page',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    TranslatePipe,
    CardDashboardComponent,
    DataTableEmptyStateComponent,
    SoftBadgeComponent,
    SoftIconComponent,
    SoftSupportArticleCodeComponent,
    SoftSupportArticleDetailModalComponent,
    SoftSupportPageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .dash-bar {
        height: 6px;
        overflow: hidden;
        border-radius: 999px;
        background: #f1f5f9;
      }

      .dash-bar > span {
        display: block;
        height: 100%;
        border-radius: inherit;
        transform-origin: left;
        animation: dash-grow 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
        animation-delay: calc(var(--i, 0) * 60ms + 0.2s);
      }

      @keyframes dash-grow {
        from {
          transform: scaleX(0);
        }
      }

      .dash-rank {
        display: inline-flex;
        height: 22px;
        width: 22px;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        border-radius: 7px;
        background: #f1f5f9;
        color: #475569;
        font-size: 11px;
        font-weight: 700;
      }

      .dash-rank--top {
        background: #e0f2fe;
        color: #0369a1;
      }

      @media (prefers-reduced-motion: reduce) {
        .dash-bar > span {
          animation: none;
        }
      }
    `,
  ],
  template: `
    <section data-testid="softsupport-dashboard">
      <softsupport-page-header
        [heading]="'softsupport.dashboard.title' | translate"
        [subtitle]="'softsupport.dashboard.subtitle' | translate"
        [breadcrumb]="['softsupport.sidebar.dashboard' | translate]"
      />

      @if (showArticles()) {
        <div class="ss-reveal mb-3 flex items-center gap-2" style="--delay: 0.1s">
          <soft-icon name="books" size="md" class="text-cyan-700" />
          <h2 class="text-lg font-semibold text-slate-800">{{ 'softsupport.dashboard.articles.title' | translate }}</h2>
        </div>

        @if (articlesError()) {
          <p class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ articlesError() }}</p>
        } @else {
          <soft-card-dashboard class="ss-reveal block" style="--delay: 0.15s" [cards]="articleCards()" [loading]="articles() === null" />

          <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div class="ss-reveal overflow-hidden rounded-xl border border-slate-200 bg-white" style="--delay: 0.22s">
              <div class="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <soft-icon name="eye" size="sm" class="text-sky-600" />{{ 'softsupport.dashboard.articles.mostRead' | translate }}
                </h3>
                <span class="text-xs text-slate-400">{{ 'softsupport.dashboard.articles.top' | translate: { count: articles()?.mostRead?.length ?? 0 } }}</span>
              </div>
              @if (articles() === null) {
                <p class="px-5 py-8 text-center text-sm text-slate-500">{{ 'common.loading' | translate }}</p>
              } @else if (articles()!.mostRead.length === 0) {
                <div class="px-5 py-8"><soft-data-table-empty-state [message]="'softsupport.dashboard.articles.noViews' | translate" [hasActiveFilters]="false" /></div>
              } @else {
                <ul class="divide-y divide-slate-100">
                  @for (article of articles()!.mostRead; track article.articleId; let i = $index) {
                    <li class="ss-row cursor-pointer px-5 py-3 hover:bg-slate-50" [style.--i]="i" (click)="detailId.set(article.articleId)">
                      <div class="flex items-center gap-3">
                        <span class="dash-rank" [class.dash-rank--top]="i < 3">{{ i + 1 }}</span>
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-medium text-slate-900">{{ article.title }}</p>
                          <p class="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                            <softsupport-article-code [code]="article.code" />
                            <span class="truncate">{{ article.productName || '—' }}</span>
                          </p>
                        </div>
                        <span class="shrink-0 text-sm font-semibold text-slate-800">{{ article.viewNumber | number }}</span>
                      </div>
                      <div class="dash-bar ml-[34px] mt-2"><span class="bg-sky-500" [style.width.%]="viewShare(article)" [style.--i]="i"></span></div>
                    </li>
                  }
                </ul>
              }
            </div>

            <div class="ss-reveal overflow-hidden rounded-xl border border-slate-200 bg-white" style="--delay: 0.28s">
              <div class="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <soft-icon name="thumbs-down" size="sm" class="text-red-500" />{{ 'softsupport.dashboard.articles.worstRated' | translate }}
                </h3>
                <span class="text-xs text-slate-400">{{ 'softsupport.dashboard.articles.worstHint' | translate }}</span>
              </div>
              @if (articles() === null) {
                <p class="px-5 py-8 text-center text-sm text-slate-500">{{ 'common.loading' | translate }}</p>
              } @else if (articles()!.worstRated.length === 0) {
                <div class="px-5 py-8"><soft-data-table-empty-state [message]="'softsupport.dashboard.articles.noPoorlyRated' | translate" [hasActiveFilters]="false" /></div>
              } @else {
                <ul class="divide-y divide-slate-100">
                  @for (article of articles()!.worstRated; track article.articleId; let i = $index) {
                    <li class="ss-row cursor-pointer px-5 py-3 hover:bg-slate-50" [style.--i]="i" (click)="detailId.set(article.articleId)">
                      <div class="flex items-center gap-3">
                        <span class="dash-rank">{{ i + 1 }}</span>
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-medium text-slate-900">{{ article.title }}</p>
                          <p class="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                            <softsupport-article-code [code]="article.code" />
                            <span class="truncate">{{ article.productName || '—' }}</span>
                          </p>
                        </div>
                        <div class="flex shrink-0 items-center gap-3 text-xs font-semibold">
                          <span class="inline-flex items-center gap-1 text-emerald-700"><soft-icon name="thumbs-up" size="sm" />{{ article.likes }}</span>
                          <span class="inline-flex items-center gap-1 text-red-600"><soft-icon name="thumbs-down" size="sm" />{{ article.dislikes }}</span>
                        </div>
                      </div>
                      <div class="ml-[34px] mt-2 flex items-center gap-2">
                        <div class="dash-bar flex-1"><span class="bg-emerald-500" [style.width.%]="article.satisfactionPercent ?? 0" [style.--i]="i"></span></div>
                        <span class="w-24 text-right text-[11px] text-slate-500">
                          {{ 'softsupport.dashboard.articles.satisfaction' | translate: { percent: article.satisfactionPercent ?? 0 } }}
                        </span>
                      </div>
                    </li>
                  }
                </ul>
              }
            </div>
          </div>
        }
      }

      @if (showCustomers()) {
        <div class="ss-reveal mb-3 flex items-center gap-2" [class.mt-8]="showArticles()" style="--delay: 0.1s">
          <soft-icon name="building-library" size="md" class="text-cyan-700" />
          <h2 class="text-lg font-semibold text-slate-800">{{ 'softsupport.dashboard.customers.title' | translate }}</h2>
        </div>

        @if (customersError()) {
          <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ customersError() }}</p>
        } @else {
          <soft-card-dashboard class="ss-reveal block" style="--delay: 0.15s" [cards]="customerCards()" [loading]="customers() === null" />

          <div class="ss-reveal mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white" style="--delay: 0.22s">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
              <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <soft-icon name="calendar" size="sm" class="text-amber-600" />{{ 'softsupport.dashboard.customers.expiring' | translate }}
              </h3>
              @if (customers(); as c) {
                <span class="text-xs text-slate-400">{{ c.monthStart | date: 'dd/MM/yyyy' }} → {{ c.monthEnd | date: 'dd/MM/yyyy' }}</span>
              }
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full text-left text-sm">
                <thead class="bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
                  <tr>
                    <th class="px-4 py-3 font-semibold">{{ 'softsupport.companies.fields.name' | translate }}</th>
                    <th class="px-4 py-3 font-semibold">{{ 'softsupport.articles.fields.product' | translate }}</th>
                    <th class="px-4 py-3 font-semibold">{{ 'softsupport.contracts.fields.start' | translate }}</th>
                    <th class="px-4 py-3 font-semibold">{{ 'softsupport.contracts.fields.end' | translate }}</th>
                    <th class="px-4 py-3 font-semibold">{{ 'softsupport.dashboard.customers.remaining' | translate }}</th>
                    <th class="px-4 py-3 font-semibold">{{ 'softsupport.dashboard.customers.renewal' | translate }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @if (customers() === null) {
                    <tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">{{ 'common.loading' | translate }}</td></tr>
                  } @else if (customers()!.expiringThisMonth.length === 0) {
                    <tr><td colspan="6" class="px-4 py-10"><soft-data-table-empty-state [message]="'softsupport.dashboard.customers.noExpiring' | translate" [hasActiveFilters]="false" /></td></tr>
                  } @else {
                    @for (contract of customers()!.expiringThisMonth; track contract.contractId) {
                      <tr class="ss-row hover:bg-slate-50" [style.--i]="$index">
                        <td class="px-4 py-3">
                          <a class="font-medium text-slate-900 hover:text-blue-700" [routerLink]="['/clients', contract.companyId]">{{ contract.companyName }}</a>
                        </td>
                        <td class="px-4 py-3 text-slate-700">{{ contract.productName || '—' }}</td>
                        <td class="whitespace-nowrap px-4 py-3 text-slate-700">{{ contract.startDate | date: 'dd/MM/yyyy' }}</td>
                        <td class="whitespace-nowrap px-4 py-3 text-slate-700">{{ contract.endDate | date: 'dd/MM/yyyy' }}</td>
                        <td class="whitespace-nowrap px-4 py-3">
                          <soft-badge [variant]="remainingVariant(contract)">{{ remainingLabel(contract) }}</soft-badge>
                        </td>
                        <td class="px-4 py-3">
                          @if (contract.renewed) {
                            <soft-badge variant="success">{{ 'softsupport.dashboard.customers.renewed' | translate }}</soft-badge>
                          } @else {
                            <soft-badge variant="secondary">{{ 'softsupport.dashboard.customers.notRenewed' | translate }}</soft-badge>
                          }
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="ss-reveal mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white" style="--delay: 0.28s">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
              <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <soft-icon name="users" size="sm" class="text-indigo-600" />{{ 'softsupport.dashboard.customers.quotas' | translate }}
              </h3>
              <span class="text-xs text-slate-400">{{ 'softsupport.dashboard.customers.quotasHint' | translate }}</span>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full text-left text-sm">
                <thead class="bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
                  <tr>
                    <th class="px-4 py-3 font-semibold">{{ 'softsupport.companies.fields.name' | translate }}</th>
                    <th class="px-4 py-3 font-semibold">{{ 'softsupport.dashboard.customers.accounts' | translate }}</th>
                    <th class="w-1/3 px-4 py-3 font-semibold">{{ 'softsupport.dashboard.customers.usage' | translate }}</th>
                    <th class="px-4 py-3 font-semibold">{{ 'softsupport.articles.columns.status' | translate }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @if (customers() === null) {
                    <tr><td colspan="4" class="px-4 py-8 text-center text-slate-500">{{ 'common.loading' | translate }}</td></tr>
                  } @else if (customers()!.quotas.length === 0) {
                    <tr><td colspan="4" class="px-4 py-10"><soft-data-table-empty-state [message]="'softsupport.dashboard.customers.noCompany' | translate" [hasActiveFilters]="false" /></td></tr>
                  } @else {
                    @for (company of customers()!.quotas; track company.companyId) {
                      <tr class="ss-row hover:bg-slate-50" [style.--i]="$index">
                        <td class="px-4 py-3">
                          <a class="font-medium text-slate-900 hover:text-blue-700" [routerLink]="['/clients', company.companyId]">
                            <span class="text-slate-400">[{{ company.shortName }}]</span> {{ company.companyName }}
                          </a>
                        </td>
                        <td class="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">{{ company.accountCount }} / {{ company.userNumber }}</td>
                        <td class="px-4 py-3">
                          <div class="dash-bar">
                            <span [class]="quotaBarClass(company)" [style.width.%]="quotaPercent(company)" [style.--i]="$index"></span>
                          </div>
                        </td>
                        <td class="px-4 py-3">
                          <soft-badge [variant]="quotaVariant(company)">{{ 'softsupport.dashboard.customers.status.' + company.status | translate }}</soft-badge>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </section>

    <softsupport-article-detail-modal [articleId]="detailId()" (closed)="detailId.set(null)" (changed)="loadArticles()" />
  `,
})
export class SoftSupportDashboardPage implements OnInit {
  private readonly dashboard = inject(SoftSupportDashboardService);
  private readonly session = inject(SoftSupportSessionService);
  private readonly translate = inject(TranslateService);

  readonly showArticles = computed(() => this.session.hasRole(DASHBOARD_ARTICLE_ROLES));
  readonly showCustomers = computed(() => this.session.hasRole(DASHBOARD_CUSTOMER_ROLES));

  readonly articles = signal<ArticleDashboard | null>(null);
  readonly customers = signal<CustomerDashboard | null>(null);
  readonly articlesError = signal<string | null>(null);
  readonly customersError = signal<string | null>(null);
  readonly detailId = signal<number | null>(null);

  readonly articleCards = computed<CardDashboardConfig[]>(() => {
    const data = this.articles();
    return [
      { label: 'softsupport.dashboard.articles.kpi.published', value: data?.publishedArticles ?? 0, color: '#0e7490', icon: 'books' },
      { label: 'softsupport.dashboard.articles.kpi.views', value: data?.totalViews ?? 0, color: '#0284c7', icon: 'eye' },
      {
        label: 'softsupport.dashboard.articles.kpi.votes',
        value: `${data?.totalLikes ?? 0} / ${data?.totalDislikes ?? 0}`,
        color: '#16a34a',
        icon: 'thumbs-up',
      },
      { label: 'softsupport.dashboard.articles.kpi.poorlyRated', value: data?.poorlyRatedCount ?? 0, color: '#dc2626', icon: 'thumbs-down' },
    ];
  });

  readonly customerCards = computed<CardDashboardConfig[]>(() => {
    const data = this.customers();
    return [
      { label: 'softsupport.dashboard.customers.kpi.expiring', value: data?.expiringThisMonth.length ?? 0, color: '#d97706', icon: 'calendar' },
      { label: 'softsupport.dashboard.customers.kpi.toRenew', value: data?.toRenewCount ?? 0, color: '#dc2626', icon: 'clock' },
      { label: 'softsupport.dashboard.customers.kpi.full', value: data?.fullCount ?? 0, color: '#ca8a04', icon: 'users' },
      { label: 'softsupport.dashboard.customers.kpi.exceeded', value: data?.exceededCount ?? 0, color: '#b91c1c', icon: 'exclamation-triangle' },
    ];
  });

  private readonly maxViews = computed(() => Math.max(1, ...(this.articles()?.mostRead ?? []).map(article => article.viewNumber)));

  ngOnInit(): void {
    if (this.showArticles()) {
      this.loadArticles();
    }
    if (this.showCustomers()) {
      this.loadCustomers();
    }
  }

  loadArticles(): void {
    this.dashboard.getArticles().subscribe({
      next: data => this.articles.set(data),
      error: error => this.articlesError.set(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic')),
    });
  }

  viewShare(article: TopArticle): number {
    return Math.round((article.viewNumber / this.maxViews()) * 100);
  }

  remainingLabel(contract: ExpiringContractItem): string {
    return contract.daysLeft < 0
      ? this.translate.instant('softsupport.dashboard.customers.expired', { count: -contract.daysLeft })
      : contract.daysLeft === 0
        ? this.translate.instant('softsupport.dashboard.customers.today')
        : this.translate.instant('softsupport.dashboard.customers.days', { count: contract.daysLeft });
  }

  remainingVariant(contract: ExpiringContractItem): 'danger' | 'warning' | 'info' | 'secondary' {
    if (contract.renewed) {
      return 'secondary';
    }
    return contract.daysLeft < 0 ? 'danger' : contract.daysLeft <= 7 ? 'warning' : 'info';
  }

  quotaPercent(company: CompanyQuota): number {
    return company.userNumber > 0 ? Math.min(100, Math.round((company.accountCount / company.userNumber) * 100)) : 100;
  }

  quotaVariant(company: CompanyQuota): 'success' | 'warning' | 'danger' {
    return QUOTA_VARIANT[company.status];
  }

  quotaBarClass(company: CompanyQuota): string {
    return company.status === 'Exceeded' ? 'bg-red-500' : company.status === 'Full' ? 'bg-amber-500' : 'bg-emerald-500';
  }

  private loadCustomers(): void {
    this.dashboard.getCustomers().subscribe({
      next: data => this.customers.set(data),
      error: error => this.customersError.set(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic')),
    });
  }
}
