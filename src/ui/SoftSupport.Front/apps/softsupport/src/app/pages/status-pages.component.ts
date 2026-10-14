import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SoftButtonComponent, SoftIconComponent } from '@soft-mfe/shared-components';
import { homeRouteFor } from '@softsupport/models';
import { SoftSupportSessionService } from '@softsupport/service';

@Component({
  selector: 'softsupport-status-page',
  imports: [TranslatePipe, SoftButtonComponent, SoftIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <soft-icon [name]="icon()" size="xl" />
      </div>
      <h1 class="text-2xl font-semibold text-slate-900">{{ titleKey() | translate }}</h1>
      <p class="mt-2 max-w-md text-sm text-slate-500">{{ messageKey() | translate }}</p>
      <div class="mt-6">
        <soft-button variant="primary" (onClick)="goHome()">{{ 'common.actions.backHome' | translate }}</soft-button>
      </div>
    </section>
  `,
})
export class StatusPageComponent {
  private readonly router = inject(Router);
  private readonly session = inject(SoftSupportSessionService);

  readonly icon = input('info');
  readonly titleKey = input.required<string>();
  readonly messageKey = input.required<string>();

  goHome(): void {
    void this.router.navigateByUrl(homeRouteFor(this.session.roleName()));
  }
}

@Component({
  selector: 'softsupport-forbidden-page',
  imports: [StatusPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<softsupport-status-page icon="shield" titleKey="common.forbidden.title" messageKey="common.forbidden.message" />`,
})
export class ForbiddenPageComponent {}

@Component({
  selector: 'softsupport-not-found-page',
  imports: [StatusPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<softsupport-status-page icon="search" titleKey="common.notFound.title" messageKey="common.notFound.message" />`,
})
export class NotFoundPageComponent {}
