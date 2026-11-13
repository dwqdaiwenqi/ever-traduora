import { apiClient } from './client';
import type { Term } from '../models';

export const termsApi = {
  find: async (projectId: string): Promise<Term[]> => {
    const res = await apiClient.get<{ data: Term[] }>(`/projects/${projectId}/terms`);
    return res.data.data;
  },
  create: async (projectId: string, value: string, context?: string | null): Promise<Term> => {
    const res = await apiClient.post<{ data: Term }>(`/projects/${projectId}/terms`, { value, context });
    return res.data.data;
  },
  update: async (projectId: string, termId: string, value: string, context?: string | null): Promise<Term> => {
    const res = await apiClient.patch<{ data: Term }>(`/projects/${projectId}/terms/${termId}`, { value, context });
    return res.data.data;
  },
  delete: async (projectId: string, termId: string) => {
    await apiClient.delete(`/projects/${projectId}/terms/${termId}`);
  },
};
