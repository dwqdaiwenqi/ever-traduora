import React, { useEffect, useMemo, useState } from 'react';
import { Table, Input, Alert, Space, Button, Segmented, Tag, Select, Switch, Popconfirm, Tooltip, message } from 'antd';
import { useParams } from 'react-router-dom';
import CountryFlag from '../shared/CountryFlag';
import { useProjectsStore } from '../../stores/projects.store';
import { useTranslationsStore } from '../../stores/translations.store';
import { useTermsStore } from '../../stores/terms.store';
import { ProjectRole, isPendingConfirmation } from '../../models';
import type { Locale, Term, Translation } from '../../models';
import ContextView from '../shared/ContextView';
import PageHeader from '../shared/PageHeader';

type Filter = 'all' | 'todo' | 'pending';

/** 简体和繁体的 language 都是 Chinese，所以带上地区区分，例如：Chinese（China） */
const localeLabel = (l: Locale) => (l.region ? `${l.language}（${l.region}）` : l.language);

/** 没有状态标签时占住那一行的高度，让原文列和译文列的输入框对齐 */
function StatusSpacer() {
  return (
    <div aria-hidden style={{ marginTop: 4, fontSize: 12, visibility: 'hidden' }}>
      <Tag bordered={false} style={{ margin: 0 }}>占位</Tag>
    </div>
  );
}

