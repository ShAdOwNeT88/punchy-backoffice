import { Component, input } from '@angular/core';

export type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/** A small coloured label for a state; the text comes translated from the caller. */
@Component({
  selector: 'app-status-chip',
  template: `<span class="chip chip--{{ tone() }}"><ng-content /></span>`,
  styles: `
    .chip {
      display: inline-flex;
      align-items: center;
      gap: var(--app-space-1);
      padding: 2px var(--app-space-2);
      border-radius: var(--app-radius-pill);
      font: var(--mat-sys-label-medium);
      white-space: nowrap;
    }
    .chip--success { background: var(--app-success-soft); color: var(--app-success); }
    .chip--warning { background: var(--app-warning-soft); color: var(--app-warning); }
    .chip--error { background: var(--app-error-soft); color: var(--app-error); }
    .chip--info { background: var(--app-info-soft); color: var(--app-primary); }
    .chip--neutral { background: var(--app-neutral-soft); color: var(--app-text-muted); }
  `,
})
export class StatusChip {
  readonly tone = input<Tone>('neutral');
}
