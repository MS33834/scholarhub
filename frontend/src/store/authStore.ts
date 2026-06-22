import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: number;
  email: string;
  username: string;
  isAdmin: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username, password) => {
    await api.login({ username, password });
    const user = await api.getMe();
    set({ user, isAuthenticated: true });
  },

  register: async (email, username, password) => {
    await api.register({ email, username, password });
    const user = await api.getMe();
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    api.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = api.getToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const user = await api.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      // Access token may have expired; try to refresh silently once.
      const refreshed = await api.refresh();
      if (refreshed) {
        try {
          const user = await api.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
          return;
        } catch {
          // Fall through to logout.
        }
      }
      api.logout();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
