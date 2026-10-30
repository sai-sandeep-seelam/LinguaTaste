import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LinguaTaste — Taste-Matched Language Immersion',
  description: 'Learn a language through content you already love. Powered by Qloo\'s taste intelligence.',
  keywords: 'language learning, personalized, taste, qloo, immersion, Japanese, Spanish, Korean, French',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
