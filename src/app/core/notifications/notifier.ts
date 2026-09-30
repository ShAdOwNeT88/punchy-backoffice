import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoService } from '@jsverse/transloco';

/** Short confirmations and failures, shown as a snack bar. Messages are translation keys. */
@Injectable({ providedIn: 'root' })
export class Notifier {
  private readonly snackBar = inject(MatSnackBar);
  private readonly transloco = inject(TranslocoService);

  success(key: string, params?: Record<string, unknown>): void {
    this.show(key, params, 'app-snack-success');
  }

  error(key: string, params?: Record<string, unknown>): void {
    this.show(key, params, 'app-snack-error', 6000);
  }

  private show(key: string, params: Record<string, unknown> | undefined, panelClass: string, duration = 3500) {
    this.snackBar.open(this.transloco.translate(key, params), this.transloco.translate('common.close'), {
      duration,
      panelClass,
    });
  }
}
