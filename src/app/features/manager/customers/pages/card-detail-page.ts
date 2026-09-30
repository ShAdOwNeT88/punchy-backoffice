import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { CardPreview } from '@shared/ui/card-preview/card-preview';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { ProgressMeter } from '@shared/ui/progress-meter/progress-meter';
import { StatusChip } from '@shared/ui/status-chip/status-chip';
import { DayPipe, MoneyPipe, MonthPipe } from '@shared/util/format.pipes';

import { BusinessService } from '../../data-access/api/endpoints/business/business.service';
import type { Card, Payment, Stamp } from '../../data-access/api/model';
import { balanceDue, remainingSlots, statusTone, toPreview } from '../../data-access/card-view';
import { MyBusinessStore } from '../../data-access/my-business.store';
import { CardActions } from '../components/card-actions';

/** One card: what the customer sees, validation of the next box, payments and history. */
@Component({
  selector: 'app-card-detail-page',
  imports: [
    CardPreview,
    DayPipe,
    EmptyState,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    MatTableModule,
    MatTooltipModule,
    MoneyPipe,
    MonthPipe,
    ProgressMeter,
    RouterLink,
    StatusChip,
    TranslocoPipe,
  ],
  templateUrl: './card-detail-page.html',
  styleUrl: './card-detail-page.scss',
})
export default class CardDetailPage {
  readonly cardId = input.required<string>();

  private readonly api = inject(BusinessService);
  private readonly actions = inject(CardActions);
  private readonly router = inject(Router);
  private readonly business = inject(MyBusinessStore).business;

  protected readonly card = rxResource({
    params: () => this.cardId(),
    stream: ({ params }) => this.api.getCard(params),
  });

  protected readonly preview = computed(() => {
    const card = this.card.value();
    const business = this.business();
    return card && business ? toPreview(card, business) : null;
  });
  protected readonly remaining = computed(() => {
    const card = this.card.value();
    return card ? remainingSlots(card) : 0;
  });
  protected readonly due = computed(() => {
    const card = this.card.value();
    return card ? balanceDue(card) : 0;
  });
  protected readonly history = computed(() => [...(this.card.value()?.stamps ?? [])].reverse());
  protected readonly payments = computed(() => [...(this.card.value()?.payments ?? [])].reverse());
  protected readonly statusTone = statusTone;

  protected readonly stampColumns = ['date', 'period', 'operator', 'amount', 'note', 'actions'];
  protected readonly paymentColumns = ['date', 'amount', 'method', 'operator', 'note', 'actions'];

  protected stamp(card: Card) {
    this.actions.stamp(card).subscribe((updated) => this.card.set(updated));
  }

  protected pay(card: Card) {
    this.actions.pay(card).subscribe((updated) => this.card.set(updated));
  }

  protected edit(card: Card) {
    this.actions.edit(card).subscribe((updated) => this.card.set(updated));
  }

  protected cancel(card: Card) {
    this.actions.cancel(card).subscribe((updated) => this.card.set(updated));
  }

  protected redeem(card: Card, renew: boolean) {
    this.actions.redeem(card, renew).subscribe(({ card: redeemed, renewed }) => {
      if (renewed) void this.router.navigate(['/manager/cards', renewed.id]);
      else this.card.set(redeemed);
    });
  }

  protected undo(card: Card, stamp: Stamp) {
    this.actions.undoStamp(card, stamp).subscribe((updated) => this.card.set(updated));
  }

  protected deletePayment(card: Card, payment: Payment) {
    this.actions.deletePayment(card, payment).subscribe((updated) => this.card.set(updated));
  }
}
