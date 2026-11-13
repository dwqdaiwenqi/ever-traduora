import React, { useEffect, useState } from 'react';
import { Table, Button, Select, Space, Popconfirm, Alert, Modal, Form, Input, Tabs, Tag, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useProjectsStore } from '../../stores/projects.store';
import { useProjectUsersStore } from '../../stores/project-users.store';
import { useProjectInvitesStore } from '../../stores/project-invites.store';
import { useAuthStore } from '../../stores/auth.store';
import { ProjectRole } from '../../models';
import type { ProjectUser, ProjectInvite } from '../../models';

const { Text } = Typography;

const roleOptions = Object.values(ProjectRole).map(r => ({ value: r, label: r }));

export default function TeamOverview() {
  const { currentProject } = useProjectsStore();
  const { user } = useAuthStore();
  const { users, isLoading: usersLoading, errorMessage: usersError, getProjectUsers, updateProjectUser, removeProjectUser, clearMessages: clearUsersMessages } = useProjectUsersStore();
  const { invites, isLoading: invitesLoading, errorMessage: invitesError, lastAdded, getProjectInvites, addProjectInvite, removeProjectInvite, clearMessages: clearInvitesMessages } = useProjectInvitesStore();
  const [addModal, setAddModal] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ email: string; inviteUrl: string } | null>(null);
  const [form] = Form.useForm();

  const selfUser = users.find(u => u.userId === user?.id);
  const canEdit = selfUser?.role === ProjectRole.Admin;

  useEffect(() => {
    if (currentProject) {
      getProjectUsers(currentProject.id, user?.id);
      getProjectInvites(currentProject.id);
    }
    return () => { clearUsersMessages(); clearInvitesMessages(); };
  }, [currentProject?.id]);

  const handleInvite = async (values: { email: string; role: ProjectRole }) => {
    if (!currentProject) return;
    try {
      const result = await addProjectInvite(currentProject.id, values.email, values.role);
      if ('inviteUrl' in result && result.inviteUrl) {
        setInviteResult({ email: values.email, inviteUrl: result.inviteUrl });
      } else {
        setAddModal(false);
        form.resetFields();
        await getProjectUsers(currentProject.id, user?.id);
      }
    } catch {}
  };

  const copyUrl = (url: string) => {
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    else document.execCommand('copy');
  };

  const userColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: ProjectRole, record: ProjectUser) =>
        canEdit && !record.isSelf ? (
          <Select
            value={role}
            options={roleOptions}
            onChange={newRole => currentProject && updateProjectUser(currentProject.id, record.userId, newRole)}
            style={{ width: 100 }}
            size="small"
          />
        ) : <Tag>{role}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ProjectUser) =>
        canEdit && !record.isSelf ? (
          <Popconfirm title="确定移除该成员？" onConfirm={() => currentProject && removeProjectUser(currentProject.id, record.userId)} okText="移除" cancelText="取消">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ) : null,
    },
  ];

  const inviteColumns = [
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '角色', dataIndex: 'role', key: 'role', render: (r: string) => <Tag>{r}</Tag> },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ProjectInvite) =>
        canEdit ? (
          <Popconfirm title="确定撤销此邀请？" onConfirm={() => currentProject && removeProjectInvite(currentProject.id, record.id)} okText="撤销" cancelText="取消">
            <Button size="small" danger>撤销</Button>
          </Popconfirm>
        ) : null,
    },
  ];

  const errorMessage = usersError || invitesError;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>团队管理</h3>
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>邀请成员</Button>
        )}
      </div>
      {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
      <Tabs
        items={[
          {
            key: 'members',
            label: `成员 (${users.length})`,
            children: <Table dataSource={users} columns={userColumns} rowKey="userId" loading={usersLoading} pagination={false} />,
          },
          {
            key: 'invites',
            label: `待接受邀请 (${invites.length})`,
            children: <Table dataSource={invites} columns={inviteColumns} rowKey="id" loading={invitesLoading} pagination={false} />,
          },
        ]}
      />

      <Modal
        title="邀请团队成员"
        open={addModal}
        onCancel={() => { setAddModal(false); setInviteResult(null); form.resetFields(); }}
        footer={inviteResult ? [
          <Button key="close" onClick={() => { setAddModal(false); setInviteResult(null); form.resetFields(); }}>关闭</Button>,
        ] : null}
        onOk={() => form.submit()}
      >
        {inviteResult ? (
          <div>
            <Alert type="success" message={`已向 ${inviteResult.email} 发送邀请邮件。`} style={{ marginBottom: 16 }} />
            <p>如果邮件未到达，可分享以下链接：</p>
            <Space.Compact style={{ width: '100%' }}>
              <Input value={inviteResult.inviteUrl} readOnly />
              <Button onClick={() => copyUrl(inviteResult.inviteUrl)}>复制</Button>
            </Space.Compact>
          </div>
        ) : (
          <Form form={form} layout="vertical" onFinish={handleInvite}>
            <Form.Item label="邮箱地址" name="email" rules={[{ required: true, type: 'email' }]}>
              <Input type="email" />
            </Form.Item>
            <Form.Item label="角色" name="role" initialValue={ProjectRole.Editor} rules={[{ required: true }]}>
              <Select options={roleOptions} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
