import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'accessToken';

export function getToken(): string | undefined {
  return localStorage.getItem(TOKEN_KEY) || undefined;
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const claims = jwtDecode<{ iat: number; exp: number; sub: string }>(token);
    const now = Math.round(new Date().getTime() / 1000);
    return claims.exp > now;
  } catch {
    return false;
  }
}
