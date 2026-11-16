import { apiClient } from './client';
import type { User } from '../models';

/**
 * 登录只有两种：
 *  - 成员：只用邮箱（emailLogin），前提是管理员已经把这个邮箱加进了某个项目
 *  - 管理员：邮箱 + 密码（passwordLogin）
 */
export const authApi = {
  emailLogin: async (email: string): Promise<{ accessToken: string }> => {
    const res = await apiClient.post<{ data: { accessToken: string } }>('/auth/email-login', { email });
    return { accessToken: res.data.data.accessToken };
  },
  passwordLogin: async (email: string, password: string): Promise<{ accessToken: string }> => {
    const res = await apiClient.post<{ access_token: string }>('/auth/token', { username: email, password, grant_type: 'password' });
    return { accessToken: res.data.access_token };
  },
  getUserSelf: async (): Promise<User> => {
    const res = await apiClient.get<{ data: User }>('/users/me');
    return res.data.data;
  },
};
