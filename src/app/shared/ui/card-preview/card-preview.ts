import { Component, computed, input, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

import { DayPipe } from '@shared/util/format.pipes';
import { emblemIcon } from '@shared/util/icons';

/** What the preview draws. Plain values, so any domain can map its own model onto it. */
export interface CardPreviewData {
  issuerName: string;
  category: string;
  emblem?: string;
  logoUrl?: string;
  tagline?: string;
  contactName?: string;
  contactPhone?: string;
  style: string;
  design: 'gradient' | 'paper';
  stampStyle: 'round' | 'signature';
  program: 'entries' | 'monthly' | 'loyalty';
  totalSlots: number;
  number?: string;
  holder?: string;
  reward?: string;
  validUntil?: string;
  stamps: { date: string; operatorInitials?: string }[];
}

interface Box {
  index: number;
  stamp?: { date: string; operatorInitials?: string };
  isReward: boolean;
}

/** Columns of the stamp grid, as on the paper cards: 12 → 4×3, 10 → 5×2, 6 → 3×2. */
export function gridColumns(total: number): number {
  if (total <= 5) return Math.max(total, 1);
  for (const columns of [5, 4, 3]) if (total % columns === 0) return columns;
  return 5;
}

/**
 * The card as the customer sees it in the app, front and back. Shows what the issuer's
 * appearance choices produce; it has no behaviour of its own besides turning the card over.
 */
@Component({
  selector: 'app-card-preview',
  imports: [MatButtonToggleModule, MatIconModule, TranslocoPipe, DayPipe],
  templateUrl: './card-preview.html',
  styleUrl: './card-preview.scss',
})
export class CardPreview {
  readonly card = input.required<CardPreviewData>();
  readonly showToggle = input(true);

  protected readonly side = signal<'front' | 'back'>('front');

  protected readonly icon = computed(() => emblemIcon(this.card().emblem, this.card().category));
  protected readonly columns = computed(() => gridColumns(this.card().totalSlots));
  protected readonly contact = computed(() =>
    [this.card().contactName, this.card().contactPhone].filter(Boolean).join(' · '),
  );
  protected readonly boxes = computed<Box[]>(() => {
    const { totalSlots, stamps, program } = this.card();
    return Array.from({ length: totalSlots }, (_, index) => ({
      index,
      stamp: stamps[index],
      isReward: program === 'loyalty' && index === totalSlots - 1,
    }));
  });

  protected flip() {
    this.side.update((s) => (s === 'front' ? 'back' : 'front'));
  }
}
