import { apiClient, API_ENDPOINT } from './client';
import type { Term } from '../models';

/** 词条备注里图片的访问地址（不需要登录，<img> 可以直接用） */
export const termImageUrl = (activityId: string, imageId: string) => `${API_ENDPOINT}/activities/${activityId}/term-images/${imageId}`;

export const termsApi = {
  uploadImage: async (activityId: string, file: File | Blob): Promise<string> => {
    const form = new FormData();
    form.append('file', file, (file as File).name || 'pasted.png');
    const res = await apiClient.post<{ data: { id: string } }>(`/activities/${activityId}/term-images`, form);
    return res.data.data.id;
  },
  find: async (activityId: string): Promise<Term[]> => {
    const res = await apiClient.get<{ data: Term[] }>(`/activities/${activityId}/terms`);
    return res.data.data;
  },
  create: async (activityId: string, value: string, context?: string | null): Promise<Term> => {
    const res = await apiClient.post<{ data: Term }>(`/activities/${activityId}/terms`, { value, context });
    return res.data.data;
  },
  update: async (activityId: string, termId: string, value: string, context?: string | null): Promise<Term> => {
    const res = await apiClient.patch<{ data: Term }>(`/activities/${activityId}/terms/${termId}`, { value, context });
    return res.data.data;
  },
  delete: async (activityId: string, termId: string) => {
    await apiClient.delete(`/activities/${activityId}/terms/${termId}`);
  },
};
