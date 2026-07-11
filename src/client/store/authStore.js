import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

const useAuthStore = create(
  persist(
    (set) => ({
      // ── State ──
      user: null,
      role: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ── Login ──
      login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          const { data } = await api.post('/auth/login', { email, password });

          const { token, user } = data;

          // Persist the token for the axios interceptor
          localStorage.setItem('token', token);

          set({
            user,
            role: user.role,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return data;
        } catch (error) {
          const message =
            error.response?.data?.message || 'Login failed. Please try again.';

          set({
            user: null,
            role: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });

          throw error;
        }
      },

      // ── Register ──
      register: async (name, email, password) => {
        set({ isLoading: true, error: null });

        try {
          const { data } = await api.post('/auth/register', {
            name,
            email,
            password,
          });

          set({ isLoading: false, error: null });

          return data;
        } catch (error) {
          const message =
            error.response?.data?.message ||
            'Registration failed. Please try again.';

          set({ isLoading: false, error: message });

          throw error;
        }
      },

      // ── Logout ──
      logout: () => {
        localStorage.removeItem('token');

        set({
          user: null,
          role: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // ── Clear error ──
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
