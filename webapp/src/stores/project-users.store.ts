import { create } from 'zustand';
import { projectUsersApi } from '../api/project-users';
import { errorToMessage } from '../utils/api-error';
import type { ProjectUser, ProjectRole } from '../models';

interface ProjectUsersState {
  users: ProjectUser[];
  isLoading: boolean;
  errorMessage: string | undefined;

  getProjectUsers: (activityId: string, selfUserId?: string) => Promise<void>;
  addProjectUser: (activityId: string, email: string, role: ProjectRole) => Promise<void>;
  updateProjectUser: (activityId: string, userId: string, role: ProjectRole) => Promise<void>;
  removeProjectUser: (activityId: string, userId: string) => Promise<void>;
  clearMessages: () => void;
  reset: () => void;
}

const defaults = { users: [], isLoading: false, errorMessage: undefined };

export const useProjectUsersStore = create<ProjectUsersState>(set => ({
  ...defaults,

  getProjectUsers: async (activityId, selfUserId) => {
    set({ isLoading: true });
    try {
      const users = await projectUsersApi.find(activityId);
      set({ users: users.map(u => ({ ...u, isSelf: u.userId === selfUserId })) });
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  addProjectUser: async (activityId, email, role) => {
    set({ isLoading: true, errorMessage: undefined });
    try {
      const user = await projectUsersApi.create(activityId, email, role);
      set(state => ({ users: [...state.users, user] }));
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProjectUser: async (activityId, userId, role) => {
    set({ isLoading: true, errorMessage: undefined });
    try {
      await projectUsersApi.update(activityId, userId, role);
      set(state => ({ users: state.users.map(u => (u.userId === userId ? { ...u, role } : u)) }));
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeProjectUser: async (activityId, userId) => {
    set({ isLoading: true, errorMessage: undefined });
    try {
      await projectUsersApi.remove(activityId, userId);
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
