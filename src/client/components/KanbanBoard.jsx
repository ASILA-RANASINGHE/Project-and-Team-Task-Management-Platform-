'use client';

import { useEffect, useState, useCallback } from 'react';
import useTaskStore from '../store/taskStore';
import TaskCard from './TaskCard';

// ── Column configuration ──
const COLUMNS = [
  {
    id: 'TODO',
    title: 'To Do',
    accent: 'text-blue-400',
    accentBg: 'bg-blue-500/10',
    dotColor: 'bg-blue-400',
    borderHover: 'border-blue-500/40',
    dropGlow: 'shadow-blue-500/10',
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    accent: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    dotColor: 'bg-amber-400',
    borderHover: 'border-amber-500/40',
    dropGlow: 'shadow-amber-500/10',
  },
  {
    id: 'DONE',
    title: 'Done',
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    dotColor: 'bg-emerald-400',
    borderHover: 'border-emerald-500/40',
    dropGlow: 'shadow-emerald-500/10',
  },
];

/**
 * KanbanColumn – A single drop-target column.
 */
function KanbanColumn({ column, tasks, onDrop }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    // Only trigger when leaving the column itself, not child elements
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);

      const taskId = e.dataTransfer.getData('text/plain');
      if (taskId) {
        onDrop(taskId, column.id);
      }
    },
    [column.id, onDrop]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        flex flex-col rounded-2xl border bg-gray-900/40 backdrop-blur-sm
        transition-all duration-200 min-h-[28rem]
        ${isDragOver
          ? `border-dashed ${column.borderHover} shadow-lg ${column.dropGlow} scale-[1.01]`
          : 'border-white/5'
        }
      `}
    >
      {/* ── Column Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${column.dotColor}`} />
          <h3 className={`text-sm font-semibold ${column.accent}`}>
            {column.title}
          </h3>
        </div>
        <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${column.accentBg} text-xs font-bold ${column.accent}`}>
          {tasks.length}
        </span>
      </div>

      {/* ── Task List ── */}
      <div className="flex-1 space-y-3 p-4 overflow-y-auto">
        {tasks.length === 0 && (
          <div className={`
            flex items-center justify-center rounded-xl border border-dashed border-white/10 py-10
            text-xs text-gray-500 transition-colors
            ${isDragOver ? `${column.borderHover} ${column.accent}` : ''}
          `}>
            {isDragOver ? 'Drop here' : 'No tasks'}
          </div>
        )}

        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

/**
 * KanbanBoard – Drag-and-drop task board with three status columns.
 *
 * @param {Object}  props
 * @param {string}  props.projectId - The project whose tasks to display
 */
export default function KanbanBoard({ projectId }) {
  const { tasks, isLoading, error, fetchTasks, updateTaskStatus, clearError } =
    useTaskStore();

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
    }
  }, [projectId, fetchTasks]);

  const handleDrop = useCallback(
    (taskId, newStatus) => {
      // Find the task – skip if it's already in the target column
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === newStatus) return;

      updateTaskStatus(taskId, newStatus);
    },
    [tasks, updateTaskStatus]
  );

  // ── Loading state ──
  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28">
        <svg className="h-10 w-10 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="mt-4 text-sm text-gray-400">Loading tasks…</p>
      </div>
    );
  }

  return (
    <div>
      {/* Error banner */}
      {error && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">
            <span className="font-medium">Error:</span> {error}
          </p>
          <button
            onClick={clearError}
            className="text-xs text-red-400 underline hover:text-red-300 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Three-column Kanban grid ── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasks.filter((t) => t.status === column.id)}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
