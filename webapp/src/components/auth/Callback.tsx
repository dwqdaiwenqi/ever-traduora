import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../shared/Logo';
import { useAuthStore } from '../../stores/auth.store';
import { peekPendingAuthorization } from '../../api/auth';

export default function Callback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleAuthCallback, handleIdentityConnectCallback, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (!code) {
      navigate('/login');
      return;
    }

    const pending = peekPendingAuthorization(state);
    if (pending?.intent === 'connect') {
      // This is a connect callback, not a sign-in callback
      const nonce = pending.nonce;
      const codeVerifier = pending.codeVerifier;
      const provider = pending.provider;
      handleIdentityConnectCallback(
        { code, provider, state: state!, nonce, code_verifier: codeVerifier },
        navigate,
      );
    } else {
      handleAuthCallback(code, state, (path) => navigate(path, { replace: true }));
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Logo style={{ color: '#1890ff', marginBottom: 16 }} />
      <div>加载中...</div>
    </div>
  );
}
