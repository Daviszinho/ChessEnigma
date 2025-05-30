
import type {Metadata} from 'next';
// import {Geist, Geist_Mono} from 'next/font/google'; // Temporarily commented out
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; 
import { LocaleProvider } from '@/context/LocaleContext';

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

export const metadata: Metadata = {
  title: 'ChessEnigma',
  description: 'Solve chess puzzles and sharpen your mind.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LocaleProvider>
      <html lang="en"> {/* Default lang, LocaleContext will update client-side */}
        {/* <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}> */}
        <body className="antialiased"> {/* Temporarily remove font variables */}
          {children}
          <Toaster />
        </body>
      </html>
    </LocaleProvider>
  );
}
