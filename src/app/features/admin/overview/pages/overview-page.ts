import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { StatTile } from '@shared/ui/stat-tile/stat-tile';
import { StatusChip } from '@shared/ui/status-chip/status-chip';
import { DayPipe } from '@shared/util/format.pipes';
import { categoryIcon } from '@shared/util/icons';

import { AdminService } from '../../data-access/api/endpoints/admin/admin.service';

/** Platform totals and the latest businesses, with shortcuts to create more. */
@Component({
  selector: 'app-overview-page',
  imports: [
    DayPipe,
    EmptyState,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    RouterLink,
    StatTile,
    StatusChip,
    TranslocoPipe,
  ],
  templateUrl: './overview-page.html',
  styleUrl: './overview-page.scss',
})
export default class OverviewPage {
  private readonly admin = inject(AdminService);

  protected readonly overview = rxResource({ stream: () => this.admin.getAdminOverview() });
  protected readonly categoryIcon = categoryIcon;
}
