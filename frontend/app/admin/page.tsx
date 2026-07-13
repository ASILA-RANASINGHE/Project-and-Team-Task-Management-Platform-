'use client';

import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute, { Role } from '../../components/ProtectedRoute';
import { api } from '../../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'Project Manager',
  TEAM_MEMBER: 'Team Member',
};

const ROLE_BADGE_CLASSES: Record<Role, string> = {
  ADMIN:
    'bg-violet-500/15 text-violet-300 ring-violet-500/30',
  PROJECT_MANAGER:
    'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  TEAM_MEMBER:
    'bg-sky-500/15 text-sky-300 ring-sky-500/30',
};

const ALL_ROLES: Role[] = ['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'];

function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setError('');
      const { data } = await api.get<{ users: User[] }>('/users');
      setUsers(data.users);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleRoleChange(userId: string, newRole: Role) {
    setUpdatingId(userId);
    try {
      const { data } = await api.patch<User>(`/users/${userId}`, {
        role: newRole,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: data.role } : u)),
      );
    } catch {
      setError('Failed to update role. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-sky-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-400">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          User Management
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          View all registered users and manage their roles.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 flex-shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-400 transition-colors hover:text-red-200"
            aria-label="Dismiss error"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Name
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Role
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Change Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-white/[0.03]"
                  >
                    {/* Name */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-semibold text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">
                          {user.name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="whitespace-nowrap px-6 py-4 text-slate-300">
                      {user.email}
                    </td>

                    {/* Role badge */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_BADGE_CLASSES[user.role]}`}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>

                    {/* Role dropdown */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="relative">
                        <select
                          id={`role-select-${user.id}`}
                          value={user.role}
                          disabled={updatingId === user.id}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value as Role)
                          }
                          className="w-full min-w-[170px] cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 pr-8 text-sm text-white outline-none ring-sky-500/40 transition-all duration-200 hover:border-white/20 focus:border-sky-500/50 focus:ring-2 disabled:cursor-wait disabled:opacity-50"
                        >
                          {ALL_ROLES.map((role) => (
                            <option
                              key={role}
                              value={role}
                              className="bg-slate-800 text-white"
                            >
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                        {/* Chevron icon */}
                        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                          {updatingId === user.id ? (
                            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-6 py-3">
          <p className="text-xs text-slate-500">
            {users.length} {users.length === 1 ? 'user' : 'users'} total
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}


