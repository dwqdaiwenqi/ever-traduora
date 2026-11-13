import React, { useEffect } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { Link } from 'react-router-dom';
import Logo from '../shared/Logo';
import { useAuthStore } from '../../stores/auth.store';

export default function ForgotPassword() {
  const { forgotPassword, isLoading, errorMessage, statusMessage, clearMessages } = useAuthStore();
  const [form] = Form.useForm();

  useEffect(() => () => clearMessages(), []);

  const onFinish = async (values: { email: string }) => {
    try {
      await forgotPassword(values.email);
    } catch {
      // shown via errorMessage
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Logo style={{ color: '#1890ff', marginBottom: 32 }} />
      <div style={{ width: 380 }}>
        {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
        {statusMessage && <Alert type="success" message={statusMessage} showIcon style={{ marginBottom: 16 }} />}
        <div style={{ padding: 24, borderRadius: 8, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
          <h4 style={{ fontFamily: 'serif', marginBottom: 20 }}>忘记密码</h4>
          <p className="text-muted" style={{ color: '#888', marginBottom: 16 }}>
            输入你的邮箱地址，我们将向你发送密码重置链接。
          </p>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email', message: '请输入有效的邮箱地址' }]}>
              <Input type="email" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading} block>发送重置链接</Button>
            </Form.Item>
          </Form>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Link to="/login">返回登录</Link>
            <Link to="/signup">注册账号</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
