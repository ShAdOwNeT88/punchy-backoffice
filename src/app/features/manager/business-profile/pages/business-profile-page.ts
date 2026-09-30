import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import type { Observable } from 'rxjs';

import { Session } from '@core/auth/session';
import { Notifier } from '@core/notifications/notifier';
import { CardPreview, type CardPreviewData } from '@shared/ui/card-preview/card-preview';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { apiErrorKey } from '@shared/util/api-error';
import { today } from '@shared/util/format';
import { CARD_STYLES, CATEGORIES, EMBLEMS, categoryIcon, emblemIcon } from '@shared/util/icons';

import { BusinessService } from '../../data-access/api/endpoints/business/business.service';
import type {
  Business,
  CardDesign,
  CardStyle,
  IssuerCategory,
  IssuerEmblem,
  StampStyle,
} from '../../data-access/api/model';
import { MyBusinessStore } from '../../data-access/my-business.store';

const MAX_LOGO_BYTES = 1024 * 1024;

/** The business's public details and how its cards look in the customers' app. */
@Component({
  selector: 'app-business-profile-page',
  imports: [
    CardPreview,
    EmptyState,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './business-profile-page.html',
  styleUrl: './business-profile-page.scss',
})
export default class BusinessProfilePage {
  protected readonly store = inject(MyBusinessStore);
  private readonly api = inject(BusinessService);
  private readonly notifier = inject(Notifier);
  private readonly session = inject(Session);

  protected readonly categories = CATEGORIES as IssuerCategory[];
  protected readonly styles = CARD_STYLES as CardStyle[];
  protected readonly emblems = EMBLEMS as IssuerEmblem[];
  protected readonly categoryIcon = categoryIcon;
  protected readonly emblemIcon = emblemIcon;

  protected readonly form = inject(NonNullableFormBuilder).group({
    category: ['other' as IssuerCategory, Validators.required],
    tagline: [''],
    contactName: [''],
    contactPhone: [''],
    email: ['', Validators.email],
    address: [''],
    city: [''],
    style: ['ocean' as CardStyle],
    design: ['gradient' as CardDesign],
    stampStyle: ['round' as StampStyle],
    emblem: ['none' as IssuerEmblem | 'none'],
  });
  private readonly values = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  // A global key: translateSignal would prefix it with this route's scope.
  private readonly sampleHolder = toSignal(
    inject(TranslocoService).selectTranslate('cardPreview.sampleHolder'),
    { initialValue: '' },
  );

  protected readonly preview = computed<CardPreviewData | null>(() => {
    const b = this.store.business();
    if (!b) return null;
    const v = { ...this.form.getRawValue(), ...this.values() };
    const day = today();
    return {
      issuerName: b.name,
      category: v.category,
      emblem: v.emblem === 'none' ? undefined : v.emblem,
      logoUrl: b.logoUrl,
      tagline: v.tagline,
      contactName: v.contactName,
      contactPhone: v.contactPhone,
      style: v.style,
      design: v.design,
      stampStyle: v.stampStyle,
      program: 'entries',
      totalSlots: 12,
      number: '0427',
      holder: this.sampleHolder(),
      stamps: Array.from({ length: 3 }, () => ({
        date: day,
        operatorInitials: this.session.user()?.initials,
      })),
    };
  });

  constructor() {
    // Fill the form whenever the business arrives, without overwriting unsaved edits.
    effect(() => {
      const b = this.store.business();
      if (b && this.form.pristine) this.reset(b);
    });
  }

  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { style, design, stampStyle, emblem, ...details } = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .updateMyBusiness({
        ...details,
        appearance: { style, design, stampStyle, emblem: emblem === 'none' ? undefined : emblem },
      })
      .subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.store.set(saved);
          this.reset(saved);
          this.notifier.success('common.saved');
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.notifier.error(apiErrorKey(error));
        },
      });
  }

  protected discard() {
    const b = this.store.business();
    if (b) this.reset(b);
  }

  protected onLogo(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      this.notifier.error('errors.logo_invalid');
      return;
    }
    this.updateLogo(this.api.uploadMyBusinessLogo({ file }));
  }

  protected removeLogo() {
    this.updateLogo(this.api.deleteMyBusinessLogo());
  }

  private updateLogo(request: Observable<Business>) {
    this.uploading.set(true);
    request.subscribe({
      next: (saved) => {
        this.uploading.set(false);
        this.store.set(saved);
        this.notifier.success('business.logoSaved');
      },
      error: (error: unknown) => {
        this.uploading.set(false);
        this.notifier.error(apiErrorKey(error));
      },
    });
  }

  private reset(b: Business) {
    this.form.reset({
      category: b.category,
      tagline: b.tagline ?? '',
      contactName: b.contactName ?? '',
      contactPhone: b.contactPhone ?? '',
      email: b.email ?? '',
      address: b.address ?? '',
      city: b.city ?? '',
      style: b.appearance.style,
      design: b.appearance.design,
      stampStyle: b.appearance.stampStyle,
      emblem: b.appearance.emblem ?? 'none',
    });
  }

}
