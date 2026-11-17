import React from 'react';
import icon from '../../assets/img/icon1.png';

interface LogoProps {
  style?: React.CSSProperties;
}

export default function Logo({ style }: LogoProps) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4em', fontSize: 20, ...style }}>
      <img src={icon} alt="LocaHub" style={{ width: '1.8em', height: '1.8em', objectFit: 'contain', display: 'block' }} />
      <span
        style={{
          fontWeight: 700,
          letterSpacing: '0.02em',
          lineHeight: 1,
          background: 'linear-gradient(90deg, var(--tr-primary), #6c8dff)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          userSelect: 'none',
        }}
      >
        LocaHub
      </span>
    </div>
  );
}
