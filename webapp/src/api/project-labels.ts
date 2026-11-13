import { apiClient } from './client';
import type { Label } from '../models';

export const projectLabelsApi = {
  find: async (projectId: string): Promise<Label[]> => {
    const res = await apiClient.get<{ data: Label[] }>(`/projects/${projectId}/labels`);
    return res.data.data;
  },
  create: async (projectId: string, value: string, color: string): Promise<Label> => {
    const res = await apiClient.post<{ data: Label }>(`/projects/${projectId}/labels`, { value, color });
    return res.data.data;
  },
  update: async (projectId: string, labelId: string, value: string, color: string): Promise<Label> => {
    const res = await apiClient.patch<{ data: Label }>(`/projects/${projectId}/labels/${labelId}`, { value, color });
    return res.data.data;
  },
  remove: async (projectId: string, labelId: string) => {
    await apiClient.delete(`/projects/${projectId}/labels/${labelId}`);
  },
  labelTerm: async (projectId: string, labelId: string, termId: string) => {
    await apiClient.post(`/projects/${projectId}/labels/${labelId}/terms/${termId}`, {});
  },
  unlabelTerm: async (projectId: string, labelId: string, termId: string) => {
    await apiClient.delete(`/projects/${projectId}/labels/${labelId}/terms/${termId}`);
  },
  labelTranslation: async (projectId: string, labelId: string, termId: string, localeCode: string) => {
    await apiClient.post(`/projects/${projectId}/labels/${labelId}/terms/${termId}/translations/${localeCode}`, {});
  },
  unlabelTranslation: async (projectId: string, labelId: string, termId: string, localeCode: string) => {
    await apiClient.delete(`/projects/${projectId}/labels/${labelId}/terms/${termId}/translations/${localeCode}`);
  },
};
