import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, HostListener, inject, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfirmationModalComponent, SoftIconComponent } from '@soft-mfe/shared-components';
import { SoftSupportSessionService, SoftSupportValidationService } from '@softsupport/service';
import { filter } from 'rxjs';

@Component({
  selector: 'softsupport-topbar',
  imports: [TranslatePipe, SoftIconComponent, ConfirmationModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly validationApi = inject(SoftSupportValidationService);
  readonly session = inject(SoftSupportSessionService);

  readonly menuToggle = output<void>();

  private readonly logoutModal = viewChild<ConfirmationModalComponent>('logoutModal');

  readonly profileOpen = signal(false);
  /** Articles en attente dans les départements confiés à l'utilisateur. */
  readonly pendingCount = signal(0);

  readonly isValidator = computed(() => !!this.session.user()?.isValidator);

  readonly profile = computed(() => {
    const user = this.session.user();
    const initials = [user?.firstName, user?.lastName]
      .filter((part): part is string => !!part)
      .map(part => part.trim().charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
    return {
      name: this.session.displayName(),
      initials: initials || 'SS',
      role: user?.roleName ?? '',
      departement: user?.departementName ?? '',
      email: user?.email ?? '',
    };
  });

  constructor() {
    this.refreshPending();
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => this.refreshPending());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.profileOpen.set(false);
    }
  }

  openValidation(): void {
    void this.router.navigate(['/validation']);
  }

  toggleProfile(): void {
    this.profileOpen.update(open => !open);
  }

  goToProfile(): void {
    this.profileOpen.set(false);
    void this.router.navigate(['/profil']);
  }

  requestLogout(): void {
    this.profileOpen.set(false);
    this.logoutModal()?.open();
  }

  logout(): void {
    this.session.close();
    void this.router.navigate(['/login']);
  }

  private refreshPending(): void {
    if (!this.session.isAuthenticated()) {
      return;
    }
    this.validationApi.count().subscribe({
      next: result => {
        this.session.updateValidator(result.isValidator);
        this.pendingCount.set(result.count);
      },
      error: () => this.pendingCount.set(0),
    });
  }
}
