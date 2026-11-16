import React from 'react';
import { Card, Tag } from 'antd';
import { GlobalOutlined, TagsOutlined } from '@ant-design/icons';
import { projectRoleLabels } from '../../models';
import type { Project } from '../../models';

interface Props {
  project: Project;
  onClick?: () => void;
}

const ellipsis: React.CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

export default function ProjectCard({ project, onClick }: Props) {
  return (
    <Card hoverable onClick={onClick} styles={{ body: { padding: 20 } }} style={{ borderColor: 'var(--tr-border-light)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 16, ...ellipsis }} title={project.name}>{project.name}</div>
        <Tag bordered={false} style={{ marginInlineEnd: 0, flexShrink: 0 }}>{projectRoleLabels[project.role] ?? project.role}</Tag>
      </div>
      <div style={{ color: 'var(--tr-text-tertiary)', fontSize: 13, margin: '6px 0 14px', minHeight: 20, ...ellipsis }}>
        {project.description || '暂无描述'}
      </div>
      <div style={{ display: 'flex', gap: 16, color: 'var(--tr-text-secondary)', fontSize: 13 }}>
        <span><TagsOutlined /> {project.termsCount ?? 0} 个词条</span>
        <span><GlobalOutlined /> {project.localesCount ?? 0} 个语言</span>
      </div>
    </Card>
  );
}
