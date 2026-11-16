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
      navigate('/projects');
    } catch (error) {
      if (get(error, 'response.data.error.code') === 'PasswordRequired') {
        setNeedPassword(true);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Logo style={{ color: '#1890ff', marginBottom: 32 }} />
      <div style={{ width: 380 }}>
        {errorMessage && !needPassword && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
        {needPassword && (
          <Alert
            type={errorMessage && errorMessage !== PASSWORD_REQUIRED_MESSAGE ? 'error' : 'info'}
            message={errorMessage && errorMessage !== PASSWORD_REQUIRED_MESSAGE ? errorMessage : '这是管理员账号，请输入密码'}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <div className="ant-card ant-card-bordered" style={{ padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
          <h4 style={{ fontFamily: 'serif', marginBottom: 20 }}>登录</h4>
          <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email', message: '请输入有效的邮箱地址' }]}>
              <Input
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="请输入管理员添加的邮箱"
                onChange={() => needPassword && setNeedPassword(false)}
              />
            </Form.Item>
            {needPassword && (
              <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password autoComplete="current-password" autoFocus />
              </Form.Item>
            )}
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={isLoading} block>登录</Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}

const PASSWORD_REQUIRED_MESSAGE = '该账号需要使用密码登录。';
