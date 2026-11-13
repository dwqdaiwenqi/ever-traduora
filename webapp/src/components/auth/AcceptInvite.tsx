import React, { useEffect, useState } from 'react';
import { Alert, Button } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../shared/Logo';
import { useAuthStore } from '../../stores/auth.store';

export default function AcceptInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { acceptInvite } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    if (!token) {
      setErrorMessage('邀请链接无效或已过期。');
      return;
    }
    acceptInvite(token, navigate)
      .then(projectId => {
        navigate(`/projects/${projectId}/translations`);
      })
      .catch(() => {
        setErrorMessage('邀请链接无效或已过期。');
      });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Logo style={{ color: '#1890ff', marginBottom: 32 }} />
      {!errorMessage ? (
        <div>正在接受邀请...</div>
      ) : (
        <div style={{ width: 380 }}>
          <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />
          <Button type="link" onClick={() => navigate('/')} style={{ padding: 0 }}>前往我的项目</Button>
        </div>
      )}
    </div>
  );
}
