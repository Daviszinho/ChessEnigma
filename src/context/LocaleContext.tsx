
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Locale = 'en' | 'es';

interface LocaleContextType {
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('en'); // Default to English

  useEffect(() => {
    // Get stored locale from localStorage on mount (client-side only)
    const storedLocale = localStorage.getItem('locale') as Locale | null;
    if (storedLocale && ['en', 'es'].includes(storedLocale)) {
      setLocale(storedLocale);
    } else {
      // Optional: could try to guess from browser language
      // const browserLang = navigator.language.split('-')[0];
      // if (browserLang === 'es') setLocale('es');
      // else setLocale('en');
      setLocale('en'); // Default if nothing stored or invalid
    }
  }, []);

  useEffect(() => {
    // Persist locale to localStorage whenever it changes (client-side only)
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale);
      document.documentElement.lang = locale; // Set lang attribute on HTML element
    }
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = (): LocaleContextType => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
