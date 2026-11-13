import { create } from 'zustand';
import { authApi, redirectWithProvider, takePendingAuthorization, providerOfState } from '../api/auth';
import { setToken, clearToken, isTokenValid, getToken } from '../utils/token';
import { errorToMessage } from '../utils/api-error';
import type { User, Provider, Identity, ProviderSignupConfirmation, IdentityConnection } from '../models';
import { get } from 'lodash';

export const ACCOUNT_EXISTS_MESSAGE =
  '该邮箱已有账号。请先用常规方式登录,然后在账号设置(已关联的登录方式)中关联 Ever ID。';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | undefined;
  statusMessage: string | undefined;
  errorMessage: string | undefined;
  redirectTo: string | undefined;
  providers: Provider[] | undefined;
  pendingSignup: ProviderSignupConfirmation | undefined;
  pendingConnect: IdentityConnection | undefined;
  identities: Identity[] | undefined;

  checkAuth: () => void;
  getUserInfo: () => Promise<void>;
  getProviders: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: (reason?: string) => void;
  mustLogin: (redirectTo: string) => void;
  receiveToken: (accessToken: string, navigate: (path: string, opts?: { replace?: boolean }) => void) => Promise<void>;
  updateUserSelf: (updates: { name?: string; email?: string }) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string, token: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  redirectToAuthProvider: (provider: Provider, options?: { intent?: 'signin' | 'connect' }) => Promise<void>;
  handleAuthCallback: (code: string, state: string | null, navigate: (path: string) => void) => Promise<void>;
  confirmProviderSignup: (navigate: (path: string) => void) => Promise<void>;
  cancelProviderSignup: (navigate: (path: string) => void) => void;
  handleIdentityConnectCallback: (payload: { code: string; provider: string; state: string; nonce: string; code_verifier: string }, navigate: (path: string) => void) => Promise<void>;
  confirmIdentityConnect: () => Promise<void>;
  cancelIdentityConnect: () => void;
  getIdentities: () => Promise<void>;
  deleteIdentity: (id: string) => Promise<void>;
  clearMessages: () => void;
  verifyEmail: (token: string) => Promise<{ email: string; emailVerified: boolean }>;
  resendVerificationEmail: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  user: undefined,
  statusMessage: undefined,
  errorMessage: undefined,
  redirectTo: undefined,
  providers: undefined,
  pendingSignup: undefined,
  pendingConnect: undefined,
  identities: undefined,

  checkAuth: () => {
    const token = getToken();
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }
    if (isTokenValid()) {
      set({ isAuthenticated: true });
      get().getUserInfo();
    } else {
      get().logout('请登录后继续');
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

  getProviders: async () => {
    try {
      const providers = await authApi.getProviders();
      set({ providers });
    } catch {
      // silent
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { accessToken } = await authApi.login(email, password);
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

  signup: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const user = await authApi.signup({ name, email, password });
      setToken(user.accessToken);
      set({ isAuthenticated: true, user });
    } catch (error) {
      set({ errorMessage: errorToMessage(error, 'Signup') });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: (reason) => {
    clearToken();
    set({ user: undefined, isAuthenticated: false, errorMessage: reason, pendingConnect: undefined, identities: undefined });
  },

  mustLogin: (redirectTo) => {
    set({ redirectTo, errorMessage: '请登录后继续' });
  },

  receiveToken: async (accessToken, navigate) => {
    setToken(accessToken);
    set({ isAuthenticated: true });
    await get().getUserInfo();
    const redirect = get().redirectTo;
    set({ redirectTo: undefined });
    const target = redirect || '/';
    const [path, query] = target.split('?');
    const params = query ? '?' + query : '';
    navigate(path + params);
  },

  updateUserSelf: async (updates) => {
    set({ isLoading: true });
    try {
      const user = await authApi.updateUserSelf(updates);
      const emailChanged = get().user?.email !== user.email;
      set({
        user,
        errorMessage: undefined,
        statusMessage: emailChanged ? '信息更新成功。请通过我们发送到新邮箱的链接确认该邮箱。' : '信息更新成功。',
      });
    } catch (error) {
      set({ errorMessage: errorToMessage(error, 'UpdateUserSelf') });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    set({ isLoading: true });
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      set({ errorMessage: undefined, statusMessage: '密码修改成功!' });
    } catch (error) {
      set({ errorMessage: errorToMessage(error, 'ChangePassword') });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true });
    try {
      await authApi.forgotPassword(email);
      set({ errorMessage: undefined, statusMessage: '重置密码的令牌已发送到你的邮箱。如果几分钟后仍未收到邮件,请尝试重新发送。' });
    } catch (error) {
      set({ errorMessage: errorToMessage(error, 'ForgotPassword') });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (email, newPassword, token) => {
    set({ isLoading: true });
    try {
      await authApi.resetPassword({ email, newPassword, token });
      set({ statusMessage: '密码重置成功,请使用新密码登录。', errorMessage: undefined });
    } catch (error) {
      set({ errorMessage: errorToMessage(error, 'ResetPassword') });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAccount: async () => {
    set({ isLoading: true });
    try {
      await authApi.deleteAccount();
      get().logout('你的账号已被永久删除。');
    } catch (error) {
      set({ errorMessage: errorToMessage(error, 'DeleteAccount') });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  redirectToAuthProvider: async (provider, options = {}) => {
    try {
      await redirectWithProvider(provider, options);
    } catch {
      set({ errorMessage: '无法使用 Ever ID 登录。需要通过安全(https)连接访问 Traduora。' });
    }
  },

  handleAuthCallback: async (code, state, navigate) => {
    set({ isLoading: true });
    try {
      const pending = takePendingAuthorization(state);
      let token: { accessToken: string } & any;
      if (pending) {
        // OIDC callback (Ever ID)
        token = await authApi.signInWithProvider({ code, provider: pending.provider, state: pending.state, nonce: pending.nonce, code_verifier: pending.codeVerifier });
      } else {
        // Google callback
        token = await authApi.signInWithProvider({ code });
      }
      await get().receiveToken(token.accessToken, navigate);
    } catch (error) {
      const code2 = get_error_code(error);
      if (error && (error as any)?.response?.status === 409 && code2 === 'signup_confirmation_required') {
        const details = (error as any)?.response?.data?.error?.details as ProviderSignupConfirmation;
        set({ pendingSignup: details, errorMessage: undefined, isLoading: false });
        navigate('/auth/everid/confirm');
        return;
      }
      if (error && (error as any)?.response?.status === 409 && code2 === 'account_exists') {
        set({ errorMessage: ACCOUNT_EXISTS_MESSAGE, pendingSignup: undefined, isLoading: false });
        navigate('/login');
        return;
      }
      set({ errorMessage: errorToMessage(error, 'ProviderSignIn'), pendingSignup: undefined, isLoading: false });
      navigate('/login');
    } finally {
      set({ isLoading: false });
    }
  },

  confirmProviderSignup: async (navigate) => {
    const pending = get().pendingSignup;
    if (!pending) {
      set({ errorMessage: '注册已过期,请重新使用 Ever ID 登录。', pendingSignup: undefined });
      navigate('/login');
      return;
    }
    set({ isLoading: true });
    try {
      const user = await authApi.confirmProviderSignup(pending.pending);
      set({ pendingSignup: undefined });
      await get().receiveToken(user.accessToken, navigate);
    } catch (error) {
      const code2 = get_error_code(error);
      const message = (error as any)?.response?.status === 409 && code2 === 'account_exists' ? ACCOUNT_EXISTS_MESSAGE : errorToMessage(error, 'ProviderSignIn');
      set({ errorMessage: message, pendingSignup: undefined, isLoading: false });
      navigate('/login');
    } finally {
      set({ isLoading: false });
    }
  },

  cancelProviderSignup: (navigate) => {
    set({ pendingSignup: undefined, errorMessage: undefined });
    navigate('/login');
  },

  handleIdentityConnectCallback: async (payload, navigate) => {
    set({ isLoading: true, pendingConnect: undefined });
    try {
      const connection = await authApi.connectIdentity(payload);
      set({ pendingConnect: connection, errorMessage: undefined, statusMessage: undefined });
      navigate('/user-settings');
    } catch (error) {
      set({ errorMessage: errorToMessage(error, 'ConnectIdentity'), statusMessage: undefined });
      navigate('/user-settings');
    } finally {
      set({ isLoading: false });
    }
  },

  confirmIdentityConnect: async () => {
    const pending = get().pendingConnect;
    if (!pending) return;
    set({ isLoading: true });
    try {
      await authApi.confirmConnectIdentity(pending.pending);
      set({ pendingConnect: undefined, errorMessage: undefined, statusMessage: 'Ever ID 已关联,现在可以用它登录。' });
      await get().getIdentities();
    } catch (error) {
      set({ pendingConnect: undefined, errorMessage: errorToMessage(error, 'ConnectIdentity'), statusMessage: undefined });
    } finally {
      set({ isLoading: false });
    }
  },

  cancelIdentityConnect: () => {
    set({ pendingConnect: undefined });
  },

  getIdentities: async () => {
    try {
      const identities = await authApi.listIdentities();
      set({ identities });
    } catch {
      set({ identities: undefined });
    }
  },

  deleteIdentity: async (id) => {
    set({ isLoading: true });
    try {
      await authApi.deleteIdentity(id);
      set({ errorMessage: undefined, statusMessage: 'Ever ID 已解除关联。' });
      await get().getIdentities();
    } catch (error) {
      set({ errorMessage: errorToMessage(error, 'DeleteIdentity'), statusMessage: undefined });
    } finally {
      set({ isLoading: false });
    }
  },

  clearMessages: () => {
    set({ errorMessage: undefined, statusMessage: undefined });
  },

  verifyEmail: async (token) => {
    set({ isLoading: true });
    try {
      return await authApi.verifyEmail(token);
    } finally {
      set({ isLoading: false });
    }
  },

  resendVerificationEmail: async () => {
    await authApi.resendVerificationEmail();
  },
}));

function get_error_code(error: any): string | undefined {
  return get(error, 'response.data.error.code');
}
