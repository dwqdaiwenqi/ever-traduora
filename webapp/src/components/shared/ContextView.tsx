import React from 'react';
import { Image } from 'antd';
import { parseContext } from '../../utils/term-context';
import { termImageUrl } from '../../api/terms';

interface Props {
  context: string | null | undefined;
  projectId: string;
  /** 缩略图边长 */
  size?: number;
  style?: React.CSSProperties;
}

/** 只读展示词条备注：文字 + 可点击放大的缩略图 */
export default function ContextView({ context, projectId, size = 88, style }: Props) {
  const { text, imageIds } = parseContext(context);
  if (!text && imageIds.length === 0) return null;
  return (
    <div style={style}>
      {text && <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>}
      {imageIds.length > 0 && (
        <Image.PreviewGroup>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: text ? 4 : 0 }}>
            {imageIds.map(id => (
              <Image
                key={id}
                src={termImageUrl(projectId, id)}
                width={size}
                height={size}
                style={{ objectFit: 'contain', background: '#fafafa', borderRadius: 4, border: '1px solid #eee' }}
              />
            ))}
          </div>
        </Image.PreviewGroup>
      )}
    </div>
  );
}
