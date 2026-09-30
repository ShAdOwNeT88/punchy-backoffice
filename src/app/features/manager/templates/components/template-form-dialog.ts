import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoPipe } from '@jsverse/transloco';

import { apiErrorKey } from '@shared/util/api-error';
import { fromCents, toCents } from '@shared/util/format';

import { BusinessService } from '../../data-access/api/endpoints/business/business.service';
import type { CardProgram, CardTemplate } from '../../data-access/api/model';

const DEFAULT_SLOTS: Record<CardProgram, number> = { entries: 10, monthly: 12, loyalty: 10 };

/** Creates or edits a card template. The program cannot change once the template exists. */
@Component({
  selector: 'app-template-form-dialog',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './template-form-dialog.html',
  styles: `
    .program { display: flex; flex-direction: column; gap: var(--app-space-2); }
    .program p { margin: 0; }
    .program mat-button-toggle-group { width: 100%; }
    .program mat-button-toggle { flex: 1; }
  `,
})
export class TemplateFormDialog {
  protected readonly template = inject<CardTemplate | null>(MAT_DIALOG_DATA);
  private readonly api = inject(BusinessService);
  private readonly ref = inject(MatDialogRef<TemplateFormDialog, CardTemplate>);

  protected readonly saving = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    program: [this.template?.program ?? ('entries' as CardProgram)],
    name: [this.template?.name ?? '', Validators.required],
    totalSlots: [
      this.template?.totalSlots ?? DEFAULT_SLOTS.entries,
      [Validators.required, Validators.min(1), Validators.max(60)],
    ],
    price: [fromCents(this.template?.priceCents) as number | null, Validators.min(0)],
    reward: [this.template?.reward ?? ''],
    validityDays: [this.template?.validityDays ?? (null as number | null), Validators.min(1)],
    printHolder: [this.template?.printHolder ?? true],
  });
  protected readonly program = toSignal(this.form.controls.program.valueChanges, {
    initialValue: this.form.controls.program.value,
  });

  constructor() {
    if (this.template) this.form.controls.program.disable();
    this.form.controls.program.valueChanges.subscribe((program) => {
      this.form.controls.totalSlots.setValue(DEFAULT_SLOTS[program]);
      this.form.controls.printHolder.setValue(program !== 'loyalty');
    });
  }

  protected save() {
    const v = this.form.getRawValue();
    const needsReward = v.program === 'loyalty' && !v.reward.trim();
    this.form.controls.reward.setErrors(needsReward ? { required: true } : null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const body = {
      name: v.name.trim(),
      totalSlots: Number(v.totalSlots),
      priceCents: v.program === 'loyalty' ? undefined : (toCents(v.price) ?? undefined),
      reward: v.program === 'loyalty' ? v.reward.trim() : undefined,
      validityDays: v.validityDays ? Number(v.validityDays) : undefined,
      printHolder: v.printHolder,
    };
    this.saving.set(true);
    this.errorKey.set(null);
    const request = this.template
      ? this.api.updateTemplate(this.template.id, body)
      : this.api.createTemplate({ ...body, program: v.program });
    request.subscribe({
      next: (saved) => this.ref.close(saved),
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorKey.set(apiErrorKey(error));
      },
    });
  }
}
