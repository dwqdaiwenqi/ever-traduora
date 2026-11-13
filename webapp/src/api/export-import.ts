import { saveAs } from 'file-saver';
import { apiClient } from './client';
import type { ExportFormat, Locale, ImportFormat, ImportResult } from '../models';

export const exportApi = {
  exportAndDownload: async (projectId: string, localeCode: string, format: ExportFormat, untranslated: boolean, fallbackLocaleCode?: string) => {
    const url = new URL(`/projects/${projectId}/exports`, apiClient.defaults.baseURL);
    url.searchParams.set('locale', localeCode);
    url.searchParams.set('format', format.code);
    url.searchParams.set('untranslated', String(untranslated));
    if (fallbackLocaleCode) url.searchParams.set('fallbackLocale', fallbackLocaleCode);

    const res = await apiClient.get(url.pathname + url.search, { responseType: 'blob' });
    saveAs(res.data, `${localeCode}.${format.extension}`);
  },
};

export const importApi = {
  import: async (projectId: string, locale: Locale, format: ImportFormat, file: File): Promise<ImportResult> => {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post<{ data: ImportResult }>(
      `/projects/${projectId}/imports?format=${format.code}&locale=${locale.code}`,
      form,
    );
    return res.data.data;
  },
};
