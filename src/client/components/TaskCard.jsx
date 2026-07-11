'use client';

/**
 * TaskCard – A draggable Tailwind-styled card representing a single task.
 *
 * Uses the native HTML5 Drag and Drop API.
 * Stores the task ID in the dataTransfer so the drop target can read it.
 *
 * @param {Object} props
 * @param {Object} props.task - The task object
 */
export default function TaskCard({ task }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight delay so the browser captures the element before styling
    e.currentTarget.classList.add('opacity-40', 'scale-95');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-40', 'scale-95');
  };

  // Priority color based on due-date proximity
  const getDueBadge = () => {
    if (!task.dueDate) return null;

    const now = new Date();
    const due = new Date(task.dueDate);
    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          Overdue
        </span>
      );
    }

    if (daysLeft <= 2) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          {daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-gray-500/15 px-2 py-0.5 text-[11px] font-medium text-gray-400">
        {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </span>
    );
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="group cursor-grab rounded-xl border border-white/5 bg-gray-800/60 p-4 transition-all hover:border-indigo-500/20 hover:bg-gray-800/80 hover:shadow-md hover:shadow-indigo-500/5 active:cursor-grabbing"
    >
      {/* Title */}
      <h4 className="text-sm font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">
        {task.title}
      </h4>

      {/* Description (truncated) */}
      {task.description && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Footer: assignee + due date */}
      <div className="flex items-center justify-between">
        {/* Assignee */}
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
              {task.assignee.name?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-[11px] text-gray-500">{task.assignee.name}</span>
          </div>
        ) : (
          <span className="text-[11px] text-gray-600 italic">Unassigned</span>
        )}

        {/* Due badge */}
        {getDueBadge()}
      </div>
    </div>
  );
}
