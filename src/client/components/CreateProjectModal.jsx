'use client';

import { useState } from 'react';
import useProjectStore from '../store/projectStore';

/**
 * CreateProjectModal – A Tailwind-styled modal for creating a new project.
 *
 * @param {Object}   props
 * @param {boolean}  props.isOpen   - Whether the modal is visible
 * @param {Function} props.onClose  - Callback to close the modal
 */
export default function CreateProjectModal({ isOpen, onClose }) {
  const { createProject, isLoading, error, clearError } = useProjectStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setName('');
    setDescription('');
    setValidationError('');
    clearError();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) {
      setValidationError('Project name is required.');
      return;
    }

    try {
      await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      handleClose();
    } catch {
      // Error is already set in the store
    }
  };

  return (
    // ── Backdrop ──
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={handleClose}
    >
      {/* ── Modal Panel ── */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-white mb-1">Create New Project</h2>
        <p className="text-sm text-gray-400 mb-6">Fill in the details to get started.</p>

        {/* Error messages */}
        {(error || validationError) && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {validationError || error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Project Name */}
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-300 mb-1.5">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="project-description" className="block text-sm font-medium text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              id="project-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating…
                </span>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
