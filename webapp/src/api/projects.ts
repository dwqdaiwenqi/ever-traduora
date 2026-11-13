import { apiClient } from './client';
import type { Project, Plan, ProjectStats } from '../models';

export const projectsApi = {
  find: async (): Promise<Project[]> => {
    const res = await apiClient.get<{ data: Project[] }>('/projects');
    return res.data.data;
  },
  findOne: async (id: string): Promise<Project> => {
    const res = await apiClient.get<{ data: Project }>(`/projects/${id}`);
    return res.data.data;
  },
  findPlan: async (projectId: string): Promise<Plan> => {
    const res = await apiClient.get<{ data: Plan }>(`/projects/${projectId}/plan`);
    return res.data.data;
  },
  getStats: async (projectId: string): Promise<ProjectStats> => {
    const res = await apiClient.get<{ data: ProjectStats }>(`/projects/${projectId}/stats`);
    return res.data.data;
  },
  create: async (data: { name: string; description?: string }): Promise<Project> => {
    const res = await apiClient.post<{ data: Project }>('/projects', data);
    return res.data.data;
  },
  update: async (id: string, data: { name?: string; description?: string }): Promise<Project> => {
    const res = await apiClient.patch<{ data: Project }>(`/projects/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/projects/${id}`);
  },
};
