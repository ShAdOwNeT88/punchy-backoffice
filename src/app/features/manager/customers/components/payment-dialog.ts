import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe } from '@jsverse/transloco';

import { apiErrorKey } from '@shared/util/api-error';
import { fromCents, toCents, today } from '@shared/util/format';

import { BusinessService } from '../../data-access/api/endpoints/business/business.service';
import type { Card, PaymentMethod } from '../../data-access/api/model';
import { balanceDue } from '../../data-access/card-view';

/** Records a payment that stamps nothing: the price of a package, a deposit, the balance. */
@Component({
  selector: 'app-payment-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'customers.payment.title' | transloco }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content>
        <div class="form-grid">
          <mat-form-field>
            <mat-label>{{ 'customers.payment.amount' | transloco }}</mat-label>
            <input matInput type="number" min="0" step="0.5" formControlName="amount" cdkFocusInitial />
            <span matTextSuffix>{{ 'common.euro' | transloco }}</span>
            <mat-error>{{ 'validation.amount' | transloco }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>{{ 'customers.payment.method' | transloco }}</mat-label>
            <mat-select formControlName="method">
              <mat-select-trigger>{{ 'paymentMethod.' + form.controls.method.value | transloco }}</mat-select-trigger>
              @for (m of methods; track m) {
                <mat-option [value]="m">{{ 'paymentMethod.' + m | transloco }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field>
            <mat-label>{{ 'customers.stamp.date' | transloco }}</mat-label>
            <input matInput type="date" formControlName="date" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>{{ 'common.notes' | transloco }}</mat-label>
            <input matInput formControlName="note" />
          </mat-form-field>
        </div>
        @if (errorKey(); as key) {
          <p class="form-error" role="alert">{{ key | transloco }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>{{ 'common.cancel' | transloco }}</button>
        <button mat-flat-button type="submit" [disabled]="saving()">{{ 'customers.payment.confirm' | transloco }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class PaymentDialog {
  protected readonly card = inject<Card>(MAT_DIALOG_DATA);
  private readonly api = inject(BusinessService);
  private readonly ref = inject(MatDialogRef<PaymentDialog, Card>);

  protected readonly methods: PaymentMethod[] = ['cash', 'card', 'transfer', 'other'];
  protected readonly saving = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    amount: [
      fromCents(balanceDue(this.card) || this.card.priceCents),
      [Validators.required, Validators.min(0.01)],
    ],
    method: ['cash' as PaymentMethod],
    date: [today(), Validators.required],
    note: [''],
  });

  protected save() {
    const v = this.form.getRawValue();
    const amountCents = toCents(v.amount);
    if (this.form.invalid || !amountCents) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.api
      .addPayment(this.card.id, {
        amountCents,
        method: v.method,
        date: v.date,
        note: v.note.trim() || undefined,
      })
      .subscribe({
        next: (card) => this.ref.close(card),
        error: (error: unknown) => {
          this.saving.set(false);
          this.errorKey.set(apiErrorKey(error));
        },
      });
  }
}
