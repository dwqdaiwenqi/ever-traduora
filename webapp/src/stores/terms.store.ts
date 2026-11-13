import { create } from 'zustand';
import { termsApi } from '../api/terms';
import { errorToMessage } from '../utils/api-error';
import type { Term } from '../models';

interface TermsState {
  terms: Term[];
  isLoading: boolean;
  errorMessage: string | undefined;

  getTerms: (projectId: string) => Promise<void>;
  createTerm: (projectId: string, value: string, context?: string) => Promise<void>;
  updateTerm: (projectId: string, termId: string, value: string, context?: string) => Promise<void>;
  deleteTerm: (projectId: string, termId: string) => Promise<void>;
  clearMessages: () => void;
  reset: () => void;
}

const defaults = { terms: [], isLoading: false, errorMessage: undefined };

export const useTermsStore = create<TermsState>((set, get) => ({
  ...defaults,

  getTerms: async (projectId) => {
    set({ isLoading: true });
    try {
      const terms = await termsApi.find(projectId);
      set({ terms });
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  createTerm: async (projectId, value, context) => {
    set({ isLoading: true });
    try {
      const term = await termsApi.create(projectId, value, context);
      set(state => ({ terms: [term, ...state.terms] }));
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateTerm: async (projectId, termId, value, context) => {
    set({ isLoading: true });
    try {
      const term = await termsApi.update(projectId, termId, value, context);
      set(state => ({ terms: state.terms.map(t => t.id === term.id ? term : t) }));
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTerm: async (projectId, termId) => {
    set({ isLoading: true });
    try {
      await termsApi.delete(projectId, termId);
      set(state => ({ terms: state.terms.filter(t => t.id !== termId) }));
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
