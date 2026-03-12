"use client";

import { useEffect, useContext } from "react";
import { LocaleContext } from "@/context/LocaleContext";

export function ClientLangUpdater() {
  const localeContext = useContext(LocaleContext);

  useEffect(() => {
    if (localeContext?.locale) {
      document.documentElement.lang = localeContext.locale;
    }

    if (localeContext?.translations?.appName) {
      document.title = localeContext.t('appName');
    }

    if (localeContext?.translations?.appDescription) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', localeContext.t('appDescription'));
      } else {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        metaDescription.content = localeContext.t('appDescription');
        document.head.appendChild(metaDescription);
      }
      
      let metaOgDescription = document.querySelector('meta[property="og:description"]');
      if (metaOgDescription) {
        metaOgDescription.setAttribute('content', localeContext.t('appDescription'));
      }
    }
  }, [localeContext]);

  return null;
}
