import { create } from 'zustand';
import { authApi } from '../api/auth';
import { setToken, clearToken, isTokenValid } from '../utils/token';
import { errorToMessage } from '../utils/api-error';
import type { User } from '../models';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | undefined;
  errorMessage: string | undefined;

  checkAuth: () => void;
  getUserInfo: () => Promise<void>;
  /** 成员：只用邮箱 */
  emailLogin: (email: string) => Promise<void>;
  /** 管理员：邮箱 + 密码 */
  passwordLogin: (email: string, password: string) => Promise<void>;
  logout: (reason?: string) => void;
  clearMessages: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // 同步读取本地 token：刷新页面时不会先被当成"未登录"而丢掉当前地址
  isAuthenticated: isTokenValid(),
  isLoading: false,
  user: undefined,
  errorMessage: undefined,

  checkAuth: () => {
    if (isTokenValid()) {
      set({ isAuthenticated: true });
      get().getUserInfo();
    } else {
      // 没有 token 时不需要提示；token 过期了才提示
      const hadToken = localStorage.getItem('accessToken');
      if (hadToken) get().logout('登录已过期，请重新登录');
      else set({ isAuthenticated: false });
    }
  },

  getUserInfo: async () => {
    try {
      const user = await authApi.getUserSelf();
      set({ user, isAuthenticated: true });
    } catch {
      // silent
    }
  },

  emailLogin: async email => {
    set({ isLoading: true, errorMessage: undefined });
    try {
      const { accessToken } = await authApi.emailLogin(email);
      setToken(accessToken);
      set({ isAuthenticated: true });
      await get().getUserInfo();
    } catch (error) {
      set({ errorMessage: errorToMessage(error, 'Login') });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  passwordLogin: async (email, password) => {
    set({ isLoading: true, errorMessage: undefined });
    try {
      const { accessToken } = await authApi.passwordLogin(email, password);
      setToken(accessToken);
      set({ isAuthenticated: true });
      await get().getUserInfo();
    } catch (error) {
      set({ errorMessage: errorToMessage(error, 'Login') });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: reason => {
    clearToken();
    set({ user: undefined, isAuthenticated: false, errorMessage: reason });
  },

  clearMessages: () => {
    set({ errorMessage: undefined });
  },
}));
