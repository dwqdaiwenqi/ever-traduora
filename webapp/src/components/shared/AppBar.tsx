import React from 'react';
import { Layout, Button, Dropdown, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuthStore } from '../../stores/auth.store';
import DemoBanner from './DemoBanner';

const { Header } = Layout;

export default function AppBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { key: 'logout', label: '退出登录', onClick: handleLogout },
  ];

  return (
    <>
      <DemoBanner />
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px', background: '#1890ff', height: 56 }}>
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Logo />
        </div>
        <div style={{ flex: 1 }} />
        {user && (
          <Space>
            <Button type="primary" ghost size="small" onClick={() => navigate('/projects')} style={{ borderColor: 'rgba(255,255,255,0.6)', color: '#fff' }}>
              <span className="material-icons" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>assignment</span>
              项目
            </Button>
            <Dropdown menu={{ items: menuItems }} placement="bottomRight">
              <Button type="primary" ghost size="small" style={{ borderColor: 'rgba(255,255,255,0.6)', color: '#fff' }}>
                <span className="material-icons" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>account_circle</span>
                {user.name || user.email}
              </Button>
            </Dropdown>
          </Space>
        )}
      </Header>
    </>
  );
}
