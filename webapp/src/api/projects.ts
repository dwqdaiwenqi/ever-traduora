import { apiClient } from './client';
import type { Project, Plan, ProjectStats } from '../models';

export const projectsApi = {
  find: async (): Promise<Project[]> => {
    const res = await apiClient.get<{ data: Project[] }>('/activities');
    return res.data.data;
  },
  findOne: async (id: string): Promise<Project> => {
    const res = await apiClient.get<{ data: Project }>(`/activities/${id}`);
    return res.data.data;
  },
  findPlan: async (activityId: string): Promise<Plan> => {
    const res = await apiClient.get<{ data: Plan }>(`/activities/${activityId}/plan`);
    return res.data.data;
  },
  getStats: async (activityId: string): Promise<ProjectStats> => {
    const res = await apiClient.get<{ data: ProjectStats }>(`/activities/${activityId}/stats`);
    return res.data.data;
  },
  create: async (data: { name: string; description?: string }): Promise<Project> => {
    const res = await apiClient.post<{ data: Project }>('/activities', data);
    return res.data.data;
  },
  update: async (id: string, data: { name?: string; description?: string }): Promise<Project> => {
    const res = await apiClient.patch<{ data: Project }>(`/activities/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/activities/${id}`);
  },
};
