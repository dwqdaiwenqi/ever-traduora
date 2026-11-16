import { create } from 'zustand';
import { termsApi } from '../api/terms';
import { errorToMessage } from '../utils/api-error';
import type { Term } from '../models';

interface TermsState {
  terms: Term[];
  isLoading: boolean;
  errorMessage: string | undefined;

  getTerms: (activityId: string) => Promise<void>;
  createTerm: (activityId: string, value: string, context?: string) => Promise<void>;
  updateTerm: (activityId: string, termId: string, value: string, context?: string) => Promise<void>;
  deleteTerm: (activityId: string, termId: string) => Promise<void>;
  clearMessages: () => void;
  reset: () => void;
}

const defaults = { terms: [], isLoading: false, errorMessage: undefined };

export const useTermsStore = create<TermsState>((set, get) => ({
  ...defaults,

  getTerms: async (activityId) => {
    set({ isLoading: true });
    try {
      const terms = await termsApi.find(activityId);
      set({ terms });
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  createTerm: async (activityId, value, context) => {
    set({ isLoading: true });
    try {
      const term = await termsApi.create(activityId, value, context);
      set(state => ({ terms: [term, ...state.terms] }));
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateTerm: async (activityId, termId, value, context) => {
    set({ isLoading: true });
    try {
      const term = await termsApi.update(activityId, termId, value, context);
      set(state => ({ terms: state.terms.map(t => t.id === term.id ? term : t) }));
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTerm: async (activityId, termId) => {
    set({ isLoading: true });
    try {
      await termsApi.delete(activityId, termId);
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
