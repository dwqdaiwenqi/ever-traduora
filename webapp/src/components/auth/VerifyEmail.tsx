import React, { useEffect, useState } from 'react';
import { Alert, Button } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../shared/Logo';
import { useAuthStore } from '../../stores/auth.store';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { verifyEmail, resendVerificationEmail, user } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resent'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('邮箱验证链接无效。');
      return;
    }
    verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('邮箱验证成功！');
      })
      .catch(() => {
        setStatus('error');
        setMessage('邮箱验证链接无效或已过期。');
      });
  }, []);

  const handleResend = async () => {
    await resendVerificationEmail();
    setStatus('resent');
    setMessage('验证邮件已重新发送。');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Logo style={{ color: '#1890ff', marginBottom: 32 }} />
      <div style={{ width: 380 }}>
        {status === 'loading' && <div>正在验证邮箱...</div>}
        {status === 'success' && (
          <Alert type="success" message={message} showIcon action={<Button onClick={() => navigate('/')}>前往项目</Button>} />
        )}
        {status === 'error' && (
          <>
            <Alert type="error" message={message} showIcon style={{ marginBottom: 16 }} />
            {user && <Button onClick={handleResend}>重新发送验证邮件</Button>}
          </>
        )}
        {status === 'resent' && <Alert type="success" message={message} showIcon />}
      </div>
    </div>
  );
}
