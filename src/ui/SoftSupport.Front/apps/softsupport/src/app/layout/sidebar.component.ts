import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SoftButtonComponent, SoftIconComponent } from '@soft-mfe/shared-components';
import { SOFTSUPPORT_SIDEBAR, SoftSupportNavItem } from '@softsupport/models';
import { SoftSupportSessionService } from '@softsupport/service';
import { filter, map } from 'rxjs';

/** Sidebar de la coque SoftAppli : rail réduit, menu déployé et tiroir mobile. */
@Component({
  selector: 'softsupport-sidebar',
  imports: [NgTemplateOutlet, RouterLink, TranslatePipe, SoftButtonComponent, SoftIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styles: [
    `
      .softsupport-sidebar-desktop {
        display: none;
      }

      @media (min-width: 1024px) {
        .softsupport-sidebar-desktop {
          display: flex;
        }

        .softsupport-sidebar-mobile,
        .softsupport-sidebar-backdrop {
          display: none;
        }
      }
    `,
  ],
})
export class SidebarComponent {
  private readonly router = inject(Router);
  private readonly session = inject(SoftSupportSessionService);

  readonly collapsed = input(false);
  readonly mobileOpen = input(false);
  readonly collapsedChange = output<boolean>();
  readonly mobileOpenChange = output<boolean>();

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  private readonly manuallyExpanded = signal<Record<string, boolean>>({});

  readonly items = computed(() => this.filterByRole(SOFTSUPPORT_SIDEBAR));

  isLeafActive(item: SoftSupportNavItem): boolean {
    return !!item.route && this.url().split('?')[0].startsWith(`/${item.route}`);
  }

  isParentActive(item: SoftSupportNavItem): boolean {
    return (item.children ?? []).some(child => this.isLeafActive(child));
  }

  isExpanded(item: SoftSupportNavItem): boolean {
    const manual = this.manuallyExpanded()[item.id];
    return manual ?? this.isParentActive(item);
  }

  toggleExpanded(item: SoftSupportNavItem): void {
    const next = !this.isExpanded(item);
    this.manuallyExpanded.update(state => ({ ...state, [item.id]: next }));
  }

  /** En mode réduit, un parent ouvre sa première page ; une feuille ouvre sa route. */
  onMiniClick(item: SoftSupportNavItem): void {
    const target = item.route ?? item.children?.[0]?.route;
    if (target) {
      void this.router.navigateByUrl(`/${target}`);
    }
  }

  toggle(): void {
    this.collapsedChange.emit(!this.collapsed());
  }

  closeMobile(): void {
    this.mobileOpenChange.emit(false);
  }

  private filterByRole(items: readonly SoftSupportNavItem[]): SoftSupportNavItem[] {
    return items
      .filter(item => this.session.hasRole(item.roles) && (!item.requiresValidator || !!this.session.user()?.isValidator))
      .map(item => (item.children ? { ...item, children: this.filterByRole(item.children) } : item))
      .filter(item => !item.children || item.children.length > 0);
  }
}
