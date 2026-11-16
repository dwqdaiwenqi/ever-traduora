import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { get } from 'lodash';
import Logo from '../shared/Logo';
import { useAuthStore } from '../../stores/auth.store';

/**
 * 成员只需要输入邮箱。输入的是管理员邮箱时，服务端会提示需要密码，这时才显示密码框。
 */
export default function Login() {
  const navigate = useNavigate();
  const { emailLogin, passwordLogin, isLoading, errorMessage, clearMessages } = useAuthStore();
  const [needPassword, setNeedPassword] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => () => clearMessages(), []);

  const onFinish = async (values: { email: string; password?: string }) => {
    try {
      if (needPassword) {
        await passwordLogin(values.email, values.password ?? '');
      } else {
        await emailLogin(values.email);
      }
      navigate('/activities');
    } catch (error) {
      if (get(error, 'response.data.error.code') === 'PasswordRequired') {
        setNeedPassword(true);
      }
    }
  };

  const isGenericError = !!errorMessage && errorMessage !== PASSWORD_REQUIRED_MESSAGE;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Logo style={{ fontSize: 26, marginBottom: 28 }} />
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          padding: '28px 28px 24px',
          background: '#fff',
          border: '1px solid var(--tr-border-light)',
          borderRadius: 12,
          boxShadow: '0 8px 30px rgba(31, 35, 41, 0.06)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>登录</h2>
        <div style={{ margin: '4px 0 20px', color: 'var(--tr-text-tertiary)', fontSize: 13 }}>
          {needPassword ? '这是管理员账号，请输入密码' : '输入管理员添加的邮箱即可登录'}
        </div>
        {isGenericError && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off" requiredMark={false}>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email', message: '请输入有效的邮箱地址' }]}>
            <Input
              size="large"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="name@company.com"
              onChange={() => needPassword && setNeedPassword(false)}
            />
          </Form.Item>
          {needPassword && (
            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password size="large" autoComplete="current-password" autoFocus />
            </Form.Item>
          )}
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button type="primary" size="large" htmlType="submit" loading={isLoading} block>登录</Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

const PASSWORD_REQUIRED_MESSAGE = '该账号需要使用密码登录。';
