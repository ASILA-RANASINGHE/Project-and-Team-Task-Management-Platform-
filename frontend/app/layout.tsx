import type { Metadata } from 'next';
import { ToastProvider } from '../context/ToastContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Frontend',
  description: 'Next.js 14 app router frontend',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
