import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { StateBadge, TRACE_ITEMS, TraceToken } from './colleague-ui';

type FileId = 'SKILL.md' | 'work.md' | 'persona.md' | 'work_skill.md' | 'persona_skill.md' | 'manifest.json' | 'meta.json';
const files: Record<FileId, { role: string; consumer: string; preview: string[] }> = {
  'SKILL.md': { role: '组合调用入口', consumer: 'Agent runtime / 用户', preview: ['Part A · 能力轨', 'Part B · 受限行为轨', 'Operating boundaries'] },
  'work.md': { role: '可编辑能力文档', consumer: '用户 / updater', preview: ['Responsibilities', 'Review Criteria', 'Decision Heuristics', 'Lessons'] },
  'persona.md': { role: '可编辑受限行为文档', consumer: '用户 / updater', preview: ['Behavior constraints', 'Expression preferences', 'Interaction rules', 'Correction records'] },
  'work_skill.md': { role: '仅能力入口', consumer: 'Agent runtime', preview: ['generated from work.md', 'capability-only invocation'] },
  'persona_skill.md': { role: '仅行为入口', consumer: 'Agent runtime', preview: ['generated from persona.md', 'behavior-only invocation'] },
  'manifest.json': { role: '安装与可选分发信息', consumer: 'Installer / Gallery', preview: ['entrypoints', 'compatible runtimes', 'slash commands', 'artifact list'] },
  'meta.json': { role: '生命周期状态', consumer: 'Lifecycle tools', preview: ['schema: 3', 'version: 2', 'provenance', 'correction_count: 1'] },
};

export const ArtifactExplorer: React.FC<WidgetProps> = () => {
  const [file, setFile] = useState<FileId>('SKILL.md');
  const [invoked, setInvoked] = useState(false);
  const [why, setWhy] = useState(false);
  const current = files[file];
  const related = useMemo(() => file === 'work.md' || file === 'SKILL.md' ? [TRACE_ITEMS[2], TRACE_ITEMS[3], TRACE_ITEMS[5]] : [], [file]);
  const selectFile = (id: FileId) => { setFile(id); setWhy(false); };
  return <div className="paper-widget artifact-explorer">
    <div className="explorer-shell">
      <nav className="file-tree" aria-label="技能文件">
        <div className="tree-root">▾ colleague_skill/</div>
        {(Object.keys(files) as FileId[]).map(id => <button key={id} className={file === id ? 'active' : ''} onClick={() => selectFile(id)}><span aria-hidden="true">{id.endsWith('.json') ? '{ }' : '▤'}</span>{id}</button>)}
      </nav>
      <section className="file-editor">
        <header><b>{file}</b><StateBadge tone={file.endsWith('.json') ? 'aux' : 'current'}>{current.consumer}</StateBadge></header>
        <div className="metadata-first"><span>元数据先出现</span><code>name · description · {current.role}</code></div>
        {!invoked && <div className="disclosure-gate"><b>详细指令尚未加载</b><p>Agent 先发现技能元数据，调用时再读取正文。</p><button onClick={() => setInvoked(true)}>调用技能</button></div>}
        {invoked && <div className="file-preview">{current.preview.map((line, index) => <div key={line} className={index === 1 && related.length ? 'rule-line' : ''}><span>{String(index + 1).padStart(2, '0')}</span><code>{line}</code></div>)}</div>}
        {invoked && related.length > 0 && <button className={`why-button ${why ? 'active' : ''}`} onClick={() => setWhy(!why)}>为什么有这条规则？</button>}
      </section>
    </div>
    {why && <div className="provenance-drawer"><div><StateBadge tone="good">证据回溯</StateBadge><b>Check authentication first.</b><p>规则反向连接到原始痕迹，而不是只显示 provenance 这个词。</p></div><div className="trace-token-row">{related.map(trace => <TraceToken key={trace.id} trace={trace} active />)}</div></div>}
    <div className={`feedback ${invoked ? 'good' : ''}`}>{invoked ? '详细文件已按需展开；元数据、正文与生命周期仍保持独立可检查。' : '渐进披露不是隐藏来源：元数据先可见，调用后才加载详细说明。'}</div>
  </div>;
};

export default ArtifactExplorer;
