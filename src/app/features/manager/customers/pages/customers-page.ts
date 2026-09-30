import { Component, type OnInit, inject, input, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged, filter, tap } from 'rxjs';

import { Notifier } from '@core/notifications/notifier';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { DayPipe } from '@shared/util/format.pipes';

import { BusinessService } from '../../data-access/api/endpoints/business/business.service';
import type { Customer } from '../../data-access/api/model';
import { CustomerFormDialog } from '../components/customer-form-dialog';

/** The business's customers, searchable by name, contact or card number. */
@Component({
  selector: 'app-customers-page',
  imports: [
    DayPipe,
    EmptyState,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTableModule,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './customers-page.html',
})
export default class CustomersPage implements OnInit {
  /** `?new=1` opens the creation form, e.g. from the dashboard. */
  readonly new = input<string>();

  private readonly api = inject(BusinessService);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);
  private readonly router = inject(Router);

  protected readonly columns = ['name', 'phone', 'cards', 'lastVisit'];

  protected readonly search = new FormControl('', { nonNullable: true });
  private readonly query = toSignal(
    this.search.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.page.set(0)),
    ),
    { initialValue: '' },
  );
  protected readonly page = signal(0);
  protected readonly pageSize = signal(20);

  protected readonly customers = rxResource({
    params: () => ({ q: this.query(), page: this.page(), pageSize: this.pageSize() }),
    stream: ({ params }) => this.api.listCustomers(params),
  });

  ngOnInit() {
    if (this.new()) {
      void this.router.navigate([], { queryParams: {}, replaceUrl: true });
      this.create();
    }
  }

  protected onPage(event: PageEvent) {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  protected open(customer: Customer) {
    void this.router.navigate(['/manager/customers', customer.id]);
  }

  protected create() {
    this.dialog
      .open(CustomerFormDialog, { data: null, panelClass: 'app-dialog', autoFocus: 'dialog' })
      .afterClosed()
      .pipe(filter((saved): saved is Customer => !!saved))
      .subscribe((customer) => {
        this.notifier.success('customers.created');
        this.open(customer);
      });
  }
}
