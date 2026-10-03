import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import { isSupportedLanguage, LanguageCode } from '@/constants/languages';
import { translations } from './translations';

export const i18n = new I18n(translations);
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

/** First supported language from the device, else English. */
export function deviceLanguage(): LanguageCode {
  for (const l of getLocales()) {
    if (l.languageCode && isSupportedLanguage(l.languageCode)) {
      return l.languageCode;
    }
  }
  return 'en';
}
