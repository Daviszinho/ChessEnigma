
"use client";

import { useContext } from 'react';
import { LocaleContext } from '@/context/LocaleContext';

export const useTranslation = () => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LocaleProvider');
  }
  return context;
};
