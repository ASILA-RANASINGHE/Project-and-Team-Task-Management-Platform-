'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute, { Role } from '../../../../components/ProtectedRoute';
import AuthenticatedLayout from '../../../../components/AuthenticatedLayout';
import { useToast } from '../../../../context/ToastContext';
import { api } from '../../../../lib/api';

/* ── Types ── */

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

interface Assignee {
  id: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
  assigneeId: string | null;
  assignee: Assignee | null;
}

interface Member {
  id: string;
  userId: string;
  projectId: string;
  user: { id: string; name: string; email: string; role: Role };
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  managerId: string;
  manager: { id: string; name: string; email: string };
  members: Member[];
  tasks: Task[];
}

/* ── Constants ── */

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
];

const STATUS_BADGE: Record<TaskStatus, string> = {
  TODO: 'bg-slate-500/15 text-slate-300 ring-slate-500/30',
  IN_PROGRESS: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  DONE: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
};

/* ───────────────────────────────────────────
   Inner dashboard (rendered inside guard)
   ─────────────────────────────────────────── */

function ProjectDashboard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Task form ──
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  // ── Member form ──
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // ── Status update ──
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  /* ── Fetch project ── */
  const fetchProject = useCallback(async () => {
    try {
      const { data } = await api.get<{ project: ProjectDetail } | ProjectDetail>(
        `/projects/${id}`,
      );
      // Handle both { project: ... } and direct object shapes
      const proj = 'project' in data ? data.project : data;
      setProject(proj);
    } catch {
      toast.error('Failed to load project.');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  /* ── Create task ── */
  async function handleCreateTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreatingTask(true);

    try {
      const body: Record<string, unknown> = {
        title: taskTitle.trim(),
        projectId: id,
      };
      if (taskDesc.trim()) body.description = taskDesc.trim();
      if (taskDue) body.dueDate = taskDue;
      if (taskAssignee) body.assigneeId = taskAssignee;

      await api.post('/tasks', body);

      // Re-fetch to get the full task with assignee populated
      await fetchProject();
      setTaskTitle('');
      setTaskDesc('');
      setTaskDue('');
      setTaskAssignee('');
      setShowTaskForm(false);
      toast.success('Task created successfully!');
    } catch (err: unknown) {
      toast.error(extractMessage(err, 'Failed to create task.'));
    } finally {
      setCreatingTask(false);
    }
  }

  /* ── Add member ── */
  async function handleAddMember(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddingMember(true);

    try {
      await api.post(`/projects/${id}/members`, {
        email: memberEmail.trim(),
      });

      await fetchProject();
      setMemberEmail('');
      toast.success('Member added successfully.');
    } catch (err: unknown) {
      toast.error(extractMessage(err, 'Failed to add member.'));
    } finally {
      setAddingMember(false);
    }
  }

  /* ── Update task status ── */
  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    setUpdatingTaskId(taskId);
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, status: newStatus } : t,
          ),
        };
      });
      toast.success('Task status updated.');
    } catch {
      toast.error('Failed to update task status.');
    } finally {
      setUpdatingTaskId(null);
    }
  }

  /* ── Helper ── */
  function extractMessage(err: unknown, fallback: string): string {
    if (
      typeof err === 'object' &&
      err !== null &&
      'response' in err &&
      typeof (err as { response?: { data?: { message?: string } } }).response
        ?.data?.message === 'string'
    ) {
      return (err as { response: { data: { message: string } } }).response.data
        .message;
    }
    return fallback;
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-amber-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-slate-400">
        <p className="text-lg">Project not found.</p>
        <button
          onClick={() => router.push('/manager')}
          className="text-sm text-amber-400 transition-colors hover:text-amber-300"
        >
          ← Back to projects
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* ── Back link + Header ── */}
      <button
        onClick={() => router.push('/manager')}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Back to projects
      </button>

      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-amber-400">
          Project
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {project.name}
        </h1>
        {project.description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            {project.description}
          </p>
        )}
      </div>

      {/* ── Action buttons row ── */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => { setShowTaskForm((v) => !v); setShowMemberForm(false); }}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          {showTaskForm ? 'Cancel' : 'New Task'}
        </button>

        <button
          onClick={() => { setShowMemberForm((v) => !v); setShowTaskForm(false); }}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white backdrop-blur transition-all duration-200 hover:border-white/20 hover:bg-white/[0.1] active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
          {showMemberForm ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      {/* ═══════════════════════════════════
           Create Task Form
         ═══════════════════════════════════ */}
      {showTaskForm && (
        <div className="animate-fade-in-up mb-8 rounded-xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20 backdrop-blur-lg">
          <h2 className="mb-4 text-lg font-semibold text-white">Create Task</h2>

          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Title */}
              <div className="sm:col-span-2">
                <label htmlFor="task-title" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Title
                </label>
                <input
                  id="task-title"
                  type="text"
                  required
                  placeholder="Implement login flow"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none ring-amber-500/40 transition-all duration-200 focus:border-amber-500/50 focus:bg-white/[0.08] focus:ring-2"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label htmlFor="task-desc" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Description <span className="text-slate-500">(optional)</span>
                </label>
                <textarea
                  id="task-desc"
                  rows={2}
                  placeholder="Details about the task…"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none ring-amber-500/40 transition-all duration-200 focus:border-amber-500/50 focus:bg-white/[0.08] focus:ring-2"
                />
              </div>

              {/* Due date */}
              <div>
                <label htmlFor="task-due" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Due date <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  id="task-due"
                  type="date"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white outline-none ring-amber-500/40 transition-all duration-200 focus:border-amber-500/50 focus:bg-white/[0.08] focus:ring-2 [color-scheme:dark]"
                />
              </div>

              {/* Assignee */}
              <div>
                <label htmlFor="task-assignee" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Assign to <span className="text-slate-500">(optional)</span>
                </label>
                <select
                  id="task-assignee"
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white outline-none ring-amber-500/40 transition-all duration-200 focus:border-amber-500/50 focus:bg-white/[0.08] focus:ring-2"
                >
                  <option value="" className="bg-slate-800">Unassigned</option>
                  {project.members.map((m) => (
                    <option key={m.userId} value={m.userId} className="bg-slate-800">
                      {m.user.name} ({m.user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingTask}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingTask ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creating…
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════
           Add Member Form
         ═══════════════════════════════════ */}
      {showMemberForm && (
        <div className="animate-fade-in-up mb-8 rounded-xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20 backdrop-blur-lg">
          <h2 className="mb-4 text-lg font-semibold text-white">Add Team Member</h2>

          <form onSubmit={handleAddMember} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="member-email" className="mb-1.5 block text-sm font-medium text-slate-300">
                User email
              </label>
              <input
                id="member-email"
                type="email"
                required
                placeholder="teammate@example.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none ring-amber-500/40 transition-all duration-200 focus:border-amber-500/50 focus:bg-white/[0.08] focus:ring-2"
              />
            </div>
            <button
              type="submit"
              disabled={addingMember}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-white backdrop-blur transition-all duration-200 hover:border-white/20 hover:bg-white/[0.1] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {addingMember ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Adding…
                </>
              ) : (
                'Add Member'
              )}
            </button>
          </form>

          {/* Current members list */}
          {project.members.length > 0 && (
            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                Current Members ({project.members.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {project.members.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300 ring-1 ring-inset ring-white/10"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-[10px] font-bold text-white">
                      {m.user.name.charAt(0).toUpperCase()}
                    </span>
                    {m.user.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════
           Tasks Table
         ═══════════════════════════════════ */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Task
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Assignee
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Due Date
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {project.tasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No tasks yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                project.tasks.map((task) => (
                  <tr key={task.id} className="transition-colors hover:bg-white/[0.03]">
                    {/* Task title + desc */}
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{task.title}</p>
                      {task.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                          {task.description}
                        </p>
                      )}
                    </td>

                    {/* Assignee */}
                    <td className="whitespace-nowrap px-6 py-4 text-slate-300">
                      {task.assignee ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-[10px] font-bold text-white">
                            {task.assignee.name.charAt(0).toUpperCase()}
                          </span>
                          {task.assignee.name}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Due date */}
                    <td className="whitespace-nowrap px-6 py-4 text-slate-400">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : <span className="text-slate-600">—</span>}
                    </td>

                    {/* Status dropdown */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="relative inline-block">
                        <select
                          value={task.status}
                          disabled={updatingTaskId === task.id}
                          onChange={(e) =>
                            handleStatusChange(task.id, e.target.value as TaskStatus)
                          }
                          className={`cursor-pointer appearance-none rounded-full py-1 pl-3 pr-7 text-xs font-medium ring-1 ring-inset outline-none transition-all duration-200 disabled:cursor-wait disabled:opacity-50 ${STATUS_BADGE[task.status]}`}
                          style={{ backgroundColor: 'transparent' }}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-slate-800 text-white">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                          {updatingTaskId === task.id ? (
                            <svg className="h-3 w-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-50" viewBox="0 0 20 20" fill="currentColor">
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
            {project.tasks.length} {project.tasks.length === 1 ? 'task' : 'tasks'} ·{' '}
            {project.members.length} {project.members.length === 1 ? 'member' : 'members'}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   Exported page — guarded for PROJECT_MANAGER
   ─────────────────────────────────────────── */

export default function ProjectDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['PROJECT_MANAGER']}>
      <AuthenticatedLayout>
        <ProjectDashboard />
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}
