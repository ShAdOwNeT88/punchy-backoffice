import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter } from 'rxjs';

import { Notifier } from '@core/notifications/notifier';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { StatusChip } from '@shared/ui/status-chip/status-chip';
import { apiErrorKey } from '@shared/util/api-error';
import { MoneyPipe } from '@shared/util/format.pipes';

import { BusinessService } from '../../data-access/api/endpoints/business/business.service';
import type { CardProgram, CardTemplate } from '../../data-access/api/model';
import { TemplateFormDialog } from '../components/template-form-dialog';

const PROGRAM_ICONS: Record<CardProgram, string> = {
  entries: 'confirmation_number',
  monthly: 'calendar_month',
  loyalty: 'loyalty',
};

/** What the business sells or hands out: every card is issued from one of these. */
@Component({
  selector: 'app-templates-page',
  imports: [
    EmptyState,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MoneyPipe,
    StatusChip,
    TranslocoPipe,
  ],
  templateUrl: './templates-page.html',
  styleUrl: './templates-page.scss',
})
export default class TemplatesPage {
  private readonly api = inject(BusinessService);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);

  protected readonly showArchived = signal(false);
  protected readonly templates = rxResource({
    params: () => this.showArchived(),
    stream: ({ params }) => this.api.listTemplates({ includeArchived: params }),
  });
  protected readonly icons = PROGRAM_ICONS;

  protected edit(template: CardTemplate | null) {
    this.dialog
      .open(TemplateFormDialog, { data: template, panelClass: 'app-dialog', autoFocus: 'dialog' })
      .afterClosed()
      .pipe(filter((saved): saved is CardTemplate => !!saved))
      .subscribe(() => {
        this.notifier.success(template ? 'common.saved' : 'templates.created');
        this.templates.reload();
      });
  }

  protected setArchived(template: CardTemplate, archived: boolean) {
    this.api.updateTemplate(template.id, { archived }).subscribe({
      next: () => {
        this.notifier.success(archived ? 'templates.archived' : 'templates.restored');
        this.templates.reload();
      },
      error: (error: unknown) => this.notifier.error(apiErrorKey(error)),
    });
  }
}
