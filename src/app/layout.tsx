
"use client"; // Required for LocaleContext and useEffect

import type { ReactNode } from 'react';
// import {Geist, Geist_Mono} from 'next/font/google'; // Temporarily commented out
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LocaleProvider, LocaleContext } from '@/context/LocaleContext'; // Import LocaleProvider
import { useContext, useEffect } from 'react'; // Import useContext and useEffect

/* // Temporarily commented out
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});
*/

// Metadata cannot be dynamic in client components directly
// For dynamic titles based on locale, you'd set it in page.tsx's useEffect
/*
export const metadata: Metadata = {
  title: 'ChessEnigma', // This will be overridden if set dynamically
  description: 'Solve chess puzzles and sharpen your mind.',
};
*/

interface RootLayoutProps {
  children: ReactNode;
}

// Inner component to access locale context for html lang attribute
function HtmlLangUpdater({ children }: { children: ReactNode }) {
  const localeContext = useContext(LocaleContext);

  // Default to 'es' if context is not yet available or locale is undefined
  const currentLang = localeContext?.locale || 'es';

  useEffect(() => {
    if (localeContext?.translations?.appName) {
      document.title = localeContext.t('appName');
    }
    if (localeContext?.translations?.appDescription) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', localeContext.t('appDescription'));
      } else {
        const newMeta = document.createElement('meta');
        newMeta.name = 'description';
        newMeta.content = localeContext.t('appDescription');
        document.head.appendChild(newMeta);
      }
    }
  }, [localeContext]);


  return (
    <html lang={currentLang} suppressHydrationWarning>
      <head>
        {/* Keep existing head elements or Next.js will manage them */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#09090b" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        {/* Initial title and description, can be updated by useEffect */}
        <title>ChessEnigma</title>
        <meta name="description" content="Solve chess puzzles and sharpen your mind." />
      </head>
      {/* Temporarily remove font variables, original: className={`${geistSans.variable} ${geistMono.variable} antialiased`} */}
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}


export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <LocaleProvider>
      <HtmlLangUpdater>
        {children}
      </HtmlLangUpdater>
    </LocaleProvider>
  );
}
