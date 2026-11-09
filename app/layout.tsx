import './globals.css';
import type { Metadata, Viewport } from 'next';
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
};
export const metadata: Metadata = {
  title: 'Lumen — dein Denkraum',
  description: 'Quellenbasiertes Arbeiten in einem ruhigen Workspace.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
