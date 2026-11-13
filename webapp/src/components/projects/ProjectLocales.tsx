import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Popconfirm, Progress, Alert, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import CountryFlag from '../shared/CountryFlag';
import SelectLocale from '../shared/SelectLocale';
import { useProjectsStore } from '../../stores/projects.store';
import { useTranslationsStore } from '../../stores/translations.store';
import type { ProjectLocale, Locale } from '../../models';

export default function ProjectLocales() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, currentProjectStats, refreshProjectStats } = useProjectsStore();
  const { projectLocales, knownLocales, isLoading, errorMessage, getProjectLocales, getKnownLocales, addProjectLocale, deleteProjectLocale, clearMessages } = useTranslationsStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState<Locale>();

  useEffect(() => {
    if (currentProject) {
      getProjectLocales(currentProject.id);
      getKnownLocales();
    }
    return () => clearMessages();
  }, [currentProject?.id]);

  const existingCodes = new Set(projectLocales.map(pl => pl.locale.code));
  const availableLocales = knownLocales.filter(l => !existingCodes.has(l.code));

  const handleAdd = async () => {
    if (!currentProject || !selectedLocale) return;
    try {
      await addProjectLocale(currentProject.id, selectedLocale.code);
      await refreshProjectStats();
      setAddModalOpen(false);
      setSelectedLocale(undefined);
    } catch {}
  };

  const handleDelete = async (localeCode: string) => {
    if (!currentProject) return;
    await deleteProjectLocale(currentProject.id, localeCode);
    await refreshProjectStats();
  };

  const getLocaleStats = (code: string) => currentProjectStats?.localeStats?.[code];

  const columns = [
    {
      title: '语言',
      key: 'locale',
      render: (_: any, record: ProjectLocale) => (
        <Space>
          <CountryFlag locale={record.locale} />
          <span>{record.locale.language}</span>
          <span style={{ color: '#888', fontSize: 12 }}>({record.locale.code})</span>
        </Space>
      ),
    },
    {
      title: '翻译进度',
      key: 'progress',
      render: (_: any, record: ProjectLocale) => {
        const stats = getLocaleStats(record.locale.code);
        if (!stats) return null;
        return (
          <Space>
            <Progress percent={Math.round(stats.progress * 100)} size="small" style={{ width: 120 }} />
            <span style={{ fontSize: 12, color: '#888' }}>{stats.translated}/{stats.total}</span>
          </Space>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ProjectLocale) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/projects/${projectId}/translations/${record.locale.code}`)}>
            查看翻译
          </Button>
          <Popconfirm
            title="确定删除此语言？所有对应翻译将被删除。"
            onConfirm={() => handleDelete(record.locale.code)}
            okText="删除"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>语言</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>添加语言</Button>
      </div>
      {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
      <Table
        dataSource={projectLocales}
        columns={columns}
        rowKey={r => r.locale.code}
        loading={isLoading}
        pagination={false}
      />
      <Modal
        title="添加语言"
        open={addModalOpen}
        onCancel={() => { setAddModalOpen(false); setSelectedLocale(undefined); }}
        onOk={handleAdd}
        okText="添加"
        cancelText="取消"
        okButtonProps={{ disabled: !selectedLocale }}
      >
        <SelectLocale
          locales={availableLocales}
          value={selectedLocale}
          onChange={setSelectedLocale}
          style={{ width: '100%' }}
        />
      </Modal>
    </div>
  );
}
