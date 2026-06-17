import { translate, type TranslationKey } from '../constants/i18n';
import { useSettingsStore } from '../store/settingsStore';

export function useTranslation() {
  const language = useSettingsStore((s) => s.language);
  return {
    language,
    t: (key: TranslationKey) => translate(language, key),
  };
}
