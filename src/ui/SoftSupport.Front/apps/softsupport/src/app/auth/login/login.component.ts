import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SoftIconComponent, SoftInputComponent } from '@soft-mfe/shared-components';
import { AppConfigService, getApiErrorMessage } from '@soft-mfe/shared-services';
import { homeRouteFor } from '@softsupport/models';
import { SoftSupportAuthService, SoftSupportSessionService } from '@softsupport/service';

interface DemoArticle {
  code: string;
  title: string;
  product: string;
  keywords: string[];
}

const QUERIES = ['incohérence stock', 'accès base comptable', 'connexion Sage CRM', 'lenteur Tom', 'impression documents'];

const ARTICLES: readonly DemoArticle[] = [
  { code: 'SAGGES|00000002', title: 'Incohérence quantité stock', product: 'Sage Gestion Commerciale', keywords: ['incohérence', 'stock', 'quantité'] },
  { code: 'SAGCPT|00000003', title: "Problème d'accès à la base comptable - 50C", product: 'Sage Comptabilité', keywords: ['accès', 'base', 'comptable'] },
  { code: 'SAGCRM|00000015', title: 'Problème de connexion Sage CRM', product: 'Sage 100cloud CRM', keywords: ['connexion', 'crm'] },
  { code: 'TMTPRO|00000047', title: 'Lenteur accès Tom', product: 'Tom²PRO', keywords: ['lenteur', 'tom'] },
  { code: 'SAGGES|00000001', title: "En-tête non affichée lors de l'impression de documents", product: 'Sage Gestion Commerciale', keywords: ['impression', 'documents', 'en-tête'] },
  { code: 'SAGIMM|00000001', title: "Problème d'accès à Sage 100C Immobilisation", product: 'Sage Immobilisation', keywords: ['accès', 'immobilisation'] },
  { code: 'SAGPAI|00000004', title: 'Une incohérence à la ligne 1 a été détectée', product: 'Sage Paie', keywords: ['incohérence', 'ligne'] },
];

@Component({
  selector: 'softsupport-login',
  imports: [ReactiveFormsModule, TranslatePipe, SoftInputComponent, SoftIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(SoftSupportAuthService);
  private readonly session = inject(SoftSupportSessionService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly helpContactUrl = inject(AppConfigService).getAll().helpContactUrl ?? 'mailto:serviceinfo@softwell.mg';

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required]],
    password: ['', Validators.required],
  });

  readonly playIntro = LoginComponent.consumeIntro();
  private readonly reducedMotion = LoginComponent.prefersReducedMotion();

  readonly isLoading = signal(false);
  readonly submitted = signal(false);
  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly typed = signal(this.reducedMotion ? QUERIES[0] : '');

  readonly results = computed(() => {
    const query = this.typed().trim().toLowerCase();
    if (query.length < 3) {
      return ARTICLES.slice(0, 3);
    }
    const words = query.split(/\s+/);
    const matching = ARTICLES.filter(article => article.keywords.some(keyword => words.some(word => keyword.startsWith(word))));
    return [...matching, ...ARTICLES.filter(article => !matching.includes(article))].slice(0, 3);
  });

  private static introPlayed = false;

  constructor() {
    if (!this.reducedMotion) {
      this.startTyping();
    }
  }

  private static prefersReducedMotion(): boolean {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }

  private static consumeIntro(): boolean {
    if (LoginComponent.introPlayed) {
      return false;
    }
    LoginComponent.introPlayed = true;
    return !LoginComponent.prefersReducedMotion();
  }

  togglePassword(): void {
    this.showPassword.update(value => !value);
  }

  fieldError(field: 'email' | 'password'): string {
    const control = this.loginForm.controls[field];
    if (!control.invalid || !(control.touched || this.submitted())) {
      return '';
    }
    return this.translate.instant(field === 'email' ? 'softsupport.login.emailRequired' : 'softsupport.login.passwordRequired');
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.errorMessage.set(null);
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { email, password } = this.loginForm.getRawValue();
    this.auth.login({ email: email.trim(), password }).subscribe({
      next: result => {
        this.session.open(result);
        this.isLoading.set(false);
        void this.router.navigateByUrl(homeRouteFor(result.user.roleName));
      },
      error: error => {
        this.isLoading.set(false);
        this.errorMessage.set(getApiErrorMessage(error) ?? this.translate.instant('softsupport.login.networkError'));
      },
    });
  }

  private startTyping(): void {
    let query = 0;
    let length = 0;
    let deleting = false;
    let pause = this.playIntro ? 14 : 4;

    const timer = setInterval(() => {
      if (pause > 0) {
        pause--;
        return;
      }
      const text = QUERIES[query];
      if (!deleting) {
        length++;
        this.typed.set(text.slice(0, length));
        if (length === text.length) {
          deleting = true;
          pause = 22;
        }
      } else {
        length = Math.max(0, length - 2);
        this.typed.set(text.slice(0, length));
        if (length === 0) {
          deleting = false;
          query = (query + 1) % QUERIES.length;
          pause = 4;
        }
      }
    }, 90);

    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
