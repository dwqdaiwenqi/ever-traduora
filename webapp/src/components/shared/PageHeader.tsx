import React from 'react';

interface Props {
  title: React.ReactNode;
  /** 标题下面的一行说明 */
  description?: React.ReactNode;
  /** 右侧的操作区（按钮、搜索框等） */
  extra?: React.ReactNode;
}

/** 所有内容页统一的标题栏：左边标题和说明，右边操作 */
export default function PageHeader({ title, description, extra }: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        <h3 className="tr-page-title">{title}</h3>
        {description && <div style={{ marginTop: 2, color: 'var(--tr-text-tertiary)', fontSize: 13 }}>{description}</div>}
      </div>
      {extra && <div style={{ flexShrink: 0 }}>{extra}</div>}
    </div>
  );
}
