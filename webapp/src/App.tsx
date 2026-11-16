import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuthStore } from './stores/auth.store';
import { setUnauthorizedCallback } from './api/client';
import { theme } from './theme';

// Auth pages
import Login from './components/auth/Login';

// Project pages
import ProjectList from './components/projects/ProjectList';
import ProjectContainer from './components/projects/ProjectContainer';
import ProjectLocales from './components/projects/ProjectLocales';
import TranslationsList from './components/projects/TranslationsList';
import TranslationMatrix from './components/projects/TranslationMatrix';
import TermsList from './components/projects/TermsList';
import TeamOverview from './components/projects/TeamOverview';
import ApiClientsOverview from './components/projects/ApiClientsOverview';
import ImportContainer from './components/projects/ImportContainer';
import ExportContainer from './components/projects/ExportContainer';
import ProjectSettings from './components/projects/ProjectSettings';

// Shared
import NotFound from './components/shared/NotFound';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function NoAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/activities" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { checkAuth, logout } = useAuthStore();

  useEffect(() => {
    setUnauthorizedCallback(() => logout('登录已过期，请重新登录。'));
    checkAuth();
  }, []);

  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<NoAuthGuard><Login /></NoAuthGuard>} />

        {/* Protected project routes */}
        <Route path="/activities" element={<AuthGuard><ProjectList /></AuthGuard>} />
        <Route path="/activities/:activityId" element={<AuthGuard><ProjectContainer /></AuthGuard>}>
          <Route index element={<Navigate to="matrix" replace />} />
          <Route path="matrix" element={<TranslationMatrix />} />
          <Route path="translations" element={<ProjectLocales />} />
          <Route path="translations/:localeCode" element={<TranslationsList />} />
          <Route path="terms" element={<TermsList />} />
          <Route path="team" element={<TeamOverview />} />
          <Route path="api" element={<ApiClientsOverview />} />
          <Route path="import" element={<ImportContainer />} />
          <Route path="export" element={<ExportContainer />} />
          <Route path="settings" element={<ProjectSettings />} />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/activities" replace />} />

        {/* 404 */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </ConfigProvider>
  );
}
