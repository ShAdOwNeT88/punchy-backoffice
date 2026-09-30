import { Pipe, type PipeTransform, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { type DateStyle, formatDay, formatMoney, formatMonth } from './format';

// Impure so that they follow the active language; each call is a cheap Intl format.

@Pipe({ name: 'money', pure: false })
export class MoneyPipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);

  transform(cents: number | null | undefined): string {
    return formatMoney(cents, this.transloco.getActiveLang());
  }
}

@Pipe({ name: 'day', pure: false })
export class DayPipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);

  transform(value: string | null | undefined, style: DateStyle = 'medium'): string {
    return formatDay(value, this.transloco.getActiveLang(), style);
  }
}

@Pipe({ name: 'month', pure: false })
export class MonthPipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);

  transform(value: string | null | undefined): string {
    return formatMonth(value, this.transloco.getActiveLang());
  }
}
