
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';

type Locale = 'en' | 'es' | 'pt';
type Translations = Record<string, string>;

interface LocaleContextType {
  locale: Locale;
  translations: Translations;
  setLocale: (locale: Locale) => void;
  t: (key: string, variables?: Record<string, string | number | undefined>) => string;
}

export const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const defaultLocale: Locale = 'es';
const supportedLocales: Locale[] = ['en', 'es', 'pt'];

interface LocaleProviderProps {
  children: ReactNode;
}

export const LocaleProvider: React.FC<LocaleProviderProps> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [translations, setTranslations] = useState<Translations>({});

  const loadTranslations = useCallback(async (loc: Locale) => {
    try {
      const translationModule = await import(`@/locales/${loc}.json`);
      setTranslations(translationModule.default || translationModule);
    } catch (error) {
      console.error(`Could not load translations for locale: ${loc}`, error);
      // Fallback to default locale if specific one fails
      if (loc !== defaultLocale) {
        const fallbackModule = await import(`@/locales/${defaultLocale}.json`);
        setTranslations(fallbackModule.default || fallbackModule);
      }
    }
  }, []);

  useEffect(() => {
    const storedLocale = localStorage.getItem('locale') as Locale | null;
    const browserLocale = navigator.language.split('-')[0] as Locale;
    
    let initialLocale = defaultLocale;

    if (storedLocale && supportedLocales.includes(storedLocale)) {
      initialLocale = storedLocale;
    } else if (supportedLocales.includes(browserLocale)) {
      initialLocale = browserLocale;
    }
    
    setLocaleState(initialLocale);
    loadTranslations(initialLocale);
  }, [loadTranslations]);

  const setLocale = (newLocale: Locale) => {
    if (supportedLocales.includes(newLocale)) {
      setLocaleState(newLocale);
      localStorage.setItem('locale', newLocale);
      loadTranslations(newLocale);
    } else {
      console.warn(`Unsupported locale: ${newLocale}. Defaulting to ${defaultLocale}.`);
      setLocaleState(defaultLocale);
      localStorage.setItem('locale', defaultLocale);
      loadTranslations(defaultLocale);
    }
  };

  const t = useCallback((key: string, variables?: Record<string, string | number | undefined>): string => {
    let translation = translations[key] || key;
    if (variables) {
      Object.keys(variables).forEach((varName) => {
        const value = variables[varName];
        if (value !== undefined) {
          translation = translation.replace(new RegExp(`\\{${varName}\\}`, 'g'), String(value));
        }
      });
    }
    return translation;
  }, [translations]);

  return (
    <LocaleContext.Provider value={{ locale, translations, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};
