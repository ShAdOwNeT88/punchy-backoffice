import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { EMPTY, type Observable, catchError, filter, switchMap, tap } from 'rxjs';

import { Notifier } from '@core/notifications/notifier';
import { confirm } from '@shared/ui/confirm-dialog/confirm-dialog';
import { apiErrorKey } from '@shared/util/api-error';

import { AdminService } from '../../data-access/api/endpoints/admin/admin.service';
import type { Business } from '../../data-access/api/model';
import { BusinessFormDialog } from './business-form-dialog';

/** The actions on a business shared by the list and the detail page. */
@Injectable({ providedIn: 'root' })
export class BusinessActions {
  private readonly dialog = inject(MatDialog);
  private readonly admin = inject(AdminService);
  private readonly transloco = inject(TranslocoService);
  private readonly notifier = inject(Notifier);

  /** Opens the form; emits the saved business. */
  edit(business: Business | null): Observable<Business> {
    return this.dialog
      .open(BusinessFormDialog, { data: business, panelClass: 'app-dialog', autoFocus: 'dialog' })
      .afterClosed()
      .pipe(
        filter((saved): saved is Business => !!saved),
        tap(() => this.notifier.success(business ? 'common.saved' : 'businesses.created')),
      );
  }

  /** Suspends an active business or reactivates a suspended one, after confirmation. */
  toggleStatus(business: Business): Observable<Business> {
    const suspend = business.status === 'active';
    const t = (key: string) => this.transloco.translate(key, { name: business.name });
    return confirm(this.dialog, {
      title: t(suspend ? 'businesses.suspend.title' : 'businesses.reactivate.title'),
      message: t(suspend ? 'businesses.suspend.message' : 'businesses.reactivate.message'),
      confirm: t(suspend ? 'businesses.suspend.confirm' : 'businesses.reactivate.confirm'),
      cancel: t('common.cancel'),
      destructive: suspend,
    }).pipe(
      filter(Boolean),
      switchMap(() =>
        this.admin.setBusinessStatus(business.id, { status: suspend ? 'suspended' : 'active' }),
      ),
      tap({
        next: () => this.notifier.success(suspend ? 'businesses.suspend.done' : 'businesses.reactivate.done'),
        error: (error: unknown) => this.notifier.error(apiErrorKey(error)),
      }),
      catchError(() => EMPTY),
    );
  }
}
