import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Placeholder for an empty list or a failed load; actions go in the content slot. */
@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  template: `
    <div class="empty">
      <mat-icon class="empty__icon" aria-hidden="true">{{ icon() }}</mat-icon>
      <div class="empty__title">{{ title() }}</div>
      @if (text()) {
        <p class="empty__text">{{ text() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--app-space-2);
      padding: var(--app-space-10) var(--app-space-4);
      text-align: center;
    }
    .empty__icon { color: var(--mat-sys-outline); transform: scale(1.6); margin-bottom: var(--app-space-2); }
    .empty__title { font: var(--mat-sys-title-medium); }
    .empty__text { margin: 0; color: var(--mat-sys-on-surface-variant); max-width: 42ch; }
  `,
})
export class EmptyState {
  readonly icon = input('inbox');
  readonly title = input.required<string>();
  readonly text = input<string>();
}
