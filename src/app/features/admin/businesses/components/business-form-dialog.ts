import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe } from '@jsverse/transloco';
import type { Observable } from 'rxjs';

import { apiErrorKey } from '@shared/util/api-error';
import { CATEGORIES, categoryIcon } from '@shared/util/icons';

import { AdminService } from '../../data-access/api/endpoints/admin/admin.service';
import type { Business, BusinessInput, IssuerCategory } from '../../data-access/api/model';

/** Creates a business, or edits the one passed in. Closes with the saved business. */
@Component({
  selector: 'app-business-form-dialog',
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
  templateUrl: './business-form-dialog.html',
})
export class BusinessFormDialog {
  protected readonly business = inject<Business | null>(MAT_DIALOG_DATA);
  private readonly admin = inject(AdminService);
  private readonly ref = inject(MatDialogRef<BusinessFormDialog, Business>);

  protected readonly categories = CATEGORIES as IssuerCategory[];
  protected readonly categoryIcon = categoryIcon;
  protected readonly saving = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: [this.business?.name ?? '', Validators.required],
    category: [this.business?.category ?? ('other' as IssuerCategory), Validators.required],
    tagline: [this.business?.tagline ?? ''],
    vatNumber: [this.business?.vatNumber ?? ''],
    contactName: [this.business?.contactName ?? ''],
    contactPhone: [this.business?.contactPhone ?? ''],
    email: [this.business?.email ?? '', Validators.email],
    address: [this.business?.address ?? ''],
    city: [this.business?.city ?? ''],
  });

  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorKey.set(null);
    const input: BusinessInput = { ...this.form.getRawValue(), appearance: this.business?.appearance };
    const request: Observable<Business> = this.business
      ? this.admin.updateBusiness(this.business.id, input)
      : this.admin.createBusiness(input);
    request.subscribe({
      next: (saved) => this.ref.close(saved),
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorKey.set(apiErrorKey(error));
      },
    });
  }
}
