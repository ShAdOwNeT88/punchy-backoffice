import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { AuthService } from '@core/auth/api/endpoints/auth/auth.service';
import { homePath } from '@core/auth/home-path';
import { Session } from '@core/auth/session';
import { DEMO_MODE } from '@core/demo/demo-mode';
import { type Language, LanguagePreference } from '@core/i18n/i18n';
import { apiErrorKey } from '@shared/util/api-error';

/** Sign-in for admins and managers. Customers use the mobile app. */
@Component({
  selector: 'app-login-page',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export default class LoginPage {
  /** Why the previous session ended, from the query string. */
  readonly reason = input<string>();
  readonly returnUrl = input<string>();

  private readonly auth = inject(AuthService);
  private readonly session = inject(Session);
  private readonly router = inject(Router);
  protected readonly demo = inject(DEMO_MODE);
  protected readonly language = inject(LanguagePreference);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  protected readonly submitting = signal(false);
  protected readonly errorKey = signal<string | null>(null);
  protected readonly hidePassword = signal(true);
  protected readonly demoReset = signal(false);

  protected submit() {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorKey.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login({ email: email.trim(), password }).subscribe({
      next: ({ token, user }) => {
        if (user.role === 'customer') {
          this.submitting.set(false);
          this.errorKey.set('login.customerNotAllowed');
          return;
        }
        this.session.start(token, user);
        const target = this.returnUrl()?.startsWith('/') ? this.returnUrl()! : homePath(user.role);
        void this.router.navigateByUrl(target);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorKey.set(apiErrorKey(error));
      },
    });
  }

  protected useDemo(email: string, password: string) {
    this.form.setValue({ email, password });
    this.submit();
  }

  protected resetDemo() {
    this.demo?.reset();
    this.demoReset.set(true);
  }

  protected setLanguage(lang: Language) {
    this.language.use(lang);
  }
}
