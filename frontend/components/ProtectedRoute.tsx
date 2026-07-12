'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

/** Roles used throughout the application. */
export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER';

interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface ProtectedRouteProps {
  /** Roles that are allowed to view the wrapped content. */
  allowedRoles: Role[];
  children: ReactNode;
}

/**
 * Client-side route guard for the Next.js App Router.
 *
 * - Reads the `user` object from localStorage (set during login).
 * - Redirects to `/login` when no user is found.
 * - Redirects to `/unauthorized` when the user's role is not in `allowedRoles`.
 * - Renders `children` only after the role check passes.
 */
export default function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('user');

    if (!raw) {
      router.replace('/login');
      return;
    }

    try {
      const user: StoredUser = JSON.parse(raw);

      if (!allowedRoles.includes(user.role)) {
        router.replace('/unauthorized');
        return;
      }

      setAuthorized(true);
    } catch {
      // Corrupt data → treat as unauthenticated
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.replace('/login');
    }
  }, [allowedRoles, router]);

  if (!authorized) {
    // Show a minimal loading state while checking auth
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-sky-400" />
      </div>
    );
  }

  return <>{children}</>;
}
