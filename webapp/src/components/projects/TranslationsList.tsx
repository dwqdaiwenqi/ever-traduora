import React, { useEffect, useState, useMemo } from 'react';
import { Table, Input, Alert, Space, Button, Progress, Segmented, Tag, Popconfirm, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import CountryFlag from '../shared/CountryFlag';
import { useProjectsStore } from '../../stores/projects.store';
import { useTranslationsStore } from '../../stores/translations.store';
import { useTermsStore } from '../../stores/terms.store';
import { ProjectRole, isPendingConfirmation } from '../../models';
import type { Term, Translation } from '../../models';
import ContextView from '../shared/ContextView';
import PageHeader from '../shared/PageHeader';

type Filter = 'all' | 'empty' | 'filled' | 'pending';

function TranslationCell({ initialValue, onSave, readOnly }: { initialValue: string; onSave: (v: string) => void; readOnly?: boolean }) {
  const [val, setVal] = useState(initialValue);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  return (
    <Input.TextArea
      value={val}
      readOnly={readOnly}
      autoSize={{ minRows: 1, maxRows: 4 }}
      placeholder={readOnly ? '未填写' : '未填写，请输入翻译...'}
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
  const { activityId, localeCode } = useParams<{ activityId: string; localeCode: string }>();
  const navigate = useNavigate();
  const { currentProject, refreshProjectStats } = useProjectsStore();
  const { translations, projectLocales, isLoading, errorMessage, getTranslations, getProjectLocales, updateTranslation, confirmTranslations, clearMessages } = useTranslationsStore();
  const { terms, getTerms } = useTermsStore();
  const readOnly = currentProject?.role === ProjectRole.Viewer;
  // 只有 admin（开发）能确认
  const canConfirm = currentProject?.role === ProjectRole.Admin;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [pageSize, setPageSize] = useState(100);

  const locale = projectLocales.find(pl => pl.locale.code === localeCode)?.locale;

  useEffect(() => {
    if (currentProject && localeCode) {
      getTranslations(currentProject.id, localeCode, navigate);
      if (projectLocales.length === 0) getProjectLocales(currentProject.id);
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
  const pendingItems = terms
    .filter(t => isPendingConfirmation(translationMap[t.id]))
    .map(t => ({ termId: t.id, value: translationMap[t.id].value }));
  const pendingCount = pendingItems.length;
  const percent = total === 0 ? 0 : Math.floor((filledCount / total) * 100);

  const keyword = search.toLowerCase();
  const filtered = terms.filter(t => {
    if (filter === 'empty' && isFilled(t.id)) return false;
    if (filter === 'filled' && !isFilled(t.id)) return false;
    if (filter === 'pending' && !isPendingConfirmation(translationMap[t.id])) return false;
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

  const handleConfirm = async (items: { termId: string; value: string }[]) => {
    if (!currentProject || !localeCode || items.length === 0) return;
    try {
      const result = await confirmTranslations(currentProject.id, localeCode, items);
      if (result.skipped > 0) {
        message.warning(`已确认 ${result.confirmed} 条；${result.skipped} 条在你确认前被运营修改过，请重新查看后再确认`);
      } else {
        message.success(`已确认 ${result.confirmed} 条，已生效`);
      }
    } catch {}
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
            {!isFilled(record.id) && <Tag color="warning" bordered={false} style={{ marginLeft: 8 }}>未填写</Tag>}
          </div>
          <ContextView context={record.context} activityId={currentProject!.id} style={{ color: 'var(--tr-text-tertiary)', fontSize: 12 }} />
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
        <div>
          <TranslationCell
            initialValue={translationMap[record.id]?.value || ''}
            onSave={v => handleUpdate(record.id, v)}
            readOnly={readOnly}
          />
          {isPendingConfirmation(translationMap[record.id]) && (
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <Tag color="orange" bordered={false} style={{ margin: 0 }}>待开发确认</Tag>
              <span style={{ color: 'var(--tr-text-tertiary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                线上当前：{translationMap[record.id]?.confirmedValue || '（无，使用兜底文案）'}
              </span>
              {canConfirm && (
                <Button
                  size="small"
                  type="primary"
                  onClick={() => handleConfirm([{ termId: record.id, value: translationMap[record.id].value }])}
                >
                  确认
                </Button>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <style>{`.tr-row-empty > td { background: #fffdf7 !important; }`}</style>
      <PageHeader
        title={
          <Space size={8}>
            {locale && <CountryFlag locale={locale} />}
            <span>{locale?.language || localeCode}</span>
          </Space>
        }
        extra={<Button onClick={() => navigate(`/activities/${activityId}/translations`)}>返回语言列表</Button>}
      />

      <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 10, marginBottom: 12, border: '1px solid var(--tr-border-light)' }}>
        <Progress
          percent={percent}
          status={emptyCount === 0 && total > 0 ? 'success' : 'active'}
          format={p => `${p}%`}
        />
        <div style={{ color: 'var(--tr-text-tertiary)', fontSize: 12 }}>
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
            { label: `待确认 (${pendingCount})`, value: 'pending' },
          ]}
        />
        <Space>
          {canConfirm && (
            <Popconfirm
              title={`确认全部 ${pendingCount} 条待确认的翻译？`}
              description="确认后立即对外生效。"
              okText="确认"
              cancelText="取消"
              disabled={pendingCount === 0}
              onConfirm={() => handleConfirm(pendingItems)}
            >
              <Button type="primary" disabled={pendingCount === 0}>
                批量确认 ({pendingCount})
              </Button>
            </Popconfirm>
          )}
          <Input.Search
            placeholder="搜索词条或翻译..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
        </Space>
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
