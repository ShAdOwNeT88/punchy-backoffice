import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@jsverse/transloco';

import { apiErrorKey } from '@shared/util/api-error';

import { BusinessService } from '../../data-access/api/endpoints/business/business.service';
import type { Card } from '../../data-access/api/model';

/** Changes a card's number or expiry, e.g. to extend a package. */
@Component({
  selector: 'app-card-edit-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'customers.card.editTitle' | transloco }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content>
        <div class="form-grid">
          <mat-form-field>
            <mat-label>{{ 'customers.issue.number' | transloco }}</mat-label>
            <input matInput formControlName="number" />
            <mat-error>{{ 'validation.required' | transloco }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>{{ 'customers.issue.validUntil' | transloco }}</mat-label>
            <input matInput type="date" formControlName="validUntil" />
            <mat-hint>{{ 'customers.card.validUntilHint' | transloco }}</mat-hint>
          </mat-form-field>
        </div>
        @if (errorKey(); as key) {
          <p class="form-error" role="alert">{{ key | transloco }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>{{ 'common.cancel' | transloco }}</button>
        <button mat-flat-button type="submit" [disabled]="saving()">{{ 'common.save' | transloco }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class CardEditDialog {
  protected readonly card = inject<Card>(MAT_DIALOG_DATA);
  private readonly api = inject(BusinessService);
  private readonly ref = inject(MatDialogRef<CardEditDialog, Card>);

  protected readonly saving = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    number: [this.card.number, Validators.required],
    validUntil: [this.card.validUntil ?? ''],
  });

  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .updateCard(this.card.id, { number: v.number.trim(), validUntil: v.validUntil || null })
      .subscribe({
        next: (card) => this.ref.close(card),
        error: (error: unknown) => {
          this.saving.set(false);
          this.errorKey.set(apiErrorKey(error));
        },
      });
  }
}
