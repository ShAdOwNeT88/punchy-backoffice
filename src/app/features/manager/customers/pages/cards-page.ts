import { Component, type OnInit, inject, input, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs';

import { EmptyState } from '@shared/ui/empty-state/empty-state';

import { BusinessService } from '../../data-access/api/endpoints/business/business.service';
import type { CardStatus, ProgramGroup } from '../../data-access/api/model';
import { CardRow } from '../components/card-row';

/** Every card of the business, filterable by kind and state, searchable by number or name. */
@Component({
  selector: 'app-cards-page',
  imports: [
    CardRow,
    EmptyState,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    ReactiveFormsModule,
    RouterLink,
    TranslocoPipe,
  ],
  templateUrl: './cards-page.html',
})
export default class CardsPage implements OnInit {
  /** Initial search, e.g. from the dashboard's quick lookup. */
  readonly q = input<string>();

  private readonly api = inject(BusinessService);

  protected readonly search = new FormControl('', { nonNullable: true });
  private readonly query = toSignal(
    this.search.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.page.set(0)),
    ),
    { initialValue: '' },
  );
  protected readonly group = signal<ProgramGroup | ''>('');
  protected readonly status = signal<CardStatus | ''>('active');
  protected readonly page = signal(0);
  protected readonly pageSize = signal(20);
  protected readonly statuses: CardStatus[] = ['active', 'completed', 'expired', 'cancelled'];

  protected readonly cards = rxResource({
    params: () => ({
      q: this.query(),
      group: this.group() || undefined,
      status: this.status() || undefined,
      page: this.page(),
      pageSize: this.pageSize(),
    }),
    stream: ({ params }) => this.api.listCards(params),
  });

  ngOnInit() {
    const q = this.q();
    if (q) {
      this.search.setValue(q);
      this.status.set('');
    }
  }

  protected setGroup(group: ProgramGroup | '') {
    this.group.set(group);
    this.page.set(0);
  }

  protected setStatus(status: CardStatus | '') {
    this.status.set(status);
    this.page.set(0);
  }

  protected onPage(event: PageEvent) {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }
}
