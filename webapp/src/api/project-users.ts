import { apiClient } from './client';
import type { ProjectUser, ProjectRole } from '../models';

export const projectUsersApi = {
  find: async (projectId: string): Promise<ProjectUser[]> => {
    const res = await apiClient.get<{ data: ProjectUser[] }>(`/projects/${projectId}/users`);
    return res.data.data;
  },
  create: async (projectId: string, email: string, role: ProjectRole): Promise<ProjectUser> => {
    const res = await apiClient.post<{ data: ProjectUser }>(`/projects/${projectId}/users`, { email, role });
    return res.data.data;
  },
  update: async (projectId: string, userId: string, role: ProjectRole): Promise<ProjectUser> => {
    const res = await apiClient.patch<{ data: ProjectUser }>(`/projects/${projectId}/users/${userId}`, { role });
    return res.data.data;
  },
  remove: async (projectId: string, userId: string) => {
    await apiClient.delete(`/projects/${projectId}/users/${userId}`);
  },
};
