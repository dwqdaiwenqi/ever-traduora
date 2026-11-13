import React, { useEffect } from 'react';
import { Button, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import Logo from '../shared/Logo';
import { useAuthStore } from '../../stores/auth.store';

export default function EverIdConfirm() {
  const navigate = useNavigate();
  const { pendingSignup, confirmProviderSignup, cancelProviderSignup, isLoading, errorMessage, clearMessages } = useAuthStore();

  useEffect(() => () => clearMessages(), []);

  if (!pendingSignup) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Logo style={{ color: '#1890ff', marginBottom: 16 }} />
        <Alert type="error" message="注册已过期，请重新使用 Ever ID 登录。" style={{ marginTop: 16 }} />
        <Button type="link" onClick={() => navigate('/login')} style={{ marginTop: 8 }}>返回登录</Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Logo style={{ color: '#1890ff', marginBottom: 32 }} />
      <div style={{ width: 420, padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
        <h4 style={{ fontFamily: 'serif', marginBottom: 16 }}>创建你的 Traduora 账号</h4>
        {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
        <p style={{ color: '#888' }}>你已通过 Ever ID 登录。确认以使用以下信息创建 Traduora 账号。</p>
        <div style={{ marginBottom: 12 }}>
          <label>姓名</label>
          <input className="ant-input" value={pendingSignup.name} readOnly style={{ width: '100%', marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>邮箱地址</label>
          <input className="ant-input" type="email" value={pendingSignup.email} readOnly style={{ width: '100%', marginTop: 4 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <Button onClick={() => cancelProviderSignup(navigate)}>取消</Button>
          <Button type="primary" loading={isLoading} onClick={() => confirmProviderSignup(navigate)}>
            确认创建账号
          </Button>
        </div>
      </div>
    </div>
  );
}
