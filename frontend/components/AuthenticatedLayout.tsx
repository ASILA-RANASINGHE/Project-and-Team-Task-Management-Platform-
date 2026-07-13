'use client';

import { ReactNode } from 'react';
import Navbar from './Navbar';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

/**
 * Shared layout wrapper for authenticated pages.
 * Renders the Navbar at the top and page content below.
 * Use this inside each ProtectedRoute‑guarded page to get a
 * consistent navigation bar without restructuring the file tree.
 */
export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