/** 表格里的一个翻译格子：失焦保存；待确认的格子下方显示线上当前值，开发可以直接确认 */
function Cell({
  translation,
  readOnly,
  canConfirm,
  onSave,
  onConfirm,
  reserveStatus,
}: {
  translation?: Translation;
  readOnly: boolean;
  canConfirm: boolean;
  onSave: (v: string) => void;
  onConfirm: () => void;
  reserveStatus?: boolean;
}) {
  const initial = translation?.value ?? '';
  const [val, setVal] = useState(initial);
  useEffect(() => setVal(initial), [initial]);
  const pending = isPendingConfirmation(translation);

  return (
    <div>
      <Input.TextArea
        value={val}
        readOnly={readOnly}
        autoSize={{ minRows: 1, maxRows: 6 }}
        placeholder={readOnly ? '' : '待翻译'}
        style={pending ? { borderColor: '#ff8800', background: '#fffaf0' } : undefined}
        onChange={e => setVal(e.target.value)}
        onBlur={() => {
          if (val !== initial) onSave(val);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            (e.target as HTMLTextAreaElement).blur();
          }
        }}
      />
      {!pending && !initial.trim() && (
        <div style={{ marginTop: 4, fontSize: 12 }}>
          <Tag bordered={false} style={{ margin: 0 }}>待填写</Tag>
        </div>
      )}
      {reserveStatus && !pending && initial.trim() && <StatusSpacer />}
      {pending && (
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <Tag color="orange" bordered={false} style={{ margin: 0 }}>待确认</Tag>
          <Tooltip title={`线上当前：${translation?.confirmedValue || '（无，使用兜底文案）'}`}>
            {
              translation?.confirmedValue && <span style={{ color: 'var(--tr-text-tertiary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                线上：{translation?.confirmedValue || '（无）'}
              </span>
            }
          </Tooltip>
          {canConfirm && (
            <Button size="small" type="primary" onClick={onConfirm}>确认</Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 对照翻译：像飞书表格一样，左边是国服原文，每种语言一列，直接对着原文填写。
 * key 是前端起的内部名字，可读性不强，所以只作为小号灰字显示，也可以隐藏。
 */
export default function TranslationMatrix() {
  const { activityId } = useParams<{ activityId: string }>();
  const { currentProject, refreshProjectStats } = useProjectsStore();
  const { projectLocales, translations, errorMessage, getProjectLocales, getTranslations, updateTranslation, confirmTranslations, clearMessages } =
    useTranslationsStore();
  const { terms, getTerms } = useTermsStore();

  const readOnly = currentProject?.role === ProjectRole.Viewer;
  const canConfirm = currentProject?.role === ProjectRole.Admin;

  const [sourceCode, setSourceCode] = useState<string>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [showKey, setShowKey] = useState(true);
  const [pageSize, setPageSize] = useState(100);
  const [loading, setLoading] = useState(false);

  const loadAll = async (activityId: string) => {
    setLoading(true);
    try {
      await Promise.all([getProjectLocales(activityId), getTerms(activityId)]);
      const locales = useTranslationsStore.getState().projectLocales;
      await Promise.all(locales.map(pl => getTranslations(activityId, pl.locale.code)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentProject) loadAll(currentProject.id);
    return () => clearMessages();
  }, [currentProject?.id]);

  // 默认以国服（zh_CN）作为参照语言，没有的话用第一个语言
  useEffect(() => {
    if (!sourceCode && projectLocales.length > 0) {
      setSourceCode((projectLocales.find(pl => pl.locale.code.startsWith('zh_CN')) ?? projectLocales[0]).locale.code);
    }
  }, [projectLocales, sourceCode]);

  const allCodes = projectLocales.map(pl => pl.locale.code);
  const targets = projectLocales.filter(pl => pl.locale.code !== sourceCode).map(pl => pl.locale);
  const sourceLocale = projectLocales.find(pl => pl.locale.code === sourceCode)?.locale;

  // trMap[语言][termId] = Translation
  const trMap = useMemo(() => {
    const m: Record<string, Record<string, Translation>> = {};
    for (const [code, list] of Object.entries(translations)) {
      m[code] = {};
      list.forEach(t => (m[code][t.termId] = t));
    }
    return m;
  }, [translations]);

  const get = (code: string, termId: string) => trMap[code]?.[termId];
  const isEmpty = (code: string, termId: string) => (get(code, termId)?.value ?? '') === '';

  const pendingItemsOf = (code: string) =>
    terms.filter(t => isPendingConfirmation(get(code, t.id))).map(t => ({ termId: t.id, value: get(code, t.id)!.value }));

  const totalPending = targets.reduce((n, l) => n + pendingItemsOf(l.code).length, 0);
  // 有任何一个语言（包括原文）还是空的，就算未填写
  const todoRows = terms.filter(t => allCodes.some(code => isEmpty(code, t.id))).length;

  const keyword = search.trim().toLowerCase();
  const rows = terms.filter(t => {
    if (filter === 'todo' && !allCodes.some(code => isEmpty(code, t.id))) return false;
    if (filter === 'pending' && !targets.some(l => isPendingConfirmation(get(l.code, t.id)))) return false;
    if (!keyword) return true;
    return (
      t.value.toLowerCase().includes(keyword) ||
      (sourceCode ? (get(sourceCode, t.id)?.value ?? '').toLowerCase().includes(keyword) : false) ||
      targets.some(l => (get(l.code, t.id)?.value ?? '').toLowerCase().includes(keyword))
    );
  });

  const handleSave = async (code: string, termId: string, value: string) => {
    if (!currentProject) return;
    await updateTranslation(currentProject.id, code, termId, value);
    refreshProjectStats();
  };

  const handleConfirm = async (code: string, items: { termId: string; value: string }[]) => {
    if (!currentProject || items.length === 0) return;
    try {
      const r = await confirmTranslations(currentProject.id, code, items);
      if (r.skipped > 0) message.warning(`已确认 ${r.confirmed} 条；${r.skipped} 条在你确认前被运营修改过，请重新查看后再确认`);
      else message.success(`已确认 ${r.confirmed} 条，已生效`);
    } catch {}
  };

  const localeTitle = (l: Locale) => {
    const pendingCount = pendingItemsOf(l.code).length;
    return (
      <div>
        <Space size={6}>
          <CountryFlag locale={l} />
          <span>{localeLabel(l)}</span>
          {pendingCount > 0 && <Tag color="orange" bordered={false} style={{ margin: 0 }}>待确认 {pendingCount}</Tag>}
        </Space>
        {canConfirm && pendingCount > 0 && (
          <Popconfirm
            title={`确认「${localeLabel(l)}」全部 ${pendingCount} 条待确认的翻译？`}
            description="确认后立即对外生效。"
            okText="确认"
            cancelText="取消"
            onConfirm={() => handleConfirm(l.code, pendingItemsOf(l.code))}
          >
            <Button size="small" type="link" style={{ padding: 0, marginLeft: 4 }}>确认本列</Button>
          </Popconfirm>
        )}
      </div>
    );
  };

  const columns = [
    // 备注（文字 + 截图）始终显示，运营翻译时要靠它判断这个词条出现在哪里；key 可以用开关隐藏
    {
      title: showKey ? 'Key / 备注' : '备注',
      key: 'key',
      width: 180,
      fixed: 'left' as const,
      render: (_: any, t: Term) => (
        <div style={{ color: 'var(--tr-text-tertiary)', fontSize: 12, wordBreak: 'break-all' }}>
          {showKey && <div>{t.value}</div>}
          <ContextView context={t.context} activityId={currentProject!.id} size={96} style={{ color: 'var(--tr-text-secondary)', marginTop: showKey ? 4 : 0 }} />
        </div>
      ),
    },
    {
      title: sourceLocale ? (
        <Space size={6}>
          <CountryFlag locale={sourceLocale} />
          <span>{localeLabel(sourceLocale)} · 原文</span>
        </Space>
      ) : '原文',
      key: 'source',
      width: 240,
      fixed: 'left' as const,
      onCell: () => ({ style: { background: 'var(--tr-bg-layout)' } }),
      render: (_: any, t: Term) =>
        sourceCode && canConfirm ? (
          // 开发（admin）可以直接修改原文，修改后立即生效
          <Cell translation={get(sourceCode, t.id)} readOnly={false} canConfirm={false} onSave={v => handleSave(sourceCode, t.id, v)} onConfirm={() => {}} reserveStatus />
        ) : (
          <div>
            <div style={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>{(sourceCode && get(sourceCode, t.id)?.value) || <span style={{ color: 'var(--tr-text-tertiary)' }}>（原文为空）</span>}</div>
            <StatusSpacer />
          </div>
        ),
    },
    ...targets.map(l => ({
      title: localeTitle(l),
      key: l.code,
      width: 260,
      render: (_: any, t: Term) => (
        <Cell
          translation={get(l.code, t.id)}
          readOnly={readOnly}
          canConfirm={canConfirm}
          onSave={v => handleSave(l.code, t.id, v)}
          onConfirm={() => handleConfirm(l.code, [{ termId: t.id, value: get(l.code, t.id)!.value }])}
        />
      ),
    })),
  ];

  return (
    <div>
      <PageHeader
        title="对照翻译"
        description="左边是原文，右边每种服一列，直接对着原文填写"
        extra={<Input.Search placeholder="搜索原文、翻译或 Key..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} allowClear />}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <Segmented
          value={filter}
          onChange={v => setFilter(v as Filter)}
          options={[
            { label: `全部 (${terms.length})`, value: 'all' },
            { label: `有未填写 (${todoRows})`, value: 'todo' },
            { label: `有待确认 (${totalPending})`, value: 'pending' },
          ]}
        />
        <Space size={16} wrap>
          <Space size={8}>
            <span style={{ color: 'var(--tr-text-tertiary)' }}>原文语言</span>
            <Select
              value={sourceCode}
              onChange={setSourceCode}
              style={{ width: 180 }}
              options={projectLocales.map(pl => ({ value: pl.locale.code, label: localeLabel(pl.locale) }))}
            />
          </Space>
          <Space size={8}>
            <Switch size="small" checked={showKey} onChange={setShowKey} />
            <span style={{ color: 'var(--tr-text-tertiary)' }}>显示 Key</span>
          </Space>
        </Space>
      </div>

      {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
      <Table
        dataSource={rows}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        scroll={{ x: 'max-content' }}
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: [50, 100, 200, 500],
          showTotal: n => `共 ${n} 条`,
          onShowSizeChange: (_, size) => setPageSize(size),
        }}
      />
    </div>
  );
}
