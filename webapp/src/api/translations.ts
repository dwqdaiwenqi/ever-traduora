import { apiClient } from './client';
import type { Locale, ProjectLocale, Translation } from '../models';

export const translationsApi = {
  loadKnownLocales: async (): Promise<Locale[]> => {
    const res = await apiClient.get<{ data: Locale[] }>('/locales');
    return res.data.data;
  },
  findProjectLocales: async (activityId: string): Promise<ProjectLocale[]> => {
    const res = await apiClient.get<{ data: ProjectLocale[] }>(`/activities/${activityId}/translations`);
    return res.data.data;
  },
  addProjectLocale: async (activityId: string, localeCode: string): Promise<ProjectLocale> => {
    const res = await apiClient.post<{ data: ProjectLocale }>(`/activities/${activityId}/translations`, { code: localeCode });
    return res.data.data;
  },
  deleteProjectLocale: async (activityId: string, localeCode: string) => {
    await apiClient.delete(`/activities/${activityId}/translations/${localeCode}`);
  },
  findProjectTranslation: async (activityId: string, localeCode: string): Promise<Translation[]> => {
    const res = await apiClient.get<{ data: Translation[] }>(`/activities/${activityId}/translations/${localeCode}`);
    return res.data.data;
  },
  confirmTranslations: async (
    activityId: string,
    localeCode: string,
    items: { termId: string; value: string }[],
  ): Promise<{ confirmed: number; skipped: number; version: number | null }> => {
    const res = await apiClient.post<{ data: { confirmed: number; skipped: number; version: number | null } }>(
      `/activities/${activityId}/translations/${localeCode}/confirm`,
      { items },
    );
    return res.data.data;
  },
  updateTranslation: async (activityId: string, localeCode: string, termId: string, value: string): Promise<Translation> => {
    const res = await apiClient.patch<{ data: Translation }>(`/activities/${activityId}/translations/${localeCode}`, { termId, value });
    return res.data.data;
  },
};
