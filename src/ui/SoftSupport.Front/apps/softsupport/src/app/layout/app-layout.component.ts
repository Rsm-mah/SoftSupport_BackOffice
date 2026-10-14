import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';

@Component({
  selector: 'softsupport-app-layout',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-layout-root flex h-screen overflow-hidden">
      <softsupport-sidebar
        [collapsed]="collapsed()"
        [mobileOpen]="mobileOpen()"
        (collapsedChange)="collapsed.set($event)"
        (mobileOpenChange)="mobileOpen.set($event)"
      />

      <div class="flex min-w-0 flex-1 flex-col transition-all duration-300 softsupport-content" [class.is-collapsed]="collapsed()">
        <softsupport-topbar (menuToggle)="mobileOpen.set(!mobileOpen())" />
        <div class="ss-scroll-progress" aria-hidden="true"></div>
        <main class="app-layout-main min-h-0 flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
        <div class="app-layout-footer z-10 flex shrink-0 items-center justify-between px-10 py-2.5">
          <span class="app-layout-footer-label text-[11.5px]">{{ 'softsupport.app.footer' | translate }}</span>
          <div class="app-layout-footer-copy text-[11px]">© 2026 SoftWell — SoftSupport</div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
      }

      .app-layout-root {
        background: var(--app-bg-solid, #f4f6f9);
        color: var(--app-text, #10143f);
      }

      .app-layout-main {
        background: var(--app-bg-solid, #f4f6f9);
      }

      .softsupport-content {
        margin-left: var(--sidebar-width);
        timeline-scope: --ss-page;
      }

      .app-layout-main {
        scroll-timeline: --ss-page block;
      }

      .softsupport-content.is-collapsed {
        margin-left: var(--sidebar-mini-width);
      }

      @media (max-width: 1023px) {
        .softsupport-content,
        .softsupport-content.is-collapsed {
          margin-left: 0;
        }
      }

      .app-layout-footer {
        border-top: 1px solid var(--app-border, rgba(2, 132, 199, 0.1));
        background: var(--app-surface-glass, rgba(255, 255, 255, 0.6));
        backdrop-filter: blur(12px);
      }

      .app-layout-footer-label {
        color: color-mix(in srgb, var(--app-text-muted, #697097) 72%, transparent);
      }

      .app-layout-footer-copy {
        color: color-mix(in srgb, var(--app-text-muted, #697097) 46%, transparent);
      }
    `,
  ],
})
export class AppLayoutComponent {
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
}
