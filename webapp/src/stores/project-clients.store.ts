import { create } from 'zustand';
import { projectClientsApi } from '../api/project-clients';
import { errorToMessage } from '../utils/api-error';
import type { ProjectClient, ProjectRole } from '../models';

interface ProjectClientsState {
  clients: ProjectClient[];
  isLoading: boolean;
  errorMessage: string | undefined;

  getProjectClients: (projectId: string) => Promise<void>;
  addProjectClient: (projectId: string, name: string, role: ProjectRole) => Promise<ProjectClient>;
  updateProjectClient: (projectId: string, clientId: string, role: ProjectRole) => Promise<void>;
  removeProjectClient: (projectId: string, clientId: string) => Promise<void>;
  clearMessages: () => void;
  reset: () => void;
}

const defaults = { clients: [], isLoading: false, errorMessage: undefined };

export const useProjectClientsStore = create<ProjectClientsState>((set, get) => ({
  ...defaults,

  getProjectClients: async (projectId) => {
    set({ isLoading: true });
    try {
      const clients = await projectClientsApi.find(projectId);
      set({ clients });
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  addProjectClient: async (projectId, name, role) => {
    set({ isLoading: true });
    try {
      const client = await projectClientsApi.create(projectId, name, role);
      set(state => ({ clients: [client, ...state.clients] }));
      return client;
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProjectClient: async (projectId, clientId, role) => {
    set({ isLoading: true });
    try {
      await projectClientsApi.update(projectId, clientId, role);
      set(state => ({ clients: state.clients.map(c => c.id === clientId ? { ...c, role } : c) }));
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeProjectClient: async (projectId, clientId) => {
    set({ isLoading: true });
    try {
      await projectClientsApi.remove(projectId, clientId);
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
