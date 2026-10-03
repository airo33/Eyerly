import { useCallback } from 'react';

import { LanguageCode } from '@/constants/languages';
import { deviceLanguage, i18n } from '@/lib/i18n';
import { useSettings } from './use-settings';

/** Effective language: explicit choice, else device default. */
export function useLanguage(): LanguageCode {
  const { settings } = useSettings();
  return settings.language ?? deviceLanguage();
}

export function useT() {
  const locale = useLanguage();
  return useCallback(
    (key: string, options?: Record<string, unknown>) =>
      i18n.t(key, { locale, ...options }),
    [locale],
  );
}
