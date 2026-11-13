import React from 'react';
import { Tag } from 'antd';
import type { Label } from '../../models';

function textColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? '#000' : '#fff';
}

interface Props {
  label: Label;
  onClose?: (label: Label) => void;
  closable?: boolean;
}

export default function LabelTag({ label, onClose, closable }: Props) {
  return (
    <Tag
      color={label.color}
      style={{ color: textColor(label.color), border: 'none', margin: '2px' }}
      closable={closable}
      onClose={onClose ? () => onClose(label) : undefined}
    >
      {label.value}
    </Tag>
  );
}
