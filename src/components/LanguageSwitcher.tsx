
"use client";

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label'; // Assuming you have a Label component

type Locale = 'en' | 'es' | 'pt';

export const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale, t } = useTranslation();

  const handleLocaleChange = (newLocale: string) => {
    setLocale(newLocale as Locale);
  };

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="language-select" className="text-sm text-muted-foreground">
        {t('selectLanguage')}
      </Label>
      <Select value={locale} onValueChange={handleLocaleChange}>
        <SelectTrigger id="language-select" className="w-auto min-w-[120px]">
          <SelectValue placeholder={t('selectLanguage')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t('languageEnglish')}</SelectItem>
          <SelectItem value="es">{t('languageSpanish')}</SelectItem>
          <SelectItem value="pt">{t('languagePortuguese')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
