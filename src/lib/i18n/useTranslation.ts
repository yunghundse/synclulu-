import { useCallback } from 'react';
import { useStore } from '../store';
import { translations, Language, LANGUAGES } from './translations';

// Type helper for translation paths (for future strict typing)
// type NestedKeyOf<T> = T extends object
//   ? { [K in keyof T]: K extends string ? T[K] extends object ? T[K] extends Record<Language, string> ? K : `${K}.${NestedKeyOf<T[K]>}` : K : never; }[keyof T]
//   : never;

/**
 * Hook for translations
 * Usage: const { t, language, setLanguage } = useTranslation();
 *        t('profile.title') // "Profil" or "Profile"
 *        t('level.levelUp', { level: 5 }) // with interpolation
 */
export function useTranslation() {
  const { language, setLanguage } = useStore();

  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const keys = path.split('.');
      let value: any = translations;

      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          console.warn(`Translation not found: ${path}`);
          return path;
        }
      }

      // Check if we reached a translation object
      if (value && typeof value === 'object' && language in value) {
        let text = value[language] as string;

        // Interpolate params
        if (params) {
          Object.entries(params).forEach(([key, val]) => {
            text = text.replace(new RegExp(`{${key}}`, 'g'), String(val));
          });
        }

        return text;
      }

      console.warn(`Translation not found for language ${language}: ${path}`);
      return path;
    },
    [language]
  );

  const changeLanguage = useCallback(
    (newLanguage: Language) => {
      setLanguage(newLanguage);
      // Persist to localStorage
      localStorage.setItem('delulu-language', newLanguage);
    },
    [setLanguage]
  );

  return {
    t,
    language,
    setLanguage: changeLanguage,
    languages: LANGUAGES,
    currentLanguage: LANGUAGES[language],
  };
}

/**
 * Get translation outside of React components
 */
export function getTranslation(
  language: Language,
  path: string,
  params?: Record<string, string | number>
): string {
  const keys = path.split('.');
  let value: any = translations;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path;
    }
  }

  if (value && typeof value === 'object' && language in value) {
    let text = value[language] as string;

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        text = text.replace(new RegExp(`{${key}}`, 'g'), String(val));
      });
    }

    return text;
  }

  return path;
}

export type { Language };
export { LANGUAGES };
