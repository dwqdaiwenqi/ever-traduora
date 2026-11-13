import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, Alert, Modal, Form, Input, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useProjectsStore } from '../../stores/projects.store';
import { useProjectClientsStore } from '../../stores/project-clients.store';
import type { ProjectClient } from '../../models';

const { Text } = Typography;

export default function ApiClientsOverview() {
  const { currentProject } = useProjectsStore();
  const { clients, isLoading, errorMessage, getProjectClients, addProjectClient, removeProjectClient, clearMessages } = useProjectClientsStore();
  const [addModal, setAddModal] = useState(false);
  const [newClientSecret, setNewClientSecret] = useState<{ id: string; secret: string } | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (currentProject) getProjectClients(currentProject.id);
    return () => clearMessages();
  }, [currentProject?.id]);

  const handleAdd = async (values: { name: string }) => {
    if (!currentProject) return;
    try {
      const client = await addProjectClient(currentProject.id, values.name);
      if (client.secret) {
        setNewClientSecret({ id: client.id, secret: client.secret });
        setAddModal(false);
        form.resetFields();
      }
    } catch {}
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    else {
      const handler = (e: ClipboardEvent) => { e.clipboardData?.setData('text/plain', text); e.preventDefault(); document.removeEventListener('copy', handler); };
      document.addEventListener('copy', handler);
      document.execCommand('copy');
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '客户端 ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Space>
          <Text copyable={{ text: id }} style={{ fontFamily: 'monospace', fontSize: 12 }}>{id.substring(0, 8)}...</Text>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ProjectClient) => (
        <Popconfirm
          title="确定撤销此 API 客户端的访问权限？"
          onConfirm={() => currentProject && removeProjectClient(currentProject.id, record.id)}
          okText="撤销"
          cancelText="取消"
        >
          <Button size="small" danger>撤销访问</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>API 客户端</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>添加客户端</Button>
      </div>
      {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
      <Table dataSource={clients} columns={columns} rowKey="id" loading={isLoading} pagination={false} />

      <Modal
        title="添加 API 客户端"
        open={addModal}
        onCancel={() => { setAddModal(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item label="名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="用于标识此 API 客户端的名称..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="API 客户端已创建"
        open={!!newClientSecret}
        onCancel={() => setNewClientSecret(null)}
        footer={[<Button key="close" type="primary" onClick={() => setNewClientSecret(null)}>完成</Button>]}
      >
        {newClientSecret && (
          <div>
            <Alert type="warning" message="请立即保存客户端密钥，它只显示一次！" style={{ marginBottom: 16 }} />
            <Form layout="vertical">
              <Form.Item label="客户端 ID">
                <Space.Compact style={{ width: '100%' }}>
                  <Input value={newClientSecret.id} readOnly style={{ fontFamily: 'monospace' }} />
                  <Button onClick={() => copyToClipboard(newClientSecret.id)}>复制</Button>
                </Space.Compact>
              </Form.Item>
              <Form.Item label="客户端密钥">
                <Space.Compact style={{ width: '100%' }}>
                  <Input value={newClientSecret.secret} readOnly style={{ fontFamily: 'monospace' }} />
                  <Button onClick={() => copyToClipboard(newClientSecret.secret)}>复制</Button>
                </Space.Compact>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}
