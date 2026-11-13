import { create } from 'zustand';
import { sortBy } from 'lodash';
import { translationsApi } from '../api/translations';
import { errorToMessage } from '../utils/api-error';
import type { Locale, ProjectLocale, Translation, Label } from '../models';

interface TranslationsState {
  projectLocales: ProjectLocale[];
  knownLocales: Locale[];
  translations: { [localeCode: string]: Translation[] };
  isLoading: boolean;
  errorMessage: string | undefined;

  getKnownLocales: () => Promise<void>;
  getProjectLocales: (projectId: string) => Promise<void>;
  addProjectLocale: (projectId: string, localeCode: string) => Promise<void>;
  deleteProjectLocale: (projectId: string, localeCode: string) => Promise<void>;
  getTranslations: (projectId: string, localeCode: string, navigate?: (path: string) => void) => Promise<void>;
  updateTranslation: (projectId: string, localeCode: string, termId: string, value: string) => Promise<void>;
  labelTranslation: (localeCode: string, termId: string, label: Label) => void;
  unlabelTranslation: (localeCode: string, termId: string, label: Label) => void;
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

  getProjectLocales: async (projectId) => {
    set({ isLoading: true });
    try {
      const projectLocales = await translationsApi.findProjectLocales(projectId);
      set({ projectLocales: sortBy(projectLocales, v => v.locale.code) });
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  addProjectLocale: async (projectId, localeCode) => {
    set({ isLoading: true });
    try {
      const projectLocale = await translationsApi.addProjectLocale(projectId, localeCode);
      set(state => ({ projectLocales: [...state.projectLocales, projectLocale] }));
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProjectLocale: async (projectId, localeCode) => {
    set({ isLoading: true });
    try {
      await translationsApi.deleteProjectLocale(projectId, localeCode);
      set(state => ({ projectLocales: state.projectLocales.filter(x => x.locale.code !== localeCode) }));
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getTranslations: async (projectId, localeCode, navigate) => {
    set({ isLoading: true });
    try {
      const translation = await translationsApi.findProjectTranslation(projectId, localeCode);
      set(state => ({ translations: { ...state.translations, [localeCode]: translation } }));
    } catch (error: any) {
      if (error?.response?.status === 404 && navigate) navigate('/404');
      set({ errorMessage: errorToMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  updateTranslation: async (projectId, localeCode, termId, value) => {
    set({ isLoading: true });
    try {
      const translation = await translationsApi.updateTranslation(projectId, localeCode, termId, value);
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

  labelTranslation: (localeCode, termId, label) => {
    set(state => {
      const forLocale = state.translations[localeCode];
      if (!forLocale) return state;
      const updated = forLocale.map(v => v.termId === termId ? { ...v, labels: [...v.labels, label] } : v);
      return { translations: { ...state.translations, [localeCode]: updated } };
    });
  },

  unlabelTranslation: (localeCode, termId, label) => {
    set(state => {
      const forLocale = state.translations[localeCode];
      if (!forLocale) return state;
      const updated = forLocale.map(v => v.termId === termId ? { ...v, labels: v.labels.filter(l => l.id !== label.id) } : v);
      return { translations: { ...state.translations, [localeCode]: updated } };
    });
  },

  clearMessages: () => set({ errorMessage: undefined }),
  reset: () => set(defaults),
}));
