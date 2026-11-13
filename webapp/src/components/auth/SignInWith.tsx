import React, { useEffect } from 'react';
import { Button, Space, Divider } from 'antd';
import { useAuthStore } from '../../stores/auth.store';

interface Props {
  intent?: 'signin' | 'connect';
}

export default function SignInWith({ intent = 'signin' }: Props) {
  const { providers, getProviders, redirectToAuthProvider } = useAuthStore();

  useEffect(() => {
    getProviders();
  }, []);

  if (!providers || providers.length === 0) return null;

  return (
    <div>
      <Divider>或通过以下方式{intent === 'connect' ? '关联' : '登录'}</Divider>
      <Space direction="vertical" style={{ width: '100%' }}>
        {providers.map(p => (
          <Button key={p.slug} block onClick={() => redirectToAuthProvider(p, { intent })}>
            通过 {p.slug} {intent === 'connect' ? '关联' : '登录'}
          </Button>
        ))}
      </Space>
    </div>
  );
}
