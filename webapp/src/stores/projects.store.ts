import { create } from 'zustand';
import { projectsApi } from '../api/projects';
import { errorToMessage } from '../utils/api-error';
import type { Project, ProjectStats } from '../models';

interface ProjectsState {
  projects: Project[];
  currentProject: Project | undefined;
  currentProjectStats: ProjectStats | undefined;
  isLoading: boolean;
  errorMessage: string | undefined;

  getProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, data: { name?: string; description?: string }) => Promise<void>;
  deleteProject: (id: string, navigate: (path: string) => void) => Promise<void>;
  setCurrentProject: (id: string, navigate: (path: string) => void) => Promise<void>;
  reloadCurrentProject: () => Promise<void>;
  refreshProjectStats: () => Promise<void>;
  clearCurrentProject: () => void;
  clearMessages: () => void;
  reset: () => void;
}

const defaults = {
  projects: [],
  currentProject: undefined,
  currentProjectStats: undefined,
  isLoading: false,
  errorMessage: undefined,
};

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  ...defaults,

  getProjects: async () => {
    set({ isLoading: true });
    try {
      const projects = await projectsApi.find();
      set({ projects });
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (name, description) => {
    set({ isLoading: true });
    try {
      const project = await projectsApi.create({ name, description });
      set(state => ({ projects: [project, ...state.projects] }));
      return project;
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProject: async (id, data) => {
    set({ isLoading: true });
    try {
      const project = await projectsApi.update(id, data);
      const currentProject = get().currentProject;
      if (currentProject && project.id === currentProject.id) {
        set({ currentProject: { ...currentProject, ...project } });
      }
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProject: async (id, navigate) => {
    set({ isLoading: true });
    try {
      await projectsApi.delete(id);
      navigate('/activities');
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentProject: async (id, navigate) => {
    set({ isLoading: true, currentProject: undefined });
    try {
      const project = await projectsApi.findOne(id);
      const plan = await projectsApi.findPlan(id);
      project.plan = plan;
      set({ currentProject: project });
      await get().refreshProjectStats();
    } catch (error: any) {
      if (error?.response?.status === 404) navigate('/404');
      set({ errorMessage: errorToMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  reloadCurrentProject: async () => {
    const activityId = get().currentProject?.id;
    if (!activityId) return;
    set({ isLoading: true });
    try {
      const project = await projectsApi.findOne(activityId);
      const plan = await projectsApi.findPlan(activityId);
      project.plan = plan;
      set({ currentProject: project });
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshProjectStats: async () => {
    const activityId = get().currentProject?.id;
    if (!activityId) return;
    try {
      const stats = await projectsApi.getStats(activityId);
      set({ currentProjectStats: stats });
    } catch (error) {
      set({ errorMessage: errorToMessage(error) });
    }
  },

  clearCurrentProject: () => {
    set({ currentProject: undefined, errorMessage: undefined });
  },

  clearMessages: () => {
    set({ errorMessage: undefined });
  },

  reset: () => {
    set(defaults);
  },
}));
