import React from 'react';
import { Select } from 'antd';
import LabelTag from './LabelTag';
import type { Label } from '../../models';

interface Props {
  labels: Label[];
  value?: Label;
  onChange?: (label: Label) => void;
  style?: React.CSSProperties;
}

export default function SelectLabel({ labels, value, onChange, style }: Props) {
  return (
    <Select
      style={{ minWidth: 160, ...style }}
      placeholder="选择标签"
      value={value?.id}
      onChange={id => {
        const label = labels.find(l => l.id === id);
        if (label && onChange) onChange(label);
      }}
      options={labels.map(l => ({
        value: l.id,
        label: <LabelTag label={l} />,
      }))}
    />
  );
}
