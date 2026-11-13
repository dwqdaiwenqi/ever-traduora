import { apiClient } from './client';
import type { ProjectInvite, ProjectInviteAddedUser, ProjectRole } from '../models';

export const projectInvitesApi = {
  find: async (projectId: string): Promise<ProjectInvite[]> => {
    const res = await apiClient.get<{ data: ProjectInvite[] }>(`/projects/${projectId}/invites`);
    return res.data.data;
  },
  create: async (projectId: string, email: string, role: ProjectRole): Promise<ProjectInvite | ProjectInviteAddedUser> => {
    const res = await apiClient.post<{ data: ProjectInvite | ProjectInviteAddedUser }>(`/projects/${projectId}/invites`, { email, role });
    return res.data.data;
  },
  update: async (projectId: string, inviteId: string, role: ProjectRole): Promise<ProjectInvite> => {
    const res = await apiClient.patch<{ data: ProjectInvite }>(`/projects/${projectId}/invites/${inviteId}`, { role });
    return res.data.data;
  },
  remove: async (projectId: string, inviteId: string) => {
    await apiClient.delete(`/projects/${projectId}/invites/${inviteId}`);
  },
};
