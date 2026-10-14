import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  CardDashboardComponent,
  DataTableEmptyStateComponent,
  SoftButtonComponent,
  SoftIconComponent,
  SoftInputComponent,
  SoftSelectComponent,
} from '@soft-mfe/shared-components';
import { CardDashboardConfig, PageSize, SelectOption } from '@soft-mfe/shared-models';
import { getApiErrorMessage } from '@soft-mfe/shared-services';
import {
  ArticleListItem,
  ArticleReferences,
  ArticleStats,
  isAdministrator,
  OPTION_CLIENT,
  OPTION_INTERNE,
  SOFTSUPPORT_DEFAULT_PAGE_SIZE,
} from '@softsupport/models';
import { SoftSupportArticleService, SoftSupportSessionService } from '@softsupport/service';
import {
  SoftSupportArticleCodeComponent,
  SoftSupportArticleDetailModalComponent,
  SoftSupportArticleOptionsComponent,
  SoftSupportArticleStatusComponent,
  SoftSupportListPaginationComponent,
  SoftSupportPageHeaderComponent,
} from '@softsupport/ui';
import { SoftSupportExportModalComponent } from './softsupport-export-modal.component';

interface ArticleFilters {
  search: string;
  productId: string;
  versionId: string;
  themeId: string;
  option: string;
}

const EMPTY_FILTERS: ArticleFilters = { search: '', productId: '', versionId: '', themeId: '', option: '' };

@Component({
  selector: 'softsupport-articles-page',
  imports: [
    DatePipe,
    TranslatePipe,
    CardDashboardComponent,
    DataTableEmptyStateComponent,
    SoftButtonComponent,
    SoftIconComponent,
    SoftInputComponent,
    SoftSelectComponent,
    SoftSupportArticleCodeComponent,
    SoftSupportArticleDetailModalComponent,
    SoftSupportArticleOptionsComponent,
    SoftSupportArticleStatusComponent,
    SoftSupportListPaginationComponent,
    SoftSupportPageHeaderComponent,
    SoftSupportExportModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './softsupport-articles.page.html',
})
export class SoftSupportArticlesPage implements OnInit, OnDestroy {
  private readonly articlesApi = inject(SoftSupportArticleService);
  private readonly session = inject(SoftSupportSessionService);
  private readonly translate = inject(TranslateService);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly isAdmin = computed(() => isAdministrator(this.session.roleName()));

  readonly rows = signal<ArticleListItem[]>([]);
  readonly totalCount = signal(0);
  readonly stats = signal<ArticleStats | null>(null);
  readonly references = signal<ArticleReferences | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = signal<PageSize>(SOFTSUPPORT_DEFAULT_PAGE_SIZE as PageSize);
  readonly filters = signal<ArticleFilters>({ ...EMPTY_FILTERS });
  readonly detailId = signal<number | null>(null);
  readonly exportOpen = signal(false);

  readonly hasFilters = computed(() => Object.values(this.filters()).some(value => value !== ''));

  readonly cards = computed<CardDashboardConfig[]>(() => {
    const stats = this.stats();
    return [
      { label: 'softsupport.articles.kpi.total', value: stats?.total ?? 0, color: '#0e7490', icon: 'books' },
      { label: 'softsupport.articles.kpi.validated', value: stats?.validated ?? 0, color: '#16a34a', icon: 'check-circle' },
      { label: 'softsupport.articles.kpi.pending', value: stats?.pending ?? 0, color: '#f59e0b', icon: 'clock' },
      { label: 'softsupport.articles.kpi.client', value: stats?.client ?? 0, color: '#6366f1', icon: 'users' },
    ];
  });

  readonly productOptions = computed<SelectOption[]>(() => this.toOptions(this.references()?.products));
  readonly versionOptions = computed<SelectOption[]>(() => this.toOptions(this.references()?.versions));
  readonly themeOptions = computed<SelectOption[]>(() => this.toOptions(this.references()?.themes));
  readonly optionOptions = computed<SelectOption[]>(() => [
    { value: '', label: this.translate.instant('softsupport.common.all') },
    { value: OPTION_INTERNE, label: this.translate.instant('softsupport.articles.options.interne') },
    { value: OPTION_CLIENT, label: this.translate.instant('softsupport.articles.options.client') },
  ]);

  ngOnInit(): void {
    this.articlesApi.getReferences().subscribe({ next: references => this.references.set(references) });
    this.loadStats();
    this.load();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  onSearch(value: string): void {
    this.filters.update(filters => ({ ...filters, search: value }));
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.applyFilters(), 350);
  }

  setFilter(key: Exclude<keyof ArticleFilters, 'search'>, value: string): void {
    this.filters.update(filters => ({ ...filters, [key]: value }));
    this.applyFilters();
  }

  clearFilters(): void {
    this.filters.set({ ...EMPTY_FILTERS });
    this.applyFilters();
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }

  onPageSizeChange(size: PageSize): void {
    this.pageSize.set(size);
    this.applyFilters();
  }

  onChanged(): void {
    this.loadStats();
    this.load();
  }

  load(): void {
    const filters = this.filters();
    const toId = (value: string) => (value ? Number(value) : null);
    this.loading.set(true);
    this.error.set(null);
    this.articlesApi
      .search({
        page: this.page(),
        pageSize: this.pageSize(),
        search: filters.search,
        productId: toId(filters.productId),
        versionId: toId(filters.versionId),
        themeId: toId(filters.themeId),
        option: filters.option || null,
      })
      .subscribe({
        next: result => {
          this.rows.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: error => {
          this.loading.set(false);
          this.error.set(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
        },
      });
  }

  private loadStats(): void {
    this.articlesApi.getStats().subscribe({ next: stats => this.stats.set(stats) });
  }

  private toOptions(items: { id: number; name: string }[] | undefined): SelectOption[] {
    return [
      { value: '', label: this.translate.instant('softsupport.common.all') },
      ...(items ?? []).map(item => ({ value: String(item.id), label: item.name })),
    ];
  }
}
