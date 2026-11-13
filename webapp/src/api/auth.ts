import { apiClient } from './client';
import type { User, Provider, Identity, IdentityConnection, ProviderSignupConfirmation, PendingAuthorization } from '../models';

export const PENDING_AUTHORIZATION_KEY = 'tr.oidc.pending';
const PENDING_AUTHORIZATION_TTL_MS = 10 * 60 * 1000;

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach(byte => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function randomBase64Url(size = 32): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(size)));
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

export function providerOfState(state: string | undefined): string | undefined {
  if (!state) return undefined;
  try {
    const decoded = JSON.parse(atob(state.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof decoded?.p === 'string' ? decoded.p : undefined;
  } catch {
    return undefined;
  }
}

export async function oidcAuthorizeUrl(provider: Provider, intent: 'signin' | 'connect'): Promise<string> {
  const codeVerifier = randomBase64Url(32);
  const codeChallenge = await pkceChallenge(codeVerifier);
  const url = new URL(provider.url);
  const pending: PendingAuthorization = {
    provider: provider.slug,
    state: base64Url(new TextEncoder().encode(JSON.stringify({ p: provider.slug, n: randomBase64Url(16) }))),
    nonce: randomBase64Url(32),
    codeVerifier,
    intent,
    createdAt: Date.now(),
  };
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', provider.clientId);
  url.searchParams.set('redirect_uri', provider.redirectUrl);
  url.searchParams.set('scope', provider.scope || 'openid profile email');
  url.searchParams.set('state', pending.state);
  url.searchParams.set('nonce', pending.nonce);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  if (intent === 'connect') {
    url.searchParams.set('prompt', 'login');
    url.searchParams.set('max_age', '300');
  }
  sessionStorage.setItem(PENDING_AUTHORIZATION_KEY, JSON.stringify(pending));
  return url.toString();
}

export function redirectWithProvider(provider: Provider, options: { intent?: 'signin' | 'connect' } = {}): void | Promise<void> {
  if (provider.pkce) {
    return oidcAuthorizeUrl(provider, options.intent ?? 'signin').then(url => {
      window.open(url, '_self');
    });
  }
  window.open(
    `${provider.url}?redirect_uri=${provider.redirectUrl}&client_id=${provider.clientId}&scope=email profile openid&access_type=offline&prompt=select_account&response_type=code`,
    '_self',
  );
}

export function peekPendingAuthorization(state: string | undefined | null): PendingAuthorization | undefined {
  if (!state) return undefined;
  try {
    const pending = JSON.parse(sessionStorage.getItem(PENDING_AUTHORIZATION_KEY) || 'null') as PendingAuthorization | null;
    if (!pending || pending.state !== state || Date.now() - pending.createdAt > PENDING_AUTHORIZATION_TTL_MS) return undefined;
    return pending;
  } catch {
    return undefined;
  }
}

export function takePendingAuthorization(state: string | undefined | null): PendingAuthorization | undefined {
  const pending = peekPendingAuthorization(state);
  sessionStorage.removeItem(PENDING_AUTHORIZATION_KEY);
  return pending;
}

export const authApi = {
  login: async (email: string, password: string): Promise<{ accessToken: string }> => {
    const res = await apiClient.post<{ access_token: string }>('/auth/token', { username: email, password, grant_type: 'password' });
    return { accessToken: res.data.access_token };
  },
  signup: async (data: { name: string; email: string; password: string; inviteToken?: string }) => {
    const res = await apiClient.post<{ data: { accessToken: string } & User }>('/auth/signup', data);
    return res.data.data;
  },
  getUserSelf: async (): Promise<User> => {
    const res = await apiClient.get<{ data: User }>('/users/me');
    return res.data.data;
  },
  updateUserSelf: async (updates: { name?: string; email?: string }): Promise<User> => {
    const res = await apiClient.patch<{ data: User }>('/users/me', updates);
    return res.data.data;
  },
  deleteAccount: async () => {
    await apiClient.delete('/users/me');
  },
  getProviders: async (): Promise<Provider[]> => {
    const res = await apiClient.get<{ data: Provider[] }>('/auth/providers');
    return res.data.data;
  },
  signInWithProvider: async (data: { code: string; provider?: string; state?: string; nonce?: string; code_verifier?: string }) => {
    const res = await apiClient.post<{ data: { accessToken: string } & User }>('/auth/signup-provider', data);
    return res.data.data;
  },
  confirmProviderSignup: async (pending: string, acceptInvites: string[]) => {
    const res = await apiClient.post<{ data: { accessToken: string } & User }>('/auth/everid/signup-confirm', { pending, acceptInvites });
    return res.data.data;
  },
  connectIdentity: async (data: { code: string; provider: string; state: string; nonce: string; code_verifier: string }): Promise<IdentityConnection> => {
    const res = await apiClient.post<{ data: IdentityConnection }>('/auth/identities/connect', data);
    return res.data.data;
  },
  confirmConnectIdentity: async (pending: string): Promise<Identity> => {
    const res = await apiClient.post<{ data: Identity }>('/auth/identities/connect/confirm', { pending });
    return res.data.data;
  },
  listIdentities: async (): Promise<Identity[]> => {
    const res = await apiClient.get<{ data: Identity[] }>('/auth/identities');
    return res.data.data;
  },
  deleteIdentity: async (id: string) => {
    await apiClient.delete(`/auth/identities/${encodeURIComponent(id)}`);
  },
  forgotPassword: async (email: string) => {
    await apiClient.post('/auth/forgot-password', { email });
  },
  resetPassword: async (data: { email: string; newPassword: string; token: string }) => {
    await apiClient.post('/auth/reset-password', data);
  },
  changePassword: async (data: { oldPassword: string; newPassword: string }) => {
    await apiClient.post('/auth/change-password', data);
  },
  acceptInvite: async (inviteToken: string): Promise<{ projectId: string; role: string }> => {
    const res = await apiClient.post<{ data: { projectId: string; role: string } }>('/auth/accept-invite', { inviteToken });
    return res.data.data;
  },
  verifyEmail: async (token: string): Promise<{ email: string; emailVerified: boolean }> => {
    const res = await apiClient.post<{ data: { email: string; emailVerified: boolean } }>('/auth/verify-email', { token });
    return res.data.data;
  },
  resendVerificationEmail: async () => {
    await apiClient.post('/auth/resend-verification-email', {});
  },
};
