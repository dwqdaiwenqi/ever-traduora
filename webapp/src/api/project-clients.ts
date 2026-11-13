import { apiClient } from './client';
import type { ProjectClient } from '../models';

export const projectClientsApi = {
  find: async (projectId: string): Promise<ProjectClient[]> => {
    const res = await apiClient.get<{ data: ProjectClient[] }>(`/projects/${projectId}/clients`);
    return res.data.data;
  },
  create: async (projectId: string, name: string): Promise<ProjectClient> => {
    const res = await apiClient.post<{ data: ProjectClient }>(`/projects/${projectId}/clients`, { name, role: 'admin' });
    return res.data.data;
  },
  remove: async (projectId: string, clientId: string) => {
    await apiClient.delete(`/projects/${projectId}/clients/${clientId}`);
  },
};
