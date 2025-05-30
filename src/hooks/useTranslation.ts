
"use client";

import { useLocale, type Locale } from '@/context/LocaleContext';
import enTranslations from '@/locales/en.json';
import esTranslations from '@/locales/es.json';

type Translations = Record<string, string>;
type NestedTranslations = Record<string, string | NestedTranslations>;


const translations: Record<Locale, Translations> = {
  en: enTranslations as Translations,
  es: esTranslations as Translations,
};

export const useTranslation = () => {
  const { locale } = useLocale();

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translationSet = translations[locale] || translations.en;
    let text = translationSet[key] || key;

    if (params) {
      Object.keys(params).forEach((paramKey) => {
        const regex = new RegExp(`{${paramKey}}`, 'g');
        text = text.replace(regex, String(params[paramKey]));
      });
    }
    return text;
  };

  return { t, currentLocale: locale };
};
