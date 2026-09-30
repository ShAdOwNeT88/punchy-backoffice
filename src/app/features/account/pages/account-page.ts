import { Component, inject, signal } from '@angular/core';
import {
  type AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@jsverse/transloco';

import { Session } from '@core/auth/session';
import { Notifier } from '@core/notifications/notifier';
import { apiErrorKey } from '@shared/util/api-error';

import { AccountService } from '../data-access/api/endpoints/account/account.service';

function sameAs(other: string) {
  return (control: AbstractControl): ValidationErrors | null =>
    control.parent && control.value !== control.parent.get(other)?.value ? { mismatch: true } : null;
}

/** The signed-in user's name, initials and password. */
@Component({
  selector: 'app-account-page',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, TranslocoPipe],
  templateUrl: './account-page.html',
  styleUrl: './account-page.scss',
})
export default class AccountPage {
  private readonly account = inject(AccountService);
  private readonly session = inject(Session);
  private readonly notifier = inject(Notifier);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly user = this.session.user;

  protected readonly profile = this.fb.group({
    firstName: [this.user()?.firstName ?? '', Validators.required],
    lastName: [this.user()?.lastName ?? '', Validators.required],
    initials: [this.user()?.initials ?? '', Validators.maxLength(3)],
  });

  protected readonly password = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, sameAs('newPassword')]],
  });

  protected readonly savingProfile = signal(false);
  protected readonly savingPassword = signal(false);

  protected saveProfile() {
    if (this.profile.invalid) {
      this.profile.markAllAsTouched();
      return;
    }
    this.savingProfile.set(true);
    this.account.updateMe(this.profile.getRawValue()).subscribe({
      next: (user) => {
        this.session.updateUser(user);
        this.savingProfile.set(false);
        this.profile.markAsPristine();
        this.notifier.success('common.saved');
      },
      error: (error: unknown) => {
        this.savingProfile.set(false);
        this.notifier.error(apiErrorKey(error));
      },
    });
  }

  protected changePassword() {
    this.password.controls.confirmPassword.updateValueAndValidity();
    if (this.password.invalid) {
      this.password.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.password.getRawValue();
    this.savingPassword.set(true);
    this.account.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.password.reset();
        this.notifier.success('account.passwordChanged');
      },
      error: (error: unknown) => {
        this.savingPassword.set(false);
        this.notifier.error(apiErrorKey(error));
      },
    });
  }
}
