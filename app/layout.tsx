import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WebScape - Browser MMORPG',
  description: 'A tick-based browser RPG',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
