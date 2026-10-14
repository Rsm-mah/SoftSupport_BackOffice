import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SoftIconComponent } from '@soft-mfe/shared-components';
import { LookupItem } from '@softsupport/models';

/** Liste à cocher filtrable (produits d'un pack, d'une catégorie). */
@Component({
  selector: 'softsupport-check-list',
  imports: [TranslatePipe, SoftIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-xl border border-slate-200">
      <div class="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
        <soft-icon name="search" size="sm" class="text-slate-400" />
        <input
          type="text"
          class="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          [placeholder]="'softsupport.common.filter' | translate"
          [value]="term()"
          (input)="term.set($any($event.target).value)"
        />
        <span class="whitespace-nowrap rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">{{ 'softsupport.common.selected' | translate: { count: selected().length } }}</span>
      </div>
      <ul class="max-h-64 overflow-y-auto py-1">
        @for (item of visible(); track item.id) {
          <li>
            <label class="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-slate-50">
              <input type="checkbox" class="h-4 w-4 accent-cyan-700" [checked]="isSelected(item.id)" (change)="toggle(item.id)" />
              <span class="text-slate-800">{{ item.name }}</span>
            </label>
          </li>
        } @empty {
          <li class="px-3 py-4 text-center text-xs text-slate-400">{{ 'softsupport.common.noResult' | translate }}</li>
        }
      </ul>
    </div>
  `,
})
export class SoftSupportCheckListComponent {
  readonly items = input<LookupItem[]>([]);
  readonly selected = model<number[]>([]);

  readonly term = signal('');

  /** Les éléments cochés restent en tête de liste. */
  readonly visible = computed(() => {
    const term = this.term().trim().toLowerCase();
    const selected = new Set(this.selected());
    return this.items()
      .filter(item => !term || item.name.toLowerCase().includes(term))
      .sort((a, b) => Number(selected.has(b.id)) - Number(selected.has(a.id)));
  });

  isSelected(id: number): boolean {
    return this.selected().includes(id);
  }

  toggle(id: number): void {
    this.selected.update(ids => (ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]));
  }
}
