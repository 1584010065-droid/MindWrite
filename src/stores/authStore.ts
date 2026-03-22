/**
 * 认证状态管理
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, OAuthProvider, AuthResponse, TokenResponse, AuthState } from '../types/auth';

type AuthActions = {
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, nickname?: string) => Promise<User>;
  loginWithOAuth: (provider: OAuthProvider) => void;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  handleOAuthCallback: (accessToken: string, refreshToken: string) => Promise<void>;
};

type AuthStore = AuthState & AuthActions;

const API_BASE = '/api';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  accessToken: null,
  refreshToken: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (email: string, password: string): Promise<User> => {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || '登录失败');
        }

        const data: AuthResponse = await response.json();
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        });

        return data.user;
      },

      register: async (email: string, password: string, nickname?: string): Promise<User> => {
        const response = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, nickname }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || '注册失败');
        }

        const data: AuthResponse = await response.json();
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        });

        return data.user;
      },

      loginWithOAuth: (provider: OAuthProvider): void => {
        window.location.href = `${API_BASE}/oauth/${provider}`;
      },

      logout: async (): Promise<void> => {
        const { refreshToken } = get();
        try {
          await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
        } catch {
          // Ignore logout API errors
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      refreshTokens: async (): Promise<void> => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          throw new Error('Token refresh failed');
        }

        const data: TokenResponse = await response.json();
        set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      },

      fetchUser: async (): Promise<void> => {
        const { accessToken } = get();
        if (!accessToken) {
          set({ isLoading: false });
          return;
        }

        try {
          const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (response.ok) {
            const user: User = await response.json();
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateUser: (userData: Partial<User>): void => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      setTokens: (accessToken: string, refreshToken: string): void => {
        set({ accessToken, refreshToken });
      },

      handleOAuthCallback: async (accessToken: string, refreshToken: string): Promise<void> => {
        set({ accessToken, refreshToken });
        await get().fetchUser();
      },
    }),
    {
      name: 'mindwrite-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: AuthStore) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

// 获取 Authorization header 的辅助函数
export function getAuthHeader(): Record<string, string> {
  const { accessToken } = useAuthStore.getState();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}