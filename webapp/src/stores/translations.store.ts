import { create } from 'zustand';
import { sortBy } from 'lodash';
import { translationsApi } from '../api/translations';
import { errorToMessage } from '../utils/api-error';
import type { Locale, ProjectLocale, Translation } from '../models';

interface TranslationsState {
  projectLocales: ProjectLocale[];
  knownLocales: Locale[];
  translations: { [localeCode: string]: Translation[] };
  isLoading: boolean;
  errorMessage: string | undefined;

  getKnownLocales: () => Promise<void>;
  getProjectLocales: (activityId: string) => Promise<void>;
  addProjectLocale: (activityId: string, localeCode: string) => Promise<void>;
  deleteProjectLocale: (activityId: string, localeCode: string) => Promise<void>;
  getTranslations: (activityId: string, localeCode: string, navigate?: (path: string) => void) => Promise<void>;
  updateTranslation: (activityId: string, localeCode: string, termId: string, value: string) => Promise<void>;
  confirmTranslations: (
    activityId: string,
    localeCode: string,
    items: { termId: string; value: string }[],
  ) => Promise<{ confirmed: number; skipped: number; version: number | null }>;
  clearMessages: () => void;
  reset: () => void;
}

const defaults = { projectLocales: [], knownLocales: [], translations: {}, isLoading: false, errorMessage: undefined };

export const useTranslationsStore = create<TranslationsState>((set, get) => ({
  ...defaults,

  getKnownLocales: async () => {
    set({ isLoading: true });
    try {
      const knownLocales = await translationsApi.loadKnownLocales();
      set({ knownLocales });
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  getProjectLocales: async (activityId) => {
    set({ isLoading: true });
    try {
      const projectLocales = await translationsApi.findProjectLocales(activityId);
      set({ projectLocales: sortBy(projectLocales, v => v.locale.code) });
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  addProjectLocale: async (activityId, localeCode) => {
    set({ isLoading: true });
    try {
      const projectLocale = await translationsApi.addProjectLocale(activityId, localeCode);
      set(state => ({ projectLocales: [...state.projectLocales, projectLocale] }));
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProjectLocale: async (activityId, localeCode) => {
    set({ isLoading: true });
    try {
      await translationsApi.deleteProjectLocale(activityId, localeCode);
      set(state => ({ projectLocales: state.projectLocales.filter(x => x.locale.code !== localeCode) }));
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getTranslations: async (activityId, localeCode, navigate) => {
    set({ isLoading: true });
    try {
      const translation = await translationsApi.findProjectTranslation(activityId, localeCode);
      set(state => ({ translations: { ...state.translations, [localeCode]: translation } }));
    } catch (error: any) {
      if (error?.response?.status === 404 && navigate) navigate('/404');
      set({ errorMessage: errorToMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  updateTranslation: async (activityId, localeCode, termId, value) => {
    set({ isLoading: true });
    try {
      const translation = await translationsApi.updateTranslation(activityId, localeCode, termId, value);
      set(state => {
        const storeTranslations = state.translations;
        let found = false;
        let previousValue: string | undefined;
        const forLocale = (storeTranslations[localeCode] || []).map(tr => {
          if (tr.termId === translation.termId) {
            found = true;
            previousValue = tr.value;
            return translation;
          }
          return tr;
        });
        if (!found) forLocale.push(translation);
        return { translations: { ...storeTranslations, [localeCode]: forLocale } };
      });
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  confirmTranslations: async (activityId, localeCode, items) => {
    set({ isLoading: true });
    try {
      const result = await translationsApi.confirmTranslations(activityId, localeCode, items);
      // 重新拉取，拿到最新的已生效值，以及确认期间被运营改过而跳过的条目
      const translation = await translationsApi.findProjectTranslation(activityId, localeCode);
      set(state => ({ translations: { ...state.translations, [localeCode]: translation } }));
      return result;
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearMessages: () => set({ errorMessage: undefined }),
  reset: () => set(defaults),
}));
