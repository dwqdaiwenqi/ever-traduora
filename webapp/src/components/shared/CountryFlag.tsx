import React from 'react';
import type { Locale } from '../../models';

function localeIconCode(code: string): string {
  const parts = code.split('-');
  return (parts[1] || parts[0]).toLowerCase();
}

interface Props {
  locale: Locale;
}

export default function CountryFlag({ locale }: Props) {
  return <span className={`flag-icon flag-icon-squared flag-icon-${localeIconCode(locale.code)}`} />;
}
