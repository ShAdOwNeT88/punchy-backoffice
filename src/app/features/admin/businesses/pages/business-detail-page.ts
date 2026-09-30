import { Component, computed, inject, input } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { CardPreview, type CardPreviewData } from '@shared/ui/card-preview/card-preview';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { StatTile } from '@shared/ui/stat-tile/stat-tile';
import { StatusChip } from '@shared/ui/status-chip/status-chip';
import { DayPipe } from '@shared/util/format.pipes';

import { AdminService } from '../../data-access/api/endpoints/admin/admin.service';
import type { Business } from '../../data-access/api/model';
import { BusinessActions } from '../components/business-actions';

/** One business: its details, how its cards look, and the managers who work for it. */
@Component({
  selector: 'app-business-detail-page',
  imports: [
    CardPreview,
    DayPipe,
    EmptyState,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    RouterLink,
    StatTile,
    StatusChip,
    TranslocoPipe,
  ],
  templateUrl: './business-detail-page.html',
  styleUrl: './business-detail-page.scss',
})
export default class BusinessDetailPage {
  readonly businessId = input.required<string>();

  private readonly admin = inject(AdminService);
  private readonly actions = inject(BusinessActions);

  protected readonly business = rxResource({
    params: () => this.businessId(),
    stream: ({ params }) => this.admin.getBusiness(params),
  });
  protected readonly managers = rxResource({
    params: () => this.businessId(),
    stream: ({ params }) => this.admin.listManagers({ businessId: params, pageSize: 100 }),
  });

  // A global key: translateSignal would prefix it with this route's scope.
  private readonly sampleHolder = toSignal(
    inject(TranslocoService).selectTranslate('cardPreview.sampleHolder'),
    { initialValue: '' },
  );

  protected readonly address = computed(() => {
    const b = this.business.value();
    return [b?.address, b?.city].filter(Boolean).join(', ');
  });

  protected readonly managerColumns = ['name', 'email', 'status', 'lastLogin'];

  protected readonly preview = computed<CardPreviewData | null>(() => {
    const b = this.business.value();
    if (!b) return null;
    return {
      issuerName: b.name,
      category: b.category,
      emblem: b.appearance.emblem,
      logoUrl: b.logoUrl,
      tagline: b.tagline,
      contactName: b.contactName,
      contactPhone: b.contactPhone,
      style: b.appearance.style,
      design: b.appearance.design,
      stampStyle: b.appearance.stampStyle,
      program: 'entries',
      totalSlots: 10,
      number: '0001',
      holder: this.sampleHolder(),
      stamps: [{ date: b.createdAt.slice(0, 10) }],
    };
  });

  protected edit(business: Business) {
    this.actions.edit(business).subscribe((saved) => this.business.set(saved));
  }

  protected toggleStatus(business: Business) {
    this.actions.toggleStatus(business).subscribe((saved) => {
      this.business.set(saved);
      this.managers.reload();
    });
  }
}
