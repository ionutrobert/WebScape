import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WebScape Map Editor',
  description: '3D Map Editor for WebScape',
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
