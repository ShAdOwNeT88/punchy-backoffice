import { Component, type OnInit, inject, input, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs';

import { Notifier } from '@core/notifications/notifier';
import { confirm } from '@shared/ui/confirm-dialog/confirm-dialog';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { StatusChip } from '@shared/ui/status-chip/status-chip';
import { apiErrorKey } from '@shared/util/api-error';
import { DayPipe } from '@shared/util/format.pipes';

import { AdminService } from '../../data-access/api/endpoints/admin/admin.service';
import type { AccountStatus, Manager } from '../../data-access/api/model';
import { ManagerFormDialog, type ManagerFormData } from '../components/manager-form-dialog';
import { ResetPasswordDialog } from '../components/reset-password-dialog';

/** The managers of every business: creation, edits, suspension and password resets. */
@Component({
  selector: 'app-managers-page',
  imports: [
    DayPipe,
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
    MatTooltipModule,
    ReactiveFormsModule,
    RouterLink,
    StatusChip,
    TranslocoPipe,
  ],
  templateUrl: './managers-page.html',
})
export default class ManagersPage implements OnInit {
  /** `?new=1` opens the creation form; `?businessId=` preselects and filters a business. */
  readonly new = input<string>();
  readonly businessId = input<string>();

  private readonly admin = inject(AdminService);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);

  protected readonly columns = ['name', 'business', 'initials', 'lastLogin', 'status', 'actions'];

  protected readonly search = new FormControl('', { nonNullable: true });
  private readonly query = toSignal(
    this.search.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.page.set(0)),
    ),
    { initialValue: '' },
  );
  protected readonly business = signal('');
  protected readonly status = signal<AccountStatus | ''>('');
  protected readonly page = signal(0);
  protected readonly pageSize = signal(20);

  protected readonly businesses = rxResource({
    stream: () => this.admin.listBusinesses({ pageSize: 100 }),
  });
  protected readonly managers = rxResource({
    params: () => ({
      q: this.query(),
      businessId: this.business() || undefined,
      status: this.status() || undefined,
      page: this.page(),
      pageSize: this.pageSize(),
    }),
    stream: ({ params }) => this.admin.listManagers(params),
  });

  ngOnInit() {
    const businessId = this.businessId();
    if (businessId) this.business.set(businessId);
    if (this.new()) {
      void this.router.navigate([], { queryParams: {}, replaceUrl: true });
      this.admin.listBusinesses({ pageSize: 100 }).subscribe((page) =>
        this.openForm({ manager: null, businesses: page.items, businessId }),
      );
    }
  }

  protected setBusiness(id: string) {
    this.business.set(id);
    this.page.set(0);
  }

  protected setStatus(status: AccountStatus | '') {
    this.status.set(status);
    this.page.set(0);
  }

  protected onPage(event: PageEvent) {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  protected create() {
    this.openForm({
      manager: null,
      businesses: this.businesses.value()?.items ?? [],
      businessId: this.business() || undefined,
    });
  }

  protected edit(manager: Manager) {
    this.openForm({ manager, businesses: this.businesses.value()?.items ?? [] });
  }

  protected resetPassword(manager: Manager) {
    this.dialog
      .open(ResetPasswordDialog, { data: manager, panelClass: ['app-dialog', 'app-dialog--narrow'] })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.notifier.success('managers.reset.done'));
  }

  protected toggleStatus(manager: Manager) {
    const suspend = manager.status === 'active';
    const t = (key: string) =>
      this.transloco.translate(key, { name: `${manager.firstName} ${manager.lastName}` });
    confirm(this.dialog, {
      title: t(suspend ? 'managers.suspend.title' : 'managers.reactivate.title'),
      message: t(suspend ? 'managers.suspend.message' : 'managers.reactivate.message'),
      confirm: t(suspend ? 'managers.suspend.confirm' : 'managers.reactivate.confirm'),
      cancel: t('common.cancel'),
      destructive: suspend,
    })
      .pipe(
        filter(Boolean),
        switchMap(() =>
          this.admin.setManagerStatus(manager.id, { status: suspend ? 'suspended' : 'active' }),
        ),
      )
      .subscribe({
        next: () => {
          this.notifier.success(suspend ? 'managers.suspend.done' : 'managers.reactivate.done');
          this.managers.reload();
        },
        error: (error: unknown) => this.notifier.error(apiErrorKey(error)),
      });
  }

  private openForm(data: ManagerFormData) {
    this.dialog
      .open(ManagerFormDialog, { data, panelClass: 'app-dialog', autoFocus: 'dialog' })
      .afterClosed()
      .pipe(filter((saved): saved is Manager => !!saved))
      .subscribe(() => {
        this.notifier.success(data.manager ? 'common.saved' : 'managers.created');
        this.managers.reload();
      });
  }
}
