import type { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { EMPTY, type Observable, catchError, filter, switchMap, tap } from 'rxjs';

import { Notifier } from '@core/notifications/notifier';
import { confirm } from '@shared/ui/confirm-dialog/confirm-dialog';
import { apiErrorKey } from '@shared/util/api-error';
import { formatDay, formatMoney } from '@shared/util/format';

import { BusinessService } from '../../data-access/api/endpoints/business/business.service';
import type { Card, Payment, RedeemResponse, Stamp } from '../../data-access/api/model';
import { CardEditDialog } from './card-edit-dialog';
import { PaymentDialog } from './payment-dialog';
import { StampDialog } from './stamp-dialog';

/**
 * The operations on a card, each ending with the updated card. Failures are reported to the
 * user here and complete the stream without a value.
 */
@Injectable({ providedIn: 'root' })
export class CardActions {
  private readonly dialog = inject(MatDialog);
  private readonly api = inject(BusinessService);
  private readonly transloco = inject(TranslocoService);
  private readonly notifier = inject(Notifier);

  stamp(card: Card): Observable<Card> {
    return this.openDialog(StampDialog, card).pipe(
      tap((updated) =>
        this.notifier.success(updated.rewardReady ? 'customers.stamp.doneReward' : 'customers.stamp.done'),
      ),
    );
  }

  pay(card: Card): Observable<Card> {
    return this.openDialog(PaymentDialog, card).pipe(tap(() => this.notifier.success('customers.payment.done')));
  }

  edit(card: Card): Observable<Card> {
    return this.openDialog(CardEditDialog, card).pipe(tap(() => this.notifier.success('common.saved')));
  }

  redeem(card: Card, renew: boolean): Observable<RedeemResponse> {
    return this.confirmThen(
      {
        title: 'customers.redeem.title',
        message: renew ? 'customers.redeem.messageRenew' : 'customers.redeem.message',
        confirm: 'customers.redeem.confirm',
        params: { reward: card.reward ?? '' },
      },
      () => this.api.redeemReward(card.id, { renew }),
      'customers.redeem.done',
    );
  }

  cancel(card: Card): Observable<Card> {
    return this.confirmThen(
      {
        title: 'customers.cancel.title',
        message: 'customers.cancel.message',
        confirm: 'customers.cancel.confirm',
        params: { number: card.number },
        destructive: true,
      },
      () => this.api.cancelCard(card.id),
      'customers.cancel.done',
    );
  }

  undoStamp(card: Card, stamp: Stamp): Observable<Card> {
    const lang = this.transloco.getActiveLang();
    return this.confirmThen(
      {
        title: 'customers.undo.title',
        message: stamp.paymentId ? 'customers.undo.messagePayment' : 'customers.undo.message',
        confirm: 'customers.undo.confirm',
        params: { date: formatDay(stamp.date, lang) },
        destructive: true,
      },
      () => this.api.deleteStamp(card.id, stamp.id),
      'customers.undo.done',
    );
  }

  deletePayment(card: Card, payment: Payment): Observable<Card> {
    const lang = this.transloco.getActiveLang();
    return this.confirmThen(
      {
        title: 'customers.deletePayment.title',
        message: 'customers.deletePayment.message',
        confirm: 'common.delete',
        params: { amount: formatMoney(payment.amountCents, lang), date: formatDay(payment.date, lang) },
        destructive: true,
      },
      () => this.api.deletePayment(card.id, payment.id),
      'customers.deletePayment.done',
    );
  }

  private openDialog<C>(component: ComponentType<C>, card: Card): Observable<Card> {
    return this.dialog
      .open<C, Card, Card>(component, { data: card, panelClass: 'app-dialog', autoFocus: 'dialog' })
      .afterClosed()
      .pipe(filter((updated): updated is Card => !!updated));
  }

  private confirmThen<T>(
    texts: {
      title: string;
      message: string;
      confirm: string;
      params: Record<string, string>;
      destructive?: boolean;
    },
    action: () => Observable<T>,
    doneKey: string,
  ): Observable<T> {
    const t = (key: string) => this.transloco.translate(key, texts.params);
    return confirm(this.dialog, {
      title: t(texts.title),
      message: t(texts.message),
      confirm: t(texts.confirm),
      cancel: t('common.cancel'),
      destructive: texts.destructive,
    }).pipe(
      filter(Boolean),
      switchMap(() => action()),
      tap(() => this.notifier.success(doneKey)),
      catchError((error: unknown) => {
        this.notifier.error(apiErrorKey(error));
        return EMPTY;
      }),
    );
  }
}
