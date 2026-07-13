'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/ProtectedRoute';
import AuthenticatedLayout from '../../components/AuthenticatedLayout';
import { api } from '../../lib/api';

interface Manager {
  id: string;
  name: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  managerId: string;
  manager: Manager;
  members: { id: string; userId: string; projectId: string }[];
  tasks: { id: string; status: string }[];
}

interface ProjectsResponse {
  projects: Project[];
}

/* ──────────────────────────────────────────
   Manager dashboard (inner component)
   ────────────────────────────────────────── */

function ManagerDashboard() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Create‑form state ──
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      setError('');
      const { data } = await api.get<ProjectsResponse>('/projects');
      setProjects(data.projects);
    } catch {
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');
    setCreating(true);

    try {
      const { data } = await api.post<{ project: Project }>('/projects', {
        name: formName.trim(),
        description: formDesc.trim() || undefined,
      });

      // Newly created project won't have members/tasks from the response include,
      // so normalise it before pushing into state.
      const created: Project = {
        ...data.project,
        members: data.project.members ?? [],
        tasks: data.project.tasks ?? [],
      };

      setProjects((prev) => [created, ...prev]);
      setFormName('');
      setFormDesc('');
      setShowForm(false);
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response
          ?.data?.message === 'string'
      ) {
        setFormError(
          (err as { response: { data: { message: string } } }).response.data
            .message,
        );
      } else {
        setFormError('Failed to create project.');
      }
    } finally {
      setCreating(false);
    }
  }

  // ── Task counts helper ──
  function taskStats(tasks: { status: string }[]) {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    return { total, done };
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-sky-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-amber-400">
            Project Manager
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            My Projects
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Create, view, and manage the projects you own.
          </p>
        </div>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:from-amber-400 hover:to-orange-400 hover:shadow-amber-500/40 active:scale-[0.98]"
        >
          {showForm ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Project
            </>
          )}
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ── Create Project Form ── */}
      {showForm && (
        <div className="animate-fade-in-up mb-8 rounded-xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20 backdrop-blur-lg">
          <h2 className="mb-4 text-lg font-semibold text-white">
            New Project
          </h2>

          {formError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label
                htmlFor="project-name"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Project name
              </label>
              <input
                id="project-name"
                type="text"
                required
                placeholder="My Awesome Project"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none ring-amber-500/40 transition-all duration-200 focus:border-amber-500/50 focus:bg-white/[0.08] focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="project-description"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Description{' '}
                <span className="text-slate-500">(optional)</span>
              </label>
              <textarea
                id="project-description"
                rows={3}
                placeholder="A short description of the project…"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none ring-amber-500/40 transition-all duration-200 focus:border-amber-500/50 focus:bg-white/[0.08] focus:ring-2"
              />
            </div>

            <button
              id="create-project-submit"
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:from-amber-400 hover:to-orange-400 hover:shadow-amber-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creating…
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── Project Cards Grid ── */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-20 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mb-4 h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="text-lg font-medium text-slate-400">No projects yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Click &quot;Create Project&quot; to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const { total, done } = taskStats(project.tasks);
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <button
                key={project.id}
                onClick={() =>
                  router.push(`/manager/projects/${project.id}`)
                }
                className="group relative flex flex-col rounded-xl border border-white/10 bg-white/[0.04] p-6 text-left shadow-lg shadow-black/20 backdrop-blur-lg transition-all duration-200 hover:border-amber-500/30 hover:bg-white/[0.06] hover:shadow-amber-500/10"
              >
                {/* Title */}
                <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-amber-300">
                  {project.name}
                </h3>

                {/* Description */}
                {project.description && (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">
                    {project.description}
                  </p>
                )}

                {/* Stats */}
                <div className="mt-auto pt-5">
                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                      <span>Progress</span>
                      <span>
                        {done}/{total} tasks
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {/* Members */}
                    <span className="inline-flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {project.members.length}{' '}
                      {project.members.length === 1 ? 'member' : 'members'}
                    </span>

                    {/* Arrow indicator */}
                    <span className="ml-auto text-slate-600 transition-colors group-hover:text-amber-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   Exported page — guarded for PROJECT_MANAGER
   ────────────────────────────────────────── */

export default function ManagerPage() {
  return (
    <ProtectedRoute allowedRoles={['PROJECT_MANAGER']}>
      <AuthenticatedLayout>
        <ManagerDashboard />
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}
