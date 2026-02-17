import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WebScape - Browser MMORPG',
  description: 'A tick-based browser RPG',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
