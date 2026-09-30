import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { ProgressMeter } from '@shared/ui/progress-meter/progress-meter';
import { StatusChip } from '@shared/ui/status-chip/status-chip';
import { DayPipe, MoneyPipe } from '@shared/util/format.pipes';

import type { Card } from '../../data-access/api/model';
import { balanceDue, statusTone } from '../../data-access/card-view';

/** One card in a list: who, which template, how full, what state. Links to the card. */
@Component({
  selector: 'app-card-row',
  imports: [DayPipe, MatIconModule, MoneyPipe, ProgressMeter, RouterLink, StatusChip, TranslocoPipe],
  template: `
    @let c = card();
    <a class="row" [routerLink]="['/manager/cards', c.id]">
      <div class="who">
        <span class="cell-main">
          @if (showCustomer()) {
            {{ c.customer.firstName }} {{ c.customer.lastName }}
          } @else {
            {{ c.templateName }}
          }
        </span>
        <span class="cell-sub">
          N. {{ c.number }} ·
          @if (showCustomer()) {
            {{ c.templateName }}
          } @else {
            {{ 'program.' + c.program | transloco }}
          }
          @if (c.validUntil) {
            · {{ 'customers.card.until' | transloco: { date: (c.validUntil | day) } }}
          }
        </span>
      </div>
      <app-progress-meter
        class="meter"
        [value]="c.stamps.length"
        [max]="c.totalSlots"
        [done]="c.rewardReady || c.status === 'completed'"
        [label]="'progress.' + c.program | transloco: { used: c.stamps.length, total: c.totalSlots }"
      />
      <div class="chips">
        @if (c.rewardReady) {
          <app-status-chip tone="success">{{ 'customers.card.rewardReady' | transloco }}</app-status-chip>
        } @else {
          <app-status-chip [tone]="tone()">{{ 'cardStatus.' + c.status | transloco }}</app-status-chip>
        }
        @if (due() > 0 && c.status === 'active') {
          <app-status-chip tone="error">{{ 'customers.card.due' | transloco: { amount: (due() | money) } }}</app-status-chip>
        }
      </div>
      <mat-icon class="go" aria-hidden="true">chevron_right</mat-icon>
    </a>
  `,
  styles: `
    .row {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(0, 1.2fr) auto auto;
      align-items: center;
      gap: var(--app-space-4);
      padding: var(--app-space-3) var(--app-space-5);
      color: inherit;
      text-decoration: none;
      border-top: var(--app-border) solid var(--mat-sys-outline-variant);
    }
    .row:hover { background: var(--app-surface-muted); }
    .who { display: flex; flex-direction: column; min-width: 0; }
    .chips { display: flex; flex-wrap: wrap; gap: var(--app-space-1); justify-content: flex-end; }
    .go { color: var(--mat-sys-on-surface-variant); }
    @media (max-width: 700px) {
      .row { grid-template-columns: minmax(0, 1fr) auto; }
      .meter, .go { display: none; }
    }
  `,
})
export class CardRow {
  readonly card = input.required<Card>();
  /** Lead with the customer's name (card lists) instead of the template (a customer's cards). */
  readonly showCustomer = input(true);

  protected readonly tone = computed(() => statusTone(this.card().status));
  protected readonly due = computed(() => balanceDue(this.card()));
}
