import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe } from '@jsverse/transloco';

import { apiErrorKey } from '@shared/util/api-error';

import { AdminService } from '../../data-access/api/endpoints/admin/admin.service';
import type { Business, Manager } from '../../data-access/api/model';
import { temporaryPassword } from './temporary-password';

export interface ManagerFormData {
  manager: Manager | null;
  businesses: Business[];
  businessId?: string;
}

/** Creates a manager with a temporary password, or edits one. Closes with the saved manager. */
@Component({
  selector: 'app-manager-form-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './manager-form-dialog.html',
})
export class ManagerFormDialog {
  protected readonly data = inject<ManagerFormData>(MAT_DIALOG_DATA);
  private readonly admin = inject(AdminService);
  private readonly ref = inject(MatDialogRef<ManagerFormDialog, Manager>);

  protected readonly isNew = !this.data.manager;
  protected readonly saving = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    firstName: [this.data.manager?.firstName ?? '', Validators.required],
    lastName: [this.data.manager?.lastName ?? '', Validators.required],
    email: [this.data.manager?.email ?? '', [Validators.required, Validators.email]],
    initials: [this.data.manager?.initials ?? '', Validators.maxLength(3)],
    phone: [this.data.manager?.phone ?? ''],
    businessId: [this.data.manager?.businessId ?? this.data.businessId ?? '', Validators.required],
    temporaryPassword: [
      this.isNew ? temporaryPassword() : '',
      this.isNew ? [Validators.required, Validators.minLength(8)] : [],
    ],
  });

  protected regenerate() {
    this.form.controls.temporaryPassword.setValue(temporaryPassword());
  }

  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorKey.set(null);
    const { temporaryPassword: password, ...fields } = this.form.getRawValue();
    const request = this.data.manager
      ? this.admin.updateManager(this.data.manager.id, fields)
      : this.admin.createManager({ ...fields, temporaryPassword: password });
    request.subscribe({
      next: (saved) => this.ref.close(saved),
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorKey.set(apiErrorKey(error));
      },
    });
  }
}
