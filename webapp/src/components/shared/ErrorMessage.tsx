import React from 'react';
import { Alert } from 'antd';

interface Props {
  message?: string;
}

export default function ErrorMessage({ message }: Props) {
  if (!message) return null;
  return <Alert type="error" message={message} showIcon style={{ marginBottom: 16 }} />;
}
