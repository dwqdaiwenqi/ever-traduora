import React, { useState, useRef, useEffect } from 'react';
import { Input } from 'antd';

const { TextArea } = Input;

interface Props {
  value: string;
  readOnly?: boolean;
  placeholder?: string;
  onSave?: (value: string) => void;
  style?: React.CSSProperties;
}

export default function EditableText({ value, readOnly = false, placeholder, onSave, style }: Props) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  const save = () => {
    setEditing(false);
    if (onSave && localValue !== value) onSave(localValue);
  };

  return (
    <TextArea
      ref={ref}
      value={localValue}
      readOnly={readOnly}
      placeholder={placeholder}
      autoSize={{ minRows: 1 }}
      style={{ resize: 'none', ...style }}
      onFocus={() => !readOnly && setEditing(true)}
      onBlur={save}
      onChange={e => setLocalValue(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          save();
        }
        if (e.key === 'Escape') {
          setLocalValue(value);
          setEditing(false);
        }
      }}
      className={editing ? 'editing' : ''}
    />
  );
}
