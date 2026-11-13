import { create } from 'zustand';
import { projectUsersApi } from '../api/project-users';
import { errorToMessage } from '../utils/api-error';
import type { ProjectUser, ProjectRole } from '../models';

interface ProjectUsersState {
  users: ProjectUser[];
  isLoading: boolean;
  errorMessage: string | undefined;

  getProjectUsers: (projectId: string, selfUserId?: string) => Promise<void>;
  addProjectUser: (projectId: string, email: string, role: ProjectRole) => Promise<void>;
  updateProjectUser: (projectId: string, userId: string, role: ProjectRole) => Promise<void>;
  removeProjectUser: (projectId: string, userId: string) => Promise<void>;
  clearMessages: () => void;
  reset: () => void;
}

const defaults = { users: [], isLoading: false, errorMessage: undefined };

export const useProjectUsersStore = create<ProjectUsersState>(set => ({
  ...defaults,

  getProjectUsers: async (projectId, selfUserId) => {
    set({ isLoading: true });
    try {
      const users = await projectUsersApi.find(projectId);
      set({ users: users.map(u => ({ ...u, isSelf: u.userId === selfUserId })) });
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  addProjectUser: async (projectId, email, role) => {
    set({ isLoading: true, errorMessage: undefined });
    try {
      const user = await projectUsersApi.create(projectId, email, role);
      set(state => ({ users: [...state.users, user] }));
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProjectUser: async (projectId, userId, role) => {
    set({ isLoading: true, errorMessage: undefined });
    try {
      await projectUsersApi.update(projectId, userId, role);
      set(state => ({ users: state.users.map(u => (u.userId === userId ? { ...u, role } : u)) }));
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeProjectUser: async (projectId, userId) => {
    set({ isLoading: true, errorMessage: undefined });
    try {
      await projectUsersApi.remove(projectId, userId);
      set(state => ({ users: state.users.filter(u => u.userId !== userId) }));
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
