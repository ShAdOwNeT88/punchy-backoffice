import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { map } from 'rxjs';

import { Session } from '@core/auth/session';
import { type Language, LanguagePreference } from '@core/i18n/i18n';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  exact?: boolean;
}

const NAV: Record<'admin' | 'manager', NavItem[]> = {
  admin: [
    { path: '/admin', icon: 'space_dashboard', label: 'nav.overview', exact: true },
    { path: '/admin/businesses', icon: 'storefront', label: 'nav.businesses' },
    { path: '/admin/managers', icon: 'badge', label: 'nav.managers' },
  ],
  manager: [
    { path: '/manager', icon: 'space_dashboard', label: 'nav.dashboard', exact: true },
    { path: '/manager/cards', icon: 'style', label: 'nav.cards' },
    { path: '/manager/customers', icon: 'group', label: 'nav.customers' },
    { path: '/manager/templates', icon: 'dashboard_customize', label: 'nav.templates' },
    { path: '/manager/business', icon: 'storefront', label: 'nav.business' },
  ],
};

/** The signed-in frame: navigation for the user's role, account menu and the routed page. */
@Component({
  selector: 'app-shell',
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslocoPipe,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly session = inject(Session);
  protected readonly language = inject(LanguagePreference);
  private readonly router = inject(Router);

  protected readonly compact = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 960px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  protected readonly nav = computed(() => {
    const role = this.session.role();
    return role === 'admin' || role === 'manager' ? NAV[role] : [];
  });

  protected readonly businessName = computed(() => {
    const user = this.session.user();
    return user?.role === 'manager' ? (user.businessName ?? '') : null;
  });

  protected setLanguage(lang: Language) {
    this.language.use(lang);
  }

  protected signOut() {
    this.session.end();
    void this.router.navigate(['/login']);
  }
}
