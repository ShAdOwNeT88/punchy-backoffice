import { Injectable, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { Session } from '@core/auth/session';

import { BusinessService } from './api/endpoints/business/business.service';
import type { Business } from './api/model';

/**
 * The signed-in manager's business, loaded once and shared by the manager's pages. It reloads
 * when a different manager signs in.
 */
@Injectable({ providedIn: 'root' })
export class MyBusinessStore {
  private readonly api = inject(BusinessService);
  private readonly session = inject(Session);

  private readonly resource = rxResource({
    params: () => (this.session.role() === 'manager' ? this.session.user()?.businessId : undefined),
    stream: ({ params }) => (params ? this.api.getMyBusiness() : of(null)),
  });

  readonly business = computed(() => this.resource.value() ?? null);
  readonly error = this.resource.error;
  readonly isLoading = this.resource.isLoading;

  set(business: Business) {
    this.resource.set(business);
  }

  reload() {
    this.resource.reload();
  }
}
