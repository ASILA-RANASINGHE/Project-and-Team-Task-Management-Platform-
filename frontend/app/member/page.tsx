'use client';

import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute, { Role } from '../../components/ProtectedRoute';
import AuthenticatedLayout from '../../components/AuthenticatedLayout';
import StatsCard from '../../components/StatsCard';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';

/* ── Types ── */

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

interface ProjectInfo {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
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

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  LOW: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  MEDIUM: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  HIGH: 'bg-red-500/10 text-red-400 ring-red-500/20',
};

/* ───────────────────────────────────────────
   Member dashboard (inner component)
   ─────────────────────────────────────────── */

function MemberDashboard() {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get<TasksResponse | Task[]>('/tasks');
      const loadedTasks = Array.isArray(data) ? data : data.tasks;
      setTasks(loadedTasks ?? []);
    } catch {
      toast.error('Failed to load your assigned tasks.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
      toast.success('Task status updated.');
    } catch {
      toast.error('Failed to update task status. Please try again.');
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

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatsCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="To Do"
          value={tasks.filter((t) => t.status === 'TODO').length}
          accentGradient="from-slate-400 to-slate-600"
        />
        <StatsCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
          label="In Progress"
          value={tasks.filter((t) => t.status === 'IN_PROGRESS').length}
          accentGradient="from-amber-400 to-orange-500"
        />
        <StatsCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Completed"
          value={tasks.filter((t) => t.status === 'DONE').length}
          accentGradient="from-emerald-400 to-teal-500"
        />
      </div>

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
                  {/* Project name badge and Priority badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-slate-400 ring-1 ring-inset ring-white/10">
                      {task.project?.name ?? 'Unknown Project'}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${PRIORITY_BADGE[task.priority]}`}
                    >
                      {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                    </span>
                  </div>

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
