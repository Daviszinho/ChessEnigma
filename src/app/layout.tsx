import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LocaleProvider } from '@/context/LocaleContext';
import { ClientLangUpdater } from '@/components/ClientLangUpdater';

export const metadata: Metadata = {
  title: 'ChessEnigma',
  description: 'Solve chess puzzles and sharpen your mind.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <LocaleProvider>
          <ClientLangUpdater />
          {children}
        </LocaleProvider>
        <Toaster />
      </body>
    </html>
  );
}
