import { create } from 'zustand';
import api from '../api/axios';

const useProjectStore = create((set) => ({
  // ── State ──
  projects: [],
  isLoading: false,
  error: null,

  // ── Fetch all projects (role-filtered on backend) ──
  fetchProjects: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.get('/projects');

      set({ projects: data.projects, isLoading: false });
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to fetch projects.';

      set({ projects: [], isLoading: false, error: message });
    }
  },

  // ── Create a new project ──
  createProject: async (projectData) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.post('/projects', projectData);

      set((state) => ({
        projects: [...state.projects, data.project],
        isLoading: false,
        error: null,
      }));

      return data;
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to create project.';

      set({ isLoading: false, error: message });

      throw error;
    }
  },

  // ── Clear error ──
  clearError: () => set({ error: null }),
}));

export default useProjectStore;
