import { apiClient } from './client';
import type { ProjectUser, ProjectRole } from '../models';

export const projectUsersApi = {
  find: async (activityId: string): Promise<ProjectUser[]> => {
    const res = await apiClient.get<{ data: ProjectUser[] }>(`/activities/${activityId}/users`);
    return res.data.data;
  },
  create: async (activityId: string, email: string, role: ProjectRole): Promise<ProjectUser> => {
    const res = await apiClient.post<{ data: ProjectUser }>(`/activities/${activityId}/users`, { email, role });
    return res.data.data;
  },
  update: async (activityId: string, userId: string, role: ProjectRole): Promise<ProjectUser> => {
    const res = await apiClient.patch<{ data: ProjectUser }>(`/activities/${activityId}/users/${userId}`, { role });
    return res.data.data;
  },
  remove: async (activityId: string, userId: string) => {
    await apiClient.delete(`/activities/${activityId}/users/${userId}`);
  },
};
