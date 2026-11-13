import React, { useEffect } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Logo from '../shared/Logo';
import { useAuthStore } from '../../stores/auth.store';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const { resetPassword, isLoading, errorMessage, statusMessage, clearMessages } = useAuthStore();
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({ email });
    return () => clearMessages();
  }, []);

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      await resetPassword(values.email, values.password, token);
    } catch {
      // shown via errorMessage
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Logo style={{ color: '#1890ff', marginBottom: 32 }} />
      <div style={{ width: 380 }}>
        {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
        {statusMessage && (
          <Alert type="success" message={statusMessage} showIcon style={{ marginBottom: 16 }} action={<Link to="/login">去登录</Link>} />
        )}
        <div style={{ padding: 24, borderRadius: 8, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
          <h4 style={{ fontFamily: 'serif', marginBottom: 20 }}>重置密码</h4>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
              <Input type="email" />
            </Form.Item>
            <Form.Item label="新密码" name="password" rules={[{ required: true, min: 8, message: '密码至少 8 位' }]}>
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading} block disabled={!!statusMessage}>
                重置密码
              </Button>
            </Form.Item>
          </Form>
          <Link to="/login">返回登录</Link>
        </div>
      </div>
    </div>
  );
}
