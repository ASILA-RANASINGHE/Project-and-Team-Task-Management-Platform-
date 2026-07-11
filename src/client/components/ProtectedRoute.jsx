'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../store/authStore';

/**
 * ProtectedRoute – Next.js App Router guard component.
 *
 * Wraps page content and enforces authentication + role-based access:
 *   • Not authenticated  → redirects to /login
 *   • Authenticated but role not in allowedRoles → redirects to /unauthorized
 *   • Authenticated and role allowed → renders children
 *
 * @param {Object}   props
 * @param {string[]} props.allowedRoles - Roles permitted to view this page
 *                                        e.g. ['ADMIN', 'PROJECT_MANAGER']
 * @param {React.ReactNode} props.children - The protected page content
 *
 * @example
 *   // In a Next.js App Router page (e.g. app/dashboard/page.jsx)
 *   export default function DashboardPage() {
 *     return (
 *       <ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER']}>
 *         <DashboardContent />
 *       </ProtectedRoute>
 *     );
 *   }
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  useEffect(() => {
    // Not logged in → send to login page
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Logged in but role not allowed → send to unauthorized page
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      router.replace('/unauthorized');
    }
  }, [isAuthenticated, role, allowedRoles, router]);

  // ── While redirecting, render nothing ──
  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return null;
  }

  // ── Authorized – render the page ──
  return children;
}
