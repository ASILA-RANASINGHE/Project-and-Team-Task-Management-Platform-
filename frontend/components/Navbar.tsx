'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Role } from './ProtectedRoute';

interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'Project Manager',
  TEAM_MEMBER: 'Team Member',
};

const ROLE_BADGE_CLASSES: Record<Role, string> = {
  ADMIN: 'bg-violet-500/15 text-violet-300 ring-violet-500/30',
  PROJECT_MANAGER: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  TEAM_MEMBER: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
};

const ROLE_AVATAR_GRADIENT: Record<Role, string> = {
  ADMIN: 'from-violet-500 to-purple-600',
  PROJECT_MANAGER: 'from-amber-400 to-orange-500',
  TEAM_MEMBER: 'from-sky-400 to-indigo-500',
};

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* corrupt data — ignore, ProtectedRoute will handle redirect */
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  }

  // Don't render until user is loaded from localStorage
  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* ── Left: Brand ── */}
        <a
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          {/* Logo icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 shadow-md shadow-sky-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4.5 w-4.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
          </div>
          <span className="hidden text-sm font-semibold tracking-tight text-white sm:block">
            TaskFlow
          </span>
        </a>

        {/* ── Right: User info + Logout ── */}
        <div className="flex items-center gap-3">
          {/* User info */}
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${ROLE_AVATAR_GRADIENT[user.role]} text-xs font-bold text-white shadow-sm`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>

            {/* Name + role */}
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-tight text-white">
                {user.name}
              </p>
              <span
                className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${ROLE_BADGE_CLASSES[user.role]}`}
              >
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/10" />

          {/* Logout button */}
          <button
            id="navbar-logout"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
