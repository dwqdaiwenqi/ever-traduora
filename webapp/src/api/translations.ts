import { apiClient } from './client';
import type { Locale, ProjectLocale, Translation } from '../models';

export const translationsApi = {
  loadKnownLocales: async (): Promise<Locale[]> => {
    const res = await apiClient.get<{ data: Locale[] }>('/locales');
    return res.data.data;
  },
  findProjectLocales: async (projectId: string): Promise<ProjectLocale[]> => {
    const res = await apiClient.get<{ data: ProjectLocale[] }>(`/projects/${projectId}/translations`);
    return res.data.data;
  },
  addProjectLocale: async (projectId: string, localeCode: string): Promise<ProjectLocale> => {
    const res = await apiClient.post<{ data: ProjectLocale }>(`/projects/${projectId}/translations`, { code: localeCode });
    return res.data.data;
  },
  deleteProjectLocale: async (projectId: string, localeCode: string) => {
    await apiClient.delete(`/projects/${projectId}/translations/${localeCode}`);
  },
  findProjectTranslation: async (projectId: string, localeCode: string): Promise<Translation[]> => {
    const res = await apiClient.get<{ data: Translation[] }>(`/projects/${projectId}/translations/${localeCode}`);
    return res.data.data;
  },
  confirmTranslations: async (
    projectId: string,
    localeCode: string,
    items: { termId: string; value: string }[],
  ): Promise<{ confirmed: number; skipped: number; version: number | null }> => {
    const res = await apiClient.post<{ data: { confirmed: number; skipped: number; version: number | null } }>(
      `/projects/${projectId}/translations/${localeCode}/confirm`,
      { items },
    );
    return res.data.data;
  },
  updateTranslation: async (projectId: string, localeCode: string, termId: string, value: string): Promise<Translation> => {
    const res = await apiClient.patch<{ data: Translation }>(`/projects/${projectId}/translations/${localeCode}`, { termId, value });
    return res.data.data;
  },
};
