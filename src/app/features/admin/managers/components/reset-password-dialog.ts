import { Clipboard } from '@angular/cdk/clipboard';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@jsverse/transloco';

import { apiErrorKey } from '@shared/util/api-error';

import { AdminService } from '../../data-access/api/endpoints/admin/admin.service';
import type { Manager } from '../../data-access/api/model';
import { temporaryPassword } from './temporary-password';

/** Sets a new temporary password for a manager who lost theirs. Closes with `true` when done. */
@Component({
  selector: 'app-reset-password-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'managers.reset.title' | transloco }}</h2>
    <mat-dialog-content>
      <p class="dialog-lead">{{ 'managers.reset.message' | transloco: { name: manager.firstName + ' ' + manager.lastName } }}</p>
      <mat-form-field>
        <mat-label>{{ 'managers.form.temporaryPassword' | transloco }}</mat-label>
        <input matInput [formControl]="password" autocomplete="off" />
        <button mat-icon-button matSuffix type="button" (click)="copy()" [attr.aria-label]="'managers.reset.copy' | transloco">
          <mat-icon>{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
        </button>
        <mat-error>{{ 'validation.minLength' | transloco: { min: 8 } }}</mat-error>
      </mat-form-field>
      @if (errorKey(); as key) {
        <p class="form-error" role="alert">{{ key | transloco }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | transloco }}</button>
      <button mat-flat-button (click)="save()" [disabled]="saving()">{{ 'managers.reset.confirm' | transloco }}</button>
    </mat-dialog-actions>
  `,
})
export class ResetPasswordDialog {
  protected readonly manager = inject<Manager>(MAT_DIALOG_DATA);
  private readonly admin = inject(AdminService);
  private readonly clipboard = inject(Clipboard);
  private readonly ref = inject(MatDialogRef<ResetPasswordDialog, boolean>);

  protected readonly password = new FormControl(temporaryPassword(), {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(8)],
  });
  protected readonly saving = signal(false);
  protected readonly copied = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected copy() {
    this.copied.set(this.clipboard.copy(this.password.value));
  }

  protected save() {
    if (this.password.invalid) {
      this.password.markAsTouched();
      return;
    }
    this.saving.set(true);
    this.admin
      .resetManagerPassword(this.manager.id, { temporaryPassword: this.password.value })
      .subscribe({
        next: () => this.ref.close(true),
        error: (error: unknown) => {
          this.saving.set(false);
          this.errorKey.set(apiErrorKey(error));
        },
      });
  }
}
