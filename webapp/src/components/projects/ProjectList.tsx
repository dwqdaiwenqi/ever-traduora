import React, { useEffect, useState } from 'react';
import { Button, Modal, Form, Input, Row, Col, Empty, Spin, Alert } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AppBar from '../shared/AppBar';
import { useProjectsStore } from '../../stores/projects.store';
import ProjectCard from './ProjectCard';
import PageHeader from '../shared/PageHeader';

export default function ProjectList() {
  const navigate = useNavigate();
  const { projects, isLoading, errorMessage, getProjects, createProject, clearMessages } = useProjectsStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getProjects();
    return () => clearMessages();
  }, []);

  const handleCreate = async (values: { name: string; description?: string }) => {
    setCreating(true);
    try {
      const project = await createProject(values.name, values.description);
      setModalOpen(false);
      form.resetFields();
      navigate(`/activities/${project.id}/matrix`);
    } catch {
      // shown via store
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <AppBar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <PageHeader
          title="我的活动"
          description="选择一个活动开始翻译"
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建活动</Button>}
        />
        {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 64 }}><Spin size="large" /></div>
        ) : projects.length === 0 ? (
          <Empty description="暂无活动" style={{ padding: 64 }}>
            <Button type="primary" onClick={() => setModalOpen(true)}>创建第一个活动</Button>
          </Empty>
        ) : (
          <Row gutter={[16, 16]}>
            {projects.map(project => (
              <Col key={project.id} xs={24} sm={12} md={8} lg={6}>
                <ProjectCard project={project} onClick={() => navigate(`/activities/${project.id}/matrix`)} />
              </Col>
            ))}
          </Row>
        )}
      </div>

      <Modal
        title="新建活动"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={creating}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="活动名称" name="name" rules={[{ required: true, message: '请输入活动名称' }]}>
            <Input placeholder="我的活动..." />
          </Form.Item>
          <Form.Item label="活动描述" name="description">
            <Input.TextArea placeholder="可选描述..." rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
