import React from 'react';
import { Select } from 'antd';
import CountryFlag from './CountryFlag';
import type { Locale } from '../../models';

interface Props {
  locales: Locale[];
  value?: Locale;
  onChange?: (locale: Locale) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export default function SelectLocale({ locales, value, onChange, placeholder = '选择语言', style }: Props) {
  return (
    <Select
      style={{ minWidth: 200, ...style }}
      placeholder={placeholder}
      value={value?.code}
      onChange={code => {
        const locale = locales.find(l => l.code === code);
        if (locale && onChange) onChange(locale);
      }}
      showSearch
      filterOption={(input, option) => {
        const locale = locales.find(l => l.code === option?.value);
        if (!locale) return false;
        return (locale.code + ' ' + locale.language + ' ' + locale.region).toLowerCase().includes(input.toLowerCase());
      }}
      options={locales.map(l => ({
        value: l.code,
        label: (
          <span>
            <CountryFlag locale={l} />
            {' '}{l.language} ({l.code})
          </span>
        ),
      }))}
    />
  );
}
