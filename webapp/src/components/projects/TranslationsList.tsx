import React, { useEffect, useState, useMemo } from 'react';
import { Table, Input, Alert, Space, Button, Progress, Segmented, Tag } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import CountryFlag from '../shared/CountryFlag';
import { useProjectsStore } from '../../stores/projects.store';
import { useTranslationsStore } from '../../stores/translations.store';
import { useTermsStore } from '../../stores/terms.store';
import type { Term, Translation } from '../../models';

type Filter = 'all' | 'empty' | 'filled';

function TranslationCell({ initialValue, onSave }: { initialValue: string; onSave: (v: string) => void }) {
  const [val, setVal] = useState(initialValue);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  return (
    <Input.TextArea
      value={val}
      status={val === '' ? 'warning' : undefined}
      autoSize={{ minRows: 1, maxRows: 4 }}
      placeholder="未填写，请输入翻译..."
      onChange={e => setVal(e.target.value)}
      onBlur={() => {
        if (val !== initialValue) onSave(val);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          (e.target as HTMLTextAreaElement).blur();
        }
      }}
    />
  );
}

export default function TranslationsList() {
  const { projectId, localeCode } = useParams<{ projectId: string; localeCode: string }>();
  const navigate = useNavigate();
  const { currentProject, refreshProjectStats } = useProjectsStore();
  const { translations, projectLocales, isLoading, errorMessage, getTranslations, updateTranslation, clearMessages } = useTranslationsStore();
  const { terms, getTerms } = useTermsStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [pageSize, setPageSize] = useState(100);

  const locale = projectLocales.find(pl => pl.locale.code === localeCode)?.locale;

  useEffect(() => {
    if (currentProject && localeCode) {
      getTranslations(currentProject.id, localeCode, navigate);
      getTerms(currentProject.id);
    }
    return () => clearMessages();
  }, [currentProject?.id, localeCode]);

  const localeTranslations = localeCode ? (translations[localeCode] || []) : [];
  const translationMap = useMemo(() => {
    const m: Record<string, Translation> = {};
    localeTranslations.forEach(t => { m[t.termId] = t; });
    return m;
  }, [localeTranslations]);

  const isFilled = (termId: string) => (translationMap[termId]?.value ?? '') !== '';

  const total = terms.length;
  const filledCount = terms.filter(t => isFilled(t.id)).length;
  const emptyCount = total - filledCount;
  const percent = total === 0 ? 0 : Math.floor((filledCount / total) * 100);

  const keyword = search.toLowerCase();
  const filtered = terms.filter(t => {
    if (filter === 'empty' && isFilled(t.id)) return false;
    if (filter === 'filled' && !isFilled(t.id)) return false;
    return (
      t.value.toLowerCase().includes(keyword) ||
      (translationMap[t.id]?.value || '').toLowerCase().includes(keyword)
    );
  });

  const handleUpdate = async (termId: string, value: string) => {
    if (!currentProject || !localeCode) return;
    await updateTranslation(currentProject.id, localeCode, termId, value);
    refreshProjectStats();
  };

  const columns = [
    {
      title: '词条',
      dataIndex: 'value',
      key: 'term',
      width: '45%',
      render: (val: string, record: Term) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {val}
            {!isFilled(record.id) && <Tag color="warning" style={{ marginLeft: 8 }}>未填写</Tag>}
          </div>
          {record.context && <div style={{ color: '#888', fontSize: 12 }}>{record.context}</div>}
        </div>
      ),
    },
    {
      title: locale ? (
        <Space>
          <CountryFlag locale={locale} />
          <span>{locale.language} ({locale.code})</span>
        </Space>
      ) : '翻译',
      key: 'translation',
      width: '55%',
      render: (_: any, record: Term) => (
        <TranslationCell
          initialValue={translationMap[record.id]?.value || ''}
          onSave={v => handleUpdate(record.id, v)}
        />
      ),
    },
  ];

  return (
    <div>
      <style>{`.tr-row-empty > td { background: #fffbe6 !important; }`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {locale && <CountryFlag locale={locale} />}
          <h3 style={{ margin: 0 }}>{locale?.language || localeCode}</h3>
        </div>
        <Button onClick={() => navigate(`/projects/${projectId}/translations`)}>
          返回语言列表
        </Button>
      </div>

      <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 8, marginBottom: 12 }}>
        <Progress
          percent={percent}
          status={emptyCount === 0 && total > 0 ? 'success' : 'active'}
          format={p => `${p}%`}
        />
        <div style={{ color: '#888', fontSize: 12 }}>
          共 {total} 条，已填写 {filledCount} 条，
          <span style={{ color: emptyCount > 0 ? '#d48806' : undefined }}>未填写 {emptyCount} 条</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Segmented
          value={filter}
          onChange={v => setFilter(v as Filter)}
          options={[
            { label: `全部 (${total})`, value: 'all' },
            { label: `只看未填写 (${emptyCount})`, value: 'empty' },
            { label: `只看已填写 (${filledCount})`, value: 'filled' },
          ]}
        />
        <Input.Search
          placeholder="搜索词条或翻译..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 240 }}
          allowClear
        />
      </div>

      {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        rowClassName={record => (isFilled(record.id) ? '' : 'tr-row-empty')}
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: [50, 100, 200, 500],
          showTotal: n => `共 ${n} 条`,
          onShowSizeChange: (_, size) => setPageSize(size),
        }}
        size="small"
      />
    </div>
  );
}
