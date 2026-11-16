import React, { useEffect, useRef, useState } from 'react';
import { Image, Input, message } from 'antd';
import { CloseCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { termsApi, termImageUrl } from '../../api/terms';
import { composeContext, CONTEXT_MAX_LENGTH, parseContext } from '../../utils/term-context';
import { errorToMessage } from '../../utils/api-error';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

interface Props {
  projectId: string;
  /** 完整的备注字符串（文字 + 图片标记） */
  value?: string | null;
  readOnly?: boolean;
  placeholder?: string;
  /** 每次改动（输入文字、添加或删除图片）都会触发，适合放在表单里 */
  onChange?: (value: string) => void;
  /** 文字失焦、添加或删除图片时触发，适合"改完自动保存"的场景 */
  onCommit?: (value: string) => void;
  thumbSize?: number;
}

/**
 * 词条备注编辑器：可以直接 Ctrl/Cmd+V 粘贴截图，也可以点按钮选择图片。
 * 文字和图片分开管理，保存时合成为一个字符串。
 */
export default function ContextEditor({ projectId, value, readOnly, placeholder, onChange, onCommit, thumbSize = 88 }: Props) {
  const parsed = parseContext(value);
  const [text, setText] = useState(parsed.text);
  const [imageIds, setImageIds] = useState(parsed.imageIds);
  const [uploading, setUploading] = useState(0);
  // 上传是异步的：用 ref 拿到最新的文字和图片，避免多张图片同时上传时互相覆盖
  const latest = useRef({ text: parsed.text, imageIds: parsed.imageIds });

  useEffect(() => {
    const p = parseContext(value);
    latest.current = { text: p.text, imageIds: p.imageIds };
    setText(p.text);
    setImageIds(p.imageIds);
  }, [value]);

  const apply = (next: { text: string; imageIds: string[] }, commit: boolean) => {
    const composed = composeContext(next.text, next.imageIds);
    if (composed.length > CONTEXT_MAX_LENGTH) {
      message.error(`备注太长了（最多 ${CONTEXT_MAX_LENGTH} 个字符，每张图片约占 45 个字符）`);
      return false;
    }
    latest.current = next;
    setText(next.text);
    setImageIds(next.imageIds);
    onChange?.(composed);
    if (commit) onCommit?.(composed);
    return true;
  };

  const uploadFiles = async (files: Array<File | Blob>) => {
    for (const file of files) {
      if (file.size > MAX_IMAGE_BYTES) {
        message.error('图片不能超过 2MB');
        continue;
      }
      setUploading(n => n + 1);
      try {
        const id = await termsApi.uploadImage(projectId, file);
        apply({ text: latest.current.text, imageIds: [...latest.current.imageIds, id] }, true);
      } catch (error) {
        message.error(`图片上传失败：${errorToMessage(error)}`);
      } finally {
        setUploading(n => n - 1);
      }
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    if (readOnly) return;
    const images = Array.from(e.clipboardData.items)
      .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter((f): f is File => !!f);
    if (images.length === 0) return; // 粘贴的是普通文字，走默认行为
    e.preventDefault();
    uploadFiles(images);
  };

  const removeImage = (id: string) => {
    apply({ text: latest.current.text, imageIds: latest.current.imageIds.filter(x => x !== id) }, true);
  };

  return (
    <div>
      <Input.TextArea
        value={text}
        readOnly={readOnly}
        placeholder={readOnly ? '' : (placeholder ?? '添加备注，可直接粘贴截图...')}
        autoSize={{ minRows: 1, maxRows: 6 }}
        onPaste={onPaste}
        onChange={e => {
          latest.current = { ...latest.current, text: e.target.value };
          setText(e.target.value);
          onChange?.(composeContext(e.target.value, latest.current.imageIds));
        }}
        onBlur={() => {
          if (readOnly) return;
          const composed = composeContext(latest.current.text, latest.current.imageIds);
          if (composed !== composeContext(parsed.text, parsed.imageIds)) {
            if (!apply(latest.current, true)) {
              // 超长：还原成已保存的内容
              apply({ text: parsed.text, imageIds: parsed.imageIds }, false);
            }
          }
        }}
      />
      {(imageIds.length > 0 || uploading > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <Image.PreviewGroup>
            {imageIds.map(id => (
              <div key={id} style={{ position: 'relative' }}>
                <Image
                  src={termImageUrl(projectId, id)}
                  width={thumbSize}
                  height={thumbSize}
                  style={{ objectFit: 'contain', background: '#fafafa', borderRadius: 4, border: '1px solid #eee' }}
                />
                {!readOnly && (
                  <CloseCircleFilled
                    onClick={() => removeImage(id)}
                    style={{ position: 'absolute', top: -6, right: -6, color: '#ff4d4f', background: '#fff', borderRadius: '50%', cursor: 'pointer' }}
                  />
                )}
              </div>
            ))}
          </Image.PreviewGroup>
          {uploading > 0 && (
            <span style={{ color: '#888', fontSize: 12 }}>
              <LoadingOutlined /> 上传中...
            </span>
          )}
        </div>
      )}
    </div>
  );
}
