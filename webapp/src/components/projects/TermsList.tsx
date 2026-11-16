import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Modal, Form, Space, Popconfirm, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useProjectsStore } from '../../stores/projects.store';
import { useTermsStore } from '../../stores/terms.store';
import { ProjectRole } from '../../models';
import type { Term } from '../../models';
import ContextEditor from '../shared/ContextEditor';
import { parseContext } from '../../utils/term-context';

export default function TermsList() {
  const { currentProject } = useProjectsStore();
  const { terms, isLoading, errorMessage, getTerms, createTerm, updateTerm, deleteTerm, clearMessages } = useTermsStore();
  const readOnly = currentProject?.role === ProjectRole.Viewer;
  const [search, setSearch] = useState('');
  const [newTermModal, setNewTermModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (currentProject) {
      getTerms(currentProject.id);
    }
    return () => clearMessages();
  }, [currentProject?.id]);

  const filtered = terms.filter(t =>
    t.value.toLowerCase().includes(search.toLowerCase()) ||
    parseContext(t.context).text.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (values: { value: string; context?: string }) => {
    if (!currentProject) return;
    try {
      await createTerm(currentProject.id, values.value, values.context);
      setNewTermModal(false);
      form.resetFields();
    } catch {}
  };

  const handleDelete = async (termId: string) => {
    if (!currentProject) return;
    await deleteTerm(currentProject.id, termId);
  };

  const columns = [
    {
      title: '词条',
      dataIndex: 'value',
      key: 'value',
      render: (val: string, record: Term) => (
        <Input
          defaultValue={val}
          variant="borderless"
          readOnly={readOnly}
          onBlur={e => {
            if (e.target.value !== val && currentProject) {
              updateTerm(currentProject.id, record.id, e.target.value, record.context ?? undefined);
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
        />
      ),
    },
    {
      title: '备注',
      dataIndex: 'context',
      key: 'context',
      render: (val: string | null, record: Term) => (
        <ContextEditor
          projectId={currentProject!.id}
          value={val}
          readOnly={readOnly}
          onCommit={v => {
            if (v !== (val || '')) updateTerm(currentProject!.id, record.id, record.value, v || undefined);
          }}
        />
      ),
    },
    ...(readOnly ? [] : [{
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: Term) => (
        <Popconfirm title="确定删除此词条？" onConfirm={() => handleDelete(record.id)} okText="删除" cancelText="取消">
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    }]),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>词条列表</h3>
        <Space>
          <Input.Search placeholder="搜索词条..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240 }} />
          {!readOnly && <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewTermModal(true)}>新增词条</Button>}
        </Space>
      </div>
      {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 50, showSizeChanger: false }}
        size="small"
      />
      <Modal
        title="新增词条"
        open={newTermModal}
        onCancel={() => { setNewTermModal(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="添加"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="词条" name="value" rules={[{ required: true, message: '请输入词条内容' }]}>
            <Input placeholder="key.name 或 Some text..." />
          </Form.Item>
          <Form.Item label="备注（可选）" name="context">
            <ContextEditor projectId={currentProject!.id} placeholder="该词条的说明或备注，可直接粘贴截图..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
