'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute, { Role } from '../../../../components/ProtectedRoute';
import AuthenticatedLayout from '../../../../components/AuthenticatedLayout';
import { useToast } from '../../../../context/ToastContext';
import { api } from '../../../../lib/api';

interface LoginLogRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  loginTime: string;
}

function formatLoginTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function getRoleLabel(role: Role) {
  switch (role) {
    case 'ADMIN':
      return 'Admin';
    case 'PROJECT_MANAGER':
      return 'Project Manager';
    case 'TEAM_MEMBER':
      return 'Team Member';
    default:
      return role;
  }
}

const ROLE_BADGE_CLASSES: Record<Role, string> = {
  ADMIN: 'bg-violet-500/15 text-violet-300 ring-violet-500/30',
  PROJECT_MANAGER: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  TEAM_MEMBER: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
};

function normalizeLog(raw: Record<string, unknown>, index: number): LoginLogRow {
  const nestedUser =
    raw.user && typeof raw.user === 'object' ? (raw.user as Record<string, unknown>) : null;

  const loginTimeValue =
    raw.loginTime ?? raw.loggedInAt ?? raw.createdAt ?? raw.timestamp ?? raw.time;

  return {
    id:
      typeof raw.id === 'string'
        ? raw.id
        : typeof raw._id === 'string'
          ? raw._id
          : `login-log-${index}`,
    name:
      (typeof raw.name === 'string' && raw.name) ||
      (nestedUser && typeof nestedUser.name === 'string' ? nestedUser.name : 'Unknown user'),
    email:
      (typeof raw.email === 'string' && raw.email) ||
      (nestedUser && typeof nestedUser.email === 'string' ? nestedUser.email : 'Unknown email'),
    role: (typeof raw.role === 'string' ? raw.role : nestedUser?.role) as Role,
    loginTime:
      typeof loginTimeValue === 'string'
        ? loginTimeValue
        : loginTimeValue instanceof Date
          ? loginTimeValue.toISOString()
          : '',
  };
}

function AdminLoginLogsPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<LoginLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchLogs() {
      try {
        const { data } = await api.get('/users/login-logs');
        const rawLogs =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.loginLogs)
              ? data.loginLogs
              : Array.isArray(data?.logs)
                ? data.logs
                : [];

        if (isMounted) {
          setLogs(rawLogs.map((log: Record<string, unknown>, index: number) => normalizeLog(log, index)));
        }
      } catch {
        if (isMounted) {
          toast.error('Failed to load login logs.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchLogs();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-sky-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-400">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Login Activity
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Review recent login events across the platform.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  User Name
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Role
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Login Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No login logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-semibold text-white">
                          {log.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{log.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-300">
                      {log.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_BADGE_CLASSES[log.role]}`}
                      >
                        {getRoleLabel(log.role)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-300">
                      {formatLoginTime(log.loginTime)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-white/[0.06] px-6 py-3">
          <p className="text-xs text-slate-500">
            {logs.length} {logs.length === 1 ? 'entry' : 'entries'} total
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginLogsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AuthenticatedLayout>
        <div className="relative min-h-screen overflow-hidden bg-[#050816]">
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-sky-500/20 blur-[120px]" />
            <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-indigo-600/20 blur-[100px]" />
          </div>
          <div className="relative z-10">
            <AdminLoginLogsPage />
          </div>
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}