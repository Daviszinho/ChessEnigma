
import type {Metadata} from 'next';
// import {Geist, Geist_Mono} from 'next/font/google'; // Temporarily commented out
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

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
    <html lang="en" suppressHydrationWarning>
      {/* Temporarily remove font variables, original: className={`${geistSans.variable} ${geistMono.variable} antialiased`} */}
      <body className="antialiased">
          {children}
          <Toaster />
      </body>
    </html>
  );
}
