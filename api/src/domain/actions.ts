export enum ProjectAction {
  // Projects
  ViewProject,
  EditProject,
  DeleteProject,

  // Project Plan
  ViewProjectPlan,
  EditProjectPlan,

  // Project Users
  ViewProjectUsers,
  EditProjectUsers,
  DeleteProjectUsers,

  // Terms
  AddTerm,
  ViewTerm,
  EditTerm,
  DeleteTerm,

  // Translations
  AddTranslation,
  ViewTranslation,
  EditTranslation,
  DeleteTranslation,
  ImportTranslation,
  ExportTranslation,
  // 确认待确认的翻译，只有 admin 可以（不加入 Editor / Viewer 的允许列表）
  ConfirmTranslation,

  // Clients
  AddProjectClient,
  ViewProjectClients,
  EditProjectClients,
  DeleteProjectClients,
}

export const AllowedEditorActions = new Set([
  ProjectAction.ViewProject,
  ProjectAction.ViewProjectPlan,
  ProjectAction.ViewProjectUsers,
  ProjectAction.AddTerm,
  ProjectAction.ViewTerm,
  ProjectAction.EditTerm,
  ProjectAction.DeleteTerm,
  ProjectAction.AddTranslation,
  ProjectAction.ViewTranslation,
  ProjectAction.EditTranslation,
  ProjectAction.DeleteTranslation,
  ProjectAction.ImportTranslation,
  ProjectAction.ExportTranslation,
  ProjectAction.ViewProjectClients,
]);

export const AllowedViewerActions = new Set([
  ProjectAction.ViewProject,
  ProjectAction.ViewProjectPlan,
  ProjectAction.ViewProjectUsers,
  ProjectAction.ViewTerm,
  ProjectAction.ViewTranslation,
  ProjectAction.ExportTranslation,
  ProjectAction.ViewProjectClients,
]);
