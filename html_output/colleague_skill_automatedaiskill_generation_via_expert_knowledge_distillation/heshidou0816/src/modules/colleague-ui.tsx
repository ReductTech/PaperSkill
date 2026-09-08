import React from 'react';

export type TraceKind = 'chat' | 'email' | 'review' | 'incident' | 'document';

export interface TraceItem {
  id: string;
  kind: TraceKind;
  icon: string;
  text: string;
}

export const TRACE_ITEMS: TraceItem[] = [
  { id: 'Chat #1', kind: 'chat', icon: '●', text: '先检查认证。' },
  { id: 'Email #5', kind: 'email', icon: '✉', text: 'P0 问题必须立即升级。' },
  { id: 'Review #7', kind: 'review', icon: '◆', text: '敏感字段不能出现在响应中。' },
  { id: 'Review #12', kind: 'review', icon: '◆', text: '拒绝前先解释风险。' },
  { id: 'Incident #3', kind: 'incident', icon: '!', text: '回滚前检查数据一致性。' },
  { id: 'Design Doc §4.2', kind: 'document', icon: '▤', text: '变更必须保留审计记录。' },
];

export const TraceToken: React.FC<{
  trace: TraceItem;
  active?: boolean;
  muted?: boolean;
  onClick?: () => void;
}> = ({ trace, active = false, muted = false, onClick }) => {
  const cls = `trace-token trace-${trace.kind}${active ? ' is-active' : ''}${muted ? ' is-muted' : ''}`;
  const content = <><span className="trace-icon" aria-hidden="true">{trace.icon}</span><span><b>{trace.id}</b><small>{trace.text}</small></span></>;
  return onClick ? <button type="button" className={cls} onClick={onClick}>{content}</button> : <div className={cls}>{content}</div>;
};

export const StateBadge: React.FC<{ tone: 'bad' | 'current' | 'good' | 'aux'; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`state-badge state-${tone}`}>{children}</span>
);

export const MiniFile: React.FC<{ name: string; active?: boolean; tone?: 'blue' | 'green' | 'purple' | 'orange' }> = ({ name, active, tone = 'blue' }) => (
  <div className={`mini-file mini-file-${tone}${active ? ' is-active' : ''}`}><span aria-hidden="true">▤</span>{name}</div>
);
