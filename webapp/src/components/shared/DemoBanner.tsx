import React from 'react';

const isDemo = import.meta.env.VITE_DEMO === 'true';
const homepage = import.meta.env.VITE_HOMEPAGE || 'https://traduora.co';

export default function DemoBanner() {
  if (!isDemo) return null;
  return (
    <div
      role="note"
      data-testid="demo-banner"
      style={{ background: '#fffbe6', borderBottom: '1px solid #ffe58f', textAlign: 'center', padding: '4px 12px', fontSize: 13 }}
    >
      你正在使用演示账号。觉得我们的软件有用吗？{' '}
      <a href={homepage} style={{ fontWeight: 'bold' }}>点击此处获取 Traduora，免费开始使用！</a>
    </div>
  );
}
