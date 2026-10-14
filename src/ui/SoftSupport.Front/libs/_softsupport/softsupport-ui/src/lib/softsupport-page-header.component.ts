import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'softsupport-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="ss-reveal mb-4 text-sm text-slate-500">
      SoftSupport
      @for (crumb of breadcrumb(); track $index) {
        <span class="mx-1.5 text-slate-300">→</span>
        <span [class.font-medium]="$last" [class.text-slate-700]="$last">{{ crumb }}</span>
      }
    </nav>
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900" data-line>{{ heading() }}</h1>
        @if (subtitle()) {
          <p class="ss-reveal mt-1 text-sm text-slate-500" style="--delay: 0.15s">{{ subtitle() }}</p>
        }
      </div>
      <div class="ss-reveal flex flex-wrap items-center gap-2" style="--delay: 0.2s">
        <ng-content />
      </div>
    </header>
  `,
})
export class SoftSupportPageHeaderComponent {
  readonly heading = input.required<string>();
  readonly subtitle = input<string>('');
  readonly breadcrumb = input<string[]>([]);
}
