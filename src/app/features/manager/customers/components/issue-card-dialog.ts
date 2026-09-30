import { Component, computed, inject, signal } from '@angular/core';
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
import { fromCents, toCents } from '@shared/util/format';
import { MoneyPipe } from '@shared/util/format.pipes';

import { BusinessService } from '../../data-access/api/endpoints/business/business.service';
import type { Card, CardTemplate, Customer, PaymentMethod } from '../../data-access/api/model';

export interface IssueCardData {
  customer: Customer;
  templates: CardTemplate[];
}

/**
 * Issues a card to a customer from one of the active templates. It can keep the number of the
 * paper card it replaces, carry over the boxes already stamped, and record the payment.
 */
@Component({
  selector: 'app-issue-card-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MoneyPipe,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './issue-card-dialog.html',
})
export class IssueCardDialog {
  protected readonly data = inject<IssueCardData>(MAT_DIALOG_DATA);
  private readonly api = inject(BusinessService);
  private readonly ref = inject(MatDialogRef<IssueCardDialog, Card>);

  protected readonly methods: PaymentMethod[] = ['cash', 'card', 'transfer', 'other'];
  protected readonly saving = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    templateId: [this.data.templates[0]?.id ?? '', Validators.required],
    number: [''],
    validUntil: [''],
    stampsAlreadyUsed: [0, [Validators.min(0)]],
    paid: [true],
    amount: [null as number | null, Validators.min(0.01)],
    method: ['cash' as PaymentMethod],
  });

  private readonly templateId = toSignal(this.form.controls.templateId.valueChanges, {
    initialValue: this.form.controls.templateId.value,
  });
  protected readonly paid = toSignal(this.form.controls.paid.valueChanges, { initialValue: true });
  protected readonly template = computed(() =>
    this.data.templates.find((t) => t.id === this.templateId()),
  );

  constructor() {
    this.prefill(this.template());
    this.form.controls.templateId.valueChanges.subscribe((id) =>
      this.prefill(this.data.templates.find((t) => t.id === id)),
    );
  }

  protected save() {
    const template = this.template();
    const v = this.form.getRawValue();
    const carried = Number(v.stampsAlreadyUsed) || 0;
    if (template && carried >= template.totalSlots) {
      this.form.controls.stampsAlreadyUsed.setErrors({ max: true });
    }
    if (this.form.invalid || !template) {
      this.form.markAllAsTouched();
      return;
    }
    const amountCents = toCents(v.amount);
    const withPayment = template.program === 'entries' && v.paid && !!amountCents;
    this.saving.set(true);
    this.errorKey.set(null);
    this.api
      .issueCard({
        customerId: this.data.customer.id,
        templateId: template.id,
        number: v.number.trim() || undefined,
        validUntil: v.validUntil || undefined,
        stampsAlreadyUsed: carried || undefined,
        payment: withPayment ? { amountCents: amountCents!, method: v.method } : undefined,
      })
      .subscribe({
        next: (card) => this.ref.close(card),
        error: (error: unknown) => {
          this.saving.set(false);
          this.errorKey.set(apiErrorKey(error));
        },
      });
  }

  private prefill(template: CardTemplate | undefined) {
    this.form.patchValue({ amount: fromCents(template?.priceCents), stampsAlreadyUsed: 0 });
  }
}
