import React, { useEffect } from 'react';
import { Form, Input, Button, Alert, Divider, Card, Modal, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import AppBar from '../shared/AppBar';
import { useAuthStore } from '../../stores/auth.store';

const { Title, Text } = Typography;

export default function UserSettings() {
  const navigate = useNavigate();
  const {
    user, updateUserSelf, changePassword, deleteAccount, isLoading, errorMessage, statusMessage, clearMessages,
    getIdentities, identities, pendingConnect, confirmIdentityConnect, cancelIdentityConnect, deleteIdentity,
    redirectToAuthProvider, providers, getProviders,
  } = useAuthStore();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({ name: user.name, email: user.email });
    }
    getIdentities();
    getProviders();
    return () => clearMessages();
  }, [user]);

  const handleUpdateProfile = async (values: { name: string; email: string }) => {
    try {
      await updateUserSelf(values);
    } catch {}
  };

  const handleChangePassword = async (values: { oldPassword: string; newPassword: string }) => {
    try {
      await changePassword(values.oldPassword, values.newPassword);
      passwordForm.resetFields();
    } catch {}
  };

  const handleDeleteAccount = () => {
    Modal.confirm({
      title: '删除账号',
      content: '确定要永久删除你的账号吗？此操作不可撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await deleteAccount();
        navigate('/login');
      },
    });
  };

  const everIdProvider = providers?.find(p => p.slug === 'everid');

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <AppBar />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px' }}>
        {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
        {statusMessage && <Alert type="success" message={statusMessage} showIcon style={{ marginBottom: 16 }} />}

        <Card title="个人信息" style={{ marginBottom: 24 }}>
          <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
            <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
              <Input type="email" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading}>保存更改</Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="修改密码" style={{ marginBottom: 24 }}>
          <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
            <Form.Item label="当前密码" name="oldPassword" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item label="新密码" name="newPassword" rules={[{ required: true, min: 8 }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading}>修改密码</Button>
            </Form.Item>
          </Form>
        </Card>

        {everIdProvider && (
          <Card title="已关联的登录方式" style={{ marginBottom: 24 }}>
            {pendingConnect && (
              <Alert
                type="warning"
                style={{ marginBottom: 16 }}
                message={`确认关联 Ever ID（${pendingConnect.emails.everId}）到此账号（${pendingConnect.emails.account}）？`}
                action={
                  <Space>
                    <Button size="small" onClick={() => cancelIdentityConnect()}>取消</Button>
                    <Button size="small" type="primary" loading={isLoading} onClick={() => confirmIdentityConnect()}>确认关联</Button>
                  </Space>
                }
              />
            )}
            {identities && identities.length > 0 ? (
              identities.map(identity => (
                <div key={identity.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <div>
                    <Text strong>{identity.provider}</Text>
                    <br />
                    <Text type="secondary">{identity.email}</Text>
                  </div>
                  <Button danger size="small" onClick={() => deleteIdentity(identity.id)}>解除关联</Button>
                </div>
              ))
            ) : (
              <div>
                <Text type="secondary">尚未关联任何第三方登录方式。</Text>
                <div style={{ marginTop: 12 }}>
                  <Button onClick={() => redirectToAuthProvider(everIdProvider, { intent: 'connect' })}>
                    关联 Ever ID
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        <Card title="危险操作" style={{ borderColor: '#ff4d4f' }}>
          <p style={{ color: '#888', marginBottom: 16 }}>删除账号后，所有数据将被永久删除且无法恢复。</p>
          <Button danger onClick={handleDeleteAccount} loading={isLoading}>删除账号</Button>
        </Card>
      </div>
    </div>
  );
}
