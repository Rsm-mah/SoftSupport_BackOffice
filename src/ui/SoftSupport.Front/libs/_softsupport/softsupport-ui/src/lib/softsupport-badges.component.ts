import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SoftBadgeComponent, SoftIconComponent } from '@soft-mfe/shared-components';
import { isClient, isInterne } from '@softsupport/models';

@Component({
  selector: 'softsupport-article-status',
  imports: [SoftBadgeComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<soft-badge [variant]="variant()">{{ label() | translate }}</soft-badge>`,
})
export class SoftSupportArticleStatusComponent {
  readonly validated = input(false);
  readonly enabled = input(true);

  readonly variant = computed(() => (!this.enabled() ? 'danger' : this.validated() ? 'success' : 'warning'));
  readonly label = computed(() =>
    !this.enabled()
      ? 'softsupport.articles.status.refused'
      : this.validated()
        ? 'softsupport.articles.status.validated'
        : 'softsupport.articles.status.pending',
  );
}

@Component({
  selector: 'softsupport-article-options',
  imports: [SoftIconComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex flex-wrap items-center gap-1">
      @if (interne()) {
        <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600" [title]="'softsupport.articles.options.interne' | translate">
          <soft-icon name="building-library" size="xs" />{{ 'softsupport.articles.options.interne' | translate }}
        </span>
      }
      @if (client()) {
        <span class="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700" [title]="'softsupport.articles.options.client' | translate">
          <soft-icon name="users" size="xs" />{{ 'softsupport.articles.options.client' | translate }}
        </span>
      }
      @if (!interne() && !client()) {
        <span class="text-xs text-slate-400">—</span>
      }
    </span>
  `,
})
export class SoftSupportArticleOptionsComponent {
  readonly options = input<string | null>(null);

  readonly interne = computed(() => isInterne(this.options()));
  readonly client = computed(() => isClient(this.options()));
}

@Component({
  selector: 'softsupport-article-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (parts(); as p) {
      <span class="whitespace-nowrap font-mono text-xs font-semibold"><span class="text-cyan-700">{{ p[0] }}</span><span class="text-slate-300">|</span><span class="text-slate-600">{{ p[1] }}</span></span>
    } @else {
      <span class="font-mono text-xs text-slate-400">—</span>
    }
  `,
})
export class SoftSupportArticleCodeComponent {
  readonly code = input<string | null>(null);

  readonly parts = computed(() => {
    const code = this.code();
    if (!code) {
      return null;
    }
    const index = code.indexOf('|');
    return index > 0 ? [code.substring(0, index), code.substring(index + 1)] : ['', code];
  });
}
