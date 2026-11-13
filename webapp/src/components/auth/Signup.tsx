import React, { useEffect } from 'react';
import { Form, Input, Button, Alert, Divider } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../shared/Logo';
import { useAuthStore } from '../../stores/auth.store';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, isLoading, errorMessage, clearMessages, providers, getProviders, redirectToAuthProvider } = useAuthStore();
  const [form] = Form.useForm();

  useEffect(() => {
    getProviders();
    return () => clearMessages();
  }, []);

  const onFinish = async (values: { name: string; email: string; password: string }) => {
    try {
      await signup(values.name, values.email, values.password);
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
        <div style={{ padding: 24, borderRadius: 8, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
          <h4 style={{ fontFamily: 'serif', marginBottom: 20 }}>注册</h4>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input autoComplete="name" />
            </Form.Item>
            <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email', message: '请输入有效的邮箱地址' }]}>
              <Input type="email" autoComplete="email" />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, min: 8, message: '密码至少 8 位' }]}>
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading} block>注册</Button>
            </Form.Item>
          </Form>
          <div>
            <Link to="/login">已有账号？登录</Link>
          </div>
          {providers && providers.length > 0 && (
            <>
              <Divider>或通过以下方式注册</Divider>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {providers.map(p => (
                  <Button key={p.slug} block onClick={() => redirectToAuthProvider(p)}>
                    通过 {p.slug} 注册
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
