import { create } from 'zustand';
import api, { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../lib/axios';
import { User, UserProfile, UserSettings } from '../types';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  settings: UserSettings | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setSettings: (settings: UserSettings | null) => void;
  setStatus: (status: AuthStatus) => void;
  fetchCurrentUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  settings: null,
  status: 'idle',
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setProfile: (profile) => set({ profile }),
  setSettings: (settings) => set({ settings }),
  setStatus: (status) => set({ status, isLoading: status === 'loading' }),

  fetchCurrentUser: async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      set({
        user: null,
        profile: null,
        settings: null,
        status: 'unauthenticated',
        isLoading: false,
        isAuthenticated: false,
      });
      return;
    }

    set({ status: 'loading', isLoading: true });
    try {
      const { data } = await api.get('/api/auth/me');
      set({
        user: data.user,
        profile: data.profile,
        settings: data.settings,
        status: 'authenticated',
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (err) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      set({
        user: null,
        profile: null,
        settings: null,
        status: 'unauthenticated',
        isLoading: false,
        isAuthenticated: false,
      });
    }
  },

  login: async (email: string, password: string) => {
    set({ status: 'loading', isLoading: true });
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
      if (data.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      }
      set({
        user: data.user,
        status: 'authenticated',
        isLoading: false,
        isAuthenticated: true,
      });
      await get().fetchCurrentUser();
    } catch (err) {
      set({ status: 'unauthenticated', isLoading: false, isAuthenticated: false });
      throw err;
    }
  },

  signup: async (name: string, email: string, password: string) => {
    set({ status: 'loading', isLoading: true });
    try {
      const { data } = await api.post('/api/auth/signup', { name, email, password });
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
      if (data.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      }
      set({
        user: data.user,
        status: 'authenticated',
        isLoading: false,
        isAuthenticated: true,
      });
      await get().fetchCurrentUser();
    } catch (err) {
      set({ status: 'unauthenticated', isLoading: false, isAuthenticated: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      set({
        user: null,
        profile: null,
        settings: null,
        status: 'unauthenticated',
        isLoading: false,
        isAuthenticated: false,
      });
      window.location.href = '/login';
    }
  },

  refreshProfile: async () => {
    await get().fetchCurrentUser();
  },
}));

