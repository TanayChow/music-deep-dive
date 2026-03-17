import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { TopNav } from '@/components/nav/TopNav';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Music Deep Dive',
  description: 'Discover artists and tracks with production credits, audio features, and trivia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-bg-primary text-gray-100 min-h-screen antialiased`}>
        <TopNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      </body>
    </html>
  );
}
