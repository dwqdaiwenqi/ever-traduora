import { create } from 'zustand';
import { projectLabelsApi } from '../api/project-labels';
import { errorToMessage } from '../utils/api-error';
import type { Label } from '../models';

interface ProjectLabelsState {
  labels: Label[];
  isLoading: boolean;
  errorMessage: string | undefined;

  getProjectLabels: (projectId: string) => Promise<void>;
  createProjectLabel: (projectId: string, value: string, color: string) => Promise<Label>;
  updateProjectLabel: (projectId: string, labelId: string, value: string, color: string) => Promise<void>;
  removeProjectLabel: (projectId: string, labelId: string) => Promise<void>;
  labelTerm: (projectId: string, label: Label, termId: string) => Promise<void>;
  unlabelTerm: (projectId: string, label: Label, termId: string) => Promise<void>;
  labelTranslation: (projectId: string, label: Label, termId: string, localeCode: string) => Promise<void>;
  unlabelTranslation: (projectId: string, label: Label, termId: string, localeCode: string) => Promise<void>;
  clearMessages: () => void;
  reset: () => void;
}

const defaults = { labels: [], isLoading: false, errorMessage: undefined };

export const useProjectLabelsStore = create<ProjectLabelsState>((set, get) => ({
  ...defaults,

  getProjectLabels: async (projectId) => {
    set({ isLoading: true });
    try {
      const labels = await projectLabelsApi.find(projectId);
      set({ labels });
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  createProjectLabel: async (projectId, value, color) => {
    set({ isLoading: true });
    try {
      const label = await projectLabelsApi.create(projectId, value, color);
      set(state => ({ labels: [...state.labels, label] }));
      return label;
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProjectLabel: async (projectId, labelId, value, color) => {
    set({ isLoading: true });
    try {
      const label = await projectLabelsApi.update(projectId, labelId, value, color);
      set(state => ({ labels: state.labels.map(l => l.id === labelId ? label : l) }));
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeProjectLabel: async (projectId, labelId) => {
    set({ isLoading: true });
    try {
      await projectLabelsApi.remove(projectId, labelId);
      set(state => ({ labels: state.labels.filter(l => l.id !== labelId) }));
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  labelTerm: async (projectId, label, termId) => {
    await projectLabelsApi.labelTerm(projectId, label.id, termId);
  },

  unlabelTerm: async (projectId, label, termId) => {
    await projectLabelsApi.unlabelTerm(projectId, label.id, termId);
  },

  labelTranslation: async (projectId, label, termId, localeCode) => {
    await projectLabelsApi.labelTranslation(projectId, label.id, termId, localeCode);
  },

  unlabelTranslation: async (projectId, label, termId, localeCode) => {
    await projectLabelsApi.unlabelTranslation(projectId, label.id, termId, localeCode);
  },

  clearMessages: () => set({ errorMessage: undefined }),
  reset: () => set(defaults),
}));
