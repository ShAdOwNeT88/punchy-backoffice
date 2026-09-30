import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** One headline number with its label, for dashboards. */
@Component({
  selector: 'app-stat-tile',
  imports: [MatIconModule],
  template: `
    <div class="tile">
      <span class="tile__icon"><mat-icon aria-hidden="true">{{ icon() }}</mat-icon></span>
      <div>
        <div class="tile__value">{{ value() }}</div>
        <div class="tile__label">{{ label() }}</div>
        @if (hint()) {
          <div class="tile__hint">{{ hint() }}</div>
        }
      </div>
    </div>
  `,
  styles: `
    .tile {
      display: flex;
      gap: var(--app-space-4);
      align-items: center;
      height: 100%;
      padding: var(--app-space-5);
      box-sizing: border-box;
      border-radius: var(--app-radius-lg);
      background: var(--app-surface);
      border: var(--app-border) solid var(--mat-sys-outline-variant);
    }
    .tile__icon {
      display: grid;
      place-items: center;
      width: var(--app-brand-mark);
      height: var(--app-brand-mark);
      border-radius: var(--app-radius-md);
      color: var(--mat-sys-on-primary-container);
      background: var(--mat-sys-primary-container);
    }
    .tile__value { font: var(--mat-sys-headline-small); font-weight: 700; }
    .tile__label { color: var(--mat-sys-on-surface-variant); }
    .tile__hint { font: var(--mat-sys-body-small); color: var(--app-warning); }
  `,
})
export class StatTile {
  readonly icon = input.required<string>();
  readonly value = input.required<string | number>();
  readonly label = input.required<string>();
  readonly hint = input<string>();
}
