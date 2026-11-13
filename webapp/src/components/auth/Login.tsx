import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Alert, Divider } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../shared/Logo';
import { useAuthStore } from '../../stores/auth.store';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, errorMessage, clearMessages, providers, getProviders, redirectToAuthProvider } = useAuthStore();
  const [form] = Form.useForm();

  useEffect(() => {
    getProviders();
    return () => clearMessages();
  }, []);

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      await login(values.email, values.password);
      navigate('/projects');
    } catch {
      // error shown via errorMessage
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Logo style={{ color: '#1890ff', marginBottom: 32 }} />
      <div style={{ width: 380 }}>
        {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
        <div className="ant-card ant-card-bordered" style={{ padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
          <h4 style={{ fontFamily: 'serif', marginBottom: 20 }}>登录</h4>
          <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email', message: '请输入有效的邮箱地址' }]}>
              <Input type="email" autoComplete="email" />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading} block>登录</Button>
            </Form.Item>
          </Form>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Link to="/signup">注册账号</Link>
            <Link to="/forgot-password">忘记密码？</Link>
          </div>
          {providers && providers.length > 0 && (
            <>
              <Divider>或通过以下方式登录</Divider>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {providers.map(p => (
                  <Button key={p.slug} block onClick={() => redirectToAuthProvider(p)}>
                    通过 {p.slug} 登录
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
