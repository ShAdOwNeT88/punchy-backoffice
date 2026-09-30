import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@jsverse/transloco';

import { apiErrorKey } from '@shared/util/api-error';

import { BusinessService } from '../../data-access/api/endpoints/business/business.service';
import type { Customer, CustomerInput } from '../../data-access/api/model';

/** Creates or edits a customer. Closes with the saved customer. */
@Component({
  selector: 'app-customer-form-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ (customer ? 'customers.form.editTitle' : 'customers.form.newTitle') | transloco }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content>
        <div class="form-grid">
          <mat-form-field>
            <mat-label>{{ 'common.firstName' | transloco }}</mat-label>
            <input matInput formControlName="firstName" autocomplete="off" />
            <mat-error>{{ 'validation.required' | transloco }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>{{ 'common.lastName' | transloco }}</mat-label>
            <input matInput formControlName="lastName" autocomplete="off" />
            <mat-error>{{ 'validation.required' | transloco }}</mat-error>
          </mat-form-field>
          <mat-form-field class="span-2">
            <mat-label>{{ 'common.email' | transloco }}</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="off" />
            <mat-hint>{{ 'customers.form.emailHint' | transloco }}</mat-hint>
            <mat-error>{{ 'validation.email' | transloco }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>{{ 'common.phone' | transloco }}</mat-label>
            <input matInput type="tel" formControlName="phone" autocomplete="off" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>{{ 'customers.form.birthDate' | transloco }}</mat-label>
            <input matInput type="date" formControlName="birthDate" />
          </mat-form-field>
          <mat-form-field class="span-2">
            <mat-label>{{ 'common.notes' | transloco }}</mat-label>
            <textarea matInput rows="2" formControlName="notes"></textarea>
          </mat-form-field>
        </div>
        @if (errorKey(); as key) {
          <p class="form-error" role="alert">{{ key | transloco }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>{{ 'common.cancel' | transloco }}</button>
        <button mat-flat-button type="submit" [disabled]="saving()">
          {{ (customer ? 'common.save' : 'common.create') | transloco }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class CustomerFormDialog {
  protected readonly customer = inject<Customer | null>(MAT_DIALOG_DATA);
  private readonly api = inject(BusinessService);
  private readonly ref = inject(MatDialogRef<CustomerFormDialog, Customer>);

  protected readonly saving = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    firstName: [this.customer?.firstName ?? '', Validators.required],
    lastName: [this.customer?.lastName ?? '', Validators.required],
    email: [this.customer?.email ?? '', Validators.email],
    phone: [this.customer?.phone ?? ''],
    birthDate: [this.customer?.birthDate ?? ''],
    notes: [this.customer?.notes ?? ''],
  });

  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const input: CustomerInput = {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      email: v.email.trim() || undefined,
      phone: v.phone.trim() || undefined,
      birthDate: v.birthDate || undefined,
      notes: v.notes.trim() || undefined,
    };
    this.saving.set(true);
    this.errorKey.set(null);
    const request = this.customer
      ? this.api.updateCustomer(this.customer.id, input)
      : this.api.createCustomer(input);
    request.subscribe({
      next: (saved) => this.ref.close(saved),
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorKey.set(apiErrorKey(error));
      },
    });
  }
}
