import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, Alert, Modal, Form, Input, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useProjectsStore } from '../../stores/projects.store';
import { useProjectClientsStore } from '../../stores/project-clients.store';
import type { ProjectClient } from '../../models';
import PageHeader from '../shared/PageHeader';

const { Text } = Typography;

export default function ApiClientsOverview() {
  const { currentProject } = useProjectsStore();
  const { clients, isLoading, errorMessage, getProjectClients, addProjectClient, rotateProjectClientSecret, removeProjectClient, clearMessages } = useProjectClientsStore();
  const [newClientSecret, setNewClientSecret] = useState<{ id: string; secret: string } | null>(null);

  useEffect(() => {
    if (currentProject) getProjectClients(currentProject.id);
    return () => clearMessages();
  }, [currentProject?.id]);

  const handleGenerate = async () => {
    if (!currentProject) return;
    try {
      const client = await addProjectClient(currentProject.id, 'default');
      if (client.secret) setNewClientSecret({ id: client.id, secret: client.secret });
    } catch {}
  };

  const handleRotate = async (clientId: string) => {
    if (!currentProject) return;
    try {
      const client = await rotateProjectClientSecret(currentProject.id, clientId);
      if (client.secret) setNewClientSecret({ id: client.id, secret: client.secret });
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
    {
      title: '客户端 ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text copyable={{ text: id }} style={{ fontFamily: 'monospace', fontSize: 12 }}>{id}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ProjectClient) => (
        <Space>
          <Popconfirm
            title="确定重置密钥？"
            description="会生成新密钥，旧密钥立即失效，正在使用它的脚本需要换成新密钥"
            onConfirm={() => handleRotate(record.id)}
            okText="重置"
            cancelText="取消"
          >
            <Button size="small">重置密钥</Button>
          </Popconfirm>
          <Popconfirm
            title="确定撤销此凭证？撤销后使用它的脚本将无法访问，之后可以重新生成"
            onConfirm={() => currentProject && removeProjectClient(currentProject.id, record.id)}
            okText="撤销"
            cancelText="取消"
          >
            <Button size="small" danger>撤销访问</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="API 凭证"
        description="给脚本批量导入导出用的访问凭证，每个活动一个；业务前端读取译文不需要它"
        extra={clients.length === 0 && <Button type="primary" icon={<PlusOutlined />} loading={isLoading} onClick={handleGenerate}>生成凭证</Button>}
      />
      {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
      <Table dataSource={clients} columns={columns} rowKey="id" loading={isLoading} pagination={false} />

      <Modal
        title="请保存凭证"
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
