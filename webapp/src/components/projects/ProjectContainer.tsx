import React, { useEffect } from 'react';
import { Outlet, useParams, useNavigate, NavLink } from 'react-router-dom';
import { Layout, Menu, Spin, Alert, Progress } from 'antd';
import AppBar from '../shared/AppBar';
import { useProjectsStore } from '../../stores/projects.store';
import { ProjectRole } from '../../models';

const { Content, Sider } = Layout;

export default function ProjectContainer() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, currentProjectStats, isLoading, errorMessage, setCurrentProject, clearCurrentProject, clearMessages } = useProjectsStore();

  useEffect(() => {
    if (projectId) {
      setCurrentProject(projectId, navigate);
    }
    return () => {
      clearCurrentProject();
      clearMessages();
    };
  }, [projectId]);

  if (isLoading && !currentProject) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <AppBar />
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spin size="large" /></div>
      </div>
    );
  }

  const stats = currentProjectStats?.projectStats;

  const menuItems = [
    { key: 'matrix', label: '对照翻译', path: 'matrix' },
    { key: 'translations', label: '按语言翻译', path: 'translations' },
    { key: 'terms', label: '词条', path: 'terms' },
    { key: 'team', label: '团队', path: 'team' },
    { key: 'api', label: 'API 客户端', path: 'api' },
    ...(currentProject?.role === ProjectRole.Viewer ? [] : [{ key: 'import', label: '导入', path: 'import' }]),
    { key: 'export', label: '导出', path: 'export' },
    { key: 'settings', label: '设置', path: 'settings' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <AppBar />
      <Layout style={{ background: 'transparent', maxWidth: 1400, margin: '0 auto' }}>
        <Sider width={200} style={{ background: '#fff', borderRight: '1px solid #f0f0f0', minHeight: 'calc(100vh - 56px)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentProject?.name}
            </div>
            {stats && (
              <div>
                <Progress percent={Math.round(stats.progress * 100)} size="small" />
                <div style={{ fontSize: 12, color: '#888' }}>{stats.translated}/{stats.total} 已翻译</div>
              </div>
            )}
          </div>
          <Menu
            mode="inline"
            style={{ border: 'none' }}
            selectedKeys={[location.pathname.split('/').pop() || 'translations']}
            items={menuItems.map(item => ({
              key: item.key,
              label: item.label,
              onClick: () => navigate(`/projects/${projectId}/${item.path}`),
            }))}
          />
        </Sider>
        <Content style={{ padding: '24px', minHeight: 'calc(100vh - 56px)' }}>
          {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
          {currentProject ? <Outlet /> : null}
        </Content>
      </Layout>
    </div>
  );
}
