import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { filter, switchMap } from 'rxjs';

import { Notifier } from '@core/notifications/notifier';
import { confirm } from '@shared/ui/confirm-dialog/confirm-dialog';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { apiErrorKey } from '@shared/util/api-error';
import { DayPipe } from '@shared/util/format.pipes';

import { BusinessService } from '../../data-access/api/endpoints/business/business.service';
import type { Card, Customer } from '../../data-access/api/model';
import { CardRow } from '../components/card-row';
import { CustomerFormDialog } from '../components/customer-form-dialog';
import { IssueCardDialog, type IssueCardData } from '../components/issue-card-dialog';

/** A customer's details and every card they hold, with issuing of new ones. */
@Component({
  selector: 'app-customer-detail-page',
  imports: [
    CardRow,
    DayPipe,
    EmptyState,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    RouterLink,
    TranslocoPipe,
  ],
  templateUrl: './customer-detail-page.html',
  styleUrl: './customer-detail-page.scss',
})
export default class CustomerDetailPage {
  readonly customerId = input.required<string>();

  private readonly api = inject(BusinessService);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);

  protected readonly customer = rxResource({
    params: () => this.customerId(),
    stream: ({ params }) => this.api.getCustomer(params),
  });
  protected readonly cards = rxResource({
    params: () => this.customerId(),
    stream: ({ params }) => this.api.listCards({ customerId: params, pageSize: 100 }),
  });
  protected readonly templates = rxResource({ stream: () => this.api.listTemplates() });

  protected edit(customer: Customer) {
    this.dialog
      .open(CustomerFormDialog, { data: customer, panelClass: 'app-dialog', autoFocus: 'dialog' })
      .afterClosed()
      .pipe(filter((saved): saved is Customer => !!saved))
      .subscribe((saved) => {
        this.customer.set(saved);
        this.notifier.success('common.saved');
      });
  }

  protected issue(customer: Customer) {
    const templates = this.templates.value() ?? [];
    if (templates.length === 0) {
      this.notifier.error('customers.issue.noTemplates');
      return;
    }
    this.dialog
      .open<IssueCardDialog, IssueCardData, Card>(IssueCardDialog, {
        data: { customer, templates },
        panelClass: 'app-dialog',
        autoFocus: 'dialog',
      })
      .afterClosed()
      .pipe(filter((card): card is Card => !!card))
      .subscribe((card) => {
        this.notifier.success('customers.issue.done', { number: card.number });
        this.cards.reload();
        this.customer.reload();
      });
  }

  protected remove(customer: Customer) {
    const name = `${customer.firstName} ${customer.lastName}`;
    confirm(this.dialog, {
      title: this.transloco.translate('customers.delete.title', { name }),
      message: this.transloco.translate('customers.delete.message', { name }),
      confirm: this.transloco.translate('common.delete'),
      cancel: this.transloco.translate('common.cancel'),
      destructive: true,
    })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.deleteCustomer(customer.id)),
      )
      .subscribe({
        next: () => {
          this.notifier.success('customers.delete.done');
          void this.router.navigate(['/manager/customers']);
        },
        error: (error: unknown) => this.notifier.error(apiErrorKey(error)),
      });
  }
}
