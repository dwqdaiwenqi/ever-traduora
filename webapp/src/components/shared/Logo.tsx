import React from 'react';

interface LogoProps {
  style?: React.CSSProperties;
}

export default function Logo({ style }: LogoProps) {
  return (
    <span style={{ fontFamily: 'serif', fontWeight: 'bold', fontSize: 22, color: '#fff', letterSpacing: 1, ...style }}>
      traduora
    </span>
  );
}
