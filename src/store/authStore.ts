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
    const result = await api.login({ username, password });
    set({
      user: {
        id: result.userId,
        email: '',
        username: result.username,
        isAdmin: result.isAdmin,
      },
      isAuthenticated: true,
    });
  },

  register: async (email, username, password) => {
    const result = await api.register({ email, username, password });
    set({
      user: {
        id: result.userId,
        email,
        username: result.username,
        isAdmin: result.isAdmin,
      },
      isAuthenticated: true,
    });
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
