import React from 'react';
import { Card, Progress, Tag } from 'antd';
import { projectRoleLabels } from '../../models';
import type { Project } from '../../models';

interface Props {
  project: Project;
  onClick?: () => void;
}

export default function ProjectCard({ project, onClick }: Props) {
  return (
    <Card
      hoverable
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      bodyStyle={{ padding: 20 }}
    >
      <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {project.name}
      </div>
      {project.description && (
        <div style={{ color: '#888', fontSize: 13, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.description}
        </div>
      )}
      <div style={{ color: '#888', fontSize: 12 }}>
        <span>{project.termsCount ?? 0} 个词条</span>
        {' · '}
        <span>{project.localesCount ?? 0} 个语言</span>
      </div>
      <Tag color="blue" style={{ marginTop: 8 }}>{projectRoleLabels[project.role] ?? project.role}</Tag>
    </Card>
  );
}
