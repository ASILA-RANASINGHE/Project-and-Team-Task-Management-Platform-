import { create } from 'zustand';
import api from '../api/axios';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'DONE'];

const useTaskStore = create((set, get) => ({
  // ── State ──
  tasks: [],
  isLoading: false,
  error: null,

  // ── Computed: tasks grouped by status column ──
  getTasksByStatus: (status) => {
    return get().tasks.filter((task) => task.status === status);
  },

  // ── Fetch tasks for a specific project ──
  fetchTasks: async (projectId) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.get(`/tasks`, {
        params: { projectId },
      });

      set({ tasks: data.tasks, isLoading: false });
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to fetch tasks.';

      set({ tasks: [], isLoading: false, error: message });
    }
  },

  // ── Update task status (PATCH /tasks/:id/status) ──
  updateTaskStatus: async (taskId, newStatus) => {
    if (!COLUMNS.includes(newStatus)) return;

    // Optimistic update – move the card immediately
    const previousTasks = get().tasks;

    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ),
    }));

    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    } catch (error) {
      // Revert on failure
      set({ tasks: previousTasks });

      const message =
        error.response?.data?.message || 'Failed to update task status.';

      set({ error: message });
    }
  },

  // ── Clear error ──
  clearError: () => set({ error: null }),
}));

export default useTaskStore;
