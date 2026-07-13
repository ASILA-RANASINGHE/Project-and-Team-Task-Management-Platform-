'use client';

import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute, { Role } from '../../components/ProtectedRoute';
import AuthenticatedLayout from '../../components/AuthenticatedLayout';
import { api } from '../../lib/api';

/* ── Types ── */

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

interface ProjectInfo {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
  projectId: string;
  project: ProjectInfo;
}

interface TasksResponse {
  tasks: Task[];
}

/* ── Constants ── */

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
];

const STATUS_COLORS: Record<TaskStatus, { badge: string; border: string }> = {
  TODO: {
    badge: 'bg-slate-500/10 text-slate-400 ring-slate-500/20',
    border: 'border-slate-500/10 hover:border-slate-500/30',
  },
  IN_PROGRESS: {
    badge: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    border: 'border-amber-500/10 hover:border-amber-500/30',
  },
  DONE: {
    badge: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    border: 'border-emerald-500/10 hover:border-emerald-500/30',
  },
};

/* ───────────────────────────────────────────
   Member dashboard (inner component)
   ─────────────────────────────────────────── */

function MemberDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setError('');
      const { data } = await api.get<TasksResponse | Task[]>('/tasks');
      const loadedTasks = Array.isArray(data) ? data : data.tasks;
      setTasks(loadedTasks ?? []);
    } catch {
      setError('Failed to load your assigned tasks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    setUpdatingTaskId(taskId);
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
      );
    } catch {
      setError('Failed to update task status. Please try again.');
    } finally {
      setUpdatingTaskId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-sky-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-400">
          Team Member
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          My Tasks
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          View and update the status of tasks assigned to you.
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-20 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mb-4 h-12 w-12 text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <p className="text-lg font-medium text-slate-400">All caught up!</p>
          <p className="mt-1 text-sm text-slate-500">
            No tasks are currently assigned to you.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-xl border bg-white/[0.03] p-5 shadow-lg backdrop-blur-lg transition-all duration-200 ${STATUS_COLORS[task.status].border}`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  {/* Project name badge */}
                  <span className="inline-flex items-center rounded-md bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-slate-400 ring-1 ring-inset ring-white/10">
                    {task.project?.name ?? 'Unknown Project'}
                  </span>

                  {/* Task title */}
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {task.title}
                  </h3>

                  {/* Task description */}
                  {task.description && (
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">
                      {task.description}
                    </p>
                  )}

                  {/* Due date */}
                  {task.dueDate && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Due {new Date(task.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>

                {/* Status Dropdown */}
                <div className="relative self-start sm:self-center">
                  <select
                    value={task.status}
                    disabled={updatingTaskId === task.id}
                    onChange={(e) =>
                      handleStatusChange(task.id, e.target.value as TaskStatus)
                    }
                    className={`cursor-pointer appearance-none rounded-full py-1.5 pl-4 pr-9 text-xs font-semibold ring-1 ring-inset outline-none transition-all duration-200 disabled:cursor-wait disabled:opacity-50 ${STATUS_COLORS[task.status].badge}`}
                    style={{ backgroundColor: 'transparent' }}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="bg-slate-800 text-white font-normal"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    {updatingTaskId === task.id ? (
                      <svg
                        className="h-3.5 w-3.5 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 opacity-50"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MemberPage() {
  return (
    <ProtectedRoute allowedRoles={['TEAM_MEMBER']}>
      <AuthenticatedLayout>
        <MemberDashboard />
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}
