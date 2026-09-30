import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { Session } from '@core/auth/session';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { ProgressMeter } from '@shared/ui/progress-meter/progress-meter';
import { StatTile } from '@shared/ui/stat-tile/stat-tile';
import { StatusChip } from '@shared/ui/status-chip/status-chip';
import { DayPipe, MoneyPipe } from '@shared/util/format.pipes';

import { BusinessService } from '../../data-access/api/endpoints/business/business.service';
import { attentionTone, balanceDue } from '../../data-access/card-view';

/** The manager's day: headline numbers, a quick card lookup and the cards needing action. */
@Component({
  selector: 'app-dashboard-page',
  imports: [
    DayPipe,
    EmptyState,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MoneyPipe,
    ProgressMeter,
    ReactiveFormsModule,
    RouterLink,
    StatTile,
    StatusChip,
    TranslocoPipe,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export default class DashboardPage {
  private readonly api = inject(BusinessService);
  private readonly router = inject(Router);
  protected readonly user = inject(Session).user;

  protected readonly overview = rxResource({ stream: () => this.api.getBusinessOverview() });
  protected readonly lookup = new FormControl('', { nonNullable: true });

  protected readonly attentionTone = attentionTone;
  protected readonly balanceDue = balanceDue;

  protected find() {
    const q = this.lookup.value.trim();
    void this.router.navigate(['/manager/cards'], { queryParams: q ? { q } : {} });
  }
}
