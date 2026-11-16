import { apiClient, API_ENDPOINT } from './client';
import type { Term } from '../models';

/** 词条备注里图片的访问地址（不需要登录，<img> 可以直接用） */
export const termImageUrl = (projectId: string, imageId: string) => `${API_ENDPOINT}/projects/${projectId}/term-images/${imageId}`;

export const termsApi = {
  uploadImage: async (projectId: string, file: File | Blob): Promise<string> => {
    const form = new FormData();
    form.append('file', file, (file as File).name || 'pasted.png');
    const res = await apiClient.post<{ data: { id: string } }>(`/projects/${projectId}/term-images`, form);
    return res.data.data.id;
  },
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
