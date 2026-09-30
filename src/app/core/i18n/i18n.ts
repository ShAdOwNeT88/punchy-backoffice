import { HttpClient } from '@angular/common/http';
import {
  type EnvironmentProviders,
  Injectable,
  inject,
  isDevMode,
  provideAppInitializer,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  type Translation,
  type TranslocoLoader,
  TranslocoService,
  provideTransloco,
} from '@jsverse/transloco';

export const LANGUAGES = ['it', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = 'punchy.lang';

/** Loads `public/i18n/<lang>.json` and, for a feature scope, `public/i18n/<scope>/<lang>.json`. */
@Injectable({ providedIn: 'root' })
class HttpTranslationLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(path: string) {
    return this.http.get<Translation>(`i18n/${path}.json`);
  }
}

function initialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (LANGUAGES as readonly string[]).includes(stored)) return stored as Language;
  } catch {
    // No stored preference.
  }
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'it';
}

/**
 * Transloco with the active language loaded before the first render, so no screen ever shows
 * translation keys (or caches an empty label, as mat-select does).
 */
export function provideI18n(): EnvironmentProviders[] {
  const transloco = provideTransloco({
    config: {
      availableLangs: [...LANGUAGES],
      defaultLang: initialLanguage(),
      fallbackLang: 'it',
      reRenderOnLangChange: true,
      prodMode: !isDevMode(),
      missingHandler: { useFallbackTranslation: true },
    },
    loader: HttpTranslationLoader,
  }) as unknown as EnvironmentProviders[];
  return [
    ...transloco,
    provideAppInitializer(() => {
      const service = inject(TranslocoService);
      document.documentElement.lang = service.getActiveLang();
      return firstValueFrom(service.load(service.getActiveLang()));
    }),
  ];
}

/** Switches the interface language and remembers the choice. */
@Injectable({ providedIn: 'root' })
export class LanguagePreference {
  private readonly transloco = inject(TranslocoService);

  readonly languages = LANGUAGES;

  current(): Language {
    return this.transloco.getActiveLang() as Language;
  }

  use(lang: Language): void {
    this.transloco.setActiveLang(lang);
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Not remembered.
    }
  }
}
