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

export interface ProviderSignupConfirmation {
  pending: string;
  name: string;
  email: string;
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

export enum ProjectRole {
  Admin = 'admin',
  Editor = 'editor',
  Viewer = 'viewer',
}

export const projectRoleLabels: Record<ProjectRole, string> = {
  [ProjectRole.Admin]: '管理员',
  [ProjectRole.Editor]: '编辑者',
  [ProjectRole.Viewer]: '只读',
};

export interface ProjectUser {
  userId: string;
  name: string;
  email: string;
  role: ProjectRole;
  isSelf?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  role: ProjectRole;
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

export interface Locale {
  code: string;
  region: string;
  language: string;
}

export interface ProjectLocale {
  id: string;
  locale: Locale;
}

export interface Term {
  id: string;
  value: string;
  context: string | null;
}

export interface Translation {
  termId: string;
  value: string;
}

export interface ProjectClient {
  id: string;
  name: string;
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
