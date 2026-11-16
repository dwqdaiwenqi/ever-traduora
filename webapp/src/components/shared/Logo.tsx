import React from 'react';

interface LogoProps {
  style?: React.CSSProperties;
  /** 在深色背景上使用白色文字 */
  light?: boolean;
}

export default function Logo({ style, light }: LogoProps) {
  const color = light ? '#fff' : 'var(--tr-primary)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 18, letterSpacing: 0.3, color, ...style }}>
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: light ? 'rgba(255,255,255,.2)' : 'var(--tr-primary)',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        T
      </span>
      traduora
    </span>
  );
}
