import { Component, computed, input } from '@angular/core';

/** A thin bar with its caption, e.g. "4 of 12 entries". */
@Component({
  selector: 'app-progress-meter',
  template: `
    <div class="meter" [class.meter--done]="done()">
      <div
        class="meter__track"
        role="progressbar"
        [attr.aria-valuenow]="value()"
        [attr.aria-valuemax]="max()"
        aria-valuemin="0"
        [attr.aria-label]="label()"
      >
        <div class="meter__fill" [style.width.%]="percent()"></div>
      </div>
      <span class="meter__label">{{ label() }}</span>
    </div>
  `,
  styles: `
    .meter { display: flex; flex-direction: column; gap: var(--app-space-1); min-width: var(--app-space-10); }
    .meter__track {
      height: var(--app-space-2);
      border-radius: var(--app-radius-pill);
      background: var(--app-surface-muted);
      overflow: hidden;
    }
    .meter__fill { height: 100%; border-radius: inherit; background: var(--app-primary); }
    .meter--done .meter__fill { background: var(--app-success); }
    .meter__label { font: var(--mat-sys-body-small); color: var(--mat-sys-on-surface-variant); }
  `,
})
export class ProgressMeter {
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  readonly label = input('');
  readonly done = input(false);

  protected readonly percent = computed(() =>
    this.max() ? Math.min(100, (this.value() / this.max()) * 100) : 0,
  );
}
