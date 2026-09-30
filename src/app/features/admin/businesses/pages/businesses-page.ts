import { Component, type OnInit, inject, input, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs';

import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { StatusChip } from '@shared/ui/status-chip/status-chip';
import { categoryIcon } from '@shared/util/icons';

import { AdminService } from '../../data-access/api/endpoints/admin/admin.service';
import type { AccountStatus, Business } from '../../data-access/api/model';
import { BusinessActions } from '../components/business-actions';

/** Every business on the platform, searchable, with suspension at hand. */
@Component({
  selector: 'app-businesses-page',
  imports: [
    EmptyState,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    ReactiveFormsModule,
    StatusChip,
    TranslocoPipe,
  ],
  templateUrl: './businesses-page.html',
})
export default class BusinessesPage implements OnInit {
  /** `?new=1` opens the creation form, e.g. from the overview. */
  readonly new = input<string>();

  private readonly admin = inject(AdminService);
  private readonly actions = inject(BusinessActions);
  private readonly router = inject(Router);

  protected readonly columns = ['name', 'category', 'managers', 'customers', 'cards', 'status', 'actions'];
  protected readonly categoryIcon = categoryIcon;

  protected readonly search = new FormControl('', { nonNullable: true });
  private readonly query = toSignal(
    this.search.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.page.set(0)),
    ),
    { initialValue: '' },
  );
  protected readonly status = signal<AccountStatus | ''>('');
  protected readonly page = signal(0);
  protected readonly pageSize = signal(20);

  protected readonly businesses = rxResource({
    params: () => ({
      q: this.query(),
      status: this.status() || undefined,
      page: this.page(),
      pageSize: this.pageSize(),
    }),
    stream: ({ params }) => this.admin.listBusinesses(params),
  });

  ngOnInit() {
    if (this.new()) {
      void this.router.navigate([], { queryParams: {}, replaceUrl: true });
      this.create();
    }
  }

  protected setStatus(status: AccountStatus | '') {
    this.status.set(status);
    this.page.set(0);
  }

  protected onPage(event: PageEvent) {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  protected open(business: Business) {
    void this.router.navigate(['/admin/businesses', business.id]);
  }

  protected create() {
    this.actions.edit(null).subscribe((b) => this.open(b));
  }

  protected edit(business: Business) {
    this.actions.edit(business).subscribe(() => this.businesses.reload());
  }

  protected toggleStatus(business: Business) {
    this.actions.toggleStatus(business).subscribe(() => this.businesses.reload());
  }
}
