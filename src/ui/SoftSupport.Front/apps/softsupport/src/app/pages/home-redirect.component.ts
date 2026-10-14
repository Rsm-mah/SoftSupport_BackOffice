import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { homeRouteFor } from '@softsupport/models';
import { SoftSupportSessionService } from '@softsupport/service';

/** Racine de l'application : envoie chaque rôle sur sa page d'accueil. */
@Component({
  selector: 'softsupport-home-redirect',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class HomeRedirectComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly session = inject(SoftSupportSessionService);

  ngOnInit(): void {
    void this.router.navigateByUrl(homeRouteFor(this.session.roleName()), { replaceUrl: true });
  }
}
