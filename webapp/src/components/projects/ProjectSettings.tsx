import React, { useEffect } from 'react';
import { Form, Input, Button, Card, Alert, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useProjectsStore } from '../../stores/projects.store';
import PageHeader from '../shared/PageHeader';

export default function ProjectSettings() {
  const navigate = useNavigate();
  const { currentProject, isLoading, errorMessage, updateProject, deleteProject, clearMessages } = useProjectsStore();
  const [form] = Form.useForm();

  useEffect(() => {
    if (currentProject) {
      form.setFieldsValue({ name: currentProject.name, description: currentProject.description });
    }
    return () => clearMessages();
  }, [currentProject?.id]);

  const handleSave = async (values: { name: string; description?: string }) => {
    if (!currentProject) return;
    try {
      await updateProject(currentProject.id, values);
    } catch {}
  };

  const handleDelete = () => {
    if (!currentProject) return;
    Modal.confirm({
      title: '删除活动',
      content: `确定要永久删除活动"${currentProject.name}"？所有词条和翻译将被删除且无法恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteProject(currentProject.id, navigate),
    });
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <PageHeader title="设置" />
      {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
      <Card title="基本信息" style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="活动名称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="活动描述" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading}>保存更改</Button>
          </Form.Item>
        </Form>
      </Card>
      {/* <Card title="危险操作" style={{ borderColor: '#ffccc7' }}>
        <p style={{ color: 'var(--tr-text-tertiary)', marginBottom: 16 }}>删除活动后，所有词条和翻译将被永久删除且无法恢复。</p>
        <Button danger onClick={handleDelete} loading={isLoading}>删除活动</Button>
      </Card> */}
    </div>
  );
}
