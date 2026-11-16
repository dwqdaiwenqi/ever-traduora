import { create } from 'zustand';
import { projectClientsApi } from '../api/project-clients';
import { errorToMessage } from '../utils/api-error';
import type { ProjectClient } from '../models';

interface ProjectClientsState {
  clients: ProjectClient[];
  isLoading: boolean;
  errorMessage: string | undefined;

  getProjectClients: (activityId: string) => Promise<void>;
  addProjectClient: (activityId: string, name: string) => Promise<ProjectClient>;
  removeProjectClient: (activityId: string, clientId: string) => Promise<void>;
  clearMessages: () => void;
  reset: () => void;
}

const defaults = { clients: [], isLoading: false, errorMessage: undefined };

export const useProjectClientsStore = create<ProjectClientsState>((set, get) => ({
  ...defaults,

  getProjectClients: async (activityId) => {
    set({ isLoading: true });
    try {
      const clients = await projectClientsApi.find(activityId);
      set({ clients });
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  addProjectClient: async (activityId, name) => {
    set({ isLoading: true });
    try {
      const client = await projectClientsApi.create(activityId, name);
      set(state => ({ clients: [client, ...state.clients] }));
      return client;
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeProjectClient: async (activityId, clientId) => {
    set({ isLoading: true });
    try {
      await projectClientsApi.remove(activityId, clientId);
      set(state => ({ clients: state.clients.filter(c => c.id !== clientId) }));
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
