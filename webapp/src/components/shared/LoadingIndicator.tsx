import React from 'react';
import { Spin } from 'antd';

interface Props {
  size?: 'small' | 'default' | 'large';
  style?: React.CSSProperties;
}

export default function LoadingIndicator({ size = 'default', style }: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 32, ...style }}>
      <Spin size={size} />
    </div>
  );
}
