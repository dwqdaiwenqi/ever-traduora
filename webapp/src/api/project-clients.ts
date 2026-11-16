import { apiClient } from './client';
import type { ProjectClient } from '../models';

export const projectClientsApi = {
  find: async (activityId: string): Promise<ProjectClient[]> => {
    const res = await apiClient.get<{ data: ProjectClient[] }>(`/activities/${activityId}/clients`);
    return res.data.data;
  },
  create: async (activityId: string, name: string): Promise<ProjectClient> => {
    const res = await apiClient.post<{ data: ProjectClient }>(`/activities/${activityId}/clients`, { name, role: 'admin' });
    return res.data.data;
  },
  remove: async (activityId: string, clientId: string) => {
    await apiClient.delete(`/activities/${activityId}/clients/${clientId}`);
  },
};
