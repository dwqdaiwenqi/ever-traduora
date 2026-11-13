import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Alert, ColorPicker } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { sample } from 'lodash';
import { useProjectsStore } from '../../stores/projects.store';
import { useProjectLabelsStore } from '../../stores/project-labels.store';
import LabelTag from '../shared/LabelTag';
import { TAG_COLORS } from '../../models';
import type { Label } from '../../models';

export default function LabelsList() {
  const { currentProject } = useProjectsStore();
  const { labels, isLoading, errorMessage, getProjectLabels, createProjectLabel, updateProjectLabel, removeProjectLabel, clearMessages } = useProjectLabelsStore();
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<Label | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    if (currentProject) getProjectLabels(currentProject.id);
    return () => clearMessages();
  }, [currentProject?.id]);

  const randomColor = () => sample(TAG_COLORS) || '#304D6D';

  const handleCreate = async (values: { value: string; color: string }) => {
    if (!currentProject) return;
    try {
      await createProjectLabel(currentProject.id, values.value, values.color);
      setCreateModal(false);
      createForm.resetFields();
    } catch {}
  };

  const handleEdit = async (values: { value: string; color: string }) => {
    if (!currentProject || !editModal) return;
    try {
      await updateProjectLabel(currentProject.id, editModal.id, values.value, values.color);
      setEditModal(null);
      editForm.resetFields();
    } catch {}
  };

  const openEdit = (label: Label) => {
    setEditModal(label);
    editForm.setFieldsValue({ value: label.value, color: label.color });
  };

  const columns = [
    {
      title: '标签',
      key: 'label',
      render: (_: any, record: Label) => <LabelTag label={record} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Label) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="确定删除此标签？" onConfirm={() => currentProject && removeProjectLabel(currentProject.id, record.id)} okText="删除" cancelText="取消">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const LabelForm = ({ form, onFinish, initialColor }: { form: any; onFinish: (v: any) => void; initialColor?: string }) => (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item label="标签名称" name="value" rules={[{ required: true }, { max: 30 }, { pattern: /.*[^ ].*/, message: '不能全为空格' }]}>
        <Input placeholder="Bug、UI、核心功能..." />
      </Form.Item>
      <Form.Item label="颜色" name="color" rules={[{ required: true }, { pattern: /^#[A-Fa-f0-9]{6}$/, message: '请输入有效的十六进制颜色' }]}>
        <Input
          placeholder="#304D6D"
          addonAfter={
            <Button size="small" type="link" onClick={() => form.setFieldValue('color', randomColor())}>随机</Button>
          }
        />
      </Form.Item>
    </Form>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>标签</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.setFieldValue('color', randomColor()); setCreateModal(true); }}>
          新建标签
        </Button>
      </div>
      {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
      <Table dataSource={labels} columns={columns} rowKey="id" loading={isLoading} pagination={false} />

      <Modal title="新建标签" open={createModal} onCancel={() => { setCreateModal(false); createForm.resetFields(); }} onOk={() => createForm.submit()} okText="创建" cancelText="取消">
        <LabelForm form={createForm} onFinish={handleCreate} />
      </Modal>

      <Modal title="编辑标签" open={!!editModal} onCancel={() => { setEditModal(null); editForm.resetFields(); }} onOk={() => editForm.submit()} okText="保存" cancelText="取消">
        <LabelForm form={editForm} onFinish={handleEdit} />
      </Modal>
    </div>
  );
}
