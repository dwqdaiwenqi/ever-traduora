import { create } from 'zustand';
import { projectInvitesApi } from '../api/project-invites';
import { errorToMessage } from '../utils/api-error';
import type { ProjectInvite, ProjectInviteAddedUser, ProjectRole } from '../models';

interface ProjectInvitesState {
  invites: ProjectInvite[];
  lastAdded: ProjectInvite | ProjectInviteAddedUser | undefined;
  isLoading: boolean;
  errorMessage: string | undefined;

  getProjectInvites: (projectId: string) => Promise<void>;
  addProjectInvite: (projectId: string, email: string, role: ProjectRole) => Promise<ProjectInvite | ProjectInviteAddedUser>;
  updateProjectInvite: (projectId: string, inviteId: string, role: ProjectRole) => Promise<void>;
  removeProjectInvite: (projectId: string, inviteId: string) => Promise<void>;
  clearMessages: () => void;
  reset: () => void;
}

const defaults = { invites: [], lastAdded: undefined, isLoading: false, errorMessage: undefined };

export const useProjectInvitesStore = create<ProjectInvitesState>((set, get) => ({
  ...defaults,

  getProjectInvites: async (projectId) => {
    set({ isLoading: true });
    try {
      const invites = await projectInvitesApi.find(projectId);
      set({ invites });
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  addProjectInvite: async (projectId, email, role) => {
    set({ isLoading: true });
    try {
      const result = await projectInvitesApi.create(projectId, email, role);
      set({ lastAdded: result, errorMessage: undefined });
      if ('id' in result && 'inviteUrl' in result) {
        // It's a ProjectInvite (pending invite)
        set(state => ({ invites: [...state.invites, result as ProjectInvite] }));
      }
      return result;
    } catch (error) {
      set({ errorMessage: errorToMessage(error, 'InviteProjectUser') });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProjectInvite: async (projectId, inviteId, role) => {
    set({ isLoading: true });
    try {
      await projectInvitesApi.update(projectId, inviteId, role);
      set(state => ({ invites: state.invites.map(i => i.id === inviteId ? { ...i, role } : i) }));
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeProjectInvite: async (projectId, inviteId) => {
    set({ isLoading: true });
    try {
      await projectInvitesApi.remove(projectId, inviteId);
      set(state => ({ invites: state.invites.filter(i => i.id !== inviteId) }));
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
