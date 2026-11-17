import React, { useEffect, useState } from 'react';
import { Table, Button, Select, Popconfirm, Alert, Modal, Form, Input, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useProjectsStore } from '../../stores/projects.store';
import { useProjectUsersStore } from '../../stores/project-users.store';
import { useAuthStore } from '../../stores/auth.store';
import PageHeader from '../shared/PageHeader';
import { ProjectRole, projectRoleLabels } from '../../models';
import type { ProjectUser } from '../../models';

const roleOptions = Object.values(ProjectRole).map(r => ({ value: r, label: projectRoleLabels[r] }));

export default function TeamOverview() {
  const { currentProject } = useProjectsStore();
  const { user } = useAuthStore();
  const { users, isLoading, errorMessage, getProjectUsers, addProjectUser, updateProjectUser, removeProjectUser, clearMessages } = useProjectUsersStore();
  const [addModal, setAddModal] = useState(false);
  const [form] = Form.useForm();

  const canEdit = currentProject?.role === ProjectRole.Admin;

  useEffect(() => {
    if (currentProject) getProjectUsers(currentProject.id, user?.id);
    return () => clearMessages();
  }, [currentProject?.id]);

  const handleAdd = async (values: { email: string; role: ProjectRole }) => {
    if (!currentProject) return;
    try {
      await addProjectUser(currentProject.id, values.email, values.role);
      setAddModal(false);
      form.resetFields();
    } catch {}
  };

  const columns = [
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
            onChange={newRole => currentProject && updateProjectUser(currentProject.id, record.userId, newRole).catch(() => {})}
            style={{ width: 110 }}
            size="small"
          />
        ) : (
          <Tag>{projectRoleLabels[role] ?? role}</Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: ProjectUser) =>
        canEdit && !record.isSelf ? (
          <Popconfirm
            title="确定移除该成员？"
            onConfirm={() => currentProject && removeProjectUser(currentProject.id, record.userId).catch(() => {})}
            okText="移除"
            cancelText="取消"
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="团队"
        extra={canEdit && <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>添加翻译成员</Button>}
      />
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="管理员：全部权限；编辑者：可编辑词条和译文、导入导出；只读：仅查看和导出。"
      />
      {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
      <Table dataSource={users} columns={columns} rowKey="userId" loading={isLoading} pagination={false} />

      <Modal
        title="添加翻译成员"
        open={addModal}
        onCancel={() => { setAddModal(false); form.resetFields(); clearMessages(); }}
        onOk={() => form.submit()}
        okText="添加"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item label="邮箱地址（对方凭此邮箱即可登录，无需密码）" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input type="email" />
          </Form.Item>
          <Form.Item label="角色" name="role" initialValue={ProjectRole.Viewer} rules={[{ required: true }]}>
            <Select options={roleOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
