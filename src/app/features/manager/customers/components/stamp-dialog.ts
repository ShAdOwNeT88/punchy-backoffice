import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoPipe } from '@jsverse/transloco';

import { apiErrorKey } from '@shared/util/api-error';
import { fromCents, toCents, today } from '@shared/util/format';
import { MonthPipe } from '@shared/util/format.pipes';

import { BusinessService } from '../../data-access/api/endpoints/business/business.service';
import type { Card, PaymentMethod } from '../../data-access/api/model';
import { payableMonths, remainingSlots } from '../../data-access/card-view';

/**
 * Validates one box of a card. For a monthly card it records the month paid and, by default,
 * the payment with it; for entries and loyalty cards it is a single stamp.
 */
@Component({
  selector: 'app-stamp-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MonthPipe,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './stamp-dialog.html',
})
export class StampDialog {
  protected readonly card = inject<Card>(MAT_DIALOG_DATA);
  private readonly api = inject(BusinessService);
  private readonly ref = inject(MatDialogRef<StampDialog, Card>);

  protected readonly monthly = this.card.program === 'monthly';
  protected readonly remaining = remainingSlots(this.card);
  protected readonly months = payableMonths(this.card, today());
  protected readonly methods: PaymentMethod[] = ['cash', 'card', 'transfer', 'other'];
  protected readonly saving = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    date: [today(), Validators.required],
    period: [this.months.suggested ?? '', this.monthly ? Validators.required : []],
    withPayment: [this.monthly],
    amount: [fromCents(this.card.priceCents), Validators.min(0.01)],
    method: ['cash' as PaymentMethod],
    note: [''],
  });
  protected readonly withPayment = toSignal(this.form.controls.withPayment.valueChanges, {
    initialValue: this.monthly,
  });

  protected save() {
    const v = this.form.getRawValue();
    const amountCents = toCents(v.amount);
    if (this.monthly && v.withPayment && !amountCents) {
      this.form.controls.amount.setErrors({ required: true });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorKey.set(null);
    this.api
      .addStamp(this.card.id, {
        date: v.date,
        period: this.monthly ? v.period : undefined,
        note: v.note.trim() || undefined,
        payment:
          this.monthly && v.withPayment && amountCents
            ? { amountCents, method: v.method, date: v.date }
            : undefined,
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
