import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Gemini Clone',
  description: 'A minimal, white chatbot interface inspired by Google Gemini.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans antialiased bg-white text-zinc-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
