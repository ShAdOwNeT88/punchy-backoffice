import type { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { type TranslocoLoader, provideTransloco } from '@jsverse/transloco';
import { of } from 'rxjs';

class KeysLoader implements TranslocoLoader {
  getTranslation() {
    return of({});
  }
}

/**
 * Renders a dialog component with its data, a stubbed dialog ref and the given service stubs.
 * Returns helpers to fill inputs and submit the form.
 */
export async function renderDialog<T>(
  dialog: Type<T>,
  data: unknown,
  services: { provide: unknown; useValue: unknown }[] = [],
) {
  const close = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: { close } },
      provideTransloco({
        config: { availableLangs: ['it'], defaultLang: 'it', missingHandler: { logMissingKey: false } },
        loader: KeysLoader,
      }),
      ...services,
    ],
  });
  const fixture = TestBed.createComponent(dialog);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;

  const input = (name: string) =>
    element.querySelector(`[formcontrolname=${name}]`) as HTMLInputElement | null;

  return {
    fixture,
    element,
    close,
    input,
    async type(name: string, value: string) {
      const field = input(name)!;
      field.value = value;
      field.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    },
    async submit() {
      element.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    },
  };
}
