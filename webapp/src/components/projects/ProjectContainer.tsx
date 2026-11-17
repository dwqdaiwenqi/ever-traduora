import React, { useEffect } from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Spin, Alert, Progress, Tag } from 'antd';
import {
  ApiOutlined,
  DownloadOutlined,
  GlobalOutlined,
  SettingOutlined,
  TableOutlined,
  TagsOutlined,
  TeamOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import AppBar, { APP_BAR_HEIGHT } from '../shared/AppBar';
import { useProjectsStore } from '../../stores/projects.store';
import { ProjectRole, projectRoleLabels } from '../../models';

const SIDER_WIDTH = 220;

export default function ProjectContainer() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentProject, currentProjectStats, isLoading, errorMessage, setCurrentProject, clearCurrentProject, clearMessages } = useProjectsStore();

  useEffect(() => {
    if (activityId) {
      setCurrentProject(activityId, navigate);
    }
    return () => {
      clearCurrentProject();
      clearMessages();
    };
  }, [activityId]);

  if (isLoading && !currentProject) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <AppBar />
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spin size="large" /></div>
      </div>
    );
  }

  const stats = currentProjectStats?.activityStats;
  const isViewer = currentProject?.role === ProjectRole.Viewer;

  const menuItems = [
    { key: 'terms', label: '词条', icon: <TagsOutlined /> },
    { key: 'translations', label: '按服翻译', icon: <GlobalOutlined /> },
    { key: 'matrix', label: '对照翻译', icon: <TableOutlined /> },
    ...(isViewer ? [] : [{ key: 'import', label: '导入', icon: <UploadOutlined /> }]),
    { key: 'export', label: '导出', icon: <DownloadOutlined /> },
    { key: 'api', label: 'API 客户端', icon: <ApiOutlined /> },
    { key: 'team', label: '翻译成员', icon: <TeamOutlined /> },
    { key: 'settings', label: '设置', icon: <SettingOutlined /> },
  ];

  // /projects/:id/<section>/...  → 第 4 段是当前所在的菜单项
  const section = location.pathname.split('/')[3] || 'matrix';

  return (
    <div style={{ minHeight: '100vh' }}>
      <AppBar />
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <aside
          style={{
            width: SIDER_WIDTH,
            flexShrink: 0,
            position: 'sticky',
            top: APP_BAR_HEIGHT,
            height: `calc(100vh - ${APP_BAR_HEIGHT}px)`,
            overflowY: 'auto',
            background: '#fff',
            borderRight: '1px solid var(--tr-border-light)',
          }}
        >
          <div style={{ padding: '16px 16px 12px' }}>
            <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={currentProject?.name}>
              {currentProject?.name}
            </div>
            {currentProject && (
              <Tag bordered={false} style={{ marginTop: 6, marginInlineEnd: 0 }}>
                {projectRoleLabels[currentProject.role] ?? currentProject.role}
              </Tag>
            )}
            {stats && (
              <div style={{ marginTop: 12 }}>
                <Progress percent={Math.round(stats.progress * 100)} size="small" />
                <div style={{ fontSize: 12, color: 'var(--tr-text-tertiary)' }}>{stats.translated}/{stats.total} 已翻译</div>
              </div>
            )}
          </div>
          <Menu
            mode="inline"
            style={{ border: 'none', paddingBottom: 16 }}
            selectedKeys={[section]}
            items={menuItems}
            onClick={({ key }) => navigate(`/activities/${activityId}/${key}`)}
          />
        </aside>
        <main style={{ flex: 1, minWidth: 0, padding: 24 }}>
          {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
          {currentProject ? <Outlet /> : null}
        </main>
      </div>
    </div>
  );
}
