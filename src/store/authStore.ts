import { create } from 'zustand';
import { api } from '../services/api';

interface User {
  id: number;
  email: string;
  username: string;
  is_admin: boolean;
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
    const result = await api.login(username, password);
    set({
      user: {
        id: result.user_id,
        email: '',
        username: result.username,
        is_admin: result.is_admin,
      },
      isAuthenticated: true,
    });
  },

  register: async (email, username, password) => {
    const result = await api.register(email, username, password);
    set({
      user: {
        id: result.user_id,
        email,
        username: result.username,
        is_admin: result.is_admin,
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
      api.logout();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
