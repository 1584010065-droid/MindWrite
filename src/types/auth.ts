/**
 * 认证相关类型定义
 */

export type User = {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  writingPreference: string;
  exportPreset: 'a4' | 'letter';
  modelSelection: string;
  enableWebSearch: boolean;
  emailVerified: boolean;
  createdAt?: string;
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
};

export type OAuthProvider = 'github' | 'google';

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = {
  email: string;
  password: string;
  nickname?: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
};