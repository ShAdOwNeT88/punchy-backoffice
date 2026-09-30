import { Injectable, type Provider, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslocoService } from '@jsverse/transloco';

/** Material paginator labels from the global `paginator.*` keys, following the active language. */
@Injectable()
export class TranslatedPaginatorIntl extends MatPaginatorIntl {
  private readonly transloco = inject(TranslocoService);

  constructor() {
    super();
    this.transloco
      .selectTranslation()
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const t = (key: string) => this.transloco.translate(`paginator.${key}`);
        this.itemsPerPageLabel = t('itemsPerPage');
        this.nextPageLabel = t('next');
        this.previousPageLabel = t('previous');
        this.firstPageLabel = t('first');
        this.lastPageLabel = t('last');
        this.changes.next();
      });
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    const start = length === 0 ? 0 : page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, length);
    return this.transloco.translate('paginator.range', { start, end, length });
  };
}

/**
 * Registered on the routes of the list pages rather than at bootstrap, so the paginator module
 * stays out of the initial bundle.
 */
export function provideTranslatedPaginator(): Provider {
  return { provide: MatPaginatorIntl, useClass: TranslatedPaginatorIntl };
}
