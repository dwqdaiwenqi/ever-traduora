export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
}

export interface Provider {
  slug: string;
  url: string;
  redirectUrl: string;
  clientId: string;
  scope?: string;
  pkce?: boolean;
}

export interface Identity {
  id: string;
  provider: string;
  email: string;
  linkMethod: string;
  linkedAt: string;
  lastLoginAt: string | null;
}

export interface PendingInvite {
  id: string;
  projectName: string;
}

export interface ProviderSignupConfirmation {
  pending: string;
  name: string;
  email: string;
  invites: PendingInvite[];
}

export interface IdentityConnection {
  pending: string;
  emails: { account: string; everId: string };
}

export interface PendingAuthorization {
  provider: string;
  state: string;
  nonce: string;
  codeVerifier: string;
  intent: 'signin' | 'connect';
  createdAt: number;
}

export interface Plan {
  code: string;
  name: string;
  maxStrings: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  role: string;
  termsCount: number;
  localesCount: number;
  plan?: Plan;
}

export interface ProjectStats {
  projectStats: {
    progress: number;
    translated: number;
    total: number;
    terms: number;
    locales: number;
  };
  localeStats: {
    [localeCode: string]: ProjectLocaleStats;
  };
}

export interface ProjectLocaleStats {
  progress: number;
  translated: number;
  total: number;
}

export enum ProjectRole {
  Admin = 'admin',
  Editor = 'editor',
  Viewer = 'viewer',
}

export interface Locale {
  code: string;
  region: string;
  language: string;
}

export interface ProjectLocale {
  id: string;
  locale: Locale;
}

export interface Label {
  id: string;
  value: string;
  color: string;
}

export const TAG_COLORS: string[] = [
  '#304D6D', '#A7CCED', '#008C45', '#63ADF2', '#82A0BC', '#D81159',
  '#FCCA46', '#4AAC5F', '#404E7C', '#7D1128', '#C41E3D', '#ED254E',
  '#FFD275', '#3AB795', '#F2CC46', '#F58549', '#FF5E5B', '#EF798A',
  '#F7A9A8', '#36413E', '#87BCDE', '#6B8F71', '#F7C1BB', '#EC4067',
];

export interface Term {
  id: string;
  value: string;
  context: string | null;
  labels: Label[];
}

export interface Translation {
  termId: string;
  value: string;
  labels: Label[];
}

export interface ProjectUser {
  userId: string;
  name: string;
  email: string;
  role: ProjectRole;
  isSelf?: boolean;
}

export interface ProjectInvite {
  id: string;
  email: string;
  role: ProjectRole;
  inviteUrl?: string;
}

export interface ProjectInviteAddedUser {
  userId: string;
  name: string;
  email: string;
  role: ProjectRole;
}

export interface ProjectClient {
  id: string;
  name: string;
  role: ProjectRole;
  secret?: string;
}

export interface ImportFormat {
  displayName: string;
  code: string;
  extension: string;
}

export const IMPORT_FORMATS: ImportFormat[] = [
  { displayName: 'Android Resources (XML)', extension: 'xml', code: 'androidxml' },
  { displayName: 'CSV', extension: 'csv', code: 'csv' },
  { displayName: 'XLIFF 1.2', extension: 'xliff', code: 'xliff12' },
  { displayName: 'JSON Flat', extension: 'json', code: 'jsonflat' },
  { displayName: 'JSON', extension: 'json', code: 'jsonnested' },
  { displayName: 'YAML Flat', extension: 'yaml', code: 'yamlflat' },
  { displayName: 'YAML', extension: 'yaml', code: 'yamlnested' },
  { displayName: 'Java Properties', extension: 'properties', code: 'properties' },
  { displayName: 'Gettext (po)', extension: 'po', code: 'po' },
  { displayName: 'Strings', extension: 'strings', code: 'strings' },
  { displayName: 'PHP', extension: 'php', code: 'php' },
  { displayName: 'Resource RESX', extension: 'resx', code: 'resx' },
];

export interface ExportFormat {
  displayName: string;
  code: string;
  extension: string;
}

export const EXPORT_FORMATS: ExportFormat[] = IMPORT_FORMATS;

export interface ImportResult {
  terms: { added: number; skipped: number };
  translations: { upserted: number };
}

export enum ProjectAction {
  ViewProject, EditProject, DeleteProject,
  ViewProjectPlan, EditProjectPlan,
  ViewProjectUsers, EditProjectUsers, DeleteProjectUsers,
  InviteProjectUser, ViewProjectInvites, EditProjectInvites, DeleteProjectInvites,
  AddTerm, ViewTerm, EditTerm, DeleteTerm,
  AddLabel, ViewLabel, EditLabel, DeleteLabel,
  AddTranslation, ViewTranslation, EditTranslation, DeleteTranslation, ImportTranslation, ExportTranslation,
  AddProjectClient, ViewProjectClients, EditProjectClients, DeleteProjectClients,
}

export const AllowedEditorActions = new Set([
  ProjectAction.ViewProject, ProjectAction.ViewProjectPlan, ProjectAction.ViewProjectUsers,
  ProjectAction.ViewProjectInvites, ProjectAction.AddTerm, ProjectAction.ViewTerm,
  ProjectAction.EditTerm, ProjectAction.DeleteTerm, ProjectAction.AddLabel, ProjectAction.ViewLabel,
  ProjectAction.EditLabel, ProjectAction.DeleteLabel, ProjectAction.AddTranslation,
  ProjectAction.ViewTranslation, ProjectAction.EditTranslation, ProjectAction.DeleteTranslation,
  ProjectAction.ImportTranslation, ProjectAction.ExportTranslation, ProjectAction.ViewProjectClients,
]);

export const AllowedViewerActions = new Set([
  ProjectAction.ViewProject, ProjectAction.ViewProjectPlan, ProjectAction.ViewProjectUsers,
  ProjectAction.ViewProjectInvites, ProjectAction.ViewTerm, ProjectAction.ViewLabel,
  ProjectAction.ViewTranslation, ProjectAction.ExportTranslation, ProjectAction.ViewProjectClients,
]);

export function isAuthorized(role: ProjectRole, action: ProjectAction): boolean {
  switch (role) {
    case ProjectRole.Admin: return true;
    case ProjectRole.Editor: return AllowedEditorActions.has(action);
    case ProjectRole.Viewer: return AllowedViewerActions.has(action);
    default: return false;
  }
}
