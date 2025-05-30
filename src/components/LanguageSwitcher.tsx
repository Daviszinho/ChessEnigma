
"use client";

import React from 'react';
import { useLocale, type Locale } from '@/context/LocaleContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();

  const languages: { code: Locale; nameKey: string }[] = [
    { code: 'en', nameKey: 'languageEnglish' },
    { code: 'es', nameKey: 'languageSpanish' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            disabled={locale === lang.code}
          >
            {t(lang.nameKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
