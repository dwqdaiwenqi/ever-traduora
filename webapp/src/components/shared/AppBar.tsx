import React from 'react';
import { Avatar, Button, Dropdown, Space } from 'antd';
import { AppstoreOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuthStore } from '../../stores/auth.store';
import DemoBanner from './DemoBanner';

export const APP_BAR_HEIGHT = 56;

export default function AppBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const name = user?.name || user?.email || '';

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <DemoBanner />
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          height: APP_BAR_HEIGHT,
          padding: '0 24px',
          background: '#fff',
          borderBottom: '1px solid var(--tr-border-light)',
        }}
      >
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Logo />
        </div>
        <div style={{ flex: 1 }} />
        {user && (
          <Space size={8}>
            <Button type="text" icon={<AppstoreOutlined />} onClick={() => navigate('/activities')}>
              活动
            </Button>
            <Dropdown
              menu={{ items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }] }}
              placement="bottomRight"
            >
              <Button type="text" style={{ paddingInline: 8 }}>
                <Avatar size={24} style={{ background: 'var(--tr-primary)', fontSize: 12, marginRight: 8 }}>
                  {name.slice(0, 1).toUpperCase()}
                </Avatar>
                {name}
              </Button>
            </Dropdown>
          </Space>
        )}
      </header>
    </div>
  );
}
