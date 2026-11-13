import { apiClient } from './client';
import type { ProjectClient, ProjectRole } from '../models';

export const projectClientsApi = {
  find: async (projectId: string): Promise<ProjectClient[]> => {
    const res = await apiClient.get<{ data: ProjectClient[] }>(`/projects/${projectId}/clients`);
    return res.data.data;
  },
  create: async (projectId: string, name: string, role: ProjectRole): Promise<ProjectClient> => {
    const res = await apiClient.post<{ data: ProjectClient }>(`/projects/${projectId}/clients`, { name, role });
    return res.data.data;
  },
  update: async (projectId: string, clientId: string, role: ProjectRole): Promise<ProjectClient> => {
    const res = await apiClient.patch<{ data: ProjectClient }>(`/projects/${projectId}/clients/${clientId}`, { role });
    return res.data.data;
  },
  remove: async (projectId: string, clientId: string) => {
    await apiClient.delete(`/projects/${projectId}/clients/${clientId}`);
  },
};
